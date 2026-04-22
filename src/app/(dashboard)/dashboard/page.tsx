import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  GraduationCap,
  Wallet,
  Landmark,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  AlertCircle,
  FileText,
  Hash,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";

// School Constants
const SCHOOL_INFO = {
  name: "Amazon Christian Academy",
  location: "Amazon B Village, Filabusi, Insiza District",
  registrationNumber: "14595",
  emisNumber: "14874",
  zimsecCentreNumber: "090005",
  responsibleAuthority: "Partners4Africa Trust",
};

interface SchoolInfo {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cash_at_hand: number;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string | null;
  balance: number;
}

interface SchoolEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  all_day: boolean;
  location: string | null;
  event_type?: {
    name: string;
    color: string;
  };
}

async function getSchoolData() {
  const supabase = await createClient();

  // Get school info
  const { data: schoolInfo } = await supabase
    .from("school_info")
    .select("*")
    .single();

  // Get bank accounts
  const { data: bankAccounts } = await supabase
    .from("bank_accounts")
    .select("*");

  // Get student count
  const { count: studentCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "enrolled");

  // Get staff count
  const { count: staffCount } = await supabase
    .from("staff")
    .select("*", { count: "exact", head: true })
    .eq("status", "employed");

  // Get recent payments (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentPayments } = await supabase
    .from("fee_payments")
    .select("amount")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const payments = recentPayments as { amount: number }[] | null;
  const monthlyRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Calculate total income (all fee payments)
  const { data: allPayments } = await supabase
    .from("fee_payments")
    .select("amount, payment_method");

  const allPaymentsData = allPayments as { amount: number; payment_method: string | null }[] | null;
  const totalIncome = allPaymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Calculate cash at hand (cash payments minus cash expenses)
  const cashPayments = allPaymentsData
    ?.filter(p => p.payment_method?.toLowerCase() === "cash")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Get total expenses (payment vouchers)
  const { data: voucherData } = await supabase
    .from("payment_vouchers")
    .select("amount, payment_method");

  const vouchers = voucherData as { amount: number; payment_method: string | null }[] | null;
  const totalExpenses = vouchers?.reduce((sum, v) => sum + Number(v.amount), 0) || 0;
  const cashExpenses = vouchers
    ?.filter(v => v.payment_method?.toLowerCase() === "cash")
    .reduce((sum, v) => sum + Number(v.amount), 0) || 0;

  // Cash at hand = cash income - cash expenses
  const calculatedCashAtHand = cashPayments - cashExpenses;

  // Calculate outstanding fees per student (more accurate method)
  // Get total expected fees per student from fee categories
  const { data: feeCategories } = await supabase
    .from("fee_categories")
    .select("default_amount");

  const categories = feeCategories as { default_amount: number | null }[] | null;
  const totalExpectedPerStudent = categories?.reduce((sum, c) => sum + Number(c.default_amount || 0), 0) || 0;

  // Get all enrolled students
  const { data: enrolledStudents } = await supabase
    .from("students")
    .select("id")
    .eq("status", "enrolled");

  const students = enrolledStudents as { id: string }[] | null;
  const studentIds = students?.map(s => s.id) || [];

  // Get all payments grouped by student
  const { data: studentPayments } = await supabase
    .from("fee_payments")
    .select("student_id, amount")
    .in("student_id", studentIds.length > 0 ? studentIds : ['none']);

  const studentPaymentsData = studentPayments as { student_id: string; amount: number }[] | null;

  // Build payment totals per student
  const paymentsByStudent: Record<string, number> = {};
  for (const payment of (studentPaymentsData || [])) {
    paymentsByStudent[payment.student_id] = (paymentsByStudent[payment.student_id] || 0) + Number(payment.amount);
  }

  // Calculate outstanding for each student and sum only positive balances
  let totalOutstanding = 0;
  let studentsWithBalance = 0;
  for (const studentId of studentIds) {
    const paid = paymentsByStudent[studentId] || 0;
    const balance = totalExpectedPerStudent - paid;
    if (balance > 0) {
      totalOutstanding += balance;
      studentsWithBalance++;
    }
  }

  // Net available funds = total income - total expenses
  const netFunds = totalIncome - totalExpenses;

  // Get upcoming events (next 7 days)
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  const { data: upcomingEvents } = await supabase
    .from("school_events")
    .select("id, title, start_date, end_date, start_time, all_day, location, event_type:event_type_id(name, color)")
    .gte("start_date", today)
    .lte("start_date", nextWeekStr)
    .order("start_date")
    .limit(5);

  return {
    schoolInfo: schoolInfo as SchoolInfo | null,
    bankAccounts: (bankAccounts as BankAccount[] | null) || [],
    studentCount: studentCount || 0,
    staffCount: staffCount || 0,
    monthlyRevenue,
    totalOutstanding,
    studentsWithBalance,
    calculatedCashAtHand,
    netFunds,
    totalIncome,
    totalExpenses,
    upcomingEvents: (upcomingEvents as SchoolEvent[]) || [],
  };
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default async function DashboardPage() {
  const data = await getSchoolData();
  const totalBankBalance = data.bankAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  // Use calculated cash at hand, or from school_info if available
  const cashAtHand = data.calculatedCashAtHand > 0 ? data.calculatedCashAtHand : (data.schoolInfo?.cash_at_hand || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">School overview and quick statistics</p>
      </div>

      {/* School Info Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="Amazon Christian Academy"
                width={80}
                height={80}
                className="rounded-xl"
              />
              <div>
                <CardTitle className="text-2xl">
                  {SCHOOL_INFO.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4" />
                  {SCHOOL_INFO.location}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Reg: {SCHOOL_INFO.registrationNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              <span>EMIS: {SCHOOL_INFO.emisNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>ZIMSEC: {SCHOOL_INFO.zimsecCentreNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>RA: {SCHOOL_INFO.responsibleAuthority}</span>
            </div>
            {data.schoolInfo?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {data.schoolInfo.phone}
              </div>
            )}
            {data.schoolInfo?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {data.schoolInfo.email}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.studentCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.staffCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fees</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${data.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.studentsWithBalance} student{data.studentsWithBalance !== 1 ? 's' : ''} with balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cash at Hand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Cash at Hand
            </CardTitle>
            <CardDescription>Cash payments received minus cash expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${cashAtHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Income: ${data.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })} |
              Expenses: ${data.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Total Funds */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Net Available Funds
            </CardTitle>
            <CardDescription>Total income minus total expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.netFunds >= 0 ? "text-primary" : "text-destructive"}`}>
              ${data.netFunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            {totalBankBalance > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Bank balance: ${totalBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events & Bank Accounts */}
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
              <Link
                href="/dashboard/calendar"
                className="text-sm text-primary hover:underline"
              >
                View all
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
                        {!event.all_day && event.start_time && (
                          <span className="ml-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatTime(event.start_time)}
                          </span>
                        )}
                      </p>
                    </div>
                    {event.event_type && (
                      <Badge
                        style={{
                          backgroundColor: event.event_type.color,
                          color: "white",
                        }}
                        className="text-xs"
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Bank Accounts
            </CardTitle>
            <CardDescription>Overview of all school bank accounts</CardDescription>
          </CardHeader>
        <CardContent>
          {data.bankAccounts.length > 0 ? (
            <div className="space-y-4">
              {data.bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-medium">{account.account_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.bank_name} {account.branch && `- ${account.branch}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {account.account_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      ${Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bank accounts configured</p>
              <p className="text-sm">Add bank accounts in Settings to track balances</p>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
