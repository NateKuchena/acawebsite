"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { StaffForm } from "@/components/staff/staff-form";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Staff {
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
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) throw error;
      setStaff(data as Staff);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  }, [supabase, resolvedParams.id]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Employee Not Found</h2>
        <Link href="/dashboard/staff">
          <Button className="mt-4">Back to Staff</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/staff/${staff.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
          <p className="text-muted-foreground">
            {staff.employee_number} - {staff.surname}, {staff.name}
          </p>
        </div>
      </div>

      <StaffForm staff={staff} mode="edit" />
    </div>
  );
}
