import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StudentForm } from "@/components/students/student-form";

export default function NewStudentPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Add New Student</h1>
          <p className="text-muted-foreground">
            Enter the student details to add them to the system
          </p>
        </div>
      </div>

      {/* Form */}
      <StudentForm mode="create" />
    </div>
  );
}
