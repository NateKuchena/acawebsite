"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  FileText,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getFormLevel, getGradingScale } from "@/lib/utils/grading";
import { PDFDownloadButton } from "@/components/report-cards/pdf-download-button";

// Types for report card data
interface StudentData {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  date_of_birth: string | null;
}

interface MarkData {
  subject: string;
  mark: number | null;
  grade: string | null;
  max_score: number | null;
  teacher_comment: string | null;
  mark_status: string | null;
}

interface SchoolInfoData {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

interface ReportCardData {
  student: StudentData;
  marks: MarkData[];
  averagePercentage: number | null;
  conductRemarks: string | null;
  principalComment: string | null;
  academicYear: string;
  term: number;
}

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  date_of_birth: string | null;
}

interface Mark {
  id: string;
  student_id: string;
  subject: string;
  mark: number | null;
  grade: string | null;
  max_score: number | null;
  teacher_comment: string | null;
  mark_status: string | null;
}

interface SchoolInfo {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

const currentYear = new Date().getFullYear();
const academicYears = [`${currentYear}`, `${currentYear - 1}`];

const terms = [
  { value: "1", label: "Term 1" },
  { value: "2", label: "Term 2" },
  { value: "3", label: "Term 3" },
];

export default function ReportCardsPage() {
  const [forms, setForms] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  const [selectedForm, setSelectedForm] = useState("");
  const [selectedYear, setSelectedYear] = useState(academicYears[0]);
  const [selectedTerm, setSelectedTerm] = useState("1");
  const [principalComments, setPrincipalComments] = useState<Record<string, string>>({});

  const supabase = useMemo(() => createClient(), []);

  // Fetch initial data (forms and school info)
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch unique forms
      const { data: formData } = await supabase
        .from("students")
        .select("form")
        .eq("status", "enrolled")
        .order("form");

      const uniqueForms = [
        ...new Set((formData as { form: string }[])?.map((s) => s.form) || []),
      ];
      setForms(uniqueForms);

      // Fetch school info
      const { data: schoolData } = await supabase
        .from("school_info")
        .select("name, address, phone, email, logo_url")
        .single();

      const typedSchoolData = schoolData as SchoolInfo | null;
      if (typedSchoolData) {
        // Use the logo from database or fallback to /logo.png
        const logoUrl = typedSchoolData.logo_url || `${window.location.origin}/logo.png`;
        setSchoolInfo({
          ...typedSchoolData,
          logo_url: logoUrl,
        });
      } else {
        // Fallback school info
        setSchoolInfo({
          name: "Amazon Christian Academy",
          address: "Amazon Village B, Filabusi",
          phone: null,
          email: null,
          logo_url: `${window.location.origin}/logo.png`,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch students and marks for selected form
  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedForm) {
      setStudents([]);
      setMarks([]);
      return;
    }

    setLoadingStudents(true);
    setPdfReady(false);
    try {
      // Fetch students in selected form
      const { data: studentData } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form, date_of_birth")
        .eq("status", "enrolled")
        .eq("form", selectedForm)
        .order("surname");

      const fetchedStudents = (studentData as Student[]) || [];
      setStudents(fetchedStudents);

      if (fetchedStudents.length === 0) {
        setMarks([]);
        return;
      }

      // Fetch exam marks for those students
      const studentIds = fetchedStudents.map((s) => s.id);
      const { data: marksData } = await supabase
        .from("student_marks")
        .select(
          "id, student_id, subject, mark, grade, max_score, teacher_comment, mark_status"
        )
        .in("student_id", studentIds)
        .eq("academic_year", selectedYear)
        .eq("term", parseInt(selectedTerm))
        .eq("mark_type", "exam")
        .order("subject");

      setMarks((marksData as Mark[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students and marks");
    } finally {
      setLoadingStudents(false);
    }
  }, [supabase, selectedForm, selectedYear, selectedTerm]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [fetchStudentsAndMarks]);

  // Group marks by student
  const marksByStudent = useMemo(() => {
    const grouped: Record<string, Mark[]> = {};
    marks.forEach((mark) => {
      if (!grouped[mark.student_id]) {
        grouped[mark.student_id] = [];
      }
      grouped[mark.student_id].push(mark);
    });
    return grouped;
  }, [marks]);

  // Calculate student statistics
  const studentStats = useMemo(() => {
    return students.map((student) => {
      const studentMarks = marksByStudent[student.id] || [];
      const validMarks = studentMarks.filter(
        (m) => m.mark !== null && !m.mark_status
      );

      let average: number | null = null;
      if (validMarks.length > 0) {
        const totalPercentage = validMarks.reduce((sum, m) => {
          const maxScore = m.max_score || 100;
          return sum + ((m.mark || 0) / maxScore) * 100;
        }, 0);
        average = totalPercentage / validMarks.length;
      }

      return {
        student,
        subjectCount: studentMarks.length,
        average,
        hasMarks: studentMarks.length > 0,
      };
    });
  }, [students, marksByStudent]);

  // Build report card data for PDF
  const reportCardData = useMemo((): ReportCardData[] => {
    return students.map((student) => {
      const studentMarks = marksByStudent[student.id] || [];

      const marksData: MarkData[] = studentMarks.map((m) => ({
        subject: m.subject,
        mark: m.mark,
        grade: m.grade,
        max_score: m.max_score,
        teacher_comment: m.teacher_comment,
        mark_status: m.mark_status,
      }));

      // Calculate average
      const validMarks = studentMarks.filter(
        (m) => m.mark !== null && !m.mark_status
      );
      let averagePercentage: number | null = null;
      if (validMarks.length > 0) {
        const totalPercentage = validMarks.reduce((sum, m) => {
          const maxScore = m.max_score || 100;
          return sum + ((m.mark || 0) / maxScore) * 100;
        }, 0);
        averagePercentage = totalPercentage / validMarks.length;
      }

      const studentData: StudentData = {
        id: student.id,
        student_number: student.student_number,
        name: student.name,
        surname: student.surname,
        form: student.form,
        date_of_birth: student.date_of_birth,
      };

      return {
        student: studentData,
        marks: marksData,
        averagePercentage,
        conductRemarks: null, // Could be fetched from disciplinary_records
        principalComment: principalComments[student.id] || null,
        academicYear: selectedYear,
        term: parseInt(selectedTerm),
      };
    });
  }, [students, marksByStudent, principalComments, selectedYear, selectedTerm]);

  // Handle generate button click
  const handleGenerate = () => {
    if (students.length === 0) {
      toast.error("No students found in selected class");
      return;
    }

    const studentsWithMarks = studentStats.filter((s) => s.hasMarks);
    if (studentsWithMarks.length === 0) {
      toast.error("No exam marks found for this term");
      return;
    }

    setGenerating(true);
    setPdfReady(true);

    // Small delay to allow PDF to start generating
    setTimeout(() => {
      setGenerating(false);
      toast.success(
        `Report cards ready for ${studentsWithMarks.length} students`
      );
    }, 1000);
  };

  const studentsWithMarks = studentStats.filter((s) => s.hasMarks).length;
  const studentsWithoutMarks = studentStats.filter((s) => !s.hasMarks).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-muted-foreground">
          Generate and download end-of-term report cards for students
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Report Cards</CardTitle>
          <CardDescription>
            Select a class and term to generate report cards for all students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Form/Class *</Label>
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={
                  !selectedForm || loadingStudents || students.length === 0
                }
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report Cards
                  </>
                )}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedForm && !loadingStudents && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">in {selectedForm}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Marks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {studentsWithMarks}
              </div>
              <p className="text-xs text-muted-foreground">
                have exam marks recorded
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Missing Marks
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {studentsWithoutMarks}
              </div>
              <p className="text-xs text-muted-foreground">
                no exam marks yet
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Download Button */}
      {pdfReady && schoolInfo && reportCardData.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">
                    Report Cards Ready
                  </p>
                  <p className="text-sm text-green-600">
                    {studentsWithMarks} report cards generated for{" "}
                    {selectedForm}
                  </p>
                </div>
              </div>
              <PDFDownloadButton
                reportCardData={reportCardData}
                schoolInfo={schoolInfo}
                fileName={`ReportCards_${selectedForm.replace(
                  /\s+/g,
                  ""
                )}_${selectedYear}_Term${selectedTerm}.pdf`}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Preview
          </CardTitle>
          <CardDescription>
            {selectedForm ? (
              <>
                Students in {selectedForm} for Term {selectedTerm},{" "}
                {selectedYear}
                {selectedForm && (
                  <span className="ml-2 text-xs">
                    Grading: {getGradingScale(getFormLevel(selectedForm))}
                  </span>
                )}
              </>
            ) : (
              "Select a class to view students"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedForm ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a Form/Class above to preview students</p>
            </div>
          ) : loadingStudents ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students found in {selectedForm}</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="w-[100px]">Student No.</TableHead>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead className="text-center w-[70px]">Subjects</TableHead>
                    <TableHead className="text-center w-[70px]">Average</TableHead>
                    <TableHead className="text-center w-[80px]">Status</TableHead>
                    <TableHead>Principal&apos;s Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentStats.map((stat, index) => (
                    <TableRow key={stat.student.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {stat.student.student_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {stat.student.surname}, {stat.student.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.subjectCount > 0 ? (
                          <Badge variant="secondary">{stat.subjectCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.average !== null ? (
                          <span
                            className={`font-mono font-bold ${
                              stat.average >= 50
                                ? "text-green-600"
                                : stat.average >= 40
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {stat.average.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {stat.hasMarks ? (
                          <Badge className="bg-green-100 text-green-800">
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            No marks
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={principalComments[stat.student.id] || ""}
                          onChange={(e) =>
                            setPrincipalComments((prev) => ({
                              ...prev,
                              [stat.student.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter comment..."
                          rows={1}
                          className="min-h-[36px] text-sm resize-none"
                          disabled={!stat.hasMarks}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
