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
import {
  Loader2,
  Plus,
  FileText,
  Check,
  X,
  Clock,
  DollarSign,
  Eye,
  Trash2,
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
  approved_by: string | null;
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

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  rejected: "Rejected",
};

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState<string>("Staff");

  // Form state
  const [requestedBy, setRequestedBy] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<RequisitionItem[]>([
    { description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);

  const supabase = useMemo(() => createClient(), []);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Staff";
        setCurrentUser(name);
      }
    };
    fetchUser();
  }, [supabase]);

  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("requisitions")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequisitions((data as Requisition[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  }, [supabase, statusFilter]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  const generateRequisitionNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REQ-${year}${month}-${random}`;
  };

  const resetForm = () => {
    setRequestedBy("");
    setDepartment("");
    setDescription("");
    setItems([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequisitionItem, value: string | number) => {
    const newItems = [...items];
    if (field === "description") {
      newItems[index].description = value as string;
    } else if (field === "quantity") {
      newItems[index].quantity = Number(value) || 0;
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    } else if (field === "unit_price") {
      newItems[index].unit_price = Number(value) || 0;
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async () => {
    if (!requestedBy.trim()) {
      toast.error("Please enter who is requesting");
      return;
    }
    if (!department) {
      toast.error("Please select a department");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (items.some((item) => !item.description.trim())) {
      toast.error("Please fill in all item descriptions");
      return;
    }

    setSaving(true);
    try {
      const requisitionData = {
        requisition_number: generateRequisitionNumber(),
        requested_by_name: requestedBy.trim(),
        department,
        description: description.trim(),
        items: items.filter((item) => item.description.trim()),
        total_amount: calculateTotal(),
        status: "pending",
      };

      const { error } = await supabase
        .from("requisitions")
        .insert(requisitionData as never);

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

  const handleStatusUpdate = async (
    id: string,
    newStatus: string,
    rejectionReason?: string
  ) => {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (newStatus === "approved" || newStatus === "awaiting_payment") {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by_name = currentUser;
      }

      if (newStatus === "rejected" && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      console.log("Updating requisition:", id, "with data:", updateData);

      const { error } = await supabase
        .from("requisitions")
        .update(updateData as never)
        .eq("id", id);

      if (error) {
        console.error("Update error:", error);
        toast.error(`Failed to update: ${error.message}`);
        return;
      }

      toast.success(`Requisition ${statusLabels[newStatus].toLowerCase()}`);
      fetchRequisitions();
      setViewDialogOpen(false);
    } catch (error) {
      console.error("Catch error:", error);
      toast.error("Failed to update requisition");
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

  const viewRequisition = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setViewDialogOpen(true);
  };

  const pendingCount = requisitions.filter((r) => r.status === "pending").length;
  const approvedCount = requisitions.filter((r) => r.status === "approved" || r.status === "awaiting_payment").length;
  const paidTotal = requisitions
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.total_amount, 0);

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
          <h1 className="text-3xl font-bold tracking-tight">Requisitions</h1>
          <p className="text-muted-foreground">
            Request and manage material/fund requisitions
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
                Fill in the details to request materials or funds
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Requested By *</Label>
                  <Input
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
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
              </div>

              <div className="space-y-2">
                <Label>Purpose/Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the requisition is for..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        {index === 0 && <Label className="text-xs">Description</Label>}
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <Label className="text-xs">Qty</Label>}
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <Label className="text-xs">Unit Price</Label>}
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        {index === 0 && <Label className="text-xs">Total</Label>}
                        <Input
                          value={`$${item.total.toFixed(2)}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t pt-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">${calculateTotal().toFixed(2)}</p>
                  </div>
                </div>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved/Awaiting</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">
                  ${paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requisitions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Requisitions
              </CardTitle>
              <CardDescription>
                {requisitions.length} requisitions total
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {requisitions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Req. No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Requested By</TableHead>
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
                    <TableCell>{req.requested_by_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.department}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {req.description}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${req.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[req.status]}>
                        {statusLabels[req.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewRequisition(req)}
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
              <p>No requisitions found</p>
              <p className="text-sm">Create a new requisition to get started</p>
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
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Requisition {selectedRequisition.requisition_number}
                </DialogTitle>
                <DialogDescription>
                  Submitted on {new Date(selectedRequisition.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Requested By</p>
                    <p className="font-medium">{selectedRequisition.requested_by_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedRequisition.department}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="font-medium">{selectedRequisition.description}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequisition.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono">
                            ${item.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${item.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">
                          Total Amount
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          ${selectedRequisition.total_amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <Badge className={statusColors[selectedRequisition.status]}>
                      {statusLabels[selectedRequisition.status]}
                    </Badge>
                    {selectedRequisition.approved_by_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Approved by {selectedRequisition.approved_by_name} on{" "}
                        {new Date(selectedRequisition.approved_at!).toLocaleDateString()}
                      </p>
                    )}
                    {selectedRequisition.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {selectedRequisition.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2">
                    {selectedRequisition.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) {
                              handleStatusUpdate(selectedRequisition.id, "rejected", reason);
                            }
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          onClick={() =>
                            handleStatusUpdate(selectedRequisition.id, "approved")
                          }
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </>
                    )}
                    {selectedRequisition.status === "approved" && (
                      <Button
                        onClick={() =>
                          handleStatusUpdate(selectedRequisition.id, "awaiting_payment")
                        }
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Mark Awaiting Payment
                      </Button>
                    )}
                    {selectedRequisition.status === "awaiting_payment" && (
                      <Button
                        variant="default"
                        onClick={() =>
                          handleStatusUpdate(selectedRequisition.id, "paid")
                        }
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
