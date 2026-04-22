"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Loader2,
  Shirt,
  Search,
  Printer,
  Package,
  Edit,
  History,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// School info for receipts
const SCHOOL_INFO = {
  name: "Amazon Christian Academy",
  address: "Amazon B Village, Filabusi, Insiza District",
  phone: "+263 XXX XXX XXX",
};

interface Student {
  id: string;
  student_number: string;
  name: string;
  surname: string;
  form: string;
}

interface Uniform {
  id: string;
  name: string;
  sizes: string[];
  price: number;
  stock_quantity: number;
}

interface UniformSale {
  id: string;
  receipt_number: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  collected: boolean;
  collected_at: string | null;
  collected_by: string | null;
  payment_method: string | null;
  received_by_name: string | null;
  created_at: string;
  students: { name: string; surname: string; student_number: string; form: string } | null;
  uniforms: { name: string } | null;
}

interface FundTransaction {
  id: string;
  transaction_type: "sale" | "expense" | "adjustment";
  amount: number;
  description: string | null;
  created_at: string;
}

export default function UniformSalesPage() {
  const [uniforms, setUniforms] = useState<Uniform[]>([]);
  const [sales, setSales] = useState<UniformSale[]>([]);
  const [fundTransactions, setFundTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [uniformDialogOpen, setUniformDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastSale, setLastSale] = useState<UniformSale | null>(null);
  const [editingUniform, setEditingUniform] = useState<Uniform | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("Staff");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);

  // Sale form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedUniform, setSelectedUniform] = useState<Uniform | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Uniform form state
  const [uniformName, setUniformName] = useState("");
  const [uniformSizes, setUniformSizes] = useState("");
  const [uniformPrice, setUniformPrice] = useState("");
  const [uniformStock, setUniformStock] = useState("");

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: uniformsData } = await supabase
        .from("uniforms")
        .select("*")
        .order("name");

      setUniforms((uniformsData as Uniform[]) || []);

      const { data: salesData } = await supabase
        .from("uniform_sales")
        .select("*, students(name, surname, student_number, form), uniforms(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      setSales((salesData as UniformSale[]) || []);

      // Fetch fund transactions
      const { data: transactionsData } = await supabase
        .from("uniform_fund_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setFundTransactions((transactionsData as FundTransaction[]) || []);
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

  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from("students")
        .select("id, student_number, name, surname, form")
        .eq("status", "enrolled")
        .or(`name.ilike.%${query}%,surname.ilike.%${query}%,student_number.ilike.%${query}%`)
        .limit(10);

      setSearchResults((data as Student[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchStudents(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchStudents]);

  const generateReceiptNumber = () => {
    const prefix = "UNI";
    const date = format(new Date(), "yyyyMMdd");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}-${date}-${random}`;
  };

  // Calculate fund balance
  const fundBalance = useMemo(() => {
    // Calculate from sales (income)
    const salesTotal = sales.reduce((sum, s) => sum + s.total_amount, 0);

    // Calculate from fund transactions (expenses are negative)
    const transactionsTotal = fundTransactions.reduce((sum, t) => {
      if (t.transaction_type === "sale") return sum + t.amount;
      if (t.transaction_type === "expense") return sum - t.amount;
      return sum + t.amount; // adjustment can be positive or negative
    }, 0);

    // If no transactions recorded yet, use sales total
    return fundTransactions.length > 0 ? transactionsTotal : salesTotal;
  }, [sales, fundTransactions]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todaySales = sales.filter(
      (s) => format(new Date(s.created_at), "yyyy-MM-dd") === today
    );
    return {
      count: todaySales.length,
      total: todaySales.reduce((sum, s) => sum + s.total_amount, 0),
      collected: todaySales.filter((s) => s.collected).length,
      pending: todaySales.filter((s) => !s.collected).length,
    };
  }, [sales]);

  const handleRecordSale = async () => {
    if (!selectedStudent || !selectedUniform || !selectedSize || !quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const qty = parseInt(quantity);
      const receiptNumber = generateReceiptNumber();
      const totalAmount = selectedUniform.price * qty;

      const saleData = {
        receipt_number: receiptNumber,
        student_id: selectedStudent.id,
        uniform_id: selectedUniform.id,
        size: selectedSize,
        quantity: qty,
        unit_price: selectedUniform.price,
        total_amount: totalAmount,
        collected: false,
        payment_method: paymentMethod,
        received_by_name: currentUser,
      };

      const { data: insertedSale, error } = await supabase
        .from("uniform_sales")
        .insert(saleData as never)
        .select("*, students(name, surname, student_number), uniforms(name)")
        .single();

      if (error) throw error;

      // Update stock
      await supabase
        .from("uniforms")
        .update({ stock_quantity: selectedUniform.stock_quantity - qty } as never)
        .eq("id", selectedUniform.id);

      // Record fund transaction
      const saleRecord = insertedSale as UniformSale | null;
      await supabase
        .from("uniform_fund_transactions")
        .insert({
          transaction_type: "sale",
          amount: totalAmount,
          description: `Sale: ${selectedUniform.name} x${qty} to ${selectedStudent.surname}, ${selectedStudent.name}`,
          reference_id: saleRecord?.id,
          reference_type: "uniform_sale",
          created_by: currentUser,
        } as never);

      toast.success("Sale recorded successfully");
      setSaleDialogOpen(false);

      // Set last sale for receipt dialog
      setLastSale(saleRecord);
      setReceiptDialogOpen(true);

      // Reset form
      setSelectedStudent(null);
      setSelectedUniform(null);
      setSelectedSize("");
      setQuantity("1");
      setPaymentMethod("cash");
      setSearchQuery("");

      fetchData();
    } catch (error) {
      toast.error("Failed to record sale");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCollected = async (sale: UniformSale) => {
    try {
      const newCollectedStatus = !sale.collected;
      const { error } = await supabase
        .from("uniform_sales")
        .update({
          collected: newCollectedStatus,
          collected_at: newCollectedStatus ? new Date().toISOString() : null,
          collected_by: newCollectedStatus ? currentUser : null,
        } as never)
        .eq("id", sale.id);

      if (error) throw error;

      toast.success(newCollectedStatus ? "Marked as collected" : "Marked as pending");
      fetchData();
    } catch (error) {
      toast.error("Failed to update collection status");
      console.error(error);
    }
  };

  const handleSaveUniform = async () => {
    if (!uniformName.trim() || !uniformPrice) {
      toast.error("Name and price are required");
      return;
    }

    setSaving(true);
    try {
      const sizes = uniformSizes.split(",").map((s) => s.trim()).filter(Boolean);
      const uniformData = {
        name: uniformName.trim(),
        sizes: sizes.length > 0 ? sizes : ["S", "M", "L", "XL"],
        price: parseFloat(uniformPrice),
        stock_quantity: uniformStock ? parseInt(uniformStock) : 0,
      };

      if (editingUniform) {
        const { error } = await supabase
          .from("uniforms")
          .update(uniformData as never)
          .eq("id", editingUniform.id);
        if (error) throw error;
        toast.success("Uniform updated");
      } else {
        const { error } = await supabase
          .from("uniforms")
          .insert(uniformData as never);
        if (error) throw error;
        toast.success("Uniform added");
      }

      setUniformDialogOpen(false);
      resetUniformForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to save uniform");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetUniformForm = () => {
    setUniformName("");
    setUniformSizes("");
    setUniformPrice("");
    setUniformStock("");
    setEditingUniform(null);
  };

  const handleEditUniform = (uniform: Uniform) => {
    setUniformName(uniform.name);
    setUniformSizes(uniform.sizes.join(", "));
    setUniformPrice(uniform.price.toString());
    setUniformStock(uniform.stock_quantity.toString());
    setEditingUniform(uniform);
    setUniformDialogOpen(true);
  };

  const printReceipt = (sale: UniformSale) => {
    const receiptContent = `
      <html>
        <head>
          <title>Receipt ${sale.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 80mm; margin: 0; padding: 10px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 15px; }
            .school-name { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
            .school-address { font-size: 10px; margin-bottom: 2px; }
            .receipt-title { font-size: 14px; font-weight: bold; margin-top: 8px; border: 2px solid #000; padding: 3px 8px; display: inline-block; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .double-line { border-top: 3px double #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .label { font-size: 11px; }
            .value { font-weight: 600; }
            .amount-box { border: 2px solid #000; padding: 10px; text-align: center; margin: 10px 0; }
            .amount-label { font-size: 11px; font-weight: bold; }
            .amount-value { font-size: 22px; font-weight: bold; }
            .status-box { border: 1px solid #000; padding: 8px; text-align: center; margin: 8px 0; }
            .status-label { font-size: 10px; font-weight: bold; }
            .status-value { font-size: 14px; font-weight: bold; }
            .status-collected { color: #16a34a; }
            .status-pending { color: #ca8a04; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .item-details { margin: 8px 0; }
            .item-header { font-weight: bold; margin-bottom: 5px; font-size: 11px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${SCHOOL_INFO.name}</div>
            <div class="school-address">${SCHOOL_INFO.address}</div>
            <div class="school-address">${SCHOOL_INFO.phone}</div>
            <div class="receipt-title">UNIFORM RECEIPT</div>
          </div>
          <div class="line"></div>
          <div class="row">
            <span class="label">Receipt No:</span>
            <span class="value">${sale.receipt_number}</span>
          </div>
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}</span>
          </div>
          <div class="line"></div>
          <div class="row">
            <span class="label">Student:</span>
            <span class="value">${sale.students?.surname}, ${sale.students?.name}</span>
          </div>
          <div class="row">
            <span class="label">Student No:</span>
            <span class="value">${sale.students?.student_number}</span>
          </div>
          <div class="row">
            <span class="label">Form/Class:</span>
            <span class="value">${sale.students?.form || "N/A"}</span>
          </div>
          <div class="line"></div>
          <div class="item-details">
            <div class="item-header">Item Details:</div>
            <div class="row">
              <span>Item:</span>
              <span>${sale.uniforms?.name}</span>
            </div>
            <div class="row">
              <span>Size:</span>
              <span>${sale.size}</span>
            </div>
            <div class="row">
              <span>Quantity:</span>
              <span>${sale.quantity}</span>
            </div>
            <div class="row">
              <span>Unit Price:</span>
              <span>$${sale.unit_price.toFixed(2)}</span>
            </div>
          </div>
          <div class="double-line"></div>
          <div class="amount-box">
            <div class="amount-label">AMOUNT PAID</div>
            <div class="amount-value">$${sale.total_amount.toFixed(2)}</div>
          </div>
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value" style="text-transform: capitalize;">${sale.payment_method || "Cash"}</span>
          </div>
          <div class="row">
            <span class="label">Received by:</span>
            <span class="value">${sale.received_by_name || "Staff"}</span>
          </div>
          <div class="status-box">
            <div class="status-label">COLLECTION STATUS</div>
            <div class="status-value ${sale.collected ? "status-collected" : "status-pending"}">${sale.collected ? "COLLECTED" : "PENDING COLLECTION"}</div>
            ${sale.collected && sale.collected_at ? `<div style="font-size: 9px; margin-top: 4px;">Collected: ${format(new Date(sale.collected_at), "dd/MM/yyyy HH:mm")}${sale.collected_by ? ` by ${sale.collected_by}` : ""}</div>` : `<div style="font-size: 9px; margin-top: 4px; color: #ca8a04;">Present this receipt to collect your uniform</div>`}
          </div>
          <div class="line"></div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p style="margin-top: 10px; font-style: italic;">This is a computer-generated receipt</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=350,height=700");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
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
          <h1 className="text-3xl font-bold tracking-tight">Uniform Sales</h1>
          <p className="text-muted-foreground">
            Manage uniform inventory, sales, and fund tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUniformDialogOpen(true)}>
            <Package className="mr-2 h-4 w-4" />
            Add Uniform
          </Button>
          <Button onClick={() => setSaleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uniform Fund Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ${fundBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shirt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Sales</p>
                <p className="text-2xl font-bold">{todayStats.count}</p>
                <p className="text-xs text-muted-foreground">${todayStats.total.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Collection</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {sales.filter((s) => !s.collected).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collected Today</p>
                <p className="text-2xl font-bold text-purple-600">{todayStats.collected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales & Collection</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="fund">Fund Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Sales & Collection Status
              </CardTitle>
              <CardDescription>Track sales and uniform collection</CardDescription>
            </CardHeader>
            <CardContent>
              {sales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">{sale.receipt_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {sale.students?.surname}, {sale.students?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {sale.students?.student_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{sale.uniforms?.name}</TableCell>
                        <TableCell><Badge variant="outline">{sale.size}</Badge></TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell className="font-mono font-medium">
                          ${sale.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sale.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={sale.collected}
                              onCheckedChange={() => handleToggleCollected(sale)}
                            />
                            <Badge
                              variant={sale.collected ? "default" : "secondary"}
                              className={sale.collected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                            >
                              {sale.collected ? "Collected" : "Pending"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => printReceipt(sale)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="h-5 w-5" />
                Uniform Inventory
              </CardTitle>
              <CardDescription>{uniforms.length} items in inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {uniforms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Sizes</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniforms.map((uniform) => (
                      <TableRow key={uniform.id}>
                        <TableCell className="font-medium">{uniform.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {uniform.sizes.map((size) => (
                              <Badge key={size} variant="outline">{size}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">${uniform.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={uniform.stock_quantity > 10 ? "default" : "destructive"}
                          >
                            {uniform.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUniform(uniform)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Shirt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No uniforms in inventory</p>
                  <p className="text-sm">Add uniforms to start selling</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fund" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Uniform Fund Transactions
              </CardTitle>
              <CardDescription>
                Track uniform fund for profitability - use payment vouchers with &quot;Uniform Fund&quot; source to draw from this pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Fund Balance</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${fundBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-xl font-bold">
                      ${sales.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              {fundTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.transaction_type === "sale"
                                ? "bg-green-100 text-green-800"
                                : transaction.transaction_type === "expense"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {transaction.transaction_type === "sale" && <TrendingUp className="h-3 w-3 mr-1" />}
                            {transaction.transaction_type === "expense" && <TrendingDown className="h-3 w-3 mr-1" />}
                            {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.description || "-"}</TableCell>
                        <TableCell className={`text-right font-mono font-medium ${
                          transaction.transaction_type === "expense" ? "text-red-600" : "text-green-600"
                        }`}>
                          {transaction.transaction_type === "expense" ? "-" : "+"}
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No fund transactions recorded yet</p>
                  <p className="text-sm">Transactions will appear here as sales are made</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Uniform Sale</DialogTitle>
            <DialogDescription>Record a uniform purchase</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label>Search Student *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searching && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}
              {searchResults.length > 0 && !selectedStudent && (
                <div className="border rounded-lg max-h-32 overflow-auto">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between items-center"
                      onClick={() => {
                        setSelectedStudent(student);
                        setSearchResults([]);
                      }}
                    >
                      <div>
                        <p className="font-medium">{student.surname}, {student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.student_number}</p>
                      </div>
                      <Badge variant="outline">{student.form}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudent && (
                <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedStudent.surname}, {selectedStudent.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.student_number} - {selectedStudent.form}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Uniform Selection */}
            <div className="space-y-2">
              <Label>Uniform Item *</Label>
              <Select
                value={selectedUniform?.id || ""}
                onValueChange={(id) => {
                  const uniform = uniforms.find((u) => u.id === id);
                  setSelectedUniform(uniform || null);
                  setSelectedSize("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select uniform" />
                </SelectTrigger>
                <SelectContent>
                  {uniforms.map((uniform) => (
                    <SelectItem key={uniform.id} value={uniform.id}>
                      {uniform.name} - ${uniform.price.toFixed(2)} (Stock: {uniform.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Selection */}
            {selectedUniform && (
              <div className="space-y-2">
                <Label>Size *</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedUniform.sizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total */}
            {selectedUniform && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  ${(selectedUniform.price * parseInt(quantity || "0")).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordSale} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog - Shows after recording sale */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Recorded</DialogTitle>
            <DialogDescription>
              Receipt #{lastSale?.receipt_number}
            </DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4 py-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  ${lastSale.total_amount.toFixed(2)}
                </p>
                <p className="text-sm text-green-700 mt-1">Payment Successful</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student:</span>
                  <span className="font-medium">
                    {lastSale.students?.surname}, {lastSale.students?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Form/Class:</span>
                  <span>{lastSale.students?.form || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">{lastSale.uniforms?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{lastSale.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>{lastSale.quantity}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="capitalize">{lastSale.payment_method || "Cash"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collection Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending Collection</Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => lastSale && printReceipt(lastSale)}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Uniform Dialog */}
      <Dialog open={uniformDialogOpen} onOpenChange={(open) => {
        setUniformDialogOpen(open);
        if (!open) resetUniformForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUniform ? "Edit Uniform" : "Add Uniform"}</DialogTitle>
            <DialogDescription>
              {editingUniform ? "Update uniform details" : "Add a new uniform item to inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={uniformName}
                onChange={(e) => setUniformName(e.target.value)}
                placeholder="e.g., School Shirt, Trousers"
              />
            </div>
            <div className="space-y-2">
              <Label>Sizes (comma-separated)</Label>
              <Input
                value={uniformSizes}
                onChange={(e) => setUniformSizes(e.target.value)}
                placeholder="S, M, L, XL"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={uniformPrice}
                  onChange={(e) => setUniformPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={uniformStock}
                  onChange={(e) => setUniformStock(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUniformDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUniform} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingUniform ? "Update" : "Add Uniform"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
