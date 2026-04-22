import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
  AlertTriangle,
  Calendar,
  MapPin,
} from "lucide-react";

interface DutyInfo {
  week_start_date: string;
  week_end_date: string;
  duty_area: string | null;
}

interface SchoolEvent {
  id: string;
  title: string;
  start_date: string;
  location: string | null;
  event_type?: {
    name: string;
    color: string;
  };
}

async function getTeacherData(userId: string) {
  const supabase = await createClient();

  // Get user role with staff info
  const { data: userRoleData } = await supabase
    .from("user_roles")
    .select("staff_id, staff:staff_id(name, surname)")
    .eq("user_id", userId)
    .single();

  const userRole = userRoleData as { staff_id: string | null; staff: { name: string; surname: string } | null } | null;
  const staffId = userRole?.staff_id;
  const staffRecord = userRole?.staff;

  // Run all queries in parallel for better performance
  const [
    pendingResult,
    approvedResult,
    rejectedResult,
    recentResult,
    studentResult
  ] = await Promise.all([
    // Pending requisitions count
    staffId
      ? supabase
          .from("requisitions")
          .select("*", { count: "exact", head: true })
          .eq("requested_by", staffId)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    // Approved requisitions count
    staffId
      ? supabase
          .from("requisitions")
          .select("*", { count: "exact", head: true })
          .eq("requested_by", staffId)
          .in("status", ["approved", "awaiting_payment"])
      : Promise.resolve({ count: 0 }),
    // Rejected requisitions count
    staffId
      ? supabase
          .from("requisitions")
          .select("*", { count: "exact", head: true })
          .eq("requested_by", staffId)
          .eq("status", "rejected")
      : Promise.resolve({ count: 0 }),
    // Recent requisitions
    staffId
      ? supabase
          .from("requisitions")
          .select("id, requisition_number, description, total_amount, status, created_at")
          .eq("requested_by", staffId)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
    // Student count
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "enrolled"),
  ]);

  // Calculate next week's Monday
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);
  const nextMondayStr = nextMonday.toISOString().split("T")[0];

  // Get next week's duty assignment for this teacher
  let nextWeekDuty: DutyInfo | null = null;
  if (staffId) {
    const { data: dutyData } = await supabase
      .from("duty_assignments")
      .select(`
        duty_area,
        duty_roster:duty_roster_id(week_start_date, week_end_date)
      `)
      .eq("staff_id", staffId);

    // Find duty for next week
    const nextWeekAssignment = (dutyData as { duty_area: string | null; duty_roster: { week_start_date: string; week_end_date: string } }[] | null)
      ?.find((d) => d.duty_roster?.week_start_date === nextMondayStr);

    if (nextWeekAssignment?.duty_roster) {
      nextWeekDuty = {
        week_start_date: nextWeekAssignment.duty_roster.week_start_date,
        week_end_date: nextWeekAssignment.duty_roster.week_end_date,
        duty_area: nextWeekAssignment.duty_area,
      };
    }
  }

  // Get upcoming events (next 7 days)
  const todayStr = today.toISOString().split("T")[0];
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekEndStr = nextWeek.toISOString().split("T")[0];

  const { data: eventsData } = await supabase
    .from("school_events")
    .select("id, title, start_date, location, event_type:event_type_id(name, color)")
    .gte("start_date", todayStr)
    .lte("start_date", nextWeekEndStr)
    .order("start_date")
    .limit(5);

  return {
    staffName: staffRecord ? `${staffRecord.surname}, ${staffRecord.name}` : "Teacher",
    staffId,
    pendingCount: pendingResult.count || 0,
    approvedCount: approvedResult.count || 0,
    rejectedCount: rejectedResult.count || 0,
    recentRequisitions: (recentResult.data as {
      id: string;
      requisition_number: string;
      description: string;
      total_amount: number;
      status: string;
      created_at: string;
    }[]) || [],
    studentCount: studentResult.count || 0,
    nextWeekDuty,
    upcomingEvents: (eventsData as SchoolEvent[]) || [],
  };
}

function formatDutyDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case "approved":
      return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
    case "awaiting_payment":
      return <Badge className="bg-purple-100 text-purple-800">Awaiting Payment</Badge>;
    case "paid":
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const data = await getTeacherData(user.id);

  return (
    <div className="space-y-6">
      {/* Duty Alert Banner */}
      {data.nextWeekDuty && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">
                  You are on duty next week!
                </h3>
                <p className="text-sm text-amber-700">
                  {formatDutyDate(data.nextWeekDuty.week_start_date)} - {formatDutyDate(data.nextWeekDuty.week_end_date)}
                  {data.nextWeekDuty.duty_area && (
                    <span className="ml-2">• Area: {data.nextWeekDuty.duty_area}</span>
                  )}
                </p>
              </div>
            </div>
            <Link href="/teacher/duty-roster">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                View Roster
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {data.staffName}
        </h1>
        <p className="text-muted-foreground">
          Manage your requisitions and student marks
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Requisitions
            </CardTitle>
            <CardDescription>
              Create and track your purchase requisitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.pendingCount}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.approvedCount}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{data.rejectedCount}</div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>
            <Link href="/teacher/requisitions">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Requisition
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Marks
            </CardTitle>
            <CardDescription>
              Enter coursework and exam marks for students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-2xl font-bold">{data.studentCount}</div>
              <div className="text-sm text-muted-foreground">Enrolled Students</div>
            </div>
            <Link href="/teacher/marks">
              <Button variant="outline" className="w-full">
                Enter Marks
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
              <Link href="/teacher/calendar">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div
                      className="w-1 h-10 rounded-full mt-1"
                      style={{ backgroundColor: event.event_type?.color || "#3B82F6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatEventDate(event.start_date)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    {event.event_type && (
                      <Badge
                        style={{
                          backgroundColor: event.event_type.color,
                          color: "white",
                        }}
                        className="text-xs shrink-0"
                      >
                        {event.event_type.name}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events</p>
                <Link href="/teacher/calendar" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">
                    View Full Calendar
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Requisitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Requisitions
            </CardTitle>
            <CardDescription>Your latest submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentRequisitions.length > 0 ? (
              <div className="space-y-3">
                {data.recentRequisitions.slice(0, 4).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      {req.status === "approved" || req.status === "awaiting_payment" || req.status === "paid" ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : req.status === "rejected" ? (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{req.requisition_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold">${req.total_amount.toFixed(2)}</p>
                      {getStatusBadge(req.status)}
                    </div>
                  </div>
                ))}
                <Link href="/teacher/requisitions">
                  <Button variant="ghost" className="w-full" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No requisitions yet</p>
                <Link href="/teacher/requisitions" className="mt-2 inline-block">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Requisition
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
