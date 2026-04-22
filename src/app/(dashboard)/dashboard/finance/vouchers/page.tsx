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
import {
  Loader2,
  Plus,
  Receipt,
  Printer,
  Eye,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface RequisitionItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PaymentVoucher {
  id: string;
  voucher_number: string;
  requisition_id: string | null;
  requisition?: {
    requisition_number: string;
    requested_by_name: string;
    department: string;
    description: string;
    items: RequisitionItem[];
    total_amount: number;
    approved_by_name: string | null;
    approved_at: string | null;
    created_at: string;
  };
  payee_name: string;
  purpose: string;
  amount: number;
  expense_category_id: string | null;
  expense_category?: { name: string };
  fund_source_id: string | null;
  fund_source?: { name: string };
  payment_method: string;
  paid_by_name: string | null;
  created_at: string;
}

interface Requisition {
  id: string;
  requisition_number: string;
  requested_by_name: string;
  description: string;
  total_amount: number;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
}

interface FeeCategory {
  id: string;
  name: string;
  default_amount: number | null;
}

const paymentMethods = ["Cash", "Bank Transfer", "Cheque", "Mobile Money"];

// Special fund source for uniform fund
const UNIFORM_FUND_ID = "uniform_fund";

export default function PaymentVouchersPage() {
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("Staff");

  // Form state
  const [requisitionId, setRequisitionId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fundSourceId, setFundSourceId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const supabase = useMemo(() => createClient(), []);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Staff";
        setCurrentUser(name);
      }
    };
    fetchUser();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch vouchers with fund source and full requisition details
      let voucherQuery = supabase
        .from("payment_vouchers")
        .select(`
          *,
          requisition:requisitions(requisition_number, requested_by_name, department, description, items, total_amount, approved_by_name, approved_at, created_at),
          expense_category:expense_categories(name),
          fund_source:fee_categories!fund_source_id(name)
        `)
        .order("created_at", { ascending: false });

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter);
        endDate.setHours(23, 59, 59, 999);
        voucherQuery = voucherQuery
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data: voucherData, error: voucherError } = await voucherQuery;
      if (voucherError) throw voucherError;
      setVouchers((voucherData as PaymentVoucher[]) || []);

      // Fetch approved requisitions awaiting payment
      const { data: reqData } = await supabase
        .from("requisitions")
        .select("id, requisition_number, requested_by_name, description, total_amount")
        .in("status", ["approved", "awaiting_payment"])
        .order("created_at", { ascending: false });
      setRequisitions((reqData as Requisition[]) || []);

      // Fetch expense categories
      const { data: catData } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");
      setCategories((catData as ExpenseCategory[]) || []);

      // Fetch fee categories (fund sources)
      const { data: feeCatData } = await supabase
        .from("fee_categories")
        .select("id, name, default_amount")
        .order("name");
      setFeeCategories((feeCatData as FeeCategory[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateVoucherNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PV-${year}${month}-${random}`;
  };

  const resetForm = () => {
    setRequisitionId("");
    setPayeeName("");
    setPurpose("");
    setAmount("");
    setCategoryId("");
    setFundSourceId("");
    setPaymentMethod("");
  };

  const handleRequisitionSelect = (reqId: string) => {
    setRequisitionId(reqId);
    const req = requisitions.find((r) => r.id === reqId);
    if (req) {
      setPayeeName(req.requested_by_name);
      setPurpose(req.description);
      setAmount(req.total_amount.toString());
    }
  };

  const handleSubmit = async () => {
    if (!payeeName.trim()) {
      toast.error("Payee name is required");
      return;
    }
    if (!purpose.trim()) {
      toast.error("Purpose is required");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Valid amount is required");
      return;
    }
    // Fund source is optional until migration is run
    if (!paymentMethod) {
      toast.error("Payment method is required");
      return;
    }

    setSaving(true);
    try {
      const voucherData: Record<string, unknown> = {
        voucher_number: generateVoucherNumber(),
        requisition_id: requisitionId || null,
        payee_name: payeeName.trim(),
        purpose: purpose.trim(),
        amount: parseFloat(amount),
        expense_category_id: categoryId || null,
        payment_method: paymentMethod,
        paid_by_name: currentUser,
      };

      // Add fund source if selected
      if (fundSourceId) {
        voucherData.fund_source_id = fundSourceId;
      }

      // If using uniform fund, set fund_source to 'uniform' for tracking
      if (fundSourceId === UNIFORM_FUND_ID) {
        voucherData.fund_source = "uniform";
        voucherData.fund_source_id = null; // Don't link to fee_categories
      }

      const { data: insertedVoucher, error } = await supabase
        .from("payment_vouchers")
        .insert(voucherData as never)
        .select()
        .single();

      if (error) throw error;

      // If using uniform fund, record in uniform_fund_transactions
      if (fundSourceId === UNIFORM_FUND_ID) {
        const voucherRecord = insertedVoucher as { id: string } | null;
        await supabase
          .from("uniform_fund_transactions")
          .insert({
            transaction_type: "expense",
            amount: parseFloat(amount),
            description: `Voucher ${voucherData.voucher_number}: ${purpose.trim()}`,
            reference_id: voucherRecord?.id,
            reference_type: "voucher",
            created_by: currentUser,
          } as never);
      }

      // If linked to requisition, update requisition status to paid
      if (requisitionId) {
        await supabase
          .from("requisitions")
          .update({ status: "paid" } as never)
          .eq("id", requisitionId);
      }

      toast.success("Payment voucher created");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create payment voucher");
    } finally {
      setSaving(false);
    }
  };

  const printVoucher = (voucher: PaymentVoucher) => {
    const req = voucher.requisition;

    // Build requisition items table if requisition exists
    const requisitionItemsHtml = req?.items ? req.items.map((item: RequisitionItem) => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">$${item.total.toFixed(2)}</td>
      </tr>
    `).join("") : "";

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Voucher - ${voucher.voucher_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header h2 { margin: 5px 0; font-size: 18px; color: #666; }
    .doc-number { font-size: 14px; margin-top: 10px; }
    .section { margin: 20px 0; }
    .section-title { font-size: 16px; font-weight: bold; background: #f0f0f0; padding: 8px; margin-bottom: 10px; border-left: 4px solid #000; }
    .row { display: flex; margin: 8px 0; }
    .label { width: 150px; font-weight: bold; }
    .value { flex: 1; border-bottom: 1px dotted #999; padding-bottom: 3px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .items-table th { background: #f0f0f0; border: 1px solid #000; padding: 8px; text-align: left; }
    .items-table .total-row { font-weight: bold; background: #f9f9f9; }
    .amount-box { background: #f0f0f0; padding: 15px; text-align: center; margin: 20px 0; border: 2px solid #000; }
    .amount-box .amount-label { font-size: 14px; font-weight: bold; }
    .amount-box .amount { font-size: 28px; font-weight: bold; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-box { width: 30%; text-align: center; }
    .sig-line { border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; font-size: 12px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #666; border-top: 1px dashed #999; padding-top: 10px; }
    .page-break { page-break-before: always; }
    .divider { border-top: 2px dashed #000; margin: 30px 0; }
  </style>
</head>
<body>
  ${req ? `
  <!-- REQUISITION SECTION -->
  <div class="header">
    <h1>AMAZON CHRISTIAN ACADEMY</h1>
    <h2>REQUISITION FORM</h2>
    <div class="doc-number">No: ${req.requisition_number}</div>
    <div class="doc-number">Date: ${new Date(req.created_at).toLocaleDateString()}</div>
  </div>

  <div class="section">
    <div class="row">
      <span class="label">Requested By:</span>
      <span class="value">${req.requested_by_name}</span>
    </div>
    <div class="row">
      <span class="label">Department:</span>
      <span class="value">${req.department}</span>
    </div>
    <div class="row">
      <span class="label">Description:</span>
      <span class="value">${req.description}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">ITEMS REQUESTED</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="width: 80px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Unit Price</th>
          <th style="width: 100px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${requisitionItemsHtml}
        <tr class="total-row">
          <td colspan="3" style="border: 1px solid #000; padding: 8px; text-align: right;">TOTAL AMOUNT:</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: right;">$${req.total_amount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="row">
      <span class="label">Approved By:</span>
      <span class="value">${req.approved_by_name || "___________________"}</span>
    </div>
    <div class="row">
      <span class="label">Approved Date:</span>
      <span class="value">${req.approved_at ? new Date(req.approved_at).toLocaleDateString() : "___________________"}</span>
    </div>
  </div>

  <div class="page-break"></div>
  ` : ""}

  <!-- PAYMENT VOUCHER SECTION -->
  <div class="header">
    <h1>AMAZON CHRISTIAN ACADEMY</h1>
    <h2>PAYMENT VOUCHER</h2>
    <div class="doc-number">No: ${voucher.voucher_number}</div>
    <div class="doc-number">Date: ${new Date(voucher.created_at).toLocaleDateString()}</div>
  </div>

  <div class="section">
    <div class="row">
      <span class="label">Pay To:</span>
      <span class="value">${voucher.payee_name}</span>
    </div>
    <div class="row">
      <span class="label">Purpose:</span>
      <span class="value">${voucher.purpose}</span>
    </div>
    ${req ? `
    <div class="row">
      <span class="label">Requisition Ref:</span>
      <span class="value">${req.requisition_number}</span>
    </div>
    ` : ""}
    <div class="row">
      <span class="label">Fund Source:</span>
      <span class="value">${voucher.fund_source?.name || "N/A"}</span>
    </div>
    <div class="row">
      <span class="label">Expense Category:</span>
      <span class="value">${voucher.expense_category?.name || "N/A"}</span>
    </div>
    <div class="row">
      <span class="label">Payment Method:</span>
      <span class="value">${voucher.payment_method}</span>
    </div>
    <div class="row">
      <span class="label">Paid By:</span>
      <span class="value">${voucher.paid_by_name || "Staff"}</span>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">AMOUNT PAID</div>
    <div class="amount">$${voucher.amount.toFixed(2)}</div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line">Prepared By</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Approved By</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Received By (Payee)</div>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated document</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
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

  const viewVoucher = (voucher: PaymentVoucher) => {
    setSelectedVoucher(voucher);
    setViewDialogOpen(true);
  };

  const totalExpenses = vouchers.reduce((sum, v) => sum + v.amount, 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Payment Vouchers</h1>
          <p className="text-muted-foreground">
            Create and manage payment vouchers for expenses
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Payment Voucher</DialogTitle>
              <DialogDescription>
                Record a payment for expenses or requisitions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Link to Requisition (Optional)</Label>
                <Select value={requisitionId || "none"} onValueChange={(val) => handleRequisitionSelect(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a requisition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Requisition</SelectItem>
                    {requisitions.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.requisition_number} - {req.requested_by_name} (${req.total_amount.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payee Name *</Label>
                <Input
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="Name of person/company receiving payment"
                />
              </div>

              <div className="space-y-2">
                <Label>Purpose *</Label>
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="What is this payment for?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fund Source *</Label>
                <Select value={fundSourceId} onValueChange={setFundSourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund to draw from" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNIFORM_FUND_ID} className="font-medium text-blue-600">
                      🎽 Uniform Fund (Separate Pool)
                    </SelectItem>
                    {feeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {fundSourceId === UNIFORM_FUND_ID
                    ? "This will draw from the Uniform Fund pool for uniform restocking"
                    : "Which collected funds should this expense be charged to?"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Expense Category</Label>
                <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    Creating...
                  </>
                ) : (
                  "Create Voucher"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vouchers</p>
                <p className="text-2xl font-bold">{vouchers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requisitions</p>
                <p className="text-2xl font-bold">{requisitions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            All Vouchers
          </CardTitle>
          <CardDescription>
            {vouchers.length} payment vouchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vouchers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Fund Source</TableHead>
                  <TableHead>Expense Cat.</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono text-sm">
                      {voucher.voucher_number}
                    </TableCell>
                    <TableCell>
                      {new Date(voucher.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{voucher.payee_name}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {voucher.purpose}
                    </TableCell>
                    <TableCell>
                      {(voucher as { fund_source?: { name: string } | string | null }).fund_source === "uniform" ? (
                        <Badge className="bg-blue-100 text-blue-800">🎽 Uniform Fund</Badge>
                      ) : voucher.fund_source ? (
                        <Badge variant="default">{voucher.fund_source.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {voucher.expense_category ? (
                        <Badge variant="outline">{voucher.expense_category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{voucher.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600">
                      ${voucher.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewVoucher(voucher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => printVoucher(voucher)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment vouchers found</p>
              <p className="text-sm">Create a voucher to record an expense</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Voucher Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          {selectedVoucher && (
            <>
              <DialogHeader>
                <DialogTitle>Payment Voucher Details</DialogTitle>
                <DialogDescription>
                  {selectedVoucher.voucher_number}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedVoucher.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedVoucher.payment_method}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Payee</p>
                  <p className="font-medium">{selectedVoucher.payee_name}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-medium">{selectedVoucher.purpose}</p>
                </div>

                {((selectedVoucher as { fund_source?: { name: string } | string | null }).fund_source === "uniform" || selectedVoucher.fund_source) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fund Source</p>
                    {(selectedVoucher as { fund_source?: { name: string } | string | null }).fund_source === "uniform" ? (
                      <Badge className="bg-blue-100 text-blue-800">🎽 Uniform Fund</Badge>
                    ) : selectedVoucher.fund_source ? (
                      <Badge variant="default">{selectedVoucher.fund_source.name}</Badge>
                    ) : null}
                  </div>
                )}

                {selectedVoucher.expense_category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expense Category</p>
                    <Badge variant="outline">{selectedVoucher.expense_category.name}</Badge>
                  </div>
                )}

                {selectedVoucher.requisition && (
                  <div>
                    <p className="text-sm text-muted-foreground">Linked Requisition</p>
                    <p className="font-medium">{selectedVoucher.requisition.requisition_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedVoucher.requisition.description}
                    </p>
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-3xl font-bold text-red-600">
                    ${selectedVoucher.amount.toFixed(2)}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => printVoucher(selectedVoucher)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
