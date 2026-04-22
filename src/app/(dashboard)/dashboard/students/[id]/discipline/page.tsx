"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Loader2, AlertTriangle, Heart } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Student {
  id: string;
  name: string;
  surname: string;
  student_number: string;
}

interface DisciplinaryRecord {
  id: string;
  date: string;
  offense: string;
  action_taken: string;
  created_at: string;
}

export default function StudentDisciplinePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [offense, setOffense] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch student
      const { data: studentData } = await supabase
        .from("students")
        .select("id, name, surname, student_number")
        .eq("id", studentId)
        .single();

      if (!studentData) {
        router.push("/dashboard/students");
        return;
      }

      setStudent(studentData);

      // Fetch disciplinary records
      const { data: recordsData } = await supabase
        .from("disciplinary_records")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      setRecords((recordsData as DisciplinaryRecord[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [studentId, supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddRecord = async () => {
    if (!offense.trim() || !actionTaken.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("disciplinary_records").insert({
        student_id: studentId,
        date,
        offense: offense.trim(),
        action_taken: actionTaken.trim(),
      } as never);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Disciplinary record added");
      setDialogOpen(false);
      setOffense("");
      setActionTaken("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      fetchData();
    } catch (error) {
      toast.error("Failed to add record");
      console.error(error);
    } finally {
      setSaving(false);
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
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/students/${studentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disciplinary Records</h1>
            <p className="text-muted-foreground">
              {student?.surname}, {student?.name} ({student?.student_number})
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Disciplinary Record</DialogTitle>
              <DialogDescription>
                Record a new disciplinary incident for this student
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Date of Incident</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Offense / Incident Description *</Label>
                <Textarea
                  value={offense}
                  onChange={(e) => setOffense(e.target.value)}
                  placeholder="Describe the offense or incident..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Action Taken *</Label>
                <Textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Describe the disciplinary action taken..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRecord} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Record"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-lg ${
                records.length > 0 ? "bg-yellow-100" : "bg-green-100"
              }`}
            >
              {records.length > 0 ? (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              ) : (
                <Heart className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-muted-foreground">
                {records.length === 1
                  ? "Disciplinary record on file"
                  : "Disciplinary records on file"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Record History</CardTitle>
          <CardDescription>All disciplinary incidents and actions taken</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {format(new Date(record.date), "PPP")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Recorded: {format(new Date(record.created_at), "PPp")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Offense:</p>
                      <p className="mt-1">{record.offense}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Action Taken:</p>
                      <p className="mt-1">{record.action_taken}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No disciplinary records</p>
              <p className="text-sm">This student has a clean record</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
