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
  Plus,
  Users,
  Search,
  Eye,
  Edit,
  Download,
  UserCheck,
  UserX,
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
  next_of_kin_name: string | null;
  next_of_kin_contact: string | null;
  status: "employed" | "terminated" | "retired";
  created_at: string;
}

const statusColors: Record<string, string> = {
  employed: "bg-green-100 text-green-800",
  terminated: "bg-red-100 text-red-800",
  retired: "bg-blue-100 text-blue-800",
};

const grades = [
  "Principal",
  "Vice Principal",
  "Head of Department",
  "Senior Teacher",
  "Teacher",
  "Lab Technician",
  "Librarian",
  "Administrator",
  "Accountant",
  "Secretary",
  "Security",
  "Cleaner",
  "Driver",
  "Groundskeeper",
  "Other",
];

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("employed");
  const [gradeFilter, setGradeFilter] = useState("all");

  const supabase = useMemo(() => createClient(), []);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("staff")
        .select("*")
        .order("surname");

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (gradeFilter && gradeFilter !== "all") {
        query = query.eq("grade", gradeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = (data as Staff[]) || [];

      // Client-side search
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (s) =>
            s.name.toLowerCase().includes(search) ||
            s.surname.toLowerCase().includes(search) ||
            s.employee_number.toLowerCase().includes(search)
        );
      }

      setStaff(filteredData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [supabase, statusFilter, gradeFilter, searchQuery]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const exportToCSV = () => {
    const headers = ["Emp. No", "Name", "Surname", "Grade", "DOB", "Next of Kin", "Contact", "Status"];
    const rows = staff.map((s) => [
      s.employee_number,
      s.name,
      s.surname,
      s.grade,
      s.date_of_birth,
      s.next_of_kin_name || "",
      s.next_of_kin_contact || "",
      s.status,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_list_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Staff list exported");
  };

  // Stats
  const employedCount = staff.filter((s) => s.status === "employed").length;
  const allStaff = staff.length;

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
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage school employees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={staff.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/staff/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>
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
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{allStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currently Employed</p>
                <p className="text-2xl font-bold text-green-600">{employedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <UserX className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Former Staff</p>
                <p className="text-2xl font-bold">{allStaff - employedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or employee number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-40">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Grade/Position</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Staff
          </CardTitle>
          <CardDescription>
            {staff.length} staff members found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emp. No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Next of Kin</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono text-sm">
                      {member.employee_number}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/staff/${member.id}`} className="hover:underline">
                        <p className="font-medium">{member.surname}, {member.name}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.grade}</Badge>
                    </TableCell>
                    <TableCell>{member.next_of_kin_name || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {member.next_of_kin_contact || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[member.status]}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/staff/${member.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/staff/${member.id}/edit`}>
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
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff members found</p>
              <p className="text-sm">Add employees to start managing staff</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
