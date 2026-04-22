"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/lib/hooks";
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
  GraduationCap,
  Search,
  Save,
  BookOpen,
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
  student_id: string;
  academic_year: string;
  term: number;
  subject: string;
  mark: number | null;
  grade: string | null;
  mark_type: string;
  mark_status: string | null; // "A" for absent, "NW" for not written, null for normal mark
  teacher_comment: string | null;
  date_written: string | null;
  topic: string | null;
  max_score: number | null;
  created_at: string;
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
  { value: "coursework", label: "Coursework" },
  { value: "exam", label: "End of Term Exam" },
  { value: "test", label: "Class Test" },
  { value: "practical", label: "Practical" },
  { value: "assignment", label: "Assignment" },
];

const terms = [
  { value: "1", label: "Term 1" },
  { value: "2", label: "Term 2" },
  { value: "3", label: "Term 3" },
];

const currentYear = new Date().getFullYear();
const academicYears = [
  `${currentYear}`,
  `${currentYear - 1}`,
];

// Special mark entries
const SPECIAL_MARKS = {
  ABSENT: "A",      // Student was absent
  NOT_WRITTEN: "NW" // Student did not write/submit
} as const;

type SpecialMark = typeof SPECIAL_MARKS[keyof typeof SPECIAL_MARKS];

// Check if a mark entry is a special mark
function isSpecialMark(value: string): value is SpecialMark {
  return value === SPECIAL_MARKS.ABSENT || value === SPECIAL_MARKS.NOT_WRITTEN;
}

// Get the form level (1-6) from form string like "Form 3A"
function getFormLevel(form: string): number {
  const match = form.match(/Form\s*(\d)/i);
  return match ? parseInt(match[1]) : 1;
}

// Calculate grade based on form level
// Form 1-4: A (75-100%), B (60-74%), C (50-59%), D (40-49%), U (<40%)
// Form 5-6: A* (90-100%), A (80-89%), B (70-79%), C (60-69%), D (50-59%), E (40-49%), U (<40%)
function calculateGrade(percentage: number, formLevel: number): string {
  if (formLevel <= 4) {
    // Form 1-4 grading scale
    if (percentage >= 75) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "U";
  } else {
    // Form 5-6 grading scale (A-Level)
    if (percentage >= 90) return "A*";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    if (percentage >= 40) return "E";
    return "U";
  }
}

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

