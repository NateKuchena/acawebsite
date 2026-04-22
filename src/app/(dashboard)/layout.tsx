export const dynamic = 'force-dynamic'
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout
      user={{
        email: user.email,
        name: user.user_metadata?.name,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
