export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherLayout } from "@/components/teacher/teacher-layout";

export default async function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role and staff info
  const { data: userRoleData } = await supabase
    .from("user_roles")
    .select("role, staff_id, staff:staff_id(name, surname)")
    .eq("user_id", user.id)
    .single();

  const userRole = userRoleData as { role: string; staff_id: string | null; staff: { name: string; surname: string } | null } | null;

  // Check if user has teacher or admin access
  if (!userRole || !["teacher", "admin", "super_admin"].includes(userRole.role)) {
    redirect("/dashboard");
  }

  // Get teacher name from staff record or user metadata
  const staffRecord = userRole.staff;
  const teacherName = staffRecord
    ? `${staffRecord.surname}, ${staffRecord.name}`
    : user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Teacher";

  return (
    <TeacherLayout teacherName={teacherName} staffId={userRole.staff_id}>
      {children}
    </TeacherLayout>
  );
}
