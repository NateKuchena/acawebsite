"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  Package,
  Settings,
  ChevronDown,
  Link as LinkIcon,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: { title: string; href: string }[];
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Students",
    icon: GraduationCap,
    children: [
      { title: "All Students", href: "/dashboard/students" },
      { title: "Add Student", href: "/dashboard/students/new" },
      { title: "Upload CSV", href: "/dashboard/students/upload" },
      { title: "Marks Entry", href: "/dashboard/students/marks" },
      { title: "Marks Overview", href: "/dashboard/students/marks/overview" },
      { title: "Report Cards", href: "/dashboard/students/report-cards" },
    ],
  },
  {
    title: "Parent Links",
    href: "/dashboard/parents",
    icon: LinkIcon,
  },
  {
    title: "Staff",
    icon: Users,
    children: [
      { title: "All Staff", href: "/dashboard/staff" },
      { title: "Add Employee", href: "/dashboard/staff/new" },
      { title: "Benefits", href: "/dashboard/staff/benefits" },
      { title: "Payroll", href: "/dashboard/staff/payroll" },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    children: [
      { title: "Fee Payments", href: "/dashboard/finance/payments" },
      { title: "Term Fee Setup", href: "/dashboard/finance/term-fees" },
      { title: "Fee Categories", href: "/dashboard/finance/categories" },
      { title: "Uniform Sales", href: "/dashboard/finance/uniforms" },
      { title: "Debt Management", href: "/dashboard/finance/debts" },
      { title: "Requisitions", href: "/dashboard/finance/requisitions" },
      { title: "Payment Vouchers", href: "/dashboard/finance/vouchers" },
      { title: "Expense Categories", href: "/dashboard/finance/expenses" },
      { title: "Other Income", href: "/dashboard/finance/income" },
      { title: "Reports", href: "/dashboard/finance/reports" },
    ],
  },
  {
    title: "Assets",
    icon: Package,
    children: [
      { title: "Asset Register", href: "/dashboard/assets" },
      { title: "Add Asset", href: "/dashboard/assets/new" },
      { title: "Reports", href: "/dashboard/assets/reports" },
    ],
  },
  {
    title: "Calendar",
    icon: Calendar,
    children: [
      { title: "School Calendar", href: "/dashboard/calendar" },
      { title: "Event Types", href: "/dashboard/calendar/event-types" },
      { title: "Duty Roster", href: "/dashboard/duty-roster" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { title: "User Roles", href: "/dashboard/settings/roles" },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Students", "Finance"]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isChildActive = (children: { href: string }[]) =>
    children?.some((child) => pathname === child.href);

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-sidebar border-r border-sidebar-border",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <Image
          src="/logo.png"
          alt="Amazon Christian Academy"
          width={44}
          height={44}
          className="rounded-lg"
        />
        <div>
          <h1 className="font-semibold text-sidebar-foreground">The Pride</h1>
          <p className="text-xs text-muted-foreground">School Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.title}>
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isChildActive(item.children || [])
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedItems.includes(item.title) && "rotate-180"
                    )}
                  />
                </button>
                {expandedItems.includes(item.title) && item.children && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive(child.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          The Pride v1.0
        </p>
      </div>
    </aside>
  );
}
