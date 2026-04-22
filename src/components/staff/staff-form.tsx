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
import { Loader2, Save, User, Phone, Heart } from "lucide-react";
import { toast } from "sonner";

const staffSchema = z.object({
  employee_number: z.string().min(1, "Employee number is required"),
  grade: z.string().min(1, "Grade/Position is required"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Surname is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  id_number: z.string().optional(),
  nssa_number: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  next_of_kin_name: z.string().optional(),
  next_of_kin_contact: z.string().optional(),
  next_of_kin_address: z.string().optional(),
  religious_denomination: z.string().optional(),
  health_conditions: z.string().optional(),
  status: z.enum(["employed", "terminated", "retired"]),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffFormProps {
  staff?: {
    id: string;
    employee_number: string;
    grade: string;
    name: string;
    surname: string;
    date_of_birth: string;
    id_number: string | null;
    nssa_number: string | null;
    phone: string | null;
    address: string | null;
    next_of_kin_name: string | null;
    next_of_kin_contact: string | null;
    next_of_kin_address: string | null;
    religious_denomination: string | null;
    health_conditions: string | null;
    status: "employed" | "terminated" | "retired";
  };
  mode: "create" | "edit";
}

const grades = [
  "Principal",
  "Vice Principal",
  "Head of Department",
  "Senior Teacher",
  "Teacher",
  "Lab Technician",
  "Librarian",
  "Administrator",
  "Accountant",
  "Secretary",
  "Security",
  "Cleaner",
  "Driver",
  "Groundskeeper",
  "Other",
];

export function StaffForm({ staff, mode }: StaffFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      employee_number: staff?.employee_number || "",
      grade: staff?.grade || "",
      name: staff?.name || "",
      surname: staff?.surname || "",
      date_of_birth: staff?.date_of_birth || "",
      id_number: staff?.id_number || "",
      nssa_number: staff?.nssa_number || "",
      phone: staff?.phone || "",
      address: staff?.address || "",
      next_of_kin_name: staff?.next_of_kin_name || "",
      next_of_kin_contact: staff?.next_of_kin_contact || "",
      next_of_kin_address: staff?.next_of_kin_address || "",
      religious_denomination: staff?.religious_denomination || "",
      health_conditions: staff?.health_conditions || "",
      status: staff?.status || "employed",
    },
  });

  async function onSubmit(data: StaffFormValues) {
    setLoading(true);

    try {
      const staffData = {
        employee_number: data.employee_number,
        grade: data.grade,
        name: data.name,
        surname: data.surname,
        date_of_birth: data.date_of_birth,
        id_number: data.id_number || null,
        nssa_number: data.nssa_number || null,
        phone: data.phone || null,
        address: data.address || null,
        next_of_kin_name: data.next_of_kin_name || null,
        next_of_kin_contact: data.next_of_kin_contact || null,
        next_of_kin_address: data.next_of_kin_address || null,
        religious_denomination: data.religious_denomination || null,
        health_conditions: data.health_conditions || null,
        status: data.status,
      };

      if (mode === "create") {
        const { error } = await supabase.from("staff").insert(staffData as never);

        if (error) {
          if (error.code === "23505") {
            toast.error("An employee with this employee number already exists");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Employee added successfully");
        router.push("/dashboard/staff");
      } else {
        const { error } = await supabase
          .from("staff")
          .update(staffData as never)
          .eq("id", staff!.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Employee updated successfully");
        router.push(`/dashboard/staff/${staff!.id}`);
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
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Employee identification and personal details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="employee_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="EMP001" {...field} disabled={mode === "edit"} />
                  </FormControl>
                  <FormDescription>Unique identifier for this employee</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade/Position *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
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
              name="id_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 63-123456-A-42" {...field} />
                  </FormControl>
                  <FormDescription>National ID or Passport number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nssa_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NSSA Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123456789" {...field} />
                  </FormControl>
                  <FormDescription>National Social Security Authority number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+263 77 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter residential address..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
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
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Staff cannot be deleted, only their status can be changed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Next of Kin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Next of Kin
            </CardTitle>
            <CardDescription>Emergency contact information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="next_of_kin_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_of_kin_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+263 77 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_of_kin_address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter next of kin address..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Additional Information
            </CardTitle>
            <CardDescription>Optional details about the employee</CardDescription>
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
                    This information will be kept confidential
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
                {mode === "create" ? "Add Employee" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
