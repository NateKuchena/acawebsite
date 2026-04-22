"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  AlertTriangle,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  name: string;
  surname: string;
}

interface DutyAssignment {
  id: string;
  staff_id: string;
  duty_area: string | null;
  staff?: StaffMember;
}

interface DutyRoster {
  id: string;
  week_start_date: string;
  week_end_date: string;
  notes: string | null;
  duty_assignments: DutyAssignment[];
}

function formatWeekDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export default function TeacherDutyRosterPage() {
  const [rosters, setRosters] = useState<DutyRoster[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // View state - start from current week
  const [viewStartDate, setViewStartDate] = useState(() => getMonday(new Date()));

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Get staff ID for current user
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("staff_id")
          .eq("user_id", user.id)
          .single();

        const role = userRole as { staff_id: string | null } | null;
        if (role?.staff_id) {
          setCurrentStaffId(role.staff_id);
        }
      }

      // Fetch duty rosters with assignments
      const { data, error } = await supabase
        .from("duty_roster")
        .select(`
          id,
          week_start_date,
          week_end_date,
          notes,
          duty_assignments (
            id,
            staff_id,
            duty_area,
            staff:staff_id (id, name, surname)
          )
        `)
        .order("week_start_date", { ascending: true });

      if (error) throw error;
      setRosters((data as DutyRoster[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load duty roster");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateWeek = (weeks: number) => {
    setViewStartDate(prev => addWeeks(prev, weeks));
  };

  // Get rosters for the visible weeks (show 8 weeks at a time)
  const visibleRosters = useMemo(() => {
    const endDate = addWeeks(viewStartDate, 8);
    return rosters.filter((roster) => {
      const rosterDate = new Date(roster.week_start_date);
      return rosterDate >= viewStartDate && rosterDate < endDate;
    });
  }, [rosters, viewStartDate]);

  // Find my duty assignments
  const myDutyWeeks = useMemo(() => {
    if (!currentStaffId) return [];
    return rosters.filter((roster) =>
      roster.duty_assignments.some((a) => a.staff_id === currentStaffId)
    );
  }, [rosters, currentStaffId]);

  // Check if current week is a duty week for the user
  const isMyDutyWeek = (roster: DutyRoster) => {
    if (!currentStaffId) return false;
    return roster.duty_assignments.some((a) => a.staff_id === currentStaffId);
  };

  // Check if this is the current week
  const isCurrentWeek = (weekStart: string) => {
    const today = new Date();
    const monday = getMonday(today);
    const rosterMonday = new Date(weekStart);
    return monday.getTime() === rosterMonday.getTime();
  };

  // Check if this is next week
  const isNextWeek = (weekStart: string) => {
    const today = new Date();
    const nextMonday = addWeeks(getMonday(today), 1);
    const rosterMonday = new Date(weekStart);
    return nextMonday.getTime() === rosterMonday.getTime();
  };

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Duty Roster</h1>
        <p className="text-muted-foreground">
          View weekly duty assignments
        </p>
      </div>

      {/* My Upcoming Duties */}
      {myDutyWeeks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              My Duty Assignments
            </CardTitle>
            <CardDescription className="text-amber-700">
              Weeks when you are on duty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myDutyWeeks.slice(0, 6).map((roster) => {
                const myAssignment = roster.duty_assignments.find(
                  (a) => a.staff_id === currentStaffId
                );
                return (
                  <div
                    key={roster.id}
                    className={`p-3 rounded-lg border ${
                      isCurrentWeek(roster.week_start_date)
                        ? "bg-amber-100 border-amber-300"
                        : isNextWeek(roster.week_start_date)
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-900">
                          {formatWeekDate(roster.week_start_date)} - {formatWeekDate(roster.week_end_date)}
                        </p>
                        {myAssignment?.duty_area && (
                          <p className="text-sm text-amber-700">
                            Area: {myAssignment.duty_area}
                          </p>
                        )}
                      </div>
                      {isCurrentWeek(roster.week_start_date) && (
                        <Badge className="bg-amber-600">This Week</Badge>
                      )}
                      {isNextWeek(roster.week_start_date) && (
                        <Badge variant="outline" className="border-amber-600 text-amber-700">
                          Next Week
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Duty Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek(-4)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewStartDate(getMonday(new Date()))}
              >
                Current Week
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek(4)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Showing {formatWeekDate(viewStartDate.toISOString())} - {formatWeekDate(addWeeks(viewStartDate, 8).toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleRosters.length > 0 ? (
            <div className="space-y-4">
              {visibleRosters.map((roster) => (
                <div
                  key={roster.id}
                  className={`p-4 rounded-lg border ${
                    isMyDutyWeek(roster)
                      ? "border-amber-300 bg-amber-50"
                      : isCurrentWeek(roster.week_start_date)
                      ? "border-primary bg-primary/5"
                      : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {formatWeekDate(roster.week_start_date)} - {formatWeekDate(roster.week_end_date)}
                        </h3>
                        {isCurrentWeek(roster.week_start_date) && (
                          <Badge>Current Week</Badge>
                        )}
                        {isNextWeek(roster.week_start_date) && (
                          <Badge variant="outline">Next Week</Badge>
                        )}
                        {isMyDutyWeek(roster) && (
                          <Badge className="bg-amber-600">Your Duty</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formatFullDate(roster.week_start_date)} - {formatFullDate(roster.week_end_date)}
                      </p>

                      {/* Staff on duty */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">On duty:</span>
                        {roster.duty_assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                              assignment.staff_id === currentStaffId
                                ? "bg-amber-100 text-amber-800 font-medium"
                                : "bg-muted"
                            }`}
                          >
                            <User className="h-3 w-3" />
                            {assignment.staff?.surname}, {assignment.staff?.name}
                            {assignment.duty_area && (
                              <span className="text-xs text-muted-foreground">
                                ({assignment.duty_area})
                              </span>
                            )}
                          </div>
                        ))}
                        {roster.duty_assignments.length === 0 && (
                          <span className="text-sm text-muted-foreground italic">
                            No assignments
                          </span>
                        )}
                      </div>

                      {roster.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          Note: {roster.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No duty roster for this period</p>
              <p className="text-sm">Try navigating to a different time range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
