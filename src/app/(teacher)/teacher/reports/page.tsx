"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSpreadsheet,
  Printer,
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
  subject: string;
  mark: number;
  grade: string;
  mark_type: string;
  max_score: number | null;
  date_written: string | null;
  topic: string | null;
  created_at: string;
}

interface Assessment {
  id: string;
  mark_type: string;
  topic: string | null;
  date_written: string | null;
  max_score: number;
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

const markTypeLabels: Record<string, string> = {
  coursework: "CW",
  exam: "Exam",
  test: "Test",
  practical: "Prac",
  assignment: "Assgn",
};

const terms = [
  { value: "1", label: "Term 1" },
  { value: "2", label: "Term 2" },
  { value: "3", label: "Term 3" },
];

const currentYear = new Date().getFullYear();
const academicYears = [`${currentYear}`, `${currentYear - 1}`];

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A*";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "U";
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
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function TeacherReportsPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [forms, setForms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);

  const [selectedForm, setSelectedForm] = useState("");
  const [selectedYear, setSelectedYear] = useState(academicYears[0]);
  const [selectedTerm, setSelectedTerm] = useState("1");
  const [selectedSubject, setSelectedSubject] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchForms = useCallback(async () => {
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

  const fetchData = useCallback(async () => {
    if (!selectedForm || !selectedSubject) {
      setStudents([]);
      setMarks([]);
      return;
    }

    setLoadingMarks(true);
    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .eq("status", "enrolled")
        .eq("form", selectedForm)
        .order("surname");

      const studentList = (studentData as Student[]) || [];
      setStudents(studentList);

      if (studentList.length > 0) {
        const studentIds = studentList.map(s => s.id);
        const { data: marksData } = await supabase
          .from("student_marks")
          .select("id, student_id, subject, mark, grade, mark_type, max_score, date_written, topic, created_at")
          .in("student_id", studentIds)
          .eq("academic_year", selectedYear)
          .eq("term", parseInt(selectedTerm))
          .eq("subject", selectedSubject)
          .order("date_written", { ascending: true, nullsFirst: false });

        setMarks((marksData as Mark[]) || []);
      } else {
        setMarks([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load marks");
    } finally {
      setLoadingMarks(false);
    }
  }, [supabase, selectedForm, selectedYear, selectedTerm, selectedSubject]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assessments = useMemo(() => {
    const assessmentMap = new Map<string, Assessment>();

    marks.forEach(mark => {
      const key = `${mark.mark_type}-${mark.topic || ''}-${mark.date_written || ''}-${mark.max_score || 100}`;

      if (!assessmentMap.has(key)) {
        assessmentMap.set(key, {
          id: key,
          mark_type: mark.mark_type,
          topic: mark.topic,
          date_written: mark.date_written,
          max_score: mark.max_score || 100,
        });
      }
    });

    return Array.from(assessmentMap.values()).sort((a, b) => {
      if (a.date_written && b.date_written) {
        return new Date(a.date_written).getTime() - new Date(b.date_written).getTime();
      }
      if (a.date_written) return -1;
      if (b.date_written) return 1;
      if (a.mark_type === 'exam' && b.mark_type !== 'exam') return 1;
      if (b.mark_type === 'exam' && a.mark_type !== 'exam') return -1;
      return 0;
    });
  }, [marks]);

  const marksLookup = useMemo(() => {
    const lookup: Record<string, Record<string, Mark>> = {};
    marks.forEach(mark => {
      const assessmentKey = `${mark.mark_type}-${mark.topic || ''}-${mark.date_written || ''}-${mark.max_score || 100}`;
      if (!lookup[mark.student_id]) {
        lookup[mark.student_id] = {};
      }
      lookup[mark.student_id][assessmentKey] = mark;
    });
    return lookup;
  }, [marks]);

  const getStudentAverage = (studentId: string): { avg: number; grade: string } | null => {
    const studentMarks = marksLookup[studentId];
    if (!studentMarks || Object.keys(studentMarks).length === 0) return null;

    let totalPercentage = 0;
    let count = 0;

    Object.values(studentMarks).forEach(mark => {
      const maxScore = mark.max_score || 100;
      const percentage = (mark.mark / maxScore) * 100;
      totalPercentage += percentage;
      count++;
    });

    if (count === 0) return null;

    const avg = totalPercentage / count;
    return { avg: Math.round(avg), grade: calculateGrade(avg) };
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Screen View */}
      <div className="space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Class Markbook</h1>
            <p className="text-sm text-muted-foreground">
              View all assessments for a subject
            </p>
          </div>
          {selectedSubject && assessments.length > 0 && (
            <Button onClick={handlePrint} size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Form/Class</Label>
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form} value={form}>{form}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Term</Label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.value} value={term.value}>{term.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedSubject ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="h-5 w-5" />
                {selectedSubject} - {selectedForm}
              </CardTitle>
              <CardDescription>
                {students.length} students | {assessments.length} assessments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingMarks ? (
                <div className="p-4 space-y-3">
                  <div className="flex gap-4 border-b pb-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : students.length > 0 && assessments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium w-8">#</th>
                        <th className="sticky left-8 bg-muted/50 px-3 py-2 text-left font-medium min-w-[160px]">Student</th>
                        {assessments.map(a => (
                          <th key={a.id} className="px-2 py-2 text-center font-medium min-w-[70px]">
                            <div className="text-xs">{markTypeLabels[a.mark_type] || a.mark_type}</div>
                            {a.topic && <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">{a.topic}</div>}
                            {a.date_written && (
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(a.date_written).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground">/{a.max_score}</div>
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center font-medium bg-muted min-w-[70px]">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const avg = getStudentAverage(student.id);
                        return (
                          <tr key={student.id} className="border-t hover:bg-muted/30">
                            <td className="sticky left-0 bg-white px-3 py-2 text-muted-foreground">{index + 1}</td>
                            <td className="sticky left-8 bg-white px-3 py-2">
                              <div className="font-medium">{student.surname}, {student.name}</div>
                              <div className="text-xs text-muted-foreground">{student.student_number}</div>
                            </td>
                            {assessments.map(a => {
                              const mark = marksLookup[student.id]?.[a.id];
                              return (
                                <td key={a.id} className="px-2 py-2 text-center">
                                  {mark ? (
                                    <div>
                                      <div className="font-mono font-semibold">{mark.mark}</div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {Math.round((mark.mark / (mark.max_score || 100)) * 100)}%
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-center bg-muted/30">
                              {avg ? (
                                <div>
                                  <div className="font-mono font-bold">{avg.avg}%</div>
                                  <Badge className={`text-[10px] px-1.5 ${getGradeColor(avg.grade)}`}>
                                    {avg.grade}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No students in {selectedForm}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No marks for {selectedSubject} this term</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Select a subject to view the markbook</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Template - Paginated for multiple assessment columns */}
      <div className="hidden print:block" ref={printRef}>
        {(() => {
          // Split assessments into chunks of 8 per page (optimized for A4 landscape with 32 students)
          const ASSESSMENTS_PER_PAGE = 8;
          const assessmentPages: Assessment[][] = [];
          for (let i = 0; i < assessments.length; i += ASSESSMENTS_PER_PAGE) {
            assessmentPages.push(assessments.slice(i, i + ASSESSMENTS_PER_PAGE));
          }
          // If no assessments, still show one page
          if (assessmentPages.length === 0) assessmentPages.push([]);

          return assessmentPages.map((pageAssessments, pageIndex) => (
            <div key={pageIndex} className="print-page p-4" style={{ pageBreakAfter: pageIndex < assessmentPages.length - 1 ? 'always' : 'auto' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="School Logo" className="w-12 h-12" />
                  <div>
                    <h1 className="text-base font-bold">AMAZON CHRISTIAN ACADEMY</h1>
                    <p className="text-[10px] text-gray-600 italic">Preparing students for life globally and eternally</p>
                  </div>
                </div>
                <div className="text-right text-[10px]">
                  <p><strong>Class:</strong> {selectedForm} | <strong>Subject:</strong> {selectedSubject}</p>
                  <p><strong>Term:</strong> {selectedTerm} | <strong>Year:</strong> {selectedYear}</p>
                  {assessmentPages.length > 1 && <p className="text-gray-500">Page {pageIndex + 1} of {assessmentPages.length}</p>}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-center text-sm font-bold mb-2">CLASS MARKBOOK {pageIndex > 0 && `(Continued)`}</h2>

              {/* Table - Optimized for 32 students */}
              {students.length > 0 && (
                <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
                  <thead>
                    <tr>
                      <th className="border border-black px-1 py-0.5 bg-gray-100 text-left" style={{ width: '18px' }}>#</th>
                      <th className="border border-black px-1 py-0.5 bg-gray-100 text-left" style={{ width: '140px' }}>Student Name</th>
                      {pageIndex === 0 && (
                        <th className="border border-black px-1 py-0.5 bg-gray-100 text-left" style={{ width: '65px' }}>Adm No.</th>
                      )}
                      {pageAssessments.map(a => (
                        <th key={a.id} className="border border-black px-0.5 py-0.5 bg-gray-100 text-center" style={{ width: '52px' }}>
                          <div className="font-bold leading-tight">{markTypeLabels[a.mark_type] || a.mark_type}</div>
                          {a.topic && <div className="font-normal leading-tight" style={{ fontSize: '7px' }}>{a.topic.substring(0, 8)}</div>}
                          {a.date_written && (
                            <div className="font-normal leading-tight" style={{ fontSize: '7px' }}>
                              {new Date(a.date_written).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </div>
                          )}
                          <div className="font-normal leading-tight" style={{ fontSize: '7px' }}>/{a.max_score}</div>
                        </th>
                      ))}
                      {pageIndex === assessmentPages.length - 1 && (
                        <>
                          <th className="border border-black px-1 py-0.5 bg-gray-200 text-center" style={{ width: '40px' }}>AVG</th>
                          <th className="border border-black px-1 py-0.5 bg-gray-200 text-center" style={{ width: '28px' }}>GR</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const avg = getStudentAverage(student.id);
                      return (
                        <tr key={student.id} style={{ height: '16px' }}>
                          <td className="border border-black px-1 py-0 text-center">{index + 1}</td>
                          <td className="border border-black px-1 py-0 truncate" style={{ maxWidth: '140px' }}>
                            {student.surname}, {student.name}
                          </td>
                          {pageIndex === 0 && (
                            <td className="border border-black px-1 py-0 font-mono" style={{ fontSize: '8px' }}>{student.student_number}</td>
                          )}
                          {pageAssessments.map(a => {
                            const mark = marksLookup[student.id]?.[a.id];
                            return (
                              <td key={a.id} className="border border-black px-0.5 py-0 text-center">
                                {mark ? mark.mark : '-'}
                              </td>
                            );
                          })}
                          {pageIndex === assessmentPages.length - 1 && (
                            <>
                              <td className="border border-black px-1 py-0 text-center font-bold bg-gray-50">
                                {avg ? `${avg.avg}%` : '-'}
                              </td>
                              <td className="border border-black px-1 py-0 text-center font-bold bg-gray-50">
                                {avg ? avg.grade : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Footer - only on last page */}
              {pageIndex === assessmentPages.length - 1 && (
                <>
                  <div className="mt-3 pt-2 border-t border-gray-300 flex justify-between text-[9px] text-gray-600">
                    <p>Printed: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p>Total Students: {students.length} | Total Assessments: {assessments.length}</p>
                  </div>
                  <div className="mt-2 text-[8px]">
                    <p className="font-bold">Grading Scale: A* (90-100%) | A (80-89%) | B (70-79%) | C (60-69%) | D (50-59%) | E (40-49%) | U (&lt;40%)</p>
                  </div>
                </>
              )}
            </div>
          ));
        })()}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
