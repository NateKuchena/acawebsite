"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const studentSchema = z.object({
  student_number: z.string().min(1, "Student number is required"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["Male", "Female"]),
  form: z.string().min(1, "Form/Class is required"),
  house: z.enum(["Norman", "Austin"]),
  guardian_name: z.string().min(1, "Guardian name is required"),
  guardian_contact: z.string().min(1, "Guardian contact is required"),
  religious_denomination: z.string().optional(),
  health_conditions: z.string().optional(),
  status: z.enum(["enrolled", "transferred", "graduated"]),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: {
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
  };
  mode: "create" | "edit";
}

const formOptions = [
  "Form 1A", "Form 1B", "Form 1C", "Form 1D",
  "Form 2A", "Form 2B", "Form 2C", "Form 2D",
  "Form 3A", "Form 3B", "Form 3C", "Form 3D",
  "Form 4A", "Form 4B", "Form 4C", "Form 4D",
  "Form 5A", "Form 5B", "Form 5C", "Form 5D",
  "Form 6A", "Form 6B", "Form 6C", "Form 6D",
];

export function StudentForm({ student, mode }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      student_number: student?.student_number || "",
      name: student?.name || "",
      surname: student?.surname || "",
      date_of_birth: student?.date_of_birth || "",
      sex: student?.sex || undefined,
      form: student?.form || "",
      house: student?.house || undefined,
      guardian_name: student?.guardian_name || "",
      guardian_contact: student?.guardian_contact || "",
      religious_denomination: student?.religious_denomination || "",
      health_conditions: student?.health_conditions || "",
      status: student?.status || "enrolled",
    },
  });

  async function onSubmit(data: StudentFormValues) {
    setLoading(true);

    try {
      if (mode === "create") {
        const { error } = await supabase.from("students").insert({
          ...data,
          religious_denomination: data.religious_denomination || null,
          health_conditions: data.health_conditions || null,
        } as never);

        if (error) {
          if (error.code === "23505") {
            toast.error("A student with this student number already exists");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Student added successfully");
        router.push("/dashboard/students");
      } else {
        const { error } = await supabase
          .from("students")
          .update({
            ...data,
            religious_denomination: data.religious_denomination || null,
            health_conditions: data.health_conditions || null,
          } as never)
          .eq("id", student!.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Student updated successfully");
        router.push(`/dashboard/students/${student!.id}`);
      }

      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Student identification and personal details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="student_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="STU001" {...field} disabled={mode === "edit"} />
                  </FormControl>
                  <FormDescription>Unique identifier for the student</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="form"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form/Class *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {formOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surname *</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="house"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>House *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select house" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Norman">Norman</SelectItem>
                      <SelectItem value="Austin">Austin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Students cannot be deleted, only their status can be changed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle>Guardian Information</CardTitle>
            <CardDescription>Parent or guardian contact details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="guardian_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guardian_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Contact *</FormLabel>
                  <FormControl>
                    <Input placeholder="+263 77 123 4567" {...field} />
                  </FormControl>
                  <FormDescription>Phone number or email</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional details about the student</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="religious_denomination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Religious Denomination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Christian, Muslim, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="health_conditions"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Allergies/Chronic Health Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List any allergies, chronic conditions, or health concerns..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This information will be available to school staff for emergency purposes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Adding..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Add Student" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