// Get color for special marks
function getSpecialMarkColor(mark: string): string {
  switch (mark) {
    case SPECIAL_MARKS.ABSENT:
      return "bg-purple-100 text-purple-800";
    case SPECIAL_MARKS.NOT_WRITTEN:
      return "bg-slate-100 text-slate-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Get label for special marks
function getSpecialMarkLabel(mark: string): string {
  switch (mark) {
    case SPECIAL_MARKS.ABSENT:
      return "Absent";
    case SPECIAL_MARKS.NOT_WRITTEN:
      return "Not Written";
    default:
      return mark;
  }
}

export default function TeacherMarksPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [forms, setForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [selectedForm, setSelectedForm] = useState("");
  const [selectedYear, setSelectedYear] = useState(academicYears[0]);
  const [selectedTerm, setSelectedTerm] = useState("1");

  // Bulk entry state
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkMarkType, setBulkMarkType] = useState("coursework");
  const [bulkDateWritten, setBulkDateWritten] = useState("");
  const [bulkTopic, setBulkTopic] = useState("");
  const [bulkMaxScore, setBulkMaxScore] = useState("100");
  const [bulkMarks, setBulkMarks] = useState<Record<string, string>>({});
  const [existingMarks, setExistingMarks] = useState<Record<string, Mark>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMarks, setLoadingMarks] = useState(false);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Track if initial data is loaded
  useRef(false);

  const supabase = useMemo(() => createClient(), []);

  // Fetch forms
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: formData } = await supabase
        .from("students")
        .select("form")
        .eq("status", "enrolled")
        .order("form");

      const uniqueForms = [...new Set((formData as { form: string }[])?.map(s => s.form) || [])];
      setForms(uniqueForms);

      if (uniqueForms.length > 0 && !selectedForm) {
        setSelectedForm(uniqueForms[0]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedForm]);

  // Fetch students for selected form
  const fetchStudents = useCallback(async () => {
    if (!selectedForm) return;

    setLoadingStudents(true);
    try {
      const { data } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .eq("status", "enrolled")
        .eq("form", selectedForm)
        .order("surname");

      setStudents((data as Student[]) || []);
      // Reset bulk marks when students change
      setBulkMarks({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  }, [supabase, selectedForm]);

  // Fetch existing marks for bulk entry
  const fetchExistingMarksForBulk = useCallback(async () => {
    if (!selectedForm || !bulkSubject || !bulkMarkType) {
      setExistingMarks({});
      return;
    }

    // Get student IDs for the selected form
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return;

    setLoadingMarks(true);
    try {
      // Build query for matching marks
      let query = supabase
        .from("student_marks")
        .select("*")
        .in("student_id", studentIds)
        .eq("academic_year", selectedYear)
        .eq("term", parseInt(selectedTerm))
        .eq("subject", bulkSubject)
        .eq("mark_type", bulkMarkType);

      // For coursework, also match by topic and date if provided
      if (bulkMarkType !== "exam" && bulkTopic) {
        query = query.eq("topic", bulkTopic);
      }
      if (bulkMarkType !== "exam" && bulkDateWritten) {
        query = query.eq("date_written", bulkDateWritten);
      }

      const { data } = await query;

      // Create lookup by student_id
      const lookup: Record<string, Mark> = {};
      (data as Mark[] || []).forEach(mark => {
        lookup[mark.student_id] = mark;
      });
      setExistingMarks(lookup);

      // Pre-fill bulk marks with existing values (handle special marks)
      const prefilled: Record<string, string> = {};
      Object.entries(lookup).forEach(([studentId, mark]) => {
        if (mark.mark_status) {
          // Special mark (Absent or Not Written)
          prefilled[studentId] = mark.mark_status;
        } else if (mark.mark !== null) {
          prefilled[studentId] = mark.mark.toString();
        }
      });
      setBulkMarks(prefilled);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMarks(false);
    }
  }, [supabase, students, selectedForm, selectedYear, selectedTerm, bulkSubject, bulkMarkType, bulkTopic, bulkDateWritten]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchExistingMarksForBulk();
  }, [fetchExistingMarksForBulk]);

  // Handle bulk mark change
  const handleBulkMarkChange = (studentId: string, value: string) => {
    setBulkMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  // Save all bulk marks
  const handleSaveBulkMarks = async () => {
    if (!bulkSubject) {
      toast.error("Please select a subject");
      return;
    }

    const marksToSave = Object.entries(bulkMarks).filter(([, value]) => value !== "");
    if (marksToSave.length === 0) {
      toast.error("Please enter at least one mark");
      return;
    }

    const isExamType = bulkMarkType === "exam";
    const maxScoreValue = !isExamType && bulkMaxScore ? parseInt(bulkMaxScore) : 100;
    const formLevel = getFormLevel(selectedForm);

    // Validate all marks
    for (const [studentId, markStr] of marksToSave) {
      const upperMarkStr = markStr.toUpperCase().trim();

      // Check if it's a special mark
      if (isSpecialMark(upperMarkStr)) {
        continue; // Valid special mark
      }

      // Otherwise validate as numeric mark
      const mark = parseFloat(markStr);
      if (isNaN(mark) || mark < 0) {
        const student = students.find(s => s.id === studentId);
        toast.error(`Invalid mark for ${student?.surname}, ${student?.name}. Enter a number, 'A' (Absent), or 'NW' (Not Written)`);
        return;
      }
      if (mark > maxScoreValue) {
        const student = students.find(s => s.id === studentId);
        toast.error(`Mark for ${student?.surname}, ${student?.name} cannot exceed ${maxScoreValue}`);
        return;
      }
    }

    setSaving(true);
    try {
      let savedCount = 0;
      let updatedCount = 0;

      for (const [studentId, markStr] of marksToSave) {
        const upperMarkStr = markStr.toUpperCase().trim();
        const isSpecial = isSpecialMark(upperMarkStr);

        // Calculate mark and grade based on whether it's a special mark
        let markValue: number | null = null;
        let grade: string | null = null;
        let markStatus: string | null = null;

        if (isSpecial) {
          markStatus = upperMarkStr;
          // No numeric mark or grade for special entries
        } else {
          markValue = parseFloat(markStr);
          const percentage = (markValue / maxScoreValue) * 100;
          grade = calculateGrade(percentage, formLevel);
        }

        const courseworkFields = isExamType ? {} : {
          date_written: bulkDateWritten || null,
          topic: bulkTopic || null,
          max_score: maxScoreValue,
        };

        const existing = existingMarks[studentId];

        if (existing) {
          // Update existing mark
          const { error } = await supabase
            .from("student_marks")
            .update({
              mark: markValue,
              grade,
              mark_status: markStatus,
              ...courseworkFields,
            } as never)
            .eq("id", existing.id);

          if (error) throw error;
          updatedCount++;
        } else {
          // Insert new mark
          const { error } = await supabase.from("student_marks").insert({
            student_id: studentId,
            academic_year: selectedYear,
            term: parseInt(selectedTerm),
            subject: bulkSubject,
            mark: markValue,
            grade,
            mark_status: markStatus,
            mark_type: bulkMarkType,
            ...courseworkFields,
          } as never);

          if (error) throw error;
          savedCount++;
        }
      }

      toast.success(`Marks saved! ${savedCount} new, ${updatedCount} updated`);

      // Redirect to dashboard after successful save
      router.push("/teacher");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  // Filter students for search (using debounced value)
  const filteredStudents = useMemo(() => {
    if (!debouncedSearchQuery) return students;
    const query = debouncedSearchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.surname.toLowerCase().includes(query) ||
      s.student_number.toLowerCase().includes(query)
    );
  }, [students, debouncedSearchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Marks</h1>
        <p className="text-muted-foreground">
          Enter coursework and exam marks for students
        </p>
      </div>

      {/* Class & Assessment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Details</CardTitle>
          <CardDescription>
            Select the class and fill in assessment details, then enter marks for all students below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Class, Year, Term */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Form/Class *</Label>
              <Select value={selectedForm} onValueChange={setSelectedForm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select form" />
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
          </div>

          {/* Row 2: Subject, Mark Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={bulkSubject} onValueChange={setBulkSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mark Type *</Label>
              <Select value={bulkMarkType} onValueChange={setBulkMarkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {markTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Coursework-specific fields */}
          {bulkMarkType !== "exam" && (
            <div className="grid gap-4 sm:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <Label>Date Written</Label>
                <Input
                  type="date"
                  value={bulkDateWritten}
                  onChange={(e) => setBulkDateWritten(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Topic/Title</Label>
                <Input
                  value={bulkTopic}
                  onChange={(e) => setBulkTopic(e.target.value)}
                  placeholder="e.g., Fractions, Chapter 3"
                />
              </div>

              <div className="space-y-2">
                <Label>Marked Out Of</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkMaxScore}
                  onChange={(e) => setBulkMaxScore(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Marks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Enter Marks - {selectedForm}
          </CardTitle>
          <CardDescription className="space-y-2">
            <p>{students.length} student(s) | Enter marks out of {bulkMarkType !== "exam" ? bulkMaxScore || "100" : "100"}</p>
            <div className="text-xs">
              <span className="font-medium">Grading Scale ({getFormLevel(selectedForm) <= 4 ? "Form 1-4" : "Form 5-6"}): </span>
              {getFormLevel(selectedForm) <= 4 ? (
                <span>A (75-100%) | B (60-74%) | C (50-59%) | D (40-49%) | U (&lt;40%)</span>
              ) : (
                <span>A* (90-100%) | A (80-89%) | B (70-79%) | C (60-69%) | D (50-59%) | E (40-49%) | U (&lt;40%)</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Special entries: </span>
              <span>A = Absent | NW = Not Written</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bulkSubject ? (
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

              <div className="border rounded-lg overflow-hidden">
                {loadingStudents || loadingMarks ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-40 flex-1" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead>Student Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[120px]">Mark</TableHead>
                        <TableHead className="w-[80px] text-center">Grade</TableHead>
                        <TableHead className="w-[80px] text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => {
                        const markStr = bulkMarks[student.id] || "";
                        const upperMarkStr = markStr.toUpperCase().trim();
                        const isSpecial = isSpecialMark(upperMarkStr);
                        const markNum = parseFloat(markStr);
                        const maxScoreNum = bulkMarkType !== "exam" && bulkMaxScore ? parseInt(bulkMaxScore) : 100;
                        const formLevel = getFormLevel(selectedForm);
                        const percentage = !isNaN(markNum) ? (markNum / maxScoreNum) * 100 : 0;
                        const grade = !isSpecial && !isNaN(markNum) && markStr !== "" ? calculateGrade(percentage, formLevel) : "";
                        const hasExisting = !!existingMarks[student.id];
                        const isOverMax = !isSpecial && !isNaN(markNum) && markNum > maxScoreNum;

                        return (
                          <TableRow key={student.id}>
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-mono text-sm">{student.student_number}</TableCell>
                            <TableCell className="font-medium">
                              {student.surname}, {student.name}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={markStr}
                                onChange={(e) => handleBulkMarkChange(student.id, e.target.value)}
                                placeholder="—"
                                className={`w-20 text-center uppercase ${isOverMax ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                title={`Enter mark (0-${maxScoreNum}), A (Absent), or NW (Not Written)`}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {isSpecial ? (
                                <Badge className={getSpecialMarkColor(upperMarkStr)}>
                                  {getSpecialMarkLabel(upperMarkStr)}
                                </Badge>
                              ) : grade ? (
                                <Badge className={getGradeColor(grade)}>
                                  {grade}
                                </Badge>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-center">
                              {hasExisting && (
                                <Badge variant="outline" className="text-xs">
                                  Saved
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {Object.values(bulkMarks).filter(v => v !== "").length} of {students.length} marks entered
                </p>
                <Button onClick={handleSaveBulkMarks} disabled={saving} size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save All Marks
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a subject above to enter marks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
