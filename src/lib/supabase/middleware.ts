import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Auth pages — no login required
  const isAuthRoute = ["/login", "/portal-login", "/auth/callback"].some((r) =>
    pathname.startsWith(r)
  );

  // Protected portal/admin routes — require login
  // Use exact prefix matching to avoid catching /portals or /portal-login
  const isPortalRoute = pathname === "/portal" || pathname.startsWith("/portal/");
  const isTeacherRoute = pathname === "/teacher" || pathname.startsWith("/teacher/");
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isProtectedRoute = isPortalRoute || isTeacherRoute || isDashboardRoute;

  // Redirect unauthenticated users trying to access protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = isPortalRoute ? "/portal-login" : "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login pages based on their role
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();

    // Check if coming from portal login
    if (pathname === "/portal-login") {
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }

    // For admin login, check user role to determine redirect
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (userRole?.role === "teacher") {
      url.pathname = "/teacher";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  // Protect teacher routes - only teachers can access
  if (user && isTeacherRoute) {
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Allow teachers and admins to access teacher portal
    if (!userRole || !["teacher", "admin", "super_admin"].includes(userRole.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Protect dashboard routes - teachers cannot access admin dashboard
  if (user && isDashboardRoute) {
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // If user is a teacher (not admin/super_admin), redirect to teacher portal
    if (userRole?.role === "teacher") {
      const url = request.nextUrl.clone();
      url.pathname = "/teacher";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
