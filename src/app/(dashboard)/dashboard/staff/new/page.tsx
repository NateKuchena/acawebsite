"use client";

import { StaffForm } from "@/components/staff/staff-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/staff">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground">
            Register a new staff member
          </p>
        </div>
      </div>

      <StaffForm mode="create" />
    </div>
  );
}
