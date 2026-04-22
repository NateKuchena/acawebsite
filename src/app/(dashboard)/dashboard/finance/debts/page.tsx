"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Download,
  Filter,
  Users,
  DollarSign,
  Printer,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface DebtorStudent {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  guardian_name: string;
  guardian_contact: string;
  total_owed: number;
  categories: { name: string; balance: number }[];
}

export default function DebtManagementPage() {
  const [debtors, setDebtors] = useState<DebtorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [minAmount, setMinAmount] = useState("");
  const [formFilter, setFormFilter] = useState("all");
  const [forms, setForms] = useState<string[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    try {
      // Get all fee categories with their expected amounts
      const { data: feeCategories } = await supabase
        .from("fee_categories")
        .select("id, name, default_amount");

      const categories = feeCategories as { id: string; name: string; default_amount: number | null }[] || [];
      const categoryMap = new Map(categories.map(c => [c.id, { name: c.name, amount: c.default_amount || 0 }]));
      // Total expected is calculated per category, not aggregated here

      // Get all enrolled students
      let studentQuery = supabase
        .from("students")
        .select("id, student_number, name, surname, form, guardian_name, guardian_contact")
        .eq("status", "enrolled");

      if (formFilter && formFilter !== "all") {
        studentQuery = studentQuery.eq("form", formFilter);
      }

      const { data: studentsData } = await studentQuery;
      const students = studentsData as Array<{
        id: string;
        student_number: string;
        name: string;
        surname: string;
        form: string;
        guardian_name: string;
        guardian_contact: string;
      }> || [];

      // Get all fee payments grouped by student and category
      const { data: paymentsData } = await supabase
        .from("fee_payments")
        .select("student_id, category_id, amount");

      const payments = paymentsData as { student_id: string; category_id: string; amount: number }[] || [];

      // Build payment map: studentId -> categoryId -> total paid
      const paymentMap = new Map<string, Map<string, number>>();
      for (const payment of payments) {
        if (!paymentMap.has(payment.student_id)) {
          paymentMap.set(payment.student_id, new Map());
        }
        const studentPayments = paymentMap.get(payment.student_id)!;
        const currentAmount = studentPayments.get(payment.category_id) || 0;
        studentPayments.set(payment.category_id, currentAmount + payment.amount);
      }

      // Calculate debt for each student
      const processedDebtors: DebtorStudent[] = [];
      const formSet = new Set<string>();

      for (const student of students) {
        formSet.add(student.form);
        const studentPayments = paymentMap.get(student.id) || new Map<string, number>();

        const debtCategories: { name: string; balance: number }[] = [];
        let totalOwed = 0;

        // For each fee category, calculate what's owed
        for (const [catId, catInfo] of categoryMap) {
          const paid = studentPayments.get(catId) || 0;
          const owed = Math.max(0, catInfo.amount - paid);
          if (owed > 0) {
            totalOwed += owed;
            debtCategories.push({
              name: catInfo.name,
              balance: owed,
            });
          }
        }

        // Apply minimum amount filter
        const minAmountValue = minAmount ? parseFloat(minAmount) : 0;
        if (totalOwed >= minAmountValue && totalOwed > 0) {
          processedDebtors.push({
            id: student.id,
            student_number: student.student_number,
            name: student.name,
            surname: student.surname,
            form: student.form,
            guardian_name: student.guardian_name || "N/A",
            guardian_contact: student.guardian_contact || "N/A",
            total_owed: totalOwed,
            categories: debtCategories,
          });
        }
      }

      // Sort by total owed (highest first)
      processedDebtors.sort((a, b) => b.total_owed - a.total_owed);
      setDebtors(processedDebtors);
      setForms(Array.from(formSet).sort());
    } catch (error) {
      console.error("Debt fetch error:", error);
      toast.error("Failed to load debt data");
    } finally {
      setLoading(false);
    }
  }, [supabase, minAmount, formFilter]);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  const totalDebt = debtors.reduce((sum, d) => sum + d.total_owed, 0);

  const exportToCSV = () => {
    const headers = ["Student No", "Name", "Surname", "Form", "Guardian", "Contact", "Total Owed", "Categories"];
    const rows = debtors.map((d) => [
      d.student_number,
      d.name,
      d.surname,
      d.form,
      d.guardian_name,
      d.guardian_contact,
      d.total_owed.toFixed(2),
      d.categories.map((c) => `${c.name}: $${c.balance.toFixed(2)}`).join("; "),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debtors_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const printInvoices = () => {
    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const invoicesHtml = debtors
      .map(
        (debtor) => `
      <div class="invoice">
        <div class="header">
          <div class="school-name">Amazon Christian Academy</div>
          <div class="school-address">Amazon B Village, Filabusi, Insiza District</div>
          <div class="school-address">+263 XXX XXX XXX</div>
          <div class="invoice-title">FEE INVOICE</div>
        </div>
        <div class="line"></div>
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${today}</span>
        </div>
        <div class="line"></div>
        <div class="row">
          <span class="label">Student:</span>
          <span class="value">${debtor.surname}, ${debtor.name}</span>
        </div>
        <div class="row">
          <span class="label">Student No:</span>
          <span class="value">${debtor.student_number}</span>
        </div>
        <div class="row">
          <span class="label">Form/Class:</span>
          <span class="value">${debtor.form}</span>
        </div>
        <div class="line"></div>
        <div class="row">
          <span class="label">Guardian:</span>
          <span class="value">${debtor.guardian_name}</span>
        </div>
        <div class="row">
          <span class="label">Contact:</span>
          <span class="value">${debtor.guardian_contact}</span>
        </div>
        <div class="line"></div>
        <div class="items">
          <div class="item-header">Outstanding Fees:</div>
          ${debtor.categories
            .map(
              (cat) => `
            <div class="row">
              <span>${cat.name}</span>
              <span>$${cat.balance.toFixed(2)}</span>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="double-line"></div>
        <div class="amount-box">
          <div class="amount-label">TOTAL AMOUNT DUE</div>
          <div class="amount-value">$${debtor.total_owed.toFixed(2)}</div>
        </div>
        <div class="line"></div>
        <div class="footer">
          <p>Please settle the above amount</p>
          <p>at the school bursar's office.</p>
          <p style="margin-top: 10px; font-style: italic;">This is a computer-generated invoice</p>
        </div>
      </div>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=350,height=700");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Invoices - ${today}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            width: 80mm;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          .invoice {
            padding: 10px;
            page-break-after: always;
          }
          .invoice:last-child {
            page-break-after: auto;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
          }
          .school-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .school-address {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .invoice-title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 8px;
            border: 2px solid #000;
            padding: 3px 8px;
            display: inline-block;
          }
          .line {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .double-line {
            border-top: 3px double #000;
            margin: 8px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .label {
            font-size: 11px;
          }
          .value {
            font-weight: 600;
          }
          .amount-box {
            border: 2px solid #000;
            padding: 10px;
            text-align: center;
            margin: 10px 0;
          }
          .amount-label {
            font-size: 11px;
            font-weight: bold;
          }
          .amount-value {
            font-size: 22px;
            font-weight: bold;
          }
          .items {
            margin: 8px 0;
          }
          .item-header {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 11px;
            text-transform: uppercase;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
          }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        ${invoicesHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printNameList = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Group debtors by form
    const debtorsByForm = debtors.reduce((acc, debtor) => {
      if (!acc[debtor.form]) {
        acc[debtor.form] = [];
      }
      acc[debtor.form].push(debtor);
      return acc;
    }, {} as Record<string, DebtorStudent[]>);

    const formSections = Object.keys(debtorsByForm)
      .sort()
      .map(
        (form) => `
        <div class="form-section">
          <h3>${form}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th style="text-align: right;">Amount Owed</th>
              </tr>
            </thead>
            <tbody>
              ${debtorsByForm[form]
                .map(
                  (d, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${d.surname}, ${d.name}</td>
                  <td style="text-align: right;">$${d.total_owed.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <p class="subtotal">Subtotal: ${debtorsByForm[form].length} students - $${debtorsByForm[form].reduce((s, d) => s + d.total_owed, 0).toFixed(2)}</p>
        </div>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debtors List - ${today}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            padding: 15mm;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 16pt;
            margin-bottom: 5px;
          }
          .header h2 {
            font-size: 13pt;
            margin-top: 10px;
          }
          .header p {
            font-size: 10pt;
          }
          .summary {
            background: #f5f5f5;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 5px;
          }
          .summary p {
            font-size: 11pt;
          }
          .form-section {
            margin-bottom: 20px;
          }
          .form-section h3 {
            font-size: 12pt;
            background: #e0e0e0;
            padding: 5px 10px;
            margin-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 4px 8px;
          }
          th {
            background: #f0f0f0;
            text-align: left;
          }
          th:first-child {
            width: 30px;
          }
          .subtotal {
            font-size: 10pt;
            text-align: right;
            margin-top: 5px;
            font-weight: bold;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9pt;
            color: #666;
          }
          @media print {
            body {
              padding: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AMAZON CHRISTIAN ACADEMY</h1>
          <p>Amazon Village B, Filabusi, Insiza</p>
          <h2>STUDENTS WITH OUTSTANDING FEES</h2>
          <p>Generated: ${today}</p>
        </div>

        <div class="summary">
          <p><strong>Total Students:</strong> ${debtors.length}</p>
          <p><strong>Total Outstanding:</strong> $${totalDebt.toFixed(2)}</p>
          ${minAmount ? `<p><strong>Filter:</strong> Minimum $${minAmount} owed</p>` : ""}
          ${formFilter !== "all" ? `<p><strong>Form:</strong> ${formFilter}</p>` : ""}
        </div>

        ${formSections}

        <div class="footer">
          <p>This is a computer-generated report.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debt Management</h1>
          <p className="text-muted-foreground">
            View and manage student fee balances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printNameList} disabled={debtors.length === 0}>
            <FileText className="mr-2 h-4 w-4" />
            Print List
          </Button>
          <Button variant="outline" onClick={printInvoices} disabled={debtors.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoices
          </Button>
          <Button onClick={exportToCSV} disabled={debtors.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Students Owing</p>
                <p className="text-2xl font-bold">{debtors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Debt</p>
                <p className="text-2xl font-bold">
                  ${debtors.length > 0
                    ? (totalDebt / debtors.length).toLocaleString(undefined, { minimumFractionDigits: 2 })
                    : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Minimum Amount Owed</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>Form/Class</Label>
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form} value={form}>{form}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchDebtors}>Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debtors List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Students with Outstanding Balances
          </CardTitle>
          <CardDescription>
            {debtors.length} students with fees owed
            {minAmount && ` (≥$${minAmount})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debtors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="text-right">Total Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtors.map((debtor) => (
                  <TableRow key={debtor.id}>
                    <TableCell>
                      <Link href={`/dashboard/students/${debtor.id}`} className="hover:underline">
                        <p className="font-medium">{debtor.surname}, {debtor.name}</p>
                        <p className="text-xs text-muted-foreground">{debtor.student_number}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{debtor.form}</Badge>
                    </TableCell>
                    <TableCell>{debtor.guardian_name}</TableCell>
                    <TableCell className="font-mono text-sm">{debtor.guardian_contact}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {debtor.categories.map((cat, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {cat.name}: ${cat.balance.toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-bold text-red-600">
                        ${debtor.total_owed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students with outstanding balances found</p>
              <p className="text-sm">
                {minAmount ? "Try lowering the minimum amount filter" : "All fees are paid up!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
