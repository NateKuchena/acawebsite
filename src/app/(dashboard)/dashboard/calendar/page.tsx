"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Plus,
  Loader2,
  Calendar,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface EventType {
  id: string;
  name: string;
  color: string;
  is_public: boolean;
}

interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  event_type_id: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  academic_year: string | null;
  term: number | null;
  is_public: boolean;
  created_at: string;
  event_type?: EventType;
}

const currentYear = new Date().getFullYear();
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Calendar view state
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventTypeId, setEventTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [location, setLocation] = useState("");
  const [academicYear, setAcademicYear] = useState(currentYear.toString());
  const [term, setTerm] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, typesRes] = await Promise.all([
        supabase
          .from("school_events")
          .select("*, event_type:event_type_id(*)")
          .order("start_date"),
        supabase
          .from("event_types")
          .select("*")
          .order("name"),
      ]);

      setEvents((eventsRes.data as SchoolEvent[]) || []);
      setEventTypes((typesRes.data as EventType[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventTypeId("");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setAllDay(true);
    setLocation("");
    setAcademicYear(currentYear.toString());
    setTerm("");
    setIsPublic(true);
    setEditingId(null);
  };

  const handleEdit = (event: SchoolEvent) => {
    setTitle(event.title);
    setDescription(event.description || "");
    setEventTypeId(event.event_type_id || "");
    setStartDate(event.start_date);
    setEndDate(event.end_date);
    setStartTime(event.start_time || "");
    setEndTime(event.end_time || "");
    setAllDay(event.all_day);
    setLocation(event.location || "");
    setAcademicYear(event.academic_year || currentYear.toString());
    setTerm(event.term?.toString() || "");
    setIsPublic(event.is_public);
    setEditingId(event.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Event title is required");
      return;
    }
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        event_type_id: eventTypeId || null,
        start_date: startDate,
        end_date: endDate || startDate,
        start_time: allDay ? null : startTime || null,
        end_time: allDay ? null : endTime || null,
        all_day: allDay,
        location: location.trim() || null,
        academic_year: academicYear || null,
        term: term ? parseInt(term) : null,
        is_public: isPublic,
      };

      if (editingId) {
        const { error } = await supabase
          .from("school_events")
          .update(eventData as never)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await supabase
          .from("school_events")
          .insert(eventData as never);

        if (error) throw error;
        toast.success("Event created");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to save event");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("school_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Event deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete event");
      console.error(error);
    }
  };

  const navigateMonth = (direction: number) => {
    let newMonth = viewMonth + direction;
    let newYear = viewYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((event) => {
      const start = event.start_date;
      const end = event.end_date;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [viewYear, viewMonth]);

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((e) => e.start_date >= today)
      .slice(0, 10);
  }, [events]);

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
          <h1 className="text-3xl font-bold tracking-tight">School Calendar</h1>
          <p className="text-muted-foreground">
            Manage school events, holidays, and important dates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/calendar/event-types">
              Manage Event Types
            </Link>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Event" : "Add Event"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update the event details" : "Create a new calendar event"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Event Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mid-Term Exams, Sports Day"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={eventTypeId} onValueChange={setEventTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (!endDate) setEndDate(e.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all_day"
                    checked={allDay}
                    onCheckedChange={(checked) => setAllDay(checked === true)}
                  />
                  <Label htmlFor="all_day" className="text-sm font-normal">
                    All day event
                  </Label>
                </div>
                {!allDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Main Hall, Sports Ground"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={academicYear} onValueChange={setAcademicYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
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
                    <Select value={term || "all"} onValueChange={(val) => setTerm(val === "all" ? "" : val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_public"
                    checked={isPublic}
                    onCheckedChange={(checked) => setIsPublic(checked === true)}
                  />
                  <Label htmlFor="is_public" className="text-sm font-normal">
                    Visible to parents (public event)
                  </Label>
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
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {MONTHS[viewMonth]} {viewYear}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewMonth(new Date().getMonth());
                    setViewYear(new Date().getFullYear());
                  }}
                >
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
              {/* Day headers */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="bg-muted-foreground/10 text-center py-2 text-sm font-medium"
                >
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : [];
                const isToday =
                  day === new Date().getDate() &&
                  viewMonth === new Date().getMonth() &&
                  viewYear === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`min-h-24 bg-background p-1 ${
                      day ? "" : "bg-muted/50"
                    }`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                              style={{
                                backgroundColor: event.event_type?.color || "#3B82F6",
                                color: "white",
                              }}
                              onClick={() => handleEdit(event)}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <CardDescription>Next 10 scheduled events</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer group"
                    onClick={() => handleEdit(event)}
                  >
                    <div
                      className="w-1 h-12 rounded-full mt-1"
                      style={{ backgroundColor: event.event_type?.color || "#3B82F6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.start_date)}
                        {event.start_date !== event.end_date && ` - ${formatDate(event.end_date)}`}
                      </p>
                      {!event.all_day && event.start_time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.start_time)}
                          {event.end_time && ` - ${formatTime(event.end_time)}`}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(event);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(event.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            {events.length} events in the calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {event.event_type ? (
                        <Badge
                          style={{
                            backgroundColor: event.event_type.color,
                            color: "white",
                          }}
                        >
                          {event.event_type.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Uncategorized</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(event.start_date)}
                      {event.start_date !== event.end_date && (
                        <span className="text-muted-foreground">
                          {" "}- {formatDate(event.end_date)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.location || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.is_public ? "default" : "secondary"}>
                        {event.is_public ? "Public" : "Staff Only"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
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
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events in the calendar</p>
              <p className="text-sm">Create your first event to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
