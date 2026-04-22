"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, LogOut, Menu, User, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PendingRequisition {
  id: string;
  requisition_number: string;
  requested_by_name: string;
  total_amount: number;
  created_at: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
  user?: {
    email?: string;
    name?: string;
  };
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pendingRequisitions, setPendingRequisitions] = useState<PendingRequisition[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- Standard hydration fix pattern
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("requisitions")
        .select("id, requisition_number, requested_by_name, total_amount, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      setPendingRequisitions((data as PendingRequisition[]) || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications(); // eslint-disable-line react-hooks/set-state-in-effect -- Data fetching on mount is valid
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0].toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications - only render after mount to avoid hydration mismatch */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {pendingRequisitions.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {pendingRequisitions.length > 9 ? "9+" : pendingRequisitions.length}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {pendingRequisitions.length > 0 && (
                  <Badge variant="secondary">{pendingRequisitions.length} pending</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pendingRequisitions.length > 0 ? (
                <>
                  {pendingRequisitions.map((req) => (
                    <DropdownMenuItem key={req.id} asChild>
                      <Link
                        href="/dashboard/finance/requisitions"
                        className="flex items-start gap-3 p-3 cursor-pointer"
                      >
                        <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                          <FileText className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Requisition {req.requisition_number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {req.requested_by_name} • ${req.total_amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(req.created_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-orange-600 border-orange-300">
                          Pending
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/finance/requisitions"
                      className="w-full text-center text-sm text-primary justify-center"
                    >
                      View all requisitions
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending notifications</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button>
        )}

        {/* User menu - only render after mount to avoid hydration mismatch */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        )}
      </div>
    </header>
  );
}
