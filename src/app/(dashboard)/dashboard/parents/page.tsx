"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Users,
  Link as LinkIcon,
  Unlink,
  Search,
  Plus,
  User,
  GraduationCap,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ParentStudentLink {
  id: string;
  user_id: string;
  student_id: string;
  created_at: string;
  user_email: string;
  student: {
    id: string;
    student_number: string;
    name: string;
    surname: string;
    form: string;
    status: string;
  };
}

interface PortalUser {
  id: string;
  email: string;
  created_at: string;
}

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
  status: string;
}

export default function ParentLinksPage() {
  const [links, setLinks] = useState<ParentStudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [foundUsers, setFoundUsers] = useState<PortalUser[]>([]);
  const [foundStudents, setFoundStudents] = useState<Student[]>([]);
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      // Get all parent-student links with student details
      const { data: linksData, error: linksError } = await supabase
        .from("parent_student_links")
        .select(`
          id,
          user_id,
          student_id,
          created_at,
          students (
            id,
            student_number,
            name,
            surname,
            form,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (linksError) throw linksError;

      // Type assertion for the links data
      interface LinkData {
        id: string;
        user_id: string;
        student_id: string;
        created_at: string;
        students: {
          id: string;
          student_number: string;
          name: string;
          surname: string;
          form: string;
          status: string;
        };
      }

      const typedLinksData = linksData as LinkData[] | null;

      const processedLinks: ParentStudentLink[] = (typedLinksData || []).map((link) => ({
        id: link.id,
        user_id: link.user_id,
        student_id: link.student_id,
        created_at: link.created_at,
        user_email: "", // Would need to be fetched separately or stored in link table
        student: link.students,
      }));

      setLinks(processedLinks);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load parent-student links");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const searchUsers = async () => {
    if (!userSearch.trim()) return;

    setSearchingUsers(true);
    try {
      // Search in a portal_users table or use Supabase admin API
      // For this implementation, we'll search registered users
      const { data, error } = await supabase
        .from("portal_users")
        .select("id, email, created_at")
        .ilike("email", `%${userSearch}%`)
        .limit(10);

      if (error) {
        // If portal_users doesn't exist, show a message
        if (error.code === "42P01") {
          toast.error("Portal users table not found. Please run the migration.");
          return;
        }
        throw error;
      }

      setFoundUsers((data as PortalUser[]) || []);
      if (data?.length === 0) {
        toast.info("No users found with that email");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to search users");
    } finally {
      setSearchingUsers(false);
    }
  };

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;

    setSearchingStudents(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form, status")
        .or(`name.ilike.%${studentSearch}%,surname.ilike.%${studentSearch}%,student_number.ilike.%${studentSearch}%`)
        .eq("status", "enrolled")
        .limit(10);

      if (error) throw error;

      setFoundStudents((data as Student[]) || []);
      if (data?.length === 0) {
        toast.info("No students found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to search students");
    } finally {
      setSearchingStudents(false);
    }
  };

  const createLink = async () => {
    if (!selectedUser || !selectedStudent) {
      toast.error("Please select both a user and a student");
      return;
    }

    setCreating(true);
    try {
      // Check if link already exists
      const { data: existing } = await supabase
        .from("parent_student_links")
        .select("id")
        .eq("user_id", selectedUser.id)
        .eq("student_id", selectedStudent.id)
        .single();

      if (existing) {
        toast.error("This link already exists");
        return;
      }

      const { error } = await supabase
        .from("parent_student_links")
        .insert({
          user_id: selectedUser.id,
          student_id: selectedStudent.id,
        } as never);

      if (error) throw error;

      toast.success("Parent-student link created successfully");
      setLinkDialogOpen(false);
      resetLinkDialog();
      fetchLinks();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from("parent_student_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;

      toast.success("Link removed successfully");
      fetchLinks();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove link");
    }
  };

  const resetLinkDialog = () => {
    setUserSearch("");
    setStudentSearch("");
    setFoundUsers([]);
    setFoundStudents([]);
    setSelectedUser(null);
    setSelectedStudent(null);
  };

  const filteredLinks = links.filter((link) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      link.student.name.toLowerCase().includes(searchLower) ||
      link.student.surname.toLowerCase().includes(searchLower) ||
      link.student.student_number.toLowerCase().includes(searchLower) ||
      link.user_id.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent-Student Links</h1>
          <p className="text-muted-foreground">
            Manage parent portal access to student records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLinks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={linkDialogOpen} onOpenChange={(open) => {
            setLinkDialogOpen(open);
            if (!open) resetLinkDialog();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Link Parent to Student</DialogTitle>
                <DialogDescription>
                  Search for a registered parent user and link them to a student
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                {/* User Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Step 1: Select Parent User
                  </Label>

                  {selectedUser ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{selectedUser.email}</p>
                          <p className="text-sm text-muted-foreground">User ID: {selectedUser.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                        />
                        <Button onClick={searchUsers} disabled={searchingUsers}>
                          {searchingUsers ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {foundUsers.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                          {foundUsers.map((user) => (
                            <button
                              key={user.id}
                              className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{user.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Student Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Step 2: Select Student
                  </Label>

                  {selectedStudent ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">{selectedStudent.surname}, {selectedStudent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedStudent.student_number} • {selectedStudent.form}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by name or student number..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchStudents()}
                        />
                        <Button onClick={searchStudents} disabled={searchingStudents}>
                          {searchingStudents ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {foundStudents.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                          {foundStudents.map((student) => (
                            <button
                              key={student.id}
                              className="w-full p-3 text-left hover:bg-muted transition-colors"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{student.surname}, {student.name}</p>
                                  <p className="text-sm text-muted-foreground">{student.student_number}</p>
                                </div>
                                <Badge variant="outline">{student.form}</Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createLink}
                  disabled={!selectedUser || !selectedStudent || creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Create Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{links.length}</div>
            <p className="text-xs text-muted-foreground">Active parent-student connections</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(links.map((l) => l.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Registered parent accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Linked Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(links.map((l) => l.student_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">Students with portal access</p>
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Links</CardTitle>
          <CardDescription>
            View and manage all parent-student connections
          </CardDescription>
          <div className="pt-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLinks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent User ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {link.user_id.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {link.student.surname}, {link.student.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {link.student.student_number}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{link.student.form}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          link.student.status === "enrolled"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {link.student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(link.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Link?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the parent&apos;s access to {link.student.surname}, {link.student.name}&apos;s records.
                              The parent will no longer be able to view this student&apos;s marks or fee statements.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteLink(link.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove Link
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-semibold text-lg">No Links Found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm
                  ? "No links match your search"
                  : "Create your first parent-student link to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">How Parent Linking Works</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Parents must first register at the Parent Portal login page</li>
                <li>After registration, use this page to link their account to their child(ren)</li>
                <li>Parents can be linked to multiple students (e.g., siblings)</li>
                <li>Multiple parents can be linked to the same student (e.g., both parents)</li>
                <li>Linked parents can view academic reports and fee statements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
