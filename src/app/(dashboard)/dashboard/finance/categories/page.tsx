"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2, Tags, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FeeCategory {
  id: string;
  name: string;
  description: string | null;
  default_amount: number | null;
  academic_year: string | null;
  term: number | null;
  created_at: string;
}

const currentYear = new Date().getFullYear().toString();

export default function FeeCategoriesPage() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [term, setTerm] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("fee_categories")
        .select("*")
        .order("name");

      setCategories((data as FeeCategory[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDefaultAmount("");
    setAcademicYear(currentYear);
    setTerm("");
    setEditingId(null);
  };

  const handleEdit = (category: FeeCategory) => {
    setName(category.name);
    setDescription(category.description || "");
    setDefaultAmount(category.default_amount?.toString() || "");
    setAcademicYear(category.academic_year || currentYear);
    setTerm(category.term?.toString() || "");
    setEditingId(category.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name: name.trim(),
        description: description.trim() || null,
        default_amount: defaultAmount ? parseFloat(defaultAmount) : null,
        academic_year: academicYear || null,
        term: term ? parseInt(term) : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("fee_categories")
          .update(categoryData as never)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase
          .from("fee_categories")
          .insert(categoryData as never);

        if (error) throw error;
        toast.success("Category created");
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error("Failed to save category");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from("fee_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category. It may be in use.");
      console.error(error);
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
          <h1 className="text-3xl font-bold tracking-tight">Fee Categories</h1>
          <p className="text-muted-foreground">
            Manage fee types like Tuition, Levy, Bus Levy, etc.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Category" : "Add Fee Category"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the fee category details" : "Create a new fee category for payments"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tuition, Bus Levy, Admission Fee"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={academicYear} onValueChange={setAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map((offset) => (
                        <SelectItem
                          key={offset}
                          value={(parseInt(currentYear) - offset).toString()}
                        >
                          {parseInt(currentYear) - offset}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Term</Label>
                  <Select value={term || "all"} onValueChange={(val) => setTerm(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Terms</SelectItem>
                      <SelectItem value="1">Term 1</SelectItem>
                      <SelectItem value="2">Term 2</SelectItem>
                      <SelectItem value="3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            All Categories
          </CardTitle>
          <CardDescription>
            {categories.length} fee categories configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {category.default_amount
                        ? `$${category.default_amount.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {category.academic_year && (
                        <Badge variant="outline">
                          {category.academic_year}
                          {category.term && ` T${category.term}`}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fee categories configured</p>
              <p className="text-sm">Create categories to start receiving payments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
