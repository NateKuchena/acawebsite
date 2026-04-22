"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Search,
  Download,
  BarChart3,
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Filter,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
}

interface MarkRecord {
  id: string;
  student_id: string;
  academic_year: string;
  term: number;
  subject: string;
  mark: number | null;
  grade: string | null;
  mark_type: string;
  mark_status: string | null;
  topic: string | null;
  max_score: number | null;
  date_written: string | null;
  created_at: string;
  student?: Student;
}

interface SubjectStats {
  subject: string;
  totalStudents: number;
  avgMark: number;
  avgPercentage: number;
  gradeDistribution: Record<string, number>;
  passRate: number;
}

interface FormStats {
  form: string;
  totalStudents: number;
  avgPercentage: number;
  passRate: number;
}

const subjects = [
  "English Language",
  "English Literature",
  "Shona",
  "Ndebele",
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Geography",
  "History",
  "Religious Studies",
  "Commerce",
  "Accounts",
  "Economics",
  "Agriculture",
  "Computer Science",
  "Physical Education",
  "Art",
  "Music",
  "Technical Graphics",
  "Food and Nutrition",
  "Fashion and Fabrics",
  "Woodwork",
  "Metalwork",
  "Building Studies",
];

const markTypes = [
  { value: "all", label: "All Types" },
  { value: "coursework", label: "Coursework" },
  { value: "exam", label: "End of Term Exam" },
  { value: "test", label: "Class Test" },
  { value: "practical", label: "Practical" },
  { value: "assignment", label: "Assignment" },
];

const terms = [
  { value: "all", label: "All Terms" },
  { value: "1", label: "Term 1" },
  { value: "2", label: "Term 2" },
  { value: "3", label: "Term 3" },
];

