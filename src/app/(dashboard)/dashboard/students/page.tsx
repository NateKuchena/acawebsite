import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Upload, Eye, Edit, GraduationCap } from "lucide-react";

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
  status: "enrolled" | "transferred" | "graduated";
  created_at: string;
  balance?: number; // Positive = owes money, Negative = credit (overpaid)
}

interface SearchParams {
  search?: string;
  status?: string;
  form?: string;
  house?: string;
  sex?: string;
  age?: string;
  page?: string;
}

async function getStudents(searchParams: SearchParams) {
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("*", { count: "exact" })
    .order("surname", { ascending: true });

  // Apply search filter
  if (searchParams.search) {
    query = query.or(
      `name.ilike.%${searchParams.search}%,surname.ilike.%${searchParams.search}%,student_number.ilike.%${searchParams.search}%`
    );
  }

  // Apply status filter
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status);
  }

  // Apply form filter
  if (searchParams.form && searchParams.form !== "all") {
    query = query.eq("form", searchParams.form);
  }

  // Apply house filter
  if (searchParams.house && searchParams.house !== "all") {
    query = query.eq("house", searchParams.house);
  }

  // Apply sex filter
  if (searchParams.sex && searchParams.sex !== "all") {
    query = query.eq("sex", searchParams.sex);
  }

  // Pagination
  const page = parseInt(searchParams.page || "1");
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching students:", error);
    return { students: [], count: 0 };
  }

  let students = (data as Student[]) || [];

  // Apply age filter (calculated from date_of_birth)
  if (searchParams.age && searchParams.age !== "all") {
    const today = new Date();
    students = students.filter(student => {
      const birthDate = new Date(student.date_of_birth);
      const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      switch (searchParams.age) {
        case "10-12":
          return age >= 10 && age <= 12;
        case "13-15":
          return age >= 13 && age <= 15;
        case "16-18":
          return age >= 16 && age <= 18;
        case "19+":
          return age >= 19;
        default:
          return true;
      }
    });
  }

  // Calculate balances for each student
  if (students.length > 0) {
    // Get total expected fees (sum of all fee category defaults)
    const { data: feeCategories } = await supabase
      .from("fee_categories")
      .select("default_amount");

    const totalExpected = (feeCategories as { default_amount: number | null }[] || [])
      .reduce((sum, c) => sum + (c.default_amount || 0), 0);

    // Get all payments for these students
    const studentIds = students.map(s => s.id);
    const { data: payments } = await supabase
      .from("fee_payments")
      .select("student_id, amount")
      .in("student_id", studentIds);

    // Group payments by student
    const paymentsByStudent: Record<string, number> = {};
    for (const payment of (payments as { student_id: string; amount: number }[] || [])) {
      paymentsByStudent[payment.student_id] = (paymentsByStudent[payment.student_id] || 0) + payment.amount;
    }

    // Calculate balance for each student (positive = owes, negative = credit)
    for (const student of students) {
      const totalPaid = paymentsByStudent[student.id] || 0;
      student.balance = totalExpected - totalPaid;
    }
  }

  return {
    students,
    count: count || 0,
  };
}

async function getForms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("form")
    .order("form");

  const forms = data as { form: string }[] | null;
  const uniqueForms = [...new Set(forms?.map((s) => s.form) || [])];
  return uniqueForms;
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

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { students, count } = await getStudents(params);
  const forms = await getForms();

  const page = parseInt(params.page || "1");
  const perPage = 20;
  const totalPages = Math.ceil(count / perPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and enrollment
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/students/upload">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </Link>
          <Link href="/dashboard/students/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by name or student number..."
                  defaultValue={params.search}
                  className="pl-9"
                />
              </div>
            </div>
            <Select name="status" defaultValue={params.status || "all"}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
            <Select name="form" defaultValue={params.form || "all"}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Form/Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map((form) => (
                  <SelectItem key={form} value={form}>
                    {form}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select name="house" defaultValue={params.house || "all"}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="House" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                <SelectItem value="Norman">Norman</SelectItem>
                <SelectItem value="Austin">Austin</SelectItem>
              </SelectContent>
            </Select>
            <Select name="sex" defaultValue={params.sex || "all"}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select name="age" defaultValue={params.age || "all"}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="10-12">10-12 years</SelectItem>
                <SelectItem value="13-15">13-15 years</SelectItem>
                <SelectItem value="16-18">16-18 years</SelectItem>
                <SelectItem value="19+">19+ years</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Records
          </CardTitle>
          <CardDescription>
            Showing {students.length} of {count} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">
                        {student.student_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.surname}, {student.name}
                      </TableCell>
                      <TableCell>
                        {student.sex ? (
                          <Badge variant="outline" className={student.sex === "Male" ? "border-blue-300 text-blue-700" : "border-pink-300 text-pink-700"}>
                            {student.sex === "Male" ? "M" : "F"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{student.form}</TableCell>
                      <TableCell>
                        {student.house ? (
                          <Badge className={student.house === "Norman" ? "bg-rose-900 text-white hover:bg-rose-900" : "bg-blue-700 text-white hover:bg-blue-700"}>
                            {student.house}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{student.guardian_name}</TableCell>
                      <TableCell className="text-right">
                        {student.balance !== undefined && (
                          <span className={`font-mono font-medium ${
                            student.balance > 0
                              ? "text-red-600"
                              : student.balance < 0
                                ? "text-green-600"
                                : "text-muted-foreground"
                          }`}>
                            {student.balance > 0
                              ? `$${student.balance.toFixed(2)}`
                              : student.balance < 0
                                ? `-$${Math.abs(student.balance).toFixed(2)} CR`
                                : "$0.00"
                            }
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/students/${student.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/students/${student.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={{
                          pathname: "/dashboard/students",
                          query: { ...params, page: page - 1 },
                        }}
                      >
                        <Button variant="outline" size="sm">
                          Previous
                        </Button>
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={{
                          pathname: "/dashboard/students",
                          query: { ...params, page: page + 1 },
                        }}
                      >
                        <Button variant="outline" size="sm">
                          Next
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground mt-1">
                {params.search || params.status || params.form || params.house || params.sex || params.age
                  ? "Try adjusting your filters"
                  : "Get started by adding your first student"}
              </p>
              {!params.search && !params.status && !params.form && !params.house && !params.sex && !params.age && (
                <Link href="/dashboard/students/new" className="mt-4 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
