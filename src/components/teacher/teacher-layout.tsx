"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Check,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

interface TeacherLayoutProps {
  children: React.ReactNode;
  teacherName: string;
  staffId: string | null;
}

interface RequisitionNotification {
  id: string;
  requisition_number: string;
  status: string;
  approved_at: string | null;
  created_at: string;
}

interface DutyNotification {
  id: string;
  week_start_date: string;
  week_end_date: string;
  duty_area: string | null;
}

const navigation = [
  { name: "Dashboard", href: "/teacher", icon: Home },
  { name: "Requisitions", href: "/teacher/requisitions", icon: FileText },
  { name: "Enter Marks", href: "/teacher/marks", icon: GraduationCap },
  { name: "Markbook", href: "/teacher/reports", icon: FileSpreadsheet },
  { name: "Calendar", href: "/teacher/calendar", icon: Calendar },
  { name: "Duty Roster", href: "/teacher/duty-roster", icon: ClipboardList },
];

function formatDutyDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TeacherLayout({ children, teacherName, staffId }: TeacherLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<RequisitionNotification[]>([]);
  const [dutyNotifications, setDutyNotifications] = useState<DutyNotification[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    if (!staffId || notificationsLoaded) return;

    try {
      // Fetch requisition notifications
      const { data } = await supabase
        .from("requisitions")
        .select("id, requisition_number, status, approved_at, created_at")
        .eq("requested_by", staffId)
        .in("status", ["approved", "rejected", "awaiting_payment", "paid"])
        .order("approved_at", { ascending: false, nullsFirst: false })
        .limit(10);

      setNotifications((data as RequisitionNotification[]) || []);

      // Calculate next week's Monday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilNextMonday);
      const nextMondayStr = nextMonday.toISOString().split("T")[0];

      // Fetch duty assignments for next week
      const { data: dutyData } = await supabase
        .from("duty_assignments")
        .select(`
          id,
          duty_area,
          duty_roster:duty_roster_id(week_start_date, week_end_date)
        `)
        .eq("staff_id", staffId);

      // Filter to find next week's duty
      const nextWeekDuties = (dutyData as { id: string; duty_area: string | null; duty_roster: { week_start_date: string; week_end_date: string } }[] | null)
        ?.filter((d) => d.duty_roster?.week_start_date === nextMondayStr)
        .map((d) => ({
          id: d.id,
          week_start_date: d.duty_roster.week_start_date,
          week_end_date: d.duty_roster.week_end_date,
          duty_area: d.duty_area,
        })) || [];

      setDutyNotifications(nextWeekDuties);

      // Show toast for next week's duty (only once per session)
      if (nextWeekDuties.length > 0 && !sessionStorage.getItem("duty_toast_shown")) {
        const duty = nextWeekDuties[0];
        toast.warning(
          `Reminder: You are on duty next week (${formatDutyDate(duty.week_start_date)} - ${formatDutyDate(duty.week_end_date)})`,
          { duration: 8000 }
        );
        sessionStorage.setItem("duty_toast_shown", "true");
      }

      setNotificationsLoaded(true);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [supabase, staffId, notificationsLoaded]);

  useEffect(() => {
    // Delay notification fetch to not block initial render
    const timer = setTimeout(fetchNotifications, 1000);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "awaiting_payment":
        return <Check className="h-4 w-4 text-green-600" />;
      case "paid":
        return <Check className="h-4 w-4 text-blue-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "awaiting_payment":
        return "Awaiting Payment";
      case "paid":
        return "Paid";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const recentNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (!n.approved_at) return false;
      const approvedDate = new Date(n.approved_at);
      const dayAgo = new Date();
      dayAgo.setDate(dayAgo.getDate() - 7);
      return approvedDate > dayAgo;
    });
  }, [notifications]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/teacher" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="School Logo"
                width={40}
                height={40}
                className="rounded-lg"
                priority
              />
              <span className="font-bold text-lg hidden sm:block">Teacher Portal</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {(recentNotifications.length > 0 || dutyNotifications.length > 0) && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {recentNotifications.length + dutyNotifications.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-3 py-2 border-b">
                    <p className="font-semibold">Notifications</p>
                  </div>

                  {/* Duty Notifications */}
                  {dutyNotifications.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-amber-50 text-xs font-medium text-amber-800">
                        Duty Roster
                      </div>
                      {dutyNotifications.map((duty) => (
                        <DropdownMenuItem key={duty.id} className="flex items-start gap-3 p-3">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">On duty next week</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDutyDate(duty.week_start_date)} - {formatDutyDate(duty.week_end_date)}
                              {duty.duty_area && <> • {duty.duty_area}</>}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  {/* Requisition Notifications */}
                  {recentNotifications.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-muted text-xs font-medium text-muted-foreground">
                        Requisition Updates
                      </div>
                      {recentNotifications.map((notif) => (
                        <DropdownMenuItem key={notif.id} asChild>
                          <Link
                            href="/teacher/requisitions"
                            className="flex items-start gap-3 p-3"
                          >
                            {getStatusIcon(notif.status)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notif.requisition_number}</p>
                              <p className="text-xs text-muted-foreground">
                                {getStatusLabel(notif.status)}
                                {notif.approved_at && (
                                  <> - {new Date(notif.approved_at).toLocaleDateString()}</>
                                )}
                              </p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  {recentNotifications.length === 0 && dutyNotifications.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:block max-w-[120px] truncate">{teacherName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer - sticky to bottom */}
      <footer className="bg-white border-t border-gray-200 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-center text-sm text-muted-foreground">
            The Pride - Teacher Portal v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
