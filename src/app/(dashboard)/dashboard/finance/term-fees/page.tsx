"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface FeeCategory {
  id: string;
  name: string;
  default_amount: number | null;
}

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
}

interface StudentBalance {
  student_id: string;
  category_id: string;
  academic_year: string;
  term: number;
  amount_due: number;
  amount_paid: number;
}

export default function TermFeesSetupPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [existingBalances, setExistingBalances] = useState<StudentBalance[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState(`${currentYear}`);
  const [term, setTerm] = useState("1");
  const [selectedForm, setSelectedForm] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const supabase = useMemo(() => createClient(), []);

  // Get unique forms from students
  const forms = useMemo(() => {
    const formSet = new Set(students.map((s) => s.form));
    return Array.from(formSet).sort();
  }, [students]);

  // Filter students by form
  const filteredStudents = useMemo(() => {
    if (selectedForm === "all") return students;
    return students.filter((s) => s.form === selectedForm);
  }, [students, selectedForm]);

  // Check which students already have balances set up
  const studentsWithBalances = useMemo(() => {
    const studentIds = new Set<string>();
    for (const bal of existingBalances) {
      if (bal.academic_year === academicYear && bal.term === parseInt(term)) {
        studentIds.add(bal.student_id);
      }
    }
    return studentIds;
  }, [existingBalances, academicYear, term]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from("fee_categories")
        .select("id, name, default_amount")
        .order("name");

      if (catError) throw catError;
      setCategories((catData as FeeCategory[]) || []);

      // Select all categories with default amounts by default
      const catsWithAmount = (catData || []).filter((c: FeeCategory) => c.default_amount && c.default_amount > 0);
      setSelectedCategories(catsWithAmount.map((c: FeeCategory) => c.id));

      // Fetch enrolled students
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .eq("status", "enrolled")
        .order("form")
        .order("surname");

      if (studentError) throw studentError;
      setStudents((studentData as Student[]) || []);

      // Fetch existing balances
      const { data: balanceData, error: balanceError } = await supabase
        .from("student_balances")
        .select("student_id, category_id, academic_year, term, amount_due, amount_paid");

      if (balanceError) throw balanceError;
      setExistingBalances((balanceData as StudentBalance[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetupFees = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one fee category");
      return;
    }

    if (filteredStudents.length === 0) {
      toast.error("No students to set up fees for");
      return;
    }

    setSaving(true);
    try {
      // Build records to insert
      const records: Array<{
        student_id: string;
        category_id: string;
        academic_year: string;
        term: number;
        amount_due: number;
        amount_paid: number;
      }> = [];

      for (const student of filteredStudents) {
        for (const catId of selectedCategories) {
          const category = categories.find((c) => c.id === catId);
          if (category && category.default_amount) {
            records.push({
              student_id: student.id,
              category_id: catId,
              academic_year: academicYear,
              term: parseInt(term),
              amount_due: category.default_amount,
              amount_paid: 0,
            });
          }
        }
      }

      if (records.length === 0) {
        toast.error("No fee records to create");
        return;
      }

      // Upsert records (insert or do nothing on conflict)
      const { error } = await supabase
        .from("student_balances")
        .upsert(records as never[], {
          onConflict: "student_id,category_id,academic_year,term",
          ignoreDuplicates: true,
        });

      if (error) throw error;

      toast.success(`Set up fees for ${filteredStudents.length} students`);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error setting up fees:", error);
      toast.error("Failed to set up fees");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const selectAllCategories = () => {
    const catsWithAmount = categories.filter((c) => c.default_amount && c.default_amount > 0);
    setSelectedCategories(catsWithAmount.map((c) => c.id));
  };

  const deselectAllCategories = () => {
    setSelectedCategories([]);
  };

  // Calculate totals
  const totalAmount = useMemo(() => {
    return selectedCategories.reduce((sum, catId) => {
      const cat = categories.find((c) => c.id === catId);
      return sum + (cat?.default_amount || 0);
    }, 0);
  }, [selectedCategories, categories]);

  const studentsToSetUp = filteredStudents.filter(
    (s) => !studentsWithBalances.has(s.id)
  ).length;

  const studentsAlreadySetUp = filteredStudents.filter((s) =>
    studentsWithBalances.has(s.id)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Term Fee Setup</h2>
          <p className="text-muted-foreground">
            Set up fee expectations for students at the start of each term
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Term Settings
            </CardTitle>
            <CardDescription>
              Select the academic year and term to set up fees for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear + 1, currentYear, currentYear - 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Term 1</SelectItem>
                    <SelectItem value="2">Term 2</SelectItem>
                    <SelectItem value="3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Filter by Form/Class</Label>
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fee Categories</Label>
                <div className="space-x-2">
                  <Button variant="link" size="sm" onClick={selectAllCategories}>
                    Select All
                  </Button>
                  <Button variant="link" size="sm" onClick={deselectAllCategories}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-auto">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={cat.id}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                        disabled={!cat.default_amount}
                      />
                      <label
                        htmlFor={cat.id}
                        className={`text-sm ${!cat.default_amount ? "text-muted-foreground" : ""}`}
                      >
                        {cat.name}
                      </label>
                    </div>
                    <span className="text-sm font-mono">
                      {cat.default_amount ? `$${cat.default_amount.toFixed(2)}` : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Summary
            </CardTitle>
            <CardDescription>
              Review before setting up term fees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Students to Set Up</p>
                <p className="text-2xl font-bold">{studentsToSetUp}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Already Set Up</p>
                <p className="text-2xl font-bold text-green-600">{studentsAlreadySetUp}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Fee Amount Per Student</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</p>
              <p className="text-sm text-blue-700 mt-1">
                {selectedCategories.length} categories selected
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-900">Total to be Set Up</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                ${(totalAmount * studentsToSetUp).toFixed(2)}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                for {studentsToSetUp} students
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSetupFees}
              disabled={saving || studentsToSetUp === 0 || selectedCategories.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Up Fees...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Set Up Fees for {studentsToSetUp} Students
                </>
              )}
            </Button>

            {studentsToSetUp === 0 && filteredStudents.length > 0 && (
              <p className="text-sm text-center text-green-600">
                All students in this selection already have fees set up for {academicYear} Term {term}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <CardDescription>
            Students that will have fees set up for {academicYear} Term {term}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.slice(0, 50).map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono">{student.student_number}</TableCell>
                  <TableCell>
                    {student.surname}, {student.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.form}</Badge>
                  </TableCell>
                  <TableCell>
                    {studentsWithBalances.has(student.id) ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Set Up
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredStudents.length > 50 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing first 50 of {filteredStudents.length} students
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
