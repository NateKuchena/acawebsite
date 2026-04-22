"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Tags, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const supabase = useMemo(() => createClient(), []);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories((data as ExpenseCategory[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load expense categories");
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
    setEditingId(null);
  };

  const handleEdit = (category: ExpenseCategory) => {
    setName(category.name);
    setDescription(category.description || "");
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
      };

      if (editingId) {
        const { error } = await supabase
          .from("expense_categories")
          .update(categoryData as never)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Category updated");
      } else {
        const { error } = await supabase
          .from("expense_categories")
          .insert(categoryData as never);

        if (error) throw error;
        toast.success("Category created");
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);

      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category. It may be in use.");
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
          <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
          <p className="text-muted-foreground">
            Manage categories for tracking expenses
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
              <DialogTitle>{editingId ? "Edit Category" : "Add Expense Category"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the category details" : "Create a new expense category"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Office Supplies, Utilities, Transport"
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
            {categories.length} expense categories configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
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
              <p>No expense categories configured</p>
              <p className="text-sm">Create categories to organize expenses</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
