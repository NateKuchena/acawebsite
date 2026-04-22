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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  DollarSign,
  Printer,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  employee_number: string;
  name: string;
  surname: string;
  grade: string;
}

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff?: Staff;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  allowances: Record<string, number> | null;
  deductions: Record<string, number> | null;
  gross_pay: number;
  net_pay: number;
  generated_at: string;
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [staffId, setStaffId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [basicSalary, setBasicSalary] = useState("");
  const [housingAllowance, setHousingAllowance] = useState("");
  const [transportAllowance, setTransportAllowance] = useState("");
  const [mealAllowance, setMealAllowance] = useState("");
  const [taxDeduction, setTaxDeduction] = useState("");
  const [pensionDeduction, setPensionDeduction] = useState("");
  const [medicalDeduction, setMedicalDeduction] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch payroll records with staff info
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select(`
          *,
          staff(id, employee_number, name, surname, grade)
        `)
        .order("pay_period_end", { ascending: false })
        .limit(100);

      if (payrollError) throw payrollError;
      setRecords((payrollData as PayrollRecord[]) || []);

      // Fetch employed staff
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, employee_number, name, surname, grade")
        .eq("status", "employed")
        .order("surname");

      setStaffList((staffData as Staff[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setStaffId("");
    setPeriodStart("");
    setPeriodEnd("");
    setBasicSalary("");
    setHousingAllowance("");
    setTransportAllowance("");
    setMealAllowance("");
    setTaxDeduction("");
    setPensionDeduction("");
    setMedicalDeduction("");
  };

  const calculateTotals = () => {
    const basic = parseFloat(basicSalary) || 0;
    const housing = parseFloat(housingAllowance) || 0;
    const transport = parseFloat(transportAllowance) || 0;
    const meal = parseFloat(mealAllowance) || 0;
    const tax = parseFloat(taxDeduction) || 0;
    const pension = parseFloat(pensionDeduction) || 0;
    const medical = parseFloat(medicalDeduction) || 0;

    const totalAllowances = housing + transport + meal;
    const totalDeductions = tax + pension + medical;
    const gross = basic + totalAllowances;
    const net = gross - totalDeductions;

    return { gross, net, totalAllowances, totalDeductions };
  };

  const handleSave = async () => {
    if (!staffId) {
      toast.error("Please select an employee");
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error("Please specify the pay period");
      return;
    }
    if (!basicSalary) {
      toast.error("Please enter the basic salary");
      return;
    }

    const { gross, net } = calculateTotals();

    setSaving(true);
    try {
      const allowances: Record<string, number> = {};
      if (housingAllowance) allowances.housing = parseFloat(housingAllowance);
      if (transportAllowance) allowances.transport = parseFloat(transportAllowance);
      if (mealAllowance) allowances.meal = parseFloat(mealAllowance);

      const deductions: Record<string, number> = {};
      if (taxDeduction) deductions.tax = parseFloat(taxDeduction);
      if (pensionDeduction) deductions.pension = parseFloat(pensionDeduction);
      if (medicalDeduction) deductions.medical = parseFloat(medicalDeduction);

      const payrollData = {
        staff_id: staffId,
        pay_period_start: periodStart,
        pay_period_end: periodEnd,
        basic_salary: parseFloat(basicSalary),
        allowances: Object.keys(allowances).length > 0 ? allowances : null,
        deductions: Object.keys(deductions).length > 0 ? deductions : null,
        gross_pay: gross,
        net_pay: net,
      };

      const { error } = await supabase.from("payroll").insert(payrollData as never);

      if (error) throw error;

      toast.success("Payroll record created");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create payroll record");
    } finally {
      setSaving(false);
    }
  };

  const printPayslip = (record: PayrollRecord) => {
    const allowances = record.allowances || {};
    const deductions = record.deductions || {};

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${record.staff?.employee_number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header h2 { margin: 10px 0; font-size: 18px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
    .info-box p { margin: 5px 0; font-size: 14px; }
    .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .section { border: 1px solid #ddd; padding: 15px; }
    .section h3 { margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    .line-item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
    .total-section { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; margin: 10px 0; }
    .total-row.net { font-size: 24px; font-weight: bold; border-top: 2px solid #000; padding-top: 15px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>SCHOOL NAME</h1>
    <h2>PAYSLIP</h2>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Employee Details</h3>
      <p><strong>Name:</strong> ${record.staff?.surname}, ${record.staff?.name}</p>
      <p><strong>Employee No:</strong> ${record.staff?.employee_number}</p>
      <p><strong>Position:</strong> ${record.staff?.grade}</p>
    </div>
    <div class="info-box">
      <h3>Pay Period</h3>
      <p><strong>From:</strong> ${new Date(record.pay_period_start).toLocaleDateString()}</p>
      <p><strong>To:</strong> ${new Date(record.pay_period_end).toLocaleDateString()}</p>
      <p><strong>Generated:</strong> ${new Date(record.generated_at).toLocaleDateString()}</p>
    </div>
  </div>

  <div class="earnings-deductions">
    <div class="section">
      <h3>Earnings</h3>
      <div class="line-item">
        <span>Basic Salary</span>
        <span>$${record.basic_salary.toFixed(2)}</span>
      </div>
      ${Object.entries(allowances).map(([key, value]) => `
        <div class="line-item">
          <span>${key.charAt(0).toUpperCase() + key.slice(1)} Allowance</span>
          <span>$${value.toFixed(2)}</span>
        </div>
      `).join('')}
      <div class="line-item" style="border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
        <span>Gross Pay</span>
        <span>$${record.gross_pay.toFixed(2)}</span>
      </div>
    </div>

    <div class="section">
      <h3>Deductions</h3>
      ${Object.entries(deductions).map(([key, value]) => `
        <div class="line-item">
          <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
          <span>$${value.toFixed(2)}</span>
        </div>
      `).join('')}
      ${Object.keys(deductions).length === 0 ? '<p style="color: #666; font-style: italic;">No deductions</p>' : ''}
      <div class="line-item" style="border-top: 1px solid #ddd; padding-top: 10px; font-weight: bold;">
        <span>Total Deductions</span>
        <span>$${(record.gross_pay - record.net_pay).toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="total-section">
    <div class="total-row">
      <span>Gross Pay</span>
      <span>$${record.gross_pay.toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span>Less: Deductions</span>
      <span>$${(record.gross_pay - record.net_pay).toFixed(2)}</span>
    </div>
    <div class="total-row net">
      <span>NET PAY</span>
      <span>$${record.net_pay.toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated payslip and does not require a signature.</p>
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

  // Calculate totals for display
  const { gross, net, totalDeductions } = calculateTotals();
  const totalGrossPaid = records.reduce((sum, r) => sum + r.gross_pay, 0);
  const totalNetPaid = records.reduce((sum, r) => sum + r.net_pay, 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">
            Generate and manage employee payroll
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate Payslip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Payslip</DialogTitle>
              <DialogDescription>
                Create a payroll record for an employee
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.surname}, {s.name} ({s.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Basic Salary *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start *</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period End *</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Allowances</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Housing</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={housingAllowance}
                      onChange={(e) => setHousingAllowance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Transport</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={transportAllowance}
                      onChange={(e) => setTransportAllowance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meal</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={mealAllowance}
                      onChange={(e) => setMealAllowance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Deductions</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tax</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDeduction}
                      onChange={(e) => setTaxDeduction(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pension</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pensionDeduction}
                      onChange={(e) => setPensionDeduction(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Aid</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={medicalDeduction}
                      onChange={(e) => setMedicalDeduction(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {basicSalary && (
                <div className="border-t pt-4 bg-muted rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Gross Pay:</span>
                      <span className="font-mono">${gross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-red-600">-${totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 pt-4 border-t text-lg font-bold">
                    <span>Net Pay:</span>
                    <span className="font-mono text-green-600">${net.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Payslip"
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
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gross Paid</p>
                <p className="text-2xl font-bold">
                  ${totalGrossPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Net Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalNetPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payroll History
          </CardTitle>
          <CardDescription>
            Recent payroll records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="font-medium">
                        {record.staff?.surname}, {record.staff?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.staff?.employee_number}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(record.pay_period_start).toLocaleDateString()} -{" "}
                        {new Date(record.pay_period_end).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${record.basic_salary.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${record.gross_pay.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-green-600">
                      ${record.net_pay.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => printPayslip(record)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payroll records</p>
              <p className="text-sm">Generate a payslip to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
