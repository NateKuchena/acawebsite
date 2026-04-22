"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface DailySummary {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

interface FundUsage {
  fundName: string;
  collected: number;
  spent: number;
  available: number;
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Data
  const [feePayments, setFeePayments] = useState<{ category: string; amount: number }[]>([]);
  const [uniformSales, setUniformSales] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<{ source: string; amount: number }[]>([]);
  const [expenses, setExpenses] = useState<{ category: string; amount: number }[]>([]);
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const [fundUsage, setFundUsage] = useState<FundUsage[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      // Fetch fee payments with categories
      const { data: feeData, error: feeError } = await supabase
        .from("fee_payments")
        .select("amount, created_at, fee_categories!category_id(name)")
        .gte("created_at", startDateTime.toISOString())
        .lte("created_at", endDateTime.toISOString());

      if (feeError) {
        console.error("Fee payments fetch error:", feeError);
      }

      // Group fee payments by category
      const feeByCategory: Record<string, number> = {};
      for (const payment of (feeData as Array<{ amount: number; fee_categories: { name: string } | null }>) || []) {
        const category = payment.fee_categories?.name || "Uncategorized";
        feeByCategory[category] = (feeByCategory[category] || 0) + payment.amount;
      }
      setFeePayments(
        Object.entries(feeByCategory).map(([category, amount]) => ({ category, amount }))
      );

      // Fetch uniform sales
      const { data: uniformData, error: uniformError } = await supabase
        .from("uniform_sales")
        .select("total_amount, created_at")
        .gte("created_at", startDateTime.toISOString())
        .lte("created_at", endDateTime.toISOString());

      if (uniformError) {
        console.error("Uniform sales fetch error:", uniformError);
      }

      const uniformTotal = ((uniformData as Array<{ total_amount: number }>) || []).reduce(
        (sum, u) => sum + u.total_amount,
        0
      );
      setUniformSales(uniformTotal);

      // Fetch other income
      const { data: incomeData, error: incomeError } = await supabase
        .from("other_income")
        .select("source, amount, created_at")
        .gte("created_at", startDateTime.toISOString())
        .lte("created_at", endDateTime.toISOString());

      if (incomeError) {
        console.error("Other income fetch error:", incomeError);
      }

      const incomeBySource: Record<string, number> = {};
      for (const income of (incomeData as Array<{ source: string; amount: number }>) || []) {
        incomeBySource[income.source] = (incomeBySource[income.source] || 0) + income.amount;
      }
      setOtherIncome(
        Object.entries(incomeBySource).map(([source, amount]) => ({ source, amount }))
      );

      // Fetch expenses (payment vouchers)
      const { data: expenseData, error: expenseError } = await supabase
        .from("payment_vouchers")
        .select("amount, created_at, expense_categories!expense_category_id(name)")
        .gte("created_at", startDateTime.toISOString())
        .lte("created_at", endDateTime.toISOString());

      if (expenseError) {
        console.error("Expenses fetch error:", expenseError);
      }

      const expenseByCategory: Record<string, number> = {};
      for (const expense of (expenseData as Array<{ amount: number; expense_categories: { name: string } | null }>) || []) {
        const category = expense.expense_categories?.name || "Uncategorized";
        expenseByCategory[category] = (expenseByCategory[category] || 0) + expense.amount;
      }
      setExpenses(
        Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount }))
      );

      // Generate daily summary
      const days: Record<string, DailySummary> = {};
      const current = new Date(startDateTime);
      while (current <= endDateTime) {
        const dateStr = current.toISOString().split("T")[0];
        days[dateStr] = { date: dateStr, income: 0, expenses: 0, net: 0 };
        current.setDate(current.getDate() + 1);
      }

      // Add fee payments to daily
      for (const payment of (feeData as Array<{ amount: number; created_at: string }>) || []) {
        const dateStr = new Date(payment.created_at).toISOString().split("T")[0];
        if (days[dateStr]) {
          days[dateStr].income += payment.amount;
        }
      }

      // Add uniform sales to daily (using already fetched data)
      for (const sale of (uniformData as Array<{ total_amount: number; created_at: string }>) || []) {
        const dateStr = new Date(sale.created_at).toISOString().split("T")[0];
        if (days[dateStr]) {
          days[dateStr].income += sale.total_amount;
        }
      }

      // Add other income to daily
      for (const income of (incomeData as Array<{ amount: number; created_at: string }>) || []) {
        const dateStr = new Date(income.created_at).toISOString().split("T")[0];
        if (days[dateStr]) {
          days[dateStr].income += income.amount;
        }
      }

      // Add expenses to daily
      for (const expense of (expenseData as Array<{ amount: number; created_at: string }>) || []) {
        const dateStr = new Date(expense.created_at).toISOString().split("T")[0];
        if (days[dateStr]) {
          days[dateStr].expenses += expense.amount;
        }
      }

      // Calculate net for each day
      for (const day of Object.values(days)) {
        day.net = day.income - day.expenses;
      }

      setDailyData(Object.values(days).sort((a, b) => a.date.localeCompare(b.date)));

      // Calculate fund usage (collected vs spent per fee category)
      // Get all fee categories
      const { data: feeCategoriesData } = await supabase
        .from("fee_categories")
        .select("id, name");

      const feeCategories = (feeCategoriesData as { id: string; name: string }[]) || [];

      // Get expenses by fund source (for the selected period)
      const { data: expensesByFund } = await supabase
        .from("payment_vouchers")
        .select("amount, fund_source_id, fee_categories!fund_source_id(name)")
        .gte("created_at", startDateTime.toISOString())
        .lte("created_at", endDateTime.toISOString())
        .not("fund_source_id", "is", null);

      // Group expenses by fund source
      const expenseByFund: Record<string, number> = {};
      for (const expense of (expensesByFund as Array<{ amount: number; fund_source_id: string; fee_categories: { name: string } | null }>) || []) {
        const fundName = expense.fee_categories?.name || "Unknown";
        expenseByFund[fundName] = (expenseByFund[fundName] || 0) + expense.amount;
      }

      // Build fund usage data
      const fundUsageData: FundUsage[] = feeCategories.map((cat) => {
        const collected = feeByCategory[cat.name] || 0;
        const spent = expenseByFund[cat.name] || 0;
        return {
          fundName: cat.name,
          collected,
          spent,
          available: collected - spent,
        };
      }).filter(f => f.collected > 0 || f.spent > 0); // Only show funds with activity

      setFundUsage(fundUsageData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [supabase, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Calculate totals
  const totalFees = feePayments.reduce((sum, f) => sum + f.amount, 0);
  const totalOtherIncome = otherIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalIncome = totalFees + uniformSales + totalOtherIncome;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const exportReport = () => {
    let csv = "Financial Report\n";
    csv += `Period: ${startDate} to ${endDate}\n\n`;

    csv += "INCOME\n";
    csv += "Category,Amount\n";
    for (const fee of feePayments) {
      csv += `"Fee - ${fee.category}","${fee.amount.toFixed(2)}"\n`;
    }
    csv += `"Uniform Sales","${uniformSales.toFixed(2)}"\n`;
    for (const income of otherIncome) {
      csv += `"Other - ${income.source}","${income.amount.toFixed(2)}"\n`;
    }
    csv += `"TOTAL INCOME","${totalIncome.toFixed(2)}"\n\n`;

    csv += "EXPENSES\n";
    csv += "Category,Amount\n";
    for (const expense of expenses) {
      csv += `"${expense.category}","${expense.amount.toFixed(2)}"\n`;
    }
    csv += `"TOTAL EXPENSES","${totalExpenses.toFixed(2)}"\n\n`;

    csv += `"NET BALANCE","${netBalance.toFixed(2)}"\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_report_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported");
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
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">
            Income, expenses, and financial summaries
          </p>
        </div>
        <Button onClick={exportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={fetchReportData}>Generate Report</Button>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setStartDate(today.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setStartDate(firstDay.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                }}
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), 0, 1);
                  setStartDate(firstDay.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                }}
              >
                This Year
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${netBalance >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                <DollarSign className={`h-5 w-5 ${netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">
                  {totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="income">Income Breakdown</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
          <TabsTrigger value="funds">Fund Usage</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Income Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Income Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Fee Payments</span>
                    <span className="font-mono text-green-600">${totalFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Uniform Sales</span>
                    <span className="font-mono text-green-600">${uniformSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Other Income</span>
                    <span className="font-mono text-green-600">${totalOtherIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded">
                    <span className="font-bold">Total Income</span>
                    <span className="font-mono font-bold text-green-600">${totalIncome.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Expense Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.length > 0 ? (
                    <>
                      {expenses.map((expense, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium">{expense.category}</span>
                          <span className="font-mono text-red-600">${expense.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No expenses recorded</p>
                  )}
                  <div className="flex justify-between items-center py-2 bg-red-50 px-2 rounded">
                    <span className="font-bold">Total Expenses</span>
                    <span className="font-mono font-bold text-red-600">${totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Income Breakdown Tab */}
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income by Category</CardTitle>
              <CardDescription>Detailed breakdown of all income sources</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feePayments.map((fee, idx) => (
                    <TableRow key={`fee-${idx}`}>
                      <TableCell className="font-medium">{fee.category}</TableCell>
                      <TableCell><Badge variant="outline">Fee Payment</Badge></TableCell>
                      <TableCell className="text-right font-mono">${fee.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {((fee.amount / totalIncome) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {uniformSales > 0 && (
                    <TableRow>
                      <TableCell className="font-medium">Uniform Sales</TableCell>
                      <TableCell><Badge variant="secondary">Sales</Badge></TableCell>
                      <TableCell className="text-right font-mono">${uniformSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {((uniformSales / totalIncome) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )}
                  {otherIncome.map((income, idx) => (
                    <TableRow key={`income-${idx}`}>
                      <TableCell className="font-medium">{income.source}</TableCell>
                      <TableCell><Badge>Other Income</Badge></TableCell>
                      <TableCell className="text-right font-mono">${income.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {((income.amount / totalIncome) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50">
                    <TableCell colSpan={2} className="font-bold">Total Income</TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">
                      ${totalIncome.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Breakdown Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Detailed breakdown of all expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{expense.category}</TableCell>
                        <TableCell className="text-right font-mono">${expense.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {((expense.amount / totalExpenses) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50">
                      <TableCell className="font-bold">Total Expenses</TableCell>
                      <TableCell className="text-right font-mono font-bold text-red-600">
                        ${totalExpenses.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expenses recorded for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fund Usage Tab */}
        <TabsContent value="funds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Fund Usage by Category
              </CardTitle>
              <CardDescription>
                Track how collected fees are being spent - see collected vs used for each fund
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fundUsage.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund (Fee Category)</TableHead>
                      <TableHead className="text-right">Collected</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Usage %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundUsage.map((fund, idx) => {
                      const usagePercent = fund.collected > 0 ? (fund.spent / fund.collected) * 100 : 0;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{fund.fundName}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            ${fund.collected.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            ${fund.spent.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-medium ${fund.available >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                            ${fund.available.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${usagePercent > 100 ? "bg-red-500" : usagePercent > 75 ? "bg-orange-500" : "bg-green-500"}`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm ${usagePercent > 100 ? "text-red-600" : ""}`}>
                                {usagePercent.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-600">
                        ${fundUsage.reduce((sum, f) => sum + f.collected, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-red-600">
                        ${fundUsage.reduce((sum, f) => sum + f.spent, 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-blue-600">
                        ${fundUsage.reduce((sum, f) => sum + f.available, 0).toFixed(2)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fund usage data for this period</p>
                  <p className="text-sm">Record payments and expenses to see fund usage</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily View Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Financial Summary
              </CardTitle>
              <CardDescription>Day-by-day income and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {day.income > 0 ? `$${day.income.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {day.expenses > 0 ? `$${day.expenses.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-medium ${
                        day.net >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {day.income > 0 || day.expenses > 0
                          ? `${day.net >= 0 ? "" : "-"}$${Math.abs(day.net).toFixed(2)}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted">
                    <TableCell className="font-bold">Period Total</TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">
                      ${totalIncome.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">
                      ${totalExpenses.toFixed(2)}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${
                      netBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      ${netBalance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
