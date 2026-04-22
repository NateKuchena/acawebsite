"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Home,
  FileText,
  DollarSign,
  User,
  LogOut,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PortalLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    title: "Dashboard",
    href: "/portal",
    icon: Home,
  },
  {
    title: "Academic Reports",
    href: "/portal/reports",
    icon: FileText,
  },
  {
    title: "Fee Statement",
    href: "/portal/fees",
    icon: DollarSign,
  },
  {
    title: "Calendar",
    href: "/portal/calendar",
    icon: Calendar,
  },
  {
    title: "My Profile",
    href: "/portal/profile",
    icon: User,
  },
];

export function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/portal-login");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white print:hidden flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/portal" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="The Pride"
                width={40}
                height={40}
                className="rounded-lg"
                priority
              />
              <div>
                <h1 className="font-bold text-lg text-foreground">The Pride</h1>
                <p className="text-xs text-muted-foreground">Parent Portal</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
              <Button variant="ghost" onClick={handleLogout} className="gap-2 ml-4 text-gray-600 hover:bg-gray-100">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer - sticky to bottom */}
      <footer className="bg-white border-t border-gray-200 flex-shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            The Pride - Parent Portal v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
