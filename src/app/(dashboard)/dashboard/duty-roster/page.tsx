"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Loader2,
  Users,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  employee_number: string;
  name: string;
  surname: string;
  grade: string;
}

interface DutyRoster {
  id: string;
  week_start_date: string;
  week_end_date: string;
  academic_year: string;
  term: number;
  notes: string | null;
  created_at: string;
}

interface DutyAssignment {
  id: string;
  duty_roster_id: string;
  staff_id: string;
  duty_area: string | null;
  notes: string | null;
  staff?: Staff;
}

interface RosterWithAssignments extends DutyRoster {
  duty_assignments?: DutyAssignment[];
}

const currentYear = new Date().getFullYear();

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getFriday(monday: Date): Date {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return friday;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function DutyRosterPage() {
  const [rosters, setRosters] = useState<RosterWithAssignments[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // View state
  const [viewDate, setViewDate] = useState(getMonday(new Date()));

  // Form state
  const [weekStartDate, setWeekStartDate] = useState("");
  const [academicYear, setAcademicYear] = useState(currentYear.toString());
  const [term, setTerm] = useState("1");
  const [notes, setNotes] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rostersRes, staffRes] = await Promise.all([
        supabase
          .from("duty_roster")
          .select(`
            *,
            duty_assignments(
              id,
              staff_id,
              duty_area,
              notes,
              staff:staff_id(id, employee_number, name, surname, grade)
            )
          `)
          .order("week_start_date", { ascending: false }),
        supabase
          .from("staff")
          .select("id, employee_number, name, surname, grade")
          .eq("status", "employed")
          .in("grade", ["Teacher", "Senior Teacher", "Head of Department", "Vice Principal", "Principal"])
          .order("surname"),
      ]);

      setRosters((rostersRes.data as RosterWithAssignments[]) || []);
      setStaff((staffRes.data as Staff[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load duty roster data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    const monday = getMonday(new Date());
    setWeekStartDate(toDateString(monday));
    setAcademicYear(currentYear.toString());
    setTerm("1");
    setNotes("");
    setSelectedStaff([]);
    setEditingId(null);
  };

  const handleEdit = (roster: RosterWithAssignments) => {
    setWeekStartDate(roster.week_start_date);
    setAcademicYear(roster.academic_year);
    setTerm(roster.term.toString());
    setNotes(roster.notes || "");
    setSelectedStaff(roster.duty_assignments?.map((a) => a.staff_id) || []);
    setEditingId(roster.id);
    setDialogOpen(true);
  };

  const handleWeekDateChange = (dateStr: string) => {
    const date = new Date(dateStr);
    const monday = getMonday(date);
    setWeekStartDate(toDateString(monday));
  };

  const handleSave = async () => {
    if (!weekStartDate) {
      toast.error("Please select a week");
      return;
    }
    if (selectedStaff.length === 0) {
      toast.error("Please select at least one teacher");
      return;
    }

    setSaving(true);
    try {
      const monday = new Date(weekStartDate);
      const friday = getFriday(monday);

      const rosterData = {
        week_start_date: toDateString(monday),
        week_end_date: toDateString(friday),
        academic_year: academicYear,
        term: parseInt(term),
        notes: notes.trim() || null,
      };

      let rosterId = editingId;

      if (editingId) {
        // Update existing roster
        const { error } = await supabase
          .from("duty_roster")
          .update(rosterData as never)
          .eq("id", editingId);

        if (error) throw error;

        // Delete existing assignments and recreate
        await supabase
          .from("duty_assignments")
          .delete()
          .eq("duty_roster_id", editingId);
      } else {
        // Check if roster already exists for this week
        const { data: existing } = await supabase
          .from("duty_roster")
          .select("id")
          .eq("week_start_date", toDateString(monday))
          .single();

        if (existing) {
          toast.error("A duty roster already exists for this week");
          setSaving(false);
          return;
        }

        // Create new roster
        const { data, error } = await supabase
          .from("duty_roster")
          .insert(rosterData as never)
          .select()
          .single();

        if (error) throw error;
        rosterId = (data as { id: string }).id;
      }

      // Create assignments
      const assignments = selectedStaff.map((staffId) => ({
        duty_roster_id: rosterId,
        staff_id: staffId,
      }));

      const { error: assignError } = await supabase
        .from("duty_assignments")
        .insert(assignments as never);

      if (assignError) throw assignError;

      toast.success(editingId ? "Duty roster updated" : "Duty roster created");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to save duty roster");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this duty roster?")) return;

    try {
      const { error } = await supabase
        .from("duty_roster")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Duty roster deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete duty roster");
      console.error(error);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setViewDate(newDate);
  };

  // Get roster for a specific week
  const getRosterForWeek = (weekStart: Date): RosterWithAssignments | undefined => {
    const dateStr = toDateString(weekStart);
    return rosters.find((r) => r.week_start_date === dateStr);
  };

  // Current week roster
  const currentWeekRoster = getRosterForWeek(viewDate);

  // Upcoming weeks (next 4 weeks)
  const upcomingWeeks = useMemo(() => {
    const weeks: { monday: Date; roster: RosterWithAssignments | undefined }[] = [];
    const today = getMonday(new Date());

    for (let i = 0; i < 8; i++) {
      const monday = new Date(today);
      monday.setDate(today.getDate() + i * 7);
      weeks.push({
        monday,
        roster: getRosterForWeek(monday),
      });
    }
    return weeks;
  }, [rosters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duty Roster</h1>
          <p className="text-muted-foreground">
            Assign teachers to weekly duty schedules
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Duty
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Duty Roster" : "Assign Weekly Duty"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the duty assignments for this week"
                  : "Select a week and assign teachers to duty"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Select Week *</Label>
                  <Input
                    type="date"
                    value={weekStartDate}
                    onChange={(e) => handleWeekDateChange(e.target.value)}
                  />
                  {weekStartDate && (
                    <p className="text-xs text-muted-foreground">
                      Week: {formatDate(weekStartDate)} - {formatDate(toDateString(getFriday(new Date(weekStartDate))))}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map((offset) => (
                        <SelectItem
                          key={offset}
                          value={(currentYear - offset).toString()}
                        >
                          {currentYear - offset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for this duty week"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Teachers on Duty * ({selectedStaff.length} selected)</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {staff.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                        selectedStaff.includes(s.id) ? "bg-primary/5" : ""
                      }`}
                      onClick={() => toggleStaffSelection(s.id)}
                    >
                      <Checkbox
                        checked={selectedStaff.includes(s.id)}
                        onCheckedChange={() => toggleStaffSelection(s.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {s.surname}, {s.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.employee_number} • {s.grade}
                        </p>
                      </div>
                      {selectedStaff.includes(s.id) && (
                        <UserCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Assign"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Week Navigator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Week of {formatFullDate(toDateString(viewDate))}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDate(getMonday(new Date()))}
              >
                This Week
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {formatDate(toDateString(viewDate))} - {formatDate(toDateString(getFriday(viewDate)))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentWeekRoster ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {currentWeekRoster.academic_year} Term {currentWeekRoster.term}
                  </Badge>
                  {currentWeekRoster.notes && (
                    <span className="text-sm text-muted-foreground">
                      {currentWeekRoster.notes}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(currentWeekRoster)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(currentWeekRoster.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                    Delete
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {currentWeekRoster.duty_assignments?.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {assignment.staff?.surname}, {assignment.staff?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.staff?.grade}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No duty assigned for this week</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setWeekStartDate(toDateString(viewDate));
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Assign Duty
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Weeks Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Duty Schedule</CardTitle>
          <CardDescription>Next 8 weeks at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingWeeks.map(({ monday, roster }) => {
              const isCurrentWeek = toDateString(monday) === toDateString(getMonday(new Date()));
              const friday = getFriday(monday);

              return (
                <div
                  key={toDateString(monday)}
                  className={`p-3 rounded-lg border ${
                    isCurrentWeek ? "border-primary bg-primary/5" : ""
                  } ${roster ? "" : "border-dashed"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {formatDate(toDateString(monday))} - {formatDate(toDateString(friday))}
                    </p>
                    {isCurrentWeek && (
                      <Badge variant="default" className="text-xs">
                        This Week
                      </Badge>
                    )}
                  </div>
                  {roster ? (
                    <div className="space-y-1">
                      {roster.duty_assignments?.slice(0, 3).map((a) => (
                        <p key={a.id} className="text-xs text-muted-foreground truncate">
                          • {a.staff?.surname}, {a.staff?.name}
                        </p>
                      ))}
                      {(roster.duty_assignments?.length || 0) > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{(roster.duty_assignments?.length || 0) - 3} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No duty assigned
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Rosters Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Duty Rosters</CardTitle>
          <CardDescription>
            {rosters.length} duty rosters configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rosters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Teachers on Duty</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rosters.map((roster) => (
                  <TableRow key={roster.id}>
                    <TableCell className="font-medium">
                      {formatDate(roster.week_start_date)} - {formatDate(roster.week_end_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roster.academic_year} T{roster.term}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {roster.duty_assignments?.slice(0, 3).map((a) => (
                          <Badge key={a.id} variant="secondary" className="text-xs">
                            {a.staff?.surname}
                          </Badge>
                        ))}
                        {(roster.duty_assignments?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(roster.duty_assignments?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {roster.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(roster)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(roster.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No duty rosters created</p>
              <p className="text-sm">Assign your first weekly duty to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
