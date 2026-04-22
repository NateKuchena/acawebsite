"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  Loader2,
  FileText,
  User,
  Printer,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
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

function ReportsContent() {
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("student");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchLinkedStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: linksData } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("user_id", user.id);

      const links = linksData as Array<{ student_id: string }> | null;

      if (!links || links.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = links.map((l) => l.student_id);

      const { data: studentsResult } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .in("id", studentIds);

      const studentsData = studentsResult as Student[] | null;
      setStudents(studentsData || []);

      // Auto-select student if passed in URL
      if (studentIdParam && studentsData?.some((s) => s.id === studentIdParam)) {
        setSelectedStudent(studentIdParam);
      } else if (studentsData && studentsData.length === 1) {
        setSelectedStudent(studentsData[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [supabase, studentIdParam]);

  const fetchMarks = useCallback(async () => {
    if (!selectedStudent) return;

    setLoadingMarks(true);
    try {
      let query = supabase
        .from("student_marks")
        .select("*")
        .eq("student_id", selectedStudent)
        .order("subject");

      if (selectedYear) {
        query = query.eq("academic_year", selectedYear);
      }
      if (selectedTerm !== "all") {
        query = query.eq("term", parseInt(selectedTerm));
      }

      const { data, error } = await query;

      if (error) throw error;

      const marksData = (data as Mark[]) || [];
      setMarks(marksData);

      // Get available years
      const years = [...new Set(marksData.map((m) => m.academic_year))].sort().reverse();
      setAvailableYears(years);

      // Auto-select most recent year if not set
      if (!selectedYear && years.length > 0) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load marks");
    } finally {
      setLoadingMarks(false);
    }
  }, [supabase, selectedStudent, selectedYear, selectedTerm]);

  useEffect(() => {
    fetchLinkedStudents();
  }, [fetchLinkedStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchMarks();
    }
  }, [selectedStudent, fetchMarks]);

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-gray-100 text-gray-800";
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    if (grade.startsWith("D")) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const filteredMarks = marks.filter((m) => {
    if (selectedYear && m.academic_year !== selectedYear) return false;
    if (selectedTerm !== "all" && m.term !== parseInt(selectedTerm)) return false;
    return true;
  });

  const calculateAverage = () => {
    const validMarks = filteredMarks.filter((m) => m.mark !== null);
    if (validMarks.length === 0) return 0;
    return validMarks.reduce((sum, m) => sum + (m.mark || 0), 0) / validMarks.length;
  };

  const getOverallGrade = (average: number) => {
    if (average >= 80) return "A";
    if (average >= 70) return "B";
    if (average >= 60) return "C";
    if (average >= 50) return "D";
    if (average >= 40) return "E";
    return "F";
  };

  const printReport = () => {
    const student = students.find((s) => s.id === selectedStudent);
    if (!student) return;

    const average = calculateAverage();
    const overallGrade = getOverallGrade(average);

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Academic Report - ${student.surname}, ${student.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; border-bottom: 2px solid #800000; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #800000; }
    .header h2 { margin: 10px 0; color: #333; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .info-item { }
    .info-item label { font-weight: bold; color: #666; font-size: 12px; display: block; }
    .info-item span { font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #800000; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; text-align: center; }
    .summary h3 { margin: 0 0 10px 0; }
    .grade { font-size: 48px; font-weight: bold; color: #800000; }
    .average { font-size: 24px; color: #333; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
    .sig-line { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SCHOOL NAME</h1>
    <h2>ACADEMIC REPORT</h2>
    <p>${selectedYear} - Term ${selectedTerm === "all" ? "All" : selectedTerm}</p>
  </div>

  <div class="student-info">
    <div class="info-item">
      <label>Student Name</label>
      <span>${student.surname}, ${student.name}</span>
    </div>
    <div class="info-item">
      <label>Student Number</label>
      <span>${student.student_number}</span>
    </div>
    <div class="info-item">
      <label>Form/Class</label>
      <span>${student.form}</span>
    </div>
    <div class="info-item">
      <label>Report Period</label>
      <span>${selectedYear} Term ${selectedTerm === "all" ? "All Terms" : selectedTerm}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Mark (%)</th>
        <th>Grade</th>
        <th>Teacher's Comment</th>
      </tr>
    </thead>
    <tbody>
      ${filteredMarks.map((m) => `
        <tr>
          <td>${m.subject}</td>
          <td>${m.mark !== null ? m.mark : "-"}</td>
          <td>${m.grade || "-"}</td>
          <td>${m.teacher_comment || "-"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="summary">
    <h3>Overall Performance</h3>
    <div class="average">Average: ${average.toFixed(1)}%</div>
    <div class="grade">${overallGrade}</div>
  </div>

  <div class="signatures">
    <div class="sig-line">Class Teacher</div>
    <div class="sig-line">Head of Department</div>
    <div class="sig-line">Principal</div>
  </div>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()}</p>
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

  const currentStudent = students.find((s) => s.id === selectedStudent);
  const average = calculateAverage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Reports</h1>
        <p className="text-muted-foreground">
          View marks and academic performance
        </p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg">No Students Linked</h3>
            <p className="text-muted-foreground">
              Please contact the school to link your account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                {students.length > 1 && (
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.surname}, {s.name} ({s.student_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={printReport}
                    disabled={filteredMarks.length === 0}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Info & Summary */}
          {currentStudent && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <User className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-medium">
                        {currentStudent.surname}, {currentStudent.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subjects</p>
                      <p className="font-medium">{filteredMarks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="font-medium">{average.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Award className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="text-2xl font-bold">{getOverallGrade(average)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marks Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Subject Marks
              </CardTitle>
              <CardDescription>
                {filteredMarks.length} subjects
                {selectedYear && ` - ${selectedYear}`}
                {selectedTerm !== "all" && ` Term ${selectedTerm}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMarks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredMarks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead className="text-center">Mark (%)</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead>Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarks.map((mark) => (
                      <TableRow key={mark.id}>
                        <TableCell className="font-medium">{mark.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Term {mark.term}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {mark.mark !== null ? mark.mark : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {mark.grade ? (
                            <Badge className={getGradeColor(mark.grade)}>
                              {mark.grade}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mark.teacher_comment || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold">No Marks Found</h3>
                  <p className="text-muted-foreground">
                    {selectedStudent
                      ? "No marks recorded for the selected period"
                      : "Select a student to view their marks"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function PortalReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
