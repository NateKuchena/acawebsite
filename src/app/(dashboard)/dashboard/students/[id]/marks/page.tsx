"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Upload, Loader2, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  surname: string;
  student_number: string;
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

interface CSVMark {
  subject: string;
  mark: string;
  grade: string;
  comment?: string;
}

const subjects = [
  "English Language",
  "Mathematics",
  "Shona",
  "Ndebele",
  "Science",
  "History",
  "Geography",
  "Religious Studies",
  "Physical Education",
  "Art",
  "Music",
  "Computer Science",
  "Agriculture",
  "Commerce",
  "Accounts",
  "Physics",
  "Chemistry",
  "Biology",
];

const currentYear = new Date().getFullYear().toString();

export default function StudentMarksPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [term, setTerm] = useState("1");
  const [subject, setSubject] = useState("");
  const [mark, setMark] = useState("");
  const [grade, setGrade] = useState("");
  const [comment, setComment] = useState("");

  // CSV state
  const [csvMarks, setCsvMarks] = useState<CSVMark[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch student
      const { data: studentData } = await supabase
        .from("students")
        .select("id, name, surname, student_number")
        .eq("id", studentId)
        .single();

      if (!studentData) {
        router.push("/dashboard/students");
        return;
      }

      setStudent(studentData);

      // Fetch marks
      const { data: marksData } = await supabase
        .from("student_marks")
        .select("*")
        .eq("student_id", studentId)
        .order("academic_year", { ascending: false })
        .order("term", { ascending: false });

      setMarks((marksData as Mark[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [studentId, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateGrade = (markValue: number): string => {
    if (markValue >= 90) return "A*";
    if (markValue >= 80) return "A";
    if (markValue >= 70) return "B";
    if (markValue >= 60) return "C";
    if (markValue >= 50) return "D";
    if (markValue >= 40) return "E";
    return "U";
  };

  const handleAddMark = async () => {
    if (!subject || !mark) {
      toast.error("Please fill in subject and mark");
      return;
    }

    setSaving(true);
    try {
      const markValue = parseFloat(mark);
      const autoGrade = grade || calculateGrade(markValue);

      const { error } = await supabase.from("student_marks").insert({
        student_id: studentId,
        academic_year: academicYear,
        term: parseInt(term),
        subject,
        mark: markValue,
        grade: autoGrade,
        teacher_comment: comment || null,
      } as never);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Mark added successfully");
      setDialogOpen(false);
      setSubject("");
      setMark("");
      setGrade("");
      setComment("");
      fetchData();
    } catch (error) {
      toast.error("Failed to add mark");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse<CSVMark>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvMarks(results.data);
        toast.success(`Parsed ${results.data.length} marks from CSV`);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handleBulkUpload = async () => {
    if (csvMarks.length === 0) {
      toast.error("No marks to upload");
      return;
    }

    setSaving(true);
    try {
      const marksToInsert = csvMarks
        .filter((m) => m.subject && m.mark)
        .map((m) => ({
          student_id: studentId,
          academic_year: academicYear,
          term: parseInt(term),
          subject: m.subject.trim(),
          mark: parseFloat(m.mark),
          grade: m.grade?.trim() || calculateGrade(parseFloat(m.mark)),
          teacher_comment: m.comment?.trim() || null,
        }));

      const { error } = await supabase.from("student_marks").insert(marksToInsert as never);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Uploaded ${marksToInsert.length} marks`);
      setCsvMarks([]);
      setCsvFile(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to upload marks");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const downloadTemplate = () => {
    const template = `subject,mark,grade,comment
English Language,85,A,Excellent work
Mathematics,72,B,Good progress
Science,68,C,Keep improving`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marks_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group marks by year and term
  const groupedMarks = marks.reduce((acc, mark) => {
    const key = `${mark.academic_year} - Term ${mark.term}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mark);
    return acc;
  }, {} as Record<string, Mark[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/students/${studentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Academic Marks</h1>
            <p className="text-muted-foreground">
              {student?.surname}, {student?.name} ({student?.student_number})
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Mark
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Mark</DialogTitle>
              <DialogDescription>
                Add a new subject mark for this student
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map((offset) => (
                        <SelectItem
                          key={offset}
                          value={(parseInt(currentYear) - offset).toString()}
                        >
                          {parseInt(currentYear) - offset}
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
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mark (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={mark}
                    onChange={(e) => setMark(e.target.value)}
                    placeholder="85"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade (optional)</Label>
                  <Input
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Auto-calculated if empty"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Teacher Comment (optional)</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment about the student's performance"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMark} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Mark"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view">View Marks</TabsTrigger>
          <TabsTrigger value="upload">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          {Object.keys(groupedMarks).length > 0 ? (
            Object.entries(groupedMarks).map(([period, periodMarks]) => (
              <Card key={period}>
                <CardHeader>
                  <CardTitle>{period}</CardTitle>
                  <CardDescription>
                    {periodMarks.length} subjects recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Mark</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodMarks.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">{m.subject}</TableCell>
                          <TableCell className="text-center font-mono">
                            {m.mark ?? "-"}%
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{m.grade || "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {m.teacher_comment || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No marks recorded yet</p>
                <p className="text-sm">Click &quot;Add Mark&quot; to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Marks</CardTitle>
              <CardDescription>
                Upload marks from a CSV file for the selected period
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
                      {[0, 1, 2].map((offset) => (
                        <SelectItem
                          key={offset}
                          value={(parseInt(currentYear) - offset).toString()}
                        >
                          {parseInt(currentYear) - offset}
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="marks-csv"
                />
                <label htmlFor="marks-csv" className="cursor-pointer flex flex-col items-center">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                  {csvFile ? (
                    <p className="font-medium">{csvFile.name}</p>
                  ) : (
                    <p className="font-medium">Click to select a CSV file</p>
                  )}
                </label>
              </div>

              {csvMarks.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Mark</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvMarks.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell>{m.subject}</TableCell>
                          <TableCell>{m.mark}</TableCell>
                          <TableCell>{m.grade || "Auto"}</TableCell>
                          <TableCell>{m.comment || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button onClick={handleBulkUpload} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload {csvMarks.length} Marks
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
