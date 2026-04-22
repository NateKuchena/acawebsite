"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Key,
  GraduationCap,
  AlertCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface LinkedStudent {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  status: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfile({
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
      });

      // Get linked students
      const { data: linksData, error: linksError } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("user_id", user.id);

      if (linksError) throw linksError;

      const links = linksData as Array<{ student_id: string }> | null;

      if (links && links.length > 0) {
        const studentIds = links.map((l) => l.student_id);

        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, student_number, name, surname, form, status")
          .in("id", studentIds);

        if (studentsError) throw studentsError;
        setLinkedStudents((studentsData as LinkedStudent[]) || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Unable to load profile</h3>
        <p className="text-muted-foreground">Please try logging in again</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your account settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and login information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{profile.email}</h3>
                <Badge variant="outline" className="mt-1">
                  Parent/Guardian
                </Badge>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Account Created</p>
                  <p className="font-medium">{formatDate(profile.created_at)}</p>
                </div>
              </div>

              {profile.last_sign_in_at && (
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Sign In</p>
                    <p className="font-medium">{formatDate(profile.last_sign_in_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your password and account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Password Protected</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is secured with a password
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter a new password for your account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                  >
                    {changingPassword && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Change Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Security Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use a strong, unique password</li>
                <li>• Never share your login credentials</li>
                <li>• Log out when using shared devices</li>
                <li>• Report suspicious activity to the school</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linked Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Linked Students
          </CardTitle>
          <CardDescription>
            Students associated with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedStudents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {linkedStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {student.surname}, {student.name}
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {student.student_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">{student.form}</Badge>
                    <Badge
                      className={
                        student.status === "enrolled"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {student.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold">No Students Linked</h3>
              <p className="text-muted-foreground mt-1">
                Contact the school administration to link students to your account
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-secondary">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-3 bg-secondary/20 rounded-lg h-fit">
              <Phone className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                If you need to update your contact information or have any issues
                with your account, please contact the school administration office
                during working hours.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">admin@school.com</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <span className="font-medium">+263 123 456 789</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
