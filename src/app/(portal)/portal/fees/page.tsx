"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  DollarSign,
  User,
  Printer,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Receipt,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
}

interface Balance {
  id: string;
  categoryName: string;
  academic_year: string;
  term: number;
  amount_due: number;
  amount_paid: number;
  balance: number;
}

interface TermBalance {
  academic_year: string;
  term: number;
  balances: Balance[];
  totalDue: number;
  totalPaid: number;
  totalBalance: number;
}

interface Payment {
  id: string;
  receipt_number: string;
  amount: number;
  payment_method: string | null;
  created_at: string;
  academic_year: string | null;
  term: number | null;
  fee_category: { name: string } | null;
}

function FeesContent() {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("student");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [termBalances, setTermBalances] = useState<TermBalance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [visiblePayments, setVisiblePayments] = useState(5);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  const supabase = useMemo(() => createClient(), []);

  const fetchLinkedStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: linksData } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("user_id", user.id);

      const links = linksData as Array<{ student_id: string }> | null;

      if (!links || links.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = links.map((l) => l.student_id);

      const { data: studentsResult } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .in("id", studentIds);

      const studentsData = studentsResult as Student[] | null;
      setStudents(studentsData || []);

      if (studentIdParam && studentsData?.some((s) => s.id === studentIdParam)) {
        setSelectedStudent(studentIdParam);
      } else if (studentsData && studentsData.length === 1) {
        setSelectedStudent(studentsData[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [supabase, studentIdParam]);

  const fetchFeeData = useCallback(async () => {
    if (!selectedStudent) return;

    setLoadingData(true);
    try {
      console.log("Fetching fee data for student:", selectedStudent);

      // Fetch all fee categories
      const { data: categoriesData, error: catError } = await supabase
        .from("fee_categories")
        .select("id, name")
        .order("name");

      if (catError) throw catError;
      const categories = categoriesData as Array<{ id: string; name: string }> || [];
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));

      // Fetch all student_balances for this student (per term/year)
      const { data: balanceData, error: balanceError } = await supabase
        .from("student_balances")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("academic_year", { ascending: false })
        .order("term", { ascending: false });

      if (balanceError) throw balanceError;
      console.log("Balance data:", balanceData);

      // Group balances by term/year
      const termBalanceMap = new Map<string, TermBalance>();
      for (const bal of (balanceData || []) as Array<{ id: string; category_id: string; academic_year: string; term: number; amount_due: number; amount_paid: number }>) {
        const key = `${bal.academic_year}-${bal.term}`;
        if (!termBalanceMap.has(key)) {
          termBalanceMap.set(key, {
            academic_year: bal.academic_year,
            term: bal.term,
            balances: [],
            totalDue: 0,
            totalPaid: 0,
            totalBalance: 0,
          });
        }
        const termBal = termBalanceMap.get(key)!;
        const balance: Balance = {
          id: bal.id,
          categoryName: categoryMap.get(bal.category_id) || "Unknown",
          academic_year: bal.academic_year,
          term: bal.term,
          amount_due: bal.amount_due,
          amount_paid: bal.amount_paid,
          balance: bal.amount_due - bal.amount_paid,
        };
        termBal.balances.push(balance);
        termBal.totalDue += bal.amount_due;
        termBal.totalPaid += bal.amount_paid;
        termBal.totalBalance += balance.balance;
      }

      // Convert to array and sort by year/term descending
      const sortedTermBalances = Array.from(termBalanceMap.values()).sort((a, b) => {
        if (a.academic_year !== b.academic_year) {
          return b.academic_year.localeCompare(a.academic_year);
        }
        return b.term - a.term;
      });

      setTermBalances(sortedTermBalances);

      // Fetch all payments for this student
      const { data: paymentData, error: paymentError } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("created_at", { ascending: false });

      if (paymentError) throw paymentError;

      // Add category names to payments
      const rawPayments = paymentData as Array<{
        category_id: string;
        amount: number;
        id: string;
        receipt_number: string;
        payment_method: string | null;
        created_at: string;
        academic_year: string | null;
        term: number | null;
      }> || [];

      const paymentsWithCategories = rawPayments.map((payment) => ({
        ...payment,
        fee_category: categoryMap.has(payment.category_id) ? { name: categoryMap.get(payment.category_id)! } : null,
      }));

      setPayments(paymentsWithCategories as Payment[]);
      setTotalPaymentsCount(paymentsWithCategories.length);
      setVisiblePayments(5);
    } catch (error) {
      console.error("Fee data fetch error:", error);
      toast.error("Failed to load fee information");
    } finally {
      setLoadingData(false);
    }
  }, [supabase, selectedStudent]);

  useEffect(() => {
    fetchLinkedStudents();
  }, [fetchLinkedStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchFeeData();
    }
  }, [selectedStudent, fetchFeeData]);

  // Calculate total owed across all terms
  const totalOwed = termBalances.reduce((sum, tb) => sum + (tb.totalBalance > 0 ? tb.totalBalance : 0), 0);
  const totalPaid = termBalances.reduce((sum, tb) => sum + tb.totalPaid, 0);
  const totalDue = termBalances.reduce((sum, tb) => sum + tb.totalDue, 0);
  const currentStudent = students.find((s) => s.id === selectedStudent);

  const printStatement = () => {
    if (!currentStudent) return;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Fee Statement - ${currentStudent.surname}, ${currentStudent.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; border-bottom: 2px solid #800000; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #800000; }
    .header h2 { margin: 10px 0; color: #333; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .info-item label { font-weight: bold; color: #666; font-size: 12px; display: block; }
    .info-item span { font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #800000; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .text-right { text-align: right; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .summary-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; }
    .summary-row.total { font-size: 24px; font-weight: bold; border-top: 2px solid #800000; padding-top: 15px; color: ${totalOwed > 0 ? '#dc2626' : '#16a34a'}; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
    .notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AMAZON CHRISTIAN ACADEMY</h1>
    <h2>FEE STATEMENT</h2>
    <p>Amazon Village B, Filabusi</p>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="student-info">
    <div class="info-item">
      <label>Student Name</label>
      <span>${currentStudent.surname}, ${currentStudent.name}</span>
    </div>
    <div class="info-item">
      <label>Student Number</label>
      <span>${currentStudent.student_number}</span>
    </div>
    <div class="info-item">
      <label>Form/Class</label>
      <span>${currentStudent.form}</span>
    </div>
    <div class="info-item">
      <label>Statement Date</label>
      <span>${new Date().toLocaleDateString()}</span>
    </div>
  </div>

  ${termBalances.map((termBal) => `
    <h3 style="margin-top: 20px; padding: 10px; background: ${termBal.totalBalance > 0 ? '#fef2f2' : '#f0fdf4'}; border-radius: 5px;">
      ${termBal.academic_year} Term ${termBal.term}
      <span style="float: right; color: ${termBal.totalBalance > 0 ? '#dc2626' : '#16a34a'}; font-weight: bold;">
        ${termBal.totalBalance > 0 ? 'Owing: $' + termBal.totalBalance.toFixed(2) : termBal.totalBalance < 0 ? 'Credit: $' + Math.abs(termBal.totalBalance).toFixed(2) : 'Fully Paid'}
      </span>
    </h3>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th class="text-right">Amount Due</th>
          <th class="text-right">Paid</th>
          <th class="text-right">Balance</th>
        </tr>
      </thead>
      <tbody>
        ${termBal.balances.map((b) => `
          <tr>
            <td>${b.categoryName}</td>
            <td class="text-right">$${b.amount_due.toFixed(2)}</td>
            <td class="text-right">$${b.amount_paid.toFixed(2)}</td>
            <td class="text-right" style="color: ${b.balance > 0 ? '#dc2626' : b.balance < 0 ? '#2563eb' : '#16a34a'}; font-weight: bold;">
              ${b.balance > 0 ? '$' + b.balance.toFixed(2) : b.balance < 0 ? '-$' + Math.abs(b.balance).toFixed(2) : '$0.00'}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `).join("")}

  <h3>Payment History (All Years/Terms)</h3>
  <table>
    <thead>
      <tr>
        <th>Receipt No.</th>
        <th>Date</th>
        <th>Year/Term</th>
        <th>Category</th>
        <th>Method</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${payments.slice(0, 20).map((p) => `
        <tr>
          <td>${p.receipt_number}</td>
          <td>${new Date(p.created_at).toLocaleDateString()}</td>
          <td>${p.academic_year ? `${p.academic_year} T${p.term}` : '-'}</td>
          <td>${p.fee_category?.name || "General"}</td>
          <td>${p.payment_method || "-"}</td>
          <td class="text-right">$${p.amount.toFixed(2)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Total Amount Due (All Terms)</span>
      <span>$${totalDue.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Total Amount Paid (All Terms)</span>
      <span>$${totalPaid.toFixed(2)}</span>
    </div>
    <div class="summary-row total">
      <span>Outstanding Balance</span>
      <span>$${totalOwed.toFixed(2)}</span>
    </div>
  </div>

  ${totalOwed > 0 ? `
  <div class="notice">
    <strong>Payment Notice:</strong> Please settle the outstanding balance at the school office.
    Payments can be made via cash, bank transfer, or mobile money.
  </div>
  ` : ''}

  <div class="footer">
    <p>This is a computer-generated statement.</p>
    <p>For queries, please contact the school accounts office.</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Statement</h1>
        <p className="text-muted-foreground">
          View balances and payment history
        </p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg">No Students Linked</h3>
            <p className="text-muted-foreground">
              Please contact the school to link your account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                {students.length > 1 && (
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.surname}, {s.name} ({s.student_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={printStatement}
                  disabled={!selectedStudent || termBalances.length === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Statement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {currentStudent && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <User className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-medium">
                        {currentStudent.surname}, {currentStudent.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Due (All Terms)</p>
                      <p className="font-medium">
                        ${totalDue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid (All Terms)</p>
                      <p className="font-medium text-green-600">
                        ${totalPaid.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={totalOwed > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${totalOwed > 0 ? "bg-red-200" : "bg-green-200"}`}>
                      {totalOwed > 0 ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className={`text-xl font-bold ${totalOwed > 0 ? "text-red-600" : "text-green-600"}`}>
                        ${totalOwed.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Outstanding Balances by Term */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Balances by Term
              </CardTitle>
              <CardDescription>
                Balances organized by academic year and term
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : termBalances.length > 0 ? (
                <div className="space-y-6">
                  {termBalances.map((termBal) => (
                    <div key={`${termBal.academic_year}-${termBal.term}`} className="border rounded-lg overflow-hidden">
                      <div className={`px-4 py-3 flex justify-between items-center ${termBal.totalBalance > 0 ? "bg-red-50" : "bg-green-50"}`}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm">
                            {termBal.academic_year} Term {termBal.term}
                          </Badge>
                          {termBal.totalBalance > 0 ? (
                            <Badge variant="destructive">Outstanding</Badge>
                          ) : (
                            <Badge className="bg-green-500">Paid</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold text-lg ${termBal.totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                            {termBal.totalBalance > 0
                              ? `$${termBal.totalBalance.toFixed(2)} owing`
                              : termBal.totalBalance < 0
                                ? `$${Math.abs(termBal.totalBalance).toFixed(2)} credit`
                                : "Fully Paid"}
                          </span>
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount Due</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {termBal.balances.map((balance) => (
                            <TableRow key={balance.id}>
                              <TableCell className="font-medium">
                                {balance.categoryName}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${balance.amount_due.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-green-600">
                                ${balance.amount_paid.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-mono font-bold ${balance.balance > 0 ? "text-red-600" : balance.balance < 0 ? "text-blue-600" : "text-green-600"}`}>
                                  {balance.balance > 0
                                    ? `$${balance.balance.toFixed(2)}`
                                    : balance.balance < 0
                                      ? `-$${Math.abs(balance.balance).toFixed(2)}`
                                      : "$0.00"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold">No Fee Records</h3>
                  <p className="text-muted-foreground">
                    {selectedStudent
                      ? "No fee records found for this student"
                      : "Select a student to view their fees"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                All payments across all years and terms - Showing {Math.min(visiblePayments, payments.length)} of {totalPaymentsCount} payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Year/Term</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, visiblePayments).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.receipt_number}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {payment.academic_year ? (
                              <Badge variant="outline">
                                {payment.academic_year} T{payment.term}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.fee_category?.name || "General"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {payment.payment_method || "Cash"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-green-600">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Load More Button */}
                  {visiblePayments < totalPaymentsCount && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisiblePayments(prev => prev + 10)}
                      >
                        Load More ({totalPaymentsCount - visiblePayments} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold">No Payment History</h3>
                  <p className="text-muted-foreground">
                    No payments recorded yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function PortalFeesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <FeesContent />
    </Suspense>
  );
}
