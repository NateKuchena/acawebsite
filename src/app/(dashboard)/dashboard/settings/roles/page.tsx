"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Shield,
  Trash2,
  Users,
  GraduationCap,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  staff_id: string | null;
  created_at: string;
  user_email?: string;
  staff_name?: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface Staff {
  id: string;
  employee_number: string;
  name: string;
  surname: string;
  grade: string;
}

const roles = [
  { value: "super_admin", label: "Super Admin", description: "Full system access", icon: Shield },
  { value: "admin", label: "Admin", description: "Administrative access", icon: UserCog },
  { value: "teacher", label: "Teacher", description: "Teacher portal access", icon: GraduationCap },
  { value: "staff", label: "Staff", description: "Basic staff access", icon: Users },
];

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800",
  admin: "bg-purple-100 text-purple-800",
  teacher: "bg-blue-100 text-blue-800",
  staff: "bg-gray-100 text-gray-800",
};

export default function RolesManagementPage() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch existing user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch staff members
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, employee_number, name, surname, grade")
        .eq("status", "employed")
        .order("surname");

      setStaffMembers((staffData as Staff[]) || []);

      // For each role, try to get user email and staff name
      const enrichedRoles: UserRole[] = [];
      for (const role of (rolesData as UserRole[]) || []) {
        const enrichedRole = { ...role };

        // Get staff name if staff_id exists
        if (role.staff_id) {
          const staff = (staffData as Staff[])?.find(s => s.id === role.staff_id);
          if (staff) {
            enrichedRole.staff_name = `${staff.surname}, ${staff.name}`;
          }
        }

        enrichedRoles.push(enrichedRole);
      }

      setUserRoles(enrichedRoles);

      // Try to fetch auth users (this may fail due to permissions)
      try {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError && users) {
          setAuthUsers(users.map(u => ({ id: u.id, email: u.email || "" })));

          // Update roles with email
          const rolesWithEmail = enrichedRoles.map(role => {
            const user = users.find(u => u.id === role.user_id);
            return { ...role, user_email: user?.email };
          });
          setUserRoles(rolesWithEmail);
        }
      } catch {
        // Admin API not available, that's okay
        console.log("Admin API not available - users will show IDs instead of emails");
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setSelectedUserId("");
    setSelectedRole("");
    setSelectedStaffId("");
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("Please enter a user ID");
      return;
    }
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedUserId)) {
      toast.error("Invalid User ID format. Must be a valid UUID.");
      return;
    }

    if (selectedStaffId && !uuidRegex.test(selectedStaffId)) {
      toast.error("Invalid Staff ID format. Must be a valid UUID.");
      return;
    }

    setSaving(true);
    try {
      // Check if role already exists for this user
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUserId)
        .eq("role", selectedRole)
        .single();

      if (existing) {
        toast.error("This user already has this role");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUserId,
        role: selectedRole,
        staff_id: selectedStaffId || null,
      } as never);

      if (error) throw error;

      toast.success("Role assigned successfully");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this role assignment?")) return;

    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Role removed");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove role");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles</h1>
          <p className="text-muted-foreground">
            Manage user role assignments for system access
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign User Role</DialogTitle>
              <DialogDescription>
                Assign a role to a user to control their system access
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>User ID *</Label>
                {authUsers.length > 0 ? (
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {authUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      placeholder="Enter user UUID from Supabase Auth"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find the User ID in Supabase Dashboard → Authentication → Users
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className="h-4 w-4" />
                          <span>{role.label}</span>
                          <span className="text-muted-foreground">- {role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link to Staff Member (Optional)</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No staff link</SelectItem>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.surname}, {staff.name} ({staff.employee_number}) - {staff.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link to a staff record for teachers to track their requisitions
                </p>
              </div>

              {/* Role descriptions */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Role Access Levels:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li><strong>Super Admin:</strong> Full access to all features</li>
                  <li><strong>Admin:</strong> Full dashboard access</li>
                  <li><strong>Teacher:</strong> Teacher portal (requisitions + marks)</li>
                  <li><strong>Staff:</strong> Basic access</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Role"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Shield className="h-10 w-10 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">How Role Assignment Works</h3>
              <p className="text-sm text-blue-800 mt-1">
                To assign a role, you need the User ID from Supabase Authentication.
                Go to your Supabase Dashboard → Authentication → Users, and copy the user&apos;s ID.
                For teachers, link them to their staff record so their requisitions are tracked properly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Role Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Role Assignments
          </CardTitle>
          <CardDescription>
            {userRoles.length} role assignment(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRoles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Linked Staff</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        {role.user_email ? (
                          <p className="font-medium">{role.user_email}</p>
                        ) : (
                          <p className="font-mono text-xs">{role.user_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[role.role] || "bg-gray-100"}>
                        {roles.find(r => r.value === role.role)?.label || role.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.staff_name || (role.staff_id ? (
                        <span className="font-mono text-xs">{role.staff_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      ))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(role.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No role assignments yet</p>
              <p className="text-sm">Assign roles to users to control their access</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Members Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Members Reference
          </CardTitle>
          <CardDescription>
            Use these IDs when linking roles to staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Staff ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-mono">{staff.employee_number}</TableCell>
                    <TableCell className="font-medium">
                      {staff.surname}, {staff.name}
                    </TableCell>
                    <TableCell>{staff.grade}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {staff.id}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No staff members found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
