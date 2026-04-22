import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StudentForm } from "@/components/students/student-form";

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
  religious_denomination: string | null;
  health_conditions: string | null;
  status: "enrolled" | "transferred" | "graduated";
}

async function getStudent(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  return data as Student | null;
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/students/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Student</h1>
          <p className="text-muted-foreground">
            Update information for {student.surname}, {student.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <StudentForm student={student} mode="edit" />
    </div>
  );
}