const currentYear = new Date().getFullYear();
const academicYears = [
  { value: "all", label: "All Years" },
  { value: `${currentYear}`, label: `${currentYear}` },
  { value: `${currentYear - 1}`, label: `${currentYear - 1}` },
];

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A*":
    case "A":
      return "bg-green-100 text-green-800";
    case "B":
      return "bg-blue-100 text-blue-800";
    case "C":
      return "bg-yellow-100 text-yellow-800";
    case "D":
      return "bg-orange-100 text-orange-800";
    case "E":
      return "bg-red-100 text-red-800";
    case "U":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getSpecialMarkLabel(mark: string): string {
  switch (mark) {
    case "A":
      return "Absent";
    case "NW":
      return "Not Written";
    default:
      return mark;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Get the form level (1-6) from form string like "Form 3A"
function getFormLevel(form: string): number {
  const match = form.match(/Form\s*(\d)/i);
  return match ? parseInt(match[1]) : 1;
}

interface MarkbookStudent {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  marks: Record<string, MarkRecord>; // keyed by unique assessment identifier
  average: number | null;
}

interface MarkbookAssessment {
  id: string;
  label: string;
  type: string;
  maxScore: number;
  date: string | null;
  topic: string | null;
}

export default function MarksOverviewPage() {
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [forms, setForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [selectedForm, setSelectedForm] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedYear, setSelectedYear] = useState(academicYears[1].value);
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [selectedMarkType, setSelectedMarkType] = useState("all");

  // View mode
  const [viewMode, setViewMode] = useState<"markbook" | "records" | "bySubject" | "byForm">("markbook");

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all students
      const { data: studentData } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .eq("status", "enrolled")
        .order("form")
        .order("surname");

      const studentsMap: Record<string, Student> = {};
      (studentData as Student[] || []).forEach(s => {
        studentsMap[s.id] = s;
      });
      setStudents(studentData as Student[] || []);

      // Get unique forms
      const uniqueForms = [...new Set((studentData as Student[])?.map(s => s.form) || [])];
      setForms(uniqueForms);

      // Build marks query
      let query = supabase
        .from("student_marks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (selectedYear !== "all") {
        query = query.eq("academic_year", selectedYear);
      }
      if (selectedTerm !== "all") {
        query = query.eq("term", parseInt(selectedTerm));
      }
      if (selectedSubject !== "all") {
        query = query.eq("subject", selectedSubject);
      }
      if (selectedMarkType !== "all") {
        query = query.eq("mark_type", selectedMarkType);
      }

      const { data: marksData, error } = await query;
      if (error) throw error;

      // Attach student data to marks
      const enrichedMarks = (marksData as MarkRecord[] || []).map(mark => ({
        ...mark,
        student: studentsMap[mark.student_id],
      }));

      // Filter by form if selected
      let filteredMarks = enrichedMarks;
      if (selectedForm !== "all") {
        filteredMarks = enrichedMarks.filter(m => m.student?.form === selectedForm);
      }

      setMarks(filteredMarks);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load marks data");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedYear, selectedTerm, selectedSubject, selectedMarkType, selectedForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search filtered marks
  const filteredMarks = useMemo(() => {
    if (!searchQuery) return marks;
    const query = searchQuery.toLowerCase();
    return marks.filter(m =>
      m.student?.name.toLowerCase().includes(query) ||
      m.student?.surname.toLowerCase().includes(query) ||
      m.student?.student_number.toLowerCase().includes(query) ||
      m.subject.toLowerCase().includes(query)
    );
  }, [marks, searchQuery]);

  // Calculate statistics by subject
  const subjectStats = useMemo((): SubjectStats[] => {
    const stats: Record<string, {
      marks: number[];
      percentages: number[];
      grades: Record<string, number>;
      total: number;
      passed: number;
    }> = {};

    marks.forEach(mark => {
      if (!mark.mark || mark.mark_status) return;

      const subject = mark.subject;
      if (!stats[subject]) {
        stats[subject] = { marks: [], percentages: [], grades: {}, total: 0, passed: 0 };
      }

      const maxScore = mark.max_score || 100;
      const percentage = (mark.mark / maxScore) * 100;

      stats[subject].marks.push(mark.mark);
      stats[subject].percentages.push(percentage);
      stats[subject].total++;

      if (percentage >= 40) {
        stats[subject].passed++;
      }

      if (mark.grade) {
        stats[subject].grades[mark.grade] = (stats[subject].grades[mark.grade] || 0) + 1;
      }
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      totalStudents: data.total,
      avgMark: data.marks.reduce((a, b) => a + b, 0) / data.marks.length,
      avgPercentage: data.percentages.reduce((a, b) => a + b, 0) / data.percentages.length,
      gradeDistribution: data.grades,
      passRate: (data.passed / data.total) * 100,
    })).sort((a, b) => b.avgPercentage - a.avgPercentage);
  }, [marks]);

  // Calculate statistics by form
  const formStats = useMemo((): FormStats[] => {
    const stats: Record<string, {
      percentages: number[];
      total: number;
      passed: number;
    }> = {};

    marks.forEach(mark => {
      if (!mark.mark || mark.mark_status || !mark.student?.form) return;

      const form = mark.student.form;
      if (!stats[form]) {
        stats[form] = { percentages: [], total: 0, passed: 0 };
      }

      const maxScore = mark.max_score || 100;
      const percentage = (mark.mark / maxScore) * 100;

      stats[form].percentages.push(percentage);
      stats[form].total++;

      if (percentage >= 40) {
        stats[form].passed++;
      }
    });

    return Object.entries(stats).map(([form, data]) => ({
      form,
      totalStudents: data.total,
      avgPercentage: data.percentages.reduce((a, b) => a + b, 0) / data.percentages.length,
      passRate: (data.passed / data.total) * 100,
    })).sort((a, b) => a.form.localeCompare(b.form));
  }, [marks]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const validMarks = marks.filter(m => m.mark && !m.mark_status);
    const totalRecords = marks.length;
    const absentCount = marks.filter(m => m.mark_status === "A").length;
    const notWrittenCount = marks.filter(m => m.mark_status === "NW").length;

    let avgPercentage = 0;
    let passCount = 0;

    validMarks.forEach(mark => {
      const maxScore = mark.max_score || 100;
      const percentage = (mark.mark! / maxScore) * 100;
      avgPercentage += percentage;
      if (percentage >= 40) passCount++;
    });

    avgPercentage = validMarks.length > 0 ? avgPercentage / validMarks.length : 0;
    const passRate = validMarks.length > 0 ? (passCount / validMarks.length) * 100 : 0;

    return {
      totalRecords,
      validMarks: validMarks.length,
      absentCount,
      notWrittenCount,
      avgPercentage,
      passRate,
    };
  }, [marks]);

  // Calculate markbook data - students with their marks organized by assessment
  const markbookData = useMemo((): { students: MarkbookStudent[]; assessments: MarkbookAssessment[] } => {
    // Only generate markbook if form and subject are selected
    if (selectedForm === "all" || selectedSubject === "all") {
      return { students: [], assessments: [] };
    }

    // Get students for selected form
    const formStudents = students.filter(s => s.form === selectedForm);

    // Get unique assessments from marks
    const assessmentMap = new Map<string, MarkbookAssessment>();
    const studentMarksMap = new Map<string, Record<string, MarkRecord>>();

    // Initialize student marks map
    formStudents.forEach(s => {
      studentMarksMap.set(s.id, {});
    });

    // Process marks to extract assessments and map to students
    marks.forEach(mark => {
      if (mark.student?.form !== selectedForm || mark.subject !== selectedSubject) return;

      // Create unique assessment ID
      let assessmentId: string;
      let assessmentLabel: string;

      if (mark.mark_type === "exam") {
        assessmentId = `exam_${mark.term}`;
        assessmentLabel = `Exam T${mark.term}`;
      } else {
        // For coursework, use type + topic + date for uniqueness
        const topic = mark.topic || "Untitled";
        const date = mark.date_written || "";
        assessmentId = `${mark.mark_type}_${topic}_${date}`;
        assessmentLabel = mark.topic || `${mark.mark_type.charAt(0).toUpperCase() + mark.mark_type.slice(1)}`;
      }

      // Add to assessments map
      if (!assessmentMap.has(assessmentId)) {
        assessmentMap.set(assessmentId, {
          id: assessmentId,
          label: assessmentLabel,
          type: mark.mark_type,
          maxScore: mark.max_score || 100,
          date: mark.date_written,
          topic: mark.topic,
        });
      }

      // Map mark to student
      const studentMarks = studentMarksMap.get(mark.student_id);
      if (studentMarks) {
        studentMarks[assessmentId] = mark;
      }
    });

    // Convert to arrays and calculate averages
    const assessments = Array.from(assessmentMap.values()).sort((a, b) => {
      // Sort by type (exams last), then by date
      if (a.type === "exam" && b.type !== "exam") return 1;
      if (a.type !== "exam" && b.type === "exam") return -1;
      if (a.date && b.date) return a.date.localeCompare(b.date);
      return 0;
    });

    const markbookStudents: MarkbookStudent[] = formStudents.map(student => {
      const studentMarks = studentMarksMap.get(student.id) || {};

      // Calculate average percentage
      const validMarks = Object.values(studentMarks).filter(m => m.mark && !m.mark_status);
      let average: number | null = null;

      if (validMarks.length > 0) {
        const totalPercentage = validMarks.reduce((sum, m) => {
          const maxScore = m.max_score || 100;
          return sum + ((m.mark || 0) / maxScore) * 100;
        }, 0);
        average = totalPercentage / validMarks.length;
      }

      return {
        ...student,
        marks: studentMarks,
        average,
      };
    }).sort((a, b) => a.surname.localeCompare(b.surname));

    return { students: markbookStudents, assessments };
  }, [marks, students, selectedForm, selectedSubject]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Student Number", "Name", "Form", "Subject", "Mark Type", "Mark", "Max Score", "Percentage", "Grade", "Term", "Year", "Date Written"];
    const rows = filteredMarks.map(mark => {
      const maxScore = mark.max_score || 100;
      const percentage = mark.mark ? ((mark.mark / maxScore) * 100).toFixed(1) : mark.mark_status || "";
      return [
        mark.student?.student_number || "",
        mark.student ? `${mark.student.surname}, ${mark.student.name}` : "",
        mark.student?.form || "",
        mark.subject,
        mark.mark_type,
        mark.mark_status || mark.mark?.toString() || "",
        maxScore.toString(),
        percentage,
        mark.grade || mark.mark_status || "",
        `Term ${mark.term}`,
        mark.academic_year,
        mark.date_written || "",
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marks_export_${selectedYear}_${selectedTerm !== "all" ? `term${selectedTerm}_` : ""}${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Marks exported to CSV");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students/marks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marks Overview</h1>
            <p className="text-muted-foreground">
              School-wide marks analysis and tracking
            </p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.validMarks} with marks, {overallStats.absentCount} absent, {overallStats.notWrittenCount} not written
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Percentage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgPercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all recorded marks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            {overallStats.passRate >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallStats.passRate >= 50 ? "text-green-600" : "text-red-600"}`}>
              {overallStats.passRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              40% threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectStats.length}</div>
            <p className="text-xs text-muted-foreground">
              With recorded marks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Form/Class</Label>
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map(form => (
                    <SelectItem key={form} value={form}>{form}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
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
                  {academicYears.map(year => (
                    <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
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
                  {terms.map(term => (
                    <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mark Type</Label>
              <Select value={selectedMarkType} onValueChange={setSelectedMarkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {markTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={viewMode === "markbook" ? "default" : "outline"}
          onClick={() => setViewMode("markbook")}
          size="sm"
        >
          Markbook
        </Button>
        <Button
          variant={viewMode === "records" ? "default" : "outline"}
          onClick={() => setViewMode("records")}
          size="sm"
        >
          Individual Records
        </Button>
        <Button
          variant={viewMode === "bySubject" ? "default" : "outline"}
          onClick={() => setViewMode("bySubject")}
          size="sm"
        >
          By Subject
        </Button>
        <Button
          variant={viewMode === "byForm" ? "default" : "outline"}
          onClick={() => setViewMode("byForm")}
          size="sm"
        >
          By Form
        </Button>
      </div>

      {/* Content based on view mode */}
      {viewMode === "markbook" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Markbook {selectedForm !== "all" && selectedSubject !== "all" && `- ${selectedForm} - ${selectedSubject}`}
            </CardTitle>
            <CardDescription>
              {selectedForm === "all" || selectedSubject === "all" ? (
                "Select a specific Form and Subject to view the markbook"
              ) : (
                <>
                  {markbookData.students.length} students | {markbookData.assessments.length} assessments
                  {selectedForm && (
                    <span className="ml-2 text-xs">
                      Grading: {getFormLevel(selectedForm) <= 4
                        ? "A (75%+) | B (60-74%) | C (50-59%) | D (40-49%) | U (<40%)"
                        : "A* (90%+) | A (80-89%) | B (70-79%) | C (60-69%) | D (50-59%) | E (40-49%) | U (<40%)"
                      }
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedForm === "all" || selectedSubject === "all" ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Please select a specific Form and Subject from the filters above</p>
                <p className="text-sm mt-2">The markbook view shows all students in a class with their assessment marks</p>
              </div>
            ) : markbookData.assessments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No marks recorded for {selectedSubject} in {selectedForm}</p>
                <p className="text-sm mt-2">Marks will appear here once they are entered</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] sticky left-0 bg-background">#</TableHead>
                        <TableHead className="sticky left-[50px] bg-background min-w-[120px]">Student No.</TableHead>
                        <TableHead className="sticky left-[170px] bg-background min-w-[180px]">Name</TableHead>
                        {markbookData.assessments.map((assessment) => (
                          <TableHead
                            key={assessment.id}
                            className="text-center min-w-[100px]"
                            title={`${assessment.type}${assessment.date ? ` - ${formatDate(assessment.date)}` : ""}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-normal text-muted-foreground capitalize">
                                {assessment.type}
                              </span>
                              <span className="truncate max-w-[90px]">{assessment.label}</span>
                              <span className="text-xs font-normal text-muted-foreground">
                                /{assessment.maxScore}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[80px]">Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {markbookData.students
                        .filter(student => {
                          if (!searchQuery) return true;
                          const query = searchQuery.toLowerCase();
                          return (
                            student.name.toLowerCase().includes(query) ||
                            student.surname.toLowerCase().includes(query) ||
                            student.student_number.toLowerCase().includes(query)
                          );
                        })
                        .map((student, index) => {
                          return (
                            <TableRow key={student.id}>
                              <TableCell className="text-muted-foreground sticky left-0 bg-background">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm sticky left-[50px] bg-background">
                                {student.student_number}
                              </TableCell>
                              <TableCell className="font-medium sticky left-[170px] bg-background">
                                {student.surname}, {student.name}
                              </TableCell>
                              {markbookData.assessments.map((assessment) => {
                                const mark = student.marks[assessment.id];
                                if (!mark) {
                                  return (
                                    <TableCell key={assessment.id} className="text-center text-muted-foreground">
                                      —
                                    </TableCell>
                                  );
                                }

                                if (mark.mark_status) {
                                  return (
                                    <TableCell key={assessment.id} className="text-center">
                                      <Badge variant="outline" className="text-xs">
                                        {getSpecialMarkLabel(mark.mark_status)}
                                      </Badge>
                                    </TableCell>
                                  );
                                }

                                const maxScore = mark.max_score || 100;
                                const percentage = mark.mark ? ((mark.mark / maxScore) * 100) : 0;

                                return (
                                  <TableCell key={assessment.id} className="text-center">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="font-mono text-sm">{mark.mark}</span>
                                      {mark.grade && (
                                        <Badge className={`${getGradeColor(mark.grade)} text-xs`}>
                                          {mark.grade}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {percentage.toFixed(0)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center">
                                {student.average !== null ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`font-mono font-bold ${
                                      student.average >= 50 ? "text-green-600" :
                                      student.average >= 40 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                      {student.average.toFixed(1)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium">Legend: </span>
                  <span className="mr-3">A = Absent</span>
                  <span>NW = Not Written</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === "records" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Mark Records
            </CardTitle>
            <CardDescription>
              {filteredMarks.length} records found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, number, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Mark</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarks.slice(0, 100).map((mark) => {
                    const maxScore = mark.max_score || 100;
                    const percentage = mark.mark ? ((mark.mark / maxScore) * 100).toFixed(1) : null;

                    return (
                      <TableRow key={mark.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {mark.student?.surname}, {mark.student?.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {mark.student?.student_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{mark.student?.form}</TableCell>
                        <TableCell>{mark.subject}</TableCell>
                        <TableCell className="capitalize">{mark.mark_type}</TableCell>
                        <TableCell className="text-center">
                          {mark.mark_status ? (
                            <Badge variant="outline">{getSpecialMarkLabel(mark.mark_status)}</Badge>
                          ) : (
                            <span className="font-mono">{mark.mark}/{maxScore}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {percentage ? `${percentage}%` : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {mark.grade ? (
                            <Badge className={getGradeColor(mark.grade)}>{mark.grade}</Badge>
                          ) : mark.mark_status ? (
                            <Badge variant="outline">{mark.mark_status}</Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>Term {mark.term}, {mark.academic_year}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mark.date_written ? formatDate(mark.date_written) : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredMarks.length > 100 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing 100 of {filteredMarks.length} records. Export to CSV to see all.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === "bySubject" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Average performance across subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Total Marks</TableHead>
                    <TableHead className="text-center">Avg %</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                    <TableHead>Grade Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectStats.map((stat) => (
                    <TableRow key={stat.subject}>
                      <TableCell className="font-medium">{stat.subject}</TableCell>
                      <TableCell className="text-center">{stat.totalStudents}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-mono font-bold ${stat.avgPercentage >= 50 ? "text-green-600" : stat.avgPercentage >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                          {stat.avgPercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stat.passRate >= 50 ? "text-green-600" : "text-red-600"}>
                          {stat.passRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {Object.entries(stat.gradeDistribution)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([grade, count]) => (
                              <Badge key={grade} className={getGradeColor(grade)} variant="outline">
                                {grade}: {count}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "byForm" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Form Performance
            </CardTitle>
            <CardDescription>
              Average performance by form/class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead className="text-center">Total Marks</TableHead>
                    <TableHead className="text-center">Avg Percentage</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formStats.map((stat) => (
                    <TableRow key={stat.form}>
                      <TableCell className="font-medium">{stat.form}</TableCell>
                      <TableCell className="text-center">{stat.totalStudents}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-mono font-bold ${stat.avgPercentage >= 50 ? "text-green-600" : stat.avgPercentage >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                          {stat.avgPercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stat.passRate >= 50 ? "text-green-600" : "text-red-600"}>
                          {stat.passRate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${stat.avgPercentage >= 50 ? "bg-green-500" : stat.avgPercentage >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(stat.avgPercentage, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
