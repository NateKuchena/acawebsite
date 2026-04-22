"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Upload, FileSpreadsheet, Check, X, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface CSVStudent {
  student_number: string;
  name: string;
  surname: string;
  date_of_birth: string;
  sex: string;
  form: string;
  house: string;
  guardian_name: string;
  guardian_contact: string;
  religious_denomination?: string;
  health_conditions?: string;
}

interface ParsedStudent extends CSVStudent {
  valid: boolean;
  errors: string[];
}

const requiredFields = [
  "student_number",
  "name",
  "surname",
  "date_of_birth",
  "sex",
  "form",
  "house",
  "guardian_name",
  "guardian_contact",
];

export default function UploadStudentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const validateStudent = (student: CSVStudent): ParsedStudent => {
    const errors: string[] = [];

    // Check required fields
    requiredFields.forEach((field) => {
      if (!student[field as keyof CSVStudent]?.toString().trim()) {
        errors.push(`Missing ${field.replace("_", " ")}`);
      }
    });

    // Validate date format
    if (student.date_of_birth) {
      const date = new Date(student.date_of_birth);
      if (isNaN(date.getTime())) {
        errors.push("Invalid date of birth format");
      }
    }

    // Validate sex
    if (student.sex && !["Male", "Female"].includes(student.sex)) {
      errors.push("Sex must be 'Male' or 'Female'");
    }

    // Validate house
    if (student.house && !["Norman", "Austin"].includes(student.house)) {
      errors.push("House must be 'Norman' or 'Austin'");
    }

    return {
      ...student,
      valid: errors.length === 0,
      errors,
    };
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setUploaded(false);

    Papa.parse<CSVStudent>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map(validateStudent);
        setParsedData(validated);

        const validCount = validated.filter((s) => s.valid).length;
        const invalidCount = validated.filter((s) => !s.valid).length;

        if (invalidCount > 0) {
          toast.warning(
            `Parsed ${validated.length} rows: ${validCount} valid, ${invalidCount} with errors`
          );
        } else {
          toast.success(`Parsed ${validated.length} valid student records`);
        }
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  }, []);

  const handleUpload = async () => {
    const validStudents = parsedData.filter((s) => s.valid);
    if (validStudents.length === 0) {
      toast.error("No valid students to upload");
      return;
    }

    setUploading(true);

    try {
      const studentsToInsert = validStudents.map((s) => ({
        student_number: s.student_number.trim(),
        name: s.name.trim(),
        surname: s.surname.trim(),
        date_of_birth: s.date_of_birth.trim(),
        sex: s.sex.trim() as "Male" | "Female",
        form: s.form.trim(),
        house: s.house.trim() as "Norman" | "Austin",
        guardian_name: s.guardian_name.trim(),
        guardian_contact: s.guardian_contact.trim(),
        religious_denomination: s.religious_denomination?.trim() || null,
        health_conditions: s.health_conditions?.trim() || null,
        status: "enrolled" as const,
      }));

      const { error } = await supabase.from("students").insert(studentsToInsert as never);

      if (error) {
        if (error.code === "23505") {
          toast.error("Some student numbers already exist in the database");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setUploaded(true);
      toast.success(`Successfully uploaded ${validStudents.length} students`);
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `student_number,name,surname,date_of_birth,sex,form,house,guardian_name,guardian_contact,religious_denomination,health_conditions
STU001,John,Doe,2010-05-15,Male,Form 1A,Norman,Jane Doe,+263771234567,Christian,None
STU002,Mary,Smith,2009-08-22,Female,Form 2B,Austin,Bob Smith,+263772345678,Catholic,Asthma`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validCount = parsedData.filter((s) => s.valid).length;
  const invalidCount = parsedData.filter((s) => !s.valid).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Students</h1>
          <p className="text-muted-foreground">
            Bulk import students from a CSV file
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV File Format</CardTitle>
          <CardDescription>
            Your CSV file should have the following columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {requiredFields.map((field) => (
                <Badge key={field} variant="default">
                  {field} *
                </Badge>
              ))}
              <Badge variant="outline">religious_denomination</Badge>
              <Badge variant="outline">health_conditions</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Fields marked with * are required. Date of birth should be in YYYY-MM-DD format.
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Select File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={uploading}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              {file ? (
                <>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Click to select a different file
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Click to select a CSV file</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop
                  </p>
                </>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {validCount} valid, {invalidCount} with errors
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {uploaded ? (
                  <Button disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Uploaded
                  </Button>
                ) : (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || validCount === 0}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload {validCount} Students
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Student No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Surname</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Guardian</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((student, index) => (
                    <TableRow
                      key={index}
                      className={student.valid ? "" : "bg-red-50"}
                    >
                      <TableCell>
                        {student.valid ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.student_number}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.surname}</TableCell>
                      <TableCell>{student.sex}</TableCell>
                      <TableCell>{student.form}</TableCell>
                      <TableCell>{student.house}</TableCell>
                      <TableCell>{student.guardian_name}</TableCell>
                      <TableCell>
                        {student.errors.length > 0 && (
                          <span className="text-sm text-red-600">
                            {student.errors.join(", ")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions after upload */}
      {uploaded && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setParsedData([]);
              setUploaded(false);
            }}
          >
            Upload More
          </Button>
          <Button onClick={() => router.push("/dashboard/students")}>
            View Students
          </Button>
        </div>
      )}
    </div>
  );
}
