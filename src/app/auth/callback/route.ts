import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Determine if this is a portal user based on the redirect destination
  const isPortalUser = next.startsWith("/portal");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to the appropriate error page based on user type
  const errorRedirect = isPortalUser
    ? `${origin}/portal-login?error=auth_failed`
    : `${origin}/login?error=auth_failed`;

  return NextResponse.redirect(errorRedirect);
}
