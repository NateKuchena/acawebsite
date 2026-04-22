"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  GraduationCap,
  User,
  DollarSign,
  FileText,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface LinkedStudent {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  status: string;
  total_balance: number;
}

export default function PortalDashboard() {
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchLinkedStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || "");

      // Get linked students
      const { data: linksData, error: linksError } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("user_id", user.id);

      if (linksError) throw linksError;

      const links = linksData as Array<{ student_id: string }> | null;

      if (!links || links.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = links.map((l) => l.student_id);

      // Get student details
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          id,
          student_number,
          name,
          surname,
          form,
          status,
          student_balances(balance)
        `)
        .in("id", studentIds);

      if (studentsError) throw studentsError;

      // Process students with balance totals
      const processedStudents: LinkedStudent[] = ((studentsData as Array<{
        id: string;
        student_number: string;
        name: string;
        surname: string;
        form: string;
        status: string;
        student_balances: Array<{ balance: number }>;
      }>) || []).map((student) => {
        const totalBalance = (student.student_balances || []).reduce(
          (sum, b) => sum + (b.balance > 0 ? b.balance : 0),
          0
        );
        return {
          id: student.id,
          student_number: student.student_number,
          name: student.name,
          surname: student.surname,
          form: student.form,
          status: student.status,
          total_balance: totalBalance,
        };
      });

      setStudents(processedStudents);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load student information");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLinkedStudents();
  }, [fetchLinkedStudents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to the Parent Portal</h1>
        <p className="text-muted-foreground mt-1">
          Logged in as: {userEmail}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/portal/reports">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Academic Reports</h3>
                  <p className="text-sm text-muted-foreground">View marks and grades</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/fees">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Fee Statement</h3>
                  <p className="text-sm text-muted-foreground">View balances and payments</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">My Profile</h3>
                  <p className="text-sm text-muted-foreground">View account details</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Linked Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            My Students
          </CardTitle>
          <CardDescription>
            Students linked to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {students.map((student) => (
                <Card key={student.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-secondary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {student.surname}, {student.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {student.student_number}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{student.form}</Badge>
                            <Badge
                              className={
                                student.status === "enrolled"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {student.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Balance Info */}
                    {student.total_balance > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Outstanding Balance</span>
                        </div>
                        <p className="text-xl font-bold text-red-600 mt-1">
                          ${student.total_balance.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {student.total_balance === 0 && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm font-medium">Fees Paid</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">All fees are up to date</p>
                      </div>
                    )}

                    {/* Quick Links */}
                    <div className="mt-4 flex gap-2">
                      <Link href={`/portal/reports?student=${student.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Reports
                        </Button>
                      </Link>
                      <Link href={`/portal/fees?student=${student.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Fees
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg">No Students Linked</h3>
              <p className="text-muted-foreground mt-1">
                Please contact the school administration to link your account to your child(ren).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-secondary">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-3 bg-secondary/20 rounded-lg h-fit">
              <AlertCircle className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">Important Information</h3>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>- Academic reports are updated after each term examination</li>
                <li>- Fee statements are updated in real-time as payments are received</li>
                <li>- For any queries, please contact the school office during working hours</li>
                <li>- Keep your login credentials secure and do not share them</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
