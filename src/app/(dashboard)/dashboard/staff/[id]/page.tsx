"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ChevronLeft,
  Edit,
  User,
  Phone,
  Briefcase,
  DollarSign,
  Heart,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Staff {
  id: string;
  employee_number: string;
  grade: string;
  name: string;
  surname: string;
  date_of_birth: string;
  id_number: string | null;
  nssa_number: string | null;
  phone: string | null;
  address: string | null;
  next_of_kin_name: string | null;
  next_of_kin_contact: string | null;
  next_of_kin_address: string | null;
  religious_denomination: string | null;
  health_conditions: string | null;
  status: "employed" | "terminated" | "retired";
  created_at: string;
  updated_at: string;
}

interface Benefit {
  id: string;
  benefit_type: string;
  provider: string | null;
  policy_number: string | null;
  monthly_amount: number | null;
  employer_contribution: number | null;
  employee_contribution: number | null;
}

interface PayrollRecord {
  id: string;
  pay_period_start: string;
  pay_period_end: string;
  basic_salary: number;
  gross_pay: number;
  net_pay: number;
  generated_at: string;
}

const statusColors: Record<string, string> = {
  employed: "bg-green-100 text-green-800",
  terminated: "bg-red-100 text-red-800",
  retired: "bg-blue-100 text-blue-800",
};

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (staffError) throw staffError;
      setStaff(staffData as Staff);

      // Fetch benefits
      const { data: benefitsData } = await supabase
        .from("staff_benefits")
        .select("*")
        .eq("staff_id", resolvedParams.id);

      setBenefits((benefitsData as Benefit[]) || []);

      // Fetch payroll records
      const { data: payrollData } = await supabase
        .from("payroll")
        .select("*")
        .eq("staff_id", resolvedParams.id)
        .order("pay_period_end", { ascending: false })
        .limit(12);

      setPayroll((payrollData as PayrollRecord[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  }, [supabase, resolvedParams.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Employee Not Found</h2>
        <Link href="/dashboard/staff">
          <Button className="mt-4">Back to Staff</Button>
        </Link>
      </div>
    );
  }

  const totalBenefitsCost = benefits.reduce(
    (sum, b) => sum + (b.employer_contribution || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/staff">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {staff.surname}, {staff.name}
            </h1>
            <p className="text-muted-foreground font-mono">{staff.employee_number}</p>
          </div>
        </div>
        <Link href={`/dashboard/staff/${staff.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </Link>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2">
        <Badge className={statusColors[staff.status]}>
          {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
        </Badge>
        <Badge variant="outline">{staff.grade}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="payroll">Payroll History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{staff.surname}, {staff.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee Number</p>
                    <p className="font-mono font-medium">{staff.employee_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {new Date(staff.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{calculateAge(staff.date_of_birth)} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID Number</p>
                    <p className="font-mono font-medium">{staff.id_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NSSA Number</p>
                    <p className="font-mono font-medium">{staff.nssa_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-mono font-medium">{staff.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Position/Grade</p>
                    <Badge variant="outline">{staff.grade}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={statusColors[staff.status]}>
                      {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                {staff.address && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium whitespace-pre-line">{staff.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Next of Kin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{staff.next_of_kin_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-mono">{staff.next_of_kin_contact || "-"}</p>
                  </div>
                </div>
                {staff.next_of_kin_address && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium whitespace-pre-line">{staff.next_of_kin_address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Religious Denomination</p>
                  <p className="font-medium">{staff.religious_denomination || "-"}</p>
                </div>
                {staff.health_conditions && (
                  <div>
                    <p className="text-sm text-muted-foreground">Health Conditions</p>
                    <p className="font-medium">{staff.health_conditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Record Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Joined System</p>
                    <p className="font-medium">
                      {new Date(staff.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {new Date(staff.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employee Benefits
                </CardTitle>
                <CardDescription>
                  {benefits.length} benefit(s) registered
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Monthly Employer Cost</p>
                <p className="text-xl font-bold">${totalBenefitsCost.toFixed(2)}</p>
              </div>
            </CardHeader>
            <CardContent>
              {benefits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benefit Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Policy Number</TableHead>
                      <TableHead className="text-right">Employer</TableHead>
                      <TableHead className="text-right">Employee</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {benefits.map((benefit) => (
                      <TableRow key={benefit.id}>
                        <TableCell className="font-medium">{benefit.benefit_type}</TableCell>
                        <TableCell>{benefit.provider || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {benefit.policy_number || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(benefit.employer_contribution || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${(benefit.employee_contribution || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          ${(benefit.monthly_amount || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No benefits registered</p>
                  <p className="text-sm">Add benefits from the Benefits page</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll History
              </CardTitle>
              <CardDescription>Recent payroll records</CardDescription>
            </CardHeader>
            <CardContent>
              {payroll.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Period</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Gross Pay</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                      <TableHead className="text-right">Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payroll.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.pay_period_start).toLocaleDateString()} -{" "}
                          {new Date(record.pay_period_end).toLocaleDateString()}
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
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {new Date(record.generated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payroll records</p>
                  <p className="text-sm">Payroll will appear here once generated</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
