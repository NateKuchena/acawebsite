"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Loader2,
  Plus,
  Wallet,
  Printer,
  Eye,
  Trash2,
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface OtherIncome {
  id: string;
  receipt_number: string;
  source: string;
  description: string | null;
  amount: number;
  created_at: string;
}

export default function OtherIncomePage() {
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<OtherIncome | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  // Form state
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("other_income")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setIncomes((data as OtherIncome[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load income records");
    } finally {
      setLoading(false);
    }
  }, [supabase, dateFilter]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INC-${year}${month}-${random}`;
  };

  const resetForm = () => {
    setSource("");
    setDescription("");
    setAmount("");
  };

  const handleSubmit = async () => {
    if (!source.trim()) {
      toast.error("Income source is required");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Valid amount is required");
      return;
    }

    setSaving(true);
    try {
      const incomeData = {
        receipt_number: generateReceiptNumber(),
        source: source.trim(),
        description: description.trim() || null,
        amount: parseFloat(amount),
      };

      const { error } = await supabase
        .from("other_income")
        .insert(incomeData as never);

      if (error) throw error;

      toast.success("Income recorded successfully");
      setDialogOpen(false);
      resetForm();
      fetchIncomes();
    } catch (error) {
      console.error(error);
      toast.error("Failed to record income");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income record?")) return;

    try {
      const { error } = await supabase.from("other_income").delete().eq("id", id);
      if (error) throw error;
      toast.success("Income record deleted");
      fetchIncomes();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete income record");
    }
  };

  const printReceipt = (income: OtherIncome) => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${income.receipt_number}</title>
  <style>
    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
    .header h2 { margin: 0; font-size: 16px; }
    .header p { margin: 5px 0; font-size: 12px; }
    .details { margin: 15px 0; }
    .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
    .total { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin: 15px 0; }
    .total .row { font-size: 16px; font-weight: bold; }
    .footer { text-align: center; font-size: 10px; margin-top: 20px; }
    @media print {
      body { width: 72mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>SCHOOL NAME</h2>
    <p>Income Receipt</p>
    <p>${income.receipt_number}</p>
  </div>

  <div class="details">
    <div class="row">
      <span>Date:</span>
      <span>${new Date(income.created_at).toLocaleDateString()}</span>
    </div>
    <div class="row">
      <span>Time:</span>
      <span>${new Date(income.created_at).toLocaleTimeString()}</span>
    </div>
  </div>

  <div class="details">
    <div class="row">
      <span>Source:</span>
      <span>${income.source}</span>
    </div>
    ${income.description ? `
    <div class="row">
      <span>Details:</span>
      <span>${income.description}</span>
    </div>
    ` : ""}
  </div>

  <div class="total">
    <div class="row">
      <span>AMOUNT:</span>
      <span>$${income.amount.toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you</p>
    <p>${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank", "width=350,height=500");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToCSV = () => {
    const headers = ["Receipt No", "Date", "Source", "Description", "Amount"];
    const rows = incomes.map((i) => [
      i.receipt_number,
      new Date(i.created_at).toLocaleDateString(),
      i.source,
      i.description || "",
      i.amount.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `other_income_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const viewIncome = (income: OtherIncome) => {
    setSelectedIncome(income);
    setViewDialogOpen(true);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  // Group by source for summary
  const incomeBySource: Record<string, number> = {};
  for (const income of incomes) {
    incomeBySource[income.source] = (incomeBySource[income.source] || 0) + income.amount;
  }
  const topSources = Object.entries(incomeBySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
          <h1 className="text-3xl font-bold tracking-tight">Other Income</h1>
          <p className="text-muted-foreground">
            Track miscellaneous income from various sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={incomes.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Other Income</DialogTitle>
                <DialogDescription>
                  Add a new miscellaneous income entry
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Income Source *</Label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., Hall Rental, Event Ticket Sales, Donations"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details about this income"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "Record Income"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{incomes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Entry</p>
                <p className="text-2xl font-bold">
                  ${incomes.length > 0 ? (totalIncome / incomes.length).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sources */}
      {topSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Income Sources</CardTitle>
            <CardDescription>Breakdown by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSources.map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{source}</Badge>
                  </div>
                  <span className="font-mono font-medium text-green-600">
                    ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-1">
              <Label>Filter by Date</Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-48"
              />
            </div>
            {dateFilter && (
              <Button variant="ghost" onClick={() => setDateFilter("")}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            All Income Entries
          </CardTitle>
          <CardDescription>
            {incomes.length} income records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className="font-mono text-sm">
                      {income.receipt_number}
                    </TableCell>
                    <TableCell>
                      {new Date(income.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{income.source}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {income.description || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">
                      ${income.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewIncome(income)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => printReceipt(income)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(income.id)}
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
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No income records found</p>
              <p className="text-sm">Record income from other sources</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Income Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          {selectedIncome && (
            <>
              <DialogHeader>
                <DialogTitle>Income Details</DialogTitle>
                <DialogDescription>
                  {selectedIncome.receipt_number}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedIncome.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {new Date(selectedIncome.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge variant="outline" className="mt-1">{selectedIncome.source}</Badge>
                </div>

                {selectedIncome.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedIncome.description}</p>
                  </div>
                )}

                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Amount Received</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${selectedIncome.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => printReceipt(selectedIncome)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
