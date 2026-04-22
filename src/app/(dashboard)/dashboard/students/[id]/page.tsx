import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Calendar,
  GraduationCap,
  Heart,
  BookOpen,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  date_of_birth: string;
  sex: "Male" | "Female" | null;
  form: string;
  house: "Norman" | "Austin" | null;
  guardian_name: string;
  guardian_contact: string;
  religious_denomination: string | null;
  health_conditions: string | null;
  status: "enrolled" | "transferred" | "graduated";
  created_at: string;
  updated_at: string;
}

interface Mark {
  id: string;
  academic_year: string;
  term: number;
  subject: string;
  mark: number | null;
  grade: string | null;
  teacher_comment: string | null;
}

interface DisciplinaryRecord {
  id: string;
  date: string;
  offense: string;
  action_taken: string;
}

interface Balance {
  id: string;
  category_id: string;
  academic_year: string;
  term: number;
  amount_due: number;
  amount_paid: number;
  balance: number;
  fee_categories: { name: string } | null;
}

async function getStudent(id: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (!student) return null;

  // Get marks
  const { data: marks } = await supabase
    .from("student_marks")
    .select("*")
    .eq("student_id", id)
    .order("academic_year", { ascending: false })
    .order("term", { ascending: false });

  // Get disciplinary records
  const { data: disciplinary } = await supabase
    .from("disciplinary_records")
    .select("*")
    .eq("student_id", id)
    .order("date", { ascending: false });

  // Get balances
  const { data: balances } = await supabase
    .from("student_balances")
    .select("*, fee_categories(name)")
    .eq("student_id", id)
    .order("academic_year", { ascending: false });

  return {
    student: student as Student,
    marks: (marks as Mark[]) || [],
    disciplinary: (disciplinary as DisciplinaryRecord[]) || [],
    balances: (balances as Balance[]) || [],
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "enrolled":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enrolled</Badge>;
    case "transferred":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Transferred</Badge>;
    case "graduated":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Graduated</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStudent(id);

  if (!data) {
    notFound();
  }

  const { student, marks, disciplinary, balances } = data;
  const totalOwed = balances.reduce((sum, b) => sum + Number(b.balance), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {student.surname}, {student.name}
              </h1>
              {getStatusBadge(student.status)}
            </div>
            <p className="text-muted-foreground font-mono">{student.student_number}</p>
          </div>
        </div>
        <Link href={`/dashboard/students/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Student
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Form</p>
                <p className="text-xl font-bold">{student.form}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="text-xl font-bold">
                  {Math.floor(
                    (new Date().getTime() - new Date(student.date_of_birth).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000)
                  )}{" "}
                  years
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disciplinary</p>
                <p className="text-xl font-bold">{disciplinary.length} records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${totalOwed > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <DollarSign className={`h-5 w-5 ${totalOwed > 0 ? "text-red-600" : "text-green-600"}`} />
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

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="marks">Academic Marks</TabsTrigger>
          <TabsTrigger value="discipline">Discipline</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Information */}
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
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Surname</p>
                    <p className="font-medium">{student.surname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {format(new Date(student.date_of_birth), "PPP")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sex</p>
                    <p className="font-medium">
                      {student.sex ? (
                        <Badge variant="outline" className={student.sex === "Male" ? "border-blue-300 text-blue-700" : "border-pink-300 text-pink-700"}>
                          {student.sex}
                        </Badge>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">House</p>
                    <p className="font-medium">
                      {student.house ? (
                        <Badge className={student.house === "Norman" ? "bg-rose-900 text-white hover:bg-rose-900" : "bg-blue-700 text-white hover:bg-blue-700"}>
                          {student.house}
                        </Badge>
                      ) : (
                        "Not assigned"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Religious Denomination</p>
                    <p className="font-medium">{student.religious_denomination || "Not specified"}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Health Conditions</p>
                  <p className="font-medium mt-1">
                    {student.health_conditions || "None recorded"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Guardian Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Guardian Name</p>
                  <p className="font-medium">{student.guardian_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium font-mono">{student.guardian_contact}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>Created</p>
                    <p className="text-foreground">
                      {format(new Date(student.created_at), "PPP")}
                    </p>
                  </div>
                  <div>
                    <p>Last Updated</p>
                    <p className="text-foreground">
                      {format(new Date(student.updated_at), "PPP")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marks Tab */}
        <TabsContent value="marks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Academic Marks
                </CardTitle>
                <CardDescription>End-of-term examination results</CardDescription>
              </div>
              <Link href={`/dashboard/students/${id}/marks`}>
                <Button variant="outline">Manage Marks</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {marks.length > 0 ? (
                <div className="space-y-6">
                  {/* Group by year and term */}
                  {Object.entries(
                    marks.reduce((acc, mark) => {
                      const key = `${mark.academic_year} - Term ${mark.term}`;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(mark);
                      return acc;
                    }, {} as Record<string, Mark[]>)
                  ).map(([period, periodMarks]) => (
                    <div key={period}>
                      <h4 className="font-medium mb-3">{period}</h4>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium">Subject</th>
                              <th className="text-center p-3 font-medium">Mark</th>
                              <th className="text-center p-3 font-medium">Grade</th>
                              <th className="text-left p-3 font-medium">Comment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periodMarks.map((mark) => (
                              <tr key={mark.id} className="border-t">
                                <td className="p-3">{mark.subject}</td>
                                <td className="p-3 text-center font-mono">
                                  {mark.mark ?? "-"}
                                </td>
                                <td className="p-3 text-center">
                                  <Badge variant="outline">{mark.grade || "-"}</Badge>
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {mark.teacher_comment || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No marks recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discipline Tab */}
        <TabsContent value="discipline">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Disciplinary Records
                </CardTitle>
                <CardDescription>History of disciplinary actions</CardDescription>
              </div>
              <Link href={`/dashboard/students/${id}/discipline`}>
                <Button variant="outline">Add Record</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {disciplinary.length > 0 ? (
                <div className="space-y-4">
                  {disciplinary.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium">{record.offense}</p>
                        <Badge variant="outline">
                          {format(new Date(record.date), "PP")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Action taken:</span> {record.action_taken}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No disciplinary records</p>
                  <p className="text-sm">This student has a clean record</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Balances
              </CardTitle>
              <CardDescription>Outstanding fees by category</CardDescription>
            </CardHeader>
            <CardContent>
              {balances.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Category</th>
                        <th className="text-left p-3 font-medium">Period</th>
                        <th className="text-right p-3 font-medium">Due</th>
                        <th className="text-right p-3 font-medium">Paid</th>
                        <th className="text-right p-3 font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balances.map((balance) => (
                        <tr key={balance.id} className="border-t">
                          <td className="p-3">{balance.fee_categories?.name || "Unknown"}</td>
                          <td className="p-3">
                            {balance.academic_year} Term {balance.term}
                          </td>
                          <td className="p-3 text-right font-mono">
                            ${Number(balance.amount_due).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono text-green-600">
                            ${Number(balance.amount_paid).toFixed(2)}
                          </td>
                          <td
                            className={`p-3 text-right font-mono font-medium ${
                              Number(balance.balance) > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            ${Number(balance.balance).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr className="border-t">
                        <td colSpan={4} className="p-3 font-medium text-right">
                          Total Outstanding:
                        </td>
                        <td
                          className={`p-3 text-right font-mono font-bold ${
                            totalOwed > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          ${totalOwed.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fee records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
