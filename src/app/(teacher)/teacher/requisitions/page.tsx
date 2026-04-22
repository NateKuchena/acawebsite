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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  FileText,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Requisition {
  id: string;
  requisition_number: string;
  requested_by_name: string;
  department: string;
  description: string;
  items: RequisitionItem[];
  total_amount: number;
  status: "pending" | "approved" | "awaiting_payment" | "paid" | "rejected";
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface RequisitionItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const departments = [
  "Administration",
  "Academic",
  "Sports",
  "Science Lab",
  "Library",
  "Kitchen/Dining",
  "Maintenance",
  "Transport",
  "IT",
  "Other",
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  awaiting_payment: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function TeacherRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("");

  // Form state
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [itemDescription, setItemDescription] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const supabase = useMemo(() => createClient(), []);

  // Fetch staff info on mount
  useEffect(() => {
    const fetchStaffInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoleData } = await supabase
        .from("user_roles")
        .select("staff_id, staff:staff_id(name, surname)")
        .eq("user_id", user.id)
        .single();

      const userRole = userRoleData as { staff_id: string | null; staff: { name: string; surname: string } | null } | null;

      if (userRole) {
        setStaffId(userRole.staff_id);
        const staff = userRole.staff;
        if (staff) {
          setTeacherName(`${staff.surname}, ${staff.name}`);
        }
      }
    };
    fetchStaffInfo();
  }, [supabase]);

  const fetchRequisitions = useCallback(async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requisitions")
        .select("*")
        .eq("requested_by", staffId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequisitions((data as Requisition[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  }, [supabase, staffId]);

  useEffect(() => {
    if (staffId) {
      fetchRequisitions();
    }
  }, [staffId, fetchRequisitions]);

  const generateRequisitionNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REQ-${year}${month}-${random}`;
  };

  const resetForm = () => {
    setDepartment("");
    setDescription("");
    setItems([]);
    setItemDescription("");
    setItemQuantity("");
    setItemPrice("");
  };

  const addItem = () => {
    if (!itemDescription.trim() || !itemQuantity || !itemPrice) {
      toast.error("Please fill in all item fields");
      return;
    }

    const quantity = parseInt(itemQuantity);
    const unitPrice = parseFloat(itemPrice);
    const total = quantity * unitPrice;

    setItems([
      ...items,
      {
        description: itemDescription.trim(),
        quantity,
        unit_price: unitPrice,
        total,
      },
    ]);

    setItemDescription("");
    setItemQuantity("");
    setItemPrice("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async () => {
    if (!department) {
      toast.error("Please select a department");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("requisitions").insert({
        requisition_number: generateRequisitionNumber(),
        requested_by: staffId,
        requested_by_name: teacherName,
        department,
        description: description.trim(),
        items,
        total_amount: totalAmount,
        status: "pending",
      } as never);

      if (error) throw error;

      toast.success("Requisition submitted successfully");
      setDialogOpen(false);
      resetForm();
      fetchRequisitions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit requisition");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this requisition?")) return;

    try {
      const { error } = await supabase.from("requisitions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Requisition deleted");
      fetchRequisitions();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete requisition");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "awaiting_payment":
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading && !staffId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <div className="flex gap-4 border-b pb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32 flex-1" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-32 flex-1" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Requisitions</h1>
          <p className="text-muted-foreground">
            Create and track your purchase requisitions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Requisition</DialogTitle>
              <DialogDescription>
                Submit a new purchase requisition for approval
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Requested By</Label>
                  <Input value={teacherName} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description / Purpose *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this requisition is for..."
                  rows={2}
                />
              </div>

              {/* Add Item */}
              <div className="space-y-2">
                <Label>Add Items</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Item description"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-24"
                  />
                  <Button type="button" onClick={addItem} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label>Items ({items.length})</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center w-20">Qty</TableHead>
                          <TableHead className="text-right w-24">Price</TableHead>
                          <TableHead className="text-right w-24">Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${item.unit_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              ${item.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={3} className="font-bold text-right">
                            Total Amount:
                          </TableCell>
                          <TableCell className="font-mono font-bold text-right text-lg">
                            ${totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Requisition"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requisitions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Requisitions
          </CardTitle>
          <CardDescription>
            {requisitions.length} requisition(s) submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="flex gap-4 border-b pb-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-40 flex-1" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center py-2">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-40 flex-1" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : requisitions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requisition No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-sm">
                      {req.requisition_number}
                    </TableCell>
                    <TableCell>
                      {new Date(req.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{req.department}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {req.description}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${req.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(req.status)}
                        <Badge className={statusColors[req.status]}>
                          {req.status === "awaiting_payment"
                            ? "Awaiting Payment"
                            : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedRequisition(req);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {req.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(req.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requisitions yet</p>
              <p className="text-sm">Create your first requisition to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Requisition Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRequisition && (
            <>
              <DialogHeader>
                <DialogTitle>Requisition Details</DialogTitle>
                <DialogDescription>
                  {selectedRequisition.requisition_number}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedRequisition.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedRequisition.department}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedRequisition.description}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequisition.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right font-mono">
                              ${item.unit_price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              ${item.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-2xl font-bold">
                    ${selectedRequisition.total_amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={statusColors[selectedRequisition.status]}>
                    {selectedRequisition.status === "awaiting_payment"
                      ? "Awaiting Payment"
                      : selectedRequisition.status.charAt(0).toUpperCase() +
                        selectedRequisition.status.slice(1)}
                  </Badge>
                </div>

                {selectedRequisition.approved_by_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approved By</p>
                    <p className="font-medium">
                      {selectedRequisition.approved_by_name}
                      {selectedRequisition.approved_at && (
                        <span className="text-muted-foreground ml-2">
                          on {new Date(selectedRequisition.approved_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {selectedRequisition.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">Rejection Reason:</p>
                    <p className="text-red-700">{selectedRequisition.rejection_reason}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
