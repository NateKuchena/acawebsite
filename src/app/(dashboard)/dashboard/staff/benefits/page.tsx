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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Briefcase,
  Edit,
  Trash2,
  DollarSign,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  employee_number: string;
  name: string;
  surname: string;
  grade: string;
}

interface Benefit {
  id: string;
  staff_id: string;
  staff?: Staff;
  benefit_type: string;
  provider: string | null;
  policy_number: string | null;
  monthly_amount: number | null;
  employer_contribution: number | null;
  employee_contribution: number | null;
  created_at: string;
}

const benefitTypes = [
  "Medical Aid",
  "Pension",
  "Life Insurance",
  "Housing Allowance",
  "Transport Allowance",
  "Meal Allowance",
  "Phone Allowance",
  "Education Allowance",
  "Other",
];

export default function StaffBenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [staffId, setStaffId] = useState("");
  const [benefitType, setBenefitType] = useState("");
  const [provider, setProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [employerContribution, setEmployerContribution] = useState("");
  const [employeeContribution, setEmployeeContribution] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch benefits with staff info
      const { data: benefitsData, error: benefitsError } = await supabase
        .from("staff_benefits")
        .select(`
          *,
          staff(id, employee_number, name, surname, grade)
        `)
        .order("created_at", { ascending: false });

      if (benefitsError) throw benefitsError;
      setBenefits((benefitsData as Benefit[]) || []);

      // Fetch employed staff
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, employee_number, name, surname, grade")
        .eq("status", "employed")
        .order("surname");

      setStaffList((staffData as Staff[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load benefits data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setStaffId("");
    setBenefitType("");
    setProvider("");
    setPolicyNumber("");
    setMonthlyAmount("");
    setEmployerContribution("");
    setEmployeeContribution("");
    setEditingId(null);
  };

  const handleEdit = (benefit: Benefit) => {
    setStaffId(benefit.staff_id);
    setBenefitType(benefit.benefit_type);
    setProvider(benefit.provider || "");
    setPolicyNumber(benefit.policy_number || "");
    setMonthlyAmount(benefit.monthly_amount?.toString() || "");
    setEmployerContribution(benefit.employer_contribution?.toString() || "");
    setEmployeeContribution(benefit.employee_contribution?.toString() || "");
    setEditingId(benefit.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!staffId) {
      toast.error("Please select an employee");
      return;
    }
    if (!benefitType) {
      toast.error("Please select a benefit type");
      return;
    }

    setSaving(true);
    try {
      const benefitData = {
        staff_id: staffId,
        benefit_type: benefitType,
        provider: provider || null,
        policy_number: policyNumber || null,
        monthly_amount: monthlyAmount ? parseFloat(monthlyAmount) : null,
        employer_contribution: employerContribution ? parseFloat(employerContribution) : null,
        employee_contribution: employeeContribution ? parseFloat(employeeContribution) : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("staff_benefits")
          .update(benefitData as never)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Benefit updated");
      } else {
        const { error } = await supabase
          .from("staff_benefits")
          .insert(benefitData as never);

        if (error) throw error;
        toast.success("Benefit added");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save benefit");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this benefit?")) return;

    try {
      const { error } = await supabase.from("staff_benefits").delete().eq("id", id);

      if (error) throw error;
      toast.success("Benefit deleted");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete benefit");
    }
  };

  // Calculate totals
  const totalEmployerCost = benefits.reduce((sum, b) => sum + (b.employer_contribution || 0), 0);
  const totalEmployeeCost = benefits.reduce((sum, b) => sum + (b.employee_contribution || 0), 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Staff Benefits</h1>
          <p className="text-muted-foreground">
            Manage employee benefits and allowances
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Benefit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Benefit" : "Add Staff Benefit"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the benefit details" : "Assign a benefit to an employee"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={staffId} onValueChange={setStaffId} disabled={!!editingId}>
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
                <Label>Benefit Type *</Label>
                <Select value={benefitType} onValueChange={setBenefitType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {benefitTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g., CIMAS, Old Mutual"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Policy/Account number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Employer</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={employerContribution}
                    onChange={(e) => setEmployerContribution(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={employeeContribution}
                    onChange={(e) => setEmployeeContribution(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Monthly</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Add Benefit"
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
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Benefits</p>
                <p className="text-2xl font-bold">{benefits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Employer Cost</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalEmployerCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <p className="text-sm text-muted-foreground">Employee Contributions</p>
                <p className="text-2xl font-bold">
                  ${totalEmployeeCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            All Benefits
          </CardTitle>
          <CardDescription>
            {benefits.length} benefit records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {benefits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Benefit Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Employer</TableHead>
                  <TableHead className="text-right">Employee</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benefits.map((benefit) => (
                  <TableRow key={benefit.id}>
                    <TableCell>
                      <p className="font-medium">
                        {benefit.staff?.surname}, {benefit.staff?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {benefit.staff?.employee_number}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{benefit.benefit_type}</Badge>
                    </TableCell>
                    <TableCell>{benefit.provider || "-"}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${(benefit.employer_contribution || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(benefit.employee_contribution || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${(benefit.monthly_amount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(benefit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(benefit.id)}
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
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No benefits recorded</p>
              <p className="text-sm">Add benefits for staff members</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
