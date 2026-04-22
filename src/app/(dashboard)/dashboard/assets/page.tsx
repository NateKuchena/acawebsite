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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Package,
  Search,
  Eye,
  Edit,
  Barcode,
  Download,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Asset {
  id: string;
  asset_number: string;
  barcode: string | null;
  name: string;
  category: string | null;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  status: "functional" | "missing" | "disposed";
  is_movable: boolean;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  functional: "bg-green-100 text-green-800",
  missing: "bg-red-100 text-red-800",
  disposed: "bg-gray-100 text-gray-800",
};

const assetCategories = [
  "Furniture",
  "Electronics",
  "Vehicles",
  "Office Equipment",
  "Sports Equipment",
  "Laboratory Equipment",
  "Kitchen Equipment",
  "Musical Instruments",
  "Tools",
  "Other",
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [movableFilter, setMovableFilter] = useState("all");

  const supabase = useMemo(() => createClient(), []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (categoryFilter && categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (movableFilter === "movable") {
        query = query.eq("is_movable", true);
      } else if (movableFilter === "fixed") {
        query = query.eq("is_movable", false);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = (data as Asset[]) || [];

      // Client-side search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (asset) =>
            asset.name.toLowerCase().includes(search) ||
            asset.asset_number.toLowerCase().includes(search) ||
            asset.barcode?.toLowerCase().includes(search) ||
            asset.location?.toLowerCase().includes(search)
        );
      }

      setAssets(filteredData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [supabase, categoryFilter, statusFilter, movableFilter, searchQuery]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const exportToCSV = () => {
    const headers = [
      "Asset No",
      "Barcode",
      "Name",
      "Category",
      "Location",
      "Purchase Date",
      "Purchase Price",
      "Current Value",
      "Status",
      "Movable",
    ];
    const rows = assets.map((a) => [
      a.asset_number,
      a.barcode || "",
      a.name,
      a.category || "",
      a.location || "",
      a.purchase_date || "",
      a.purchase_price?.toFixed(2) || "",
      a.current_value?.toFixed(2) || "",
      a.status,
      a.is_movable ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset_register_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Asset register exported");
  };

  // Calculate summary stats
  const totalAssets = assets.length;
  const functionalAssets = assets.filter((a) => a.status === "functional").length;
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const movableAssets = assets.filter((a) => a.is_movable).length;

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
          <h1 className="text-3xl font-bold tracking-tight">Asset Register</h1>
          <p className="text-muted-foreground">
            Manage school assets and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={assets.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/assets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{totalAssets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Functional</p>
                <p className="text-2xl font-bold">{functionalAssets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Barcode className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Movable</p>
                <p className="text-2xl font-bold">{movableAssets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, asset number, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-40">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {assetCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Type</Label>
              <Select value={movableFilter} onValueChange={setMovableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="movable">Movable</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Assets
          </CardTitle>
          <CardDescription>
            {assets.length} assets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono text-sm">
                      {asset.asset_number}
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      {asset.category ? (
                        <Badge variant="outline">{asset.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{asset.location || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[asset.status]}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={asset.is_movable ? "secondary" : "outline"}>
                        {asset.is_movable ? "Movable" : "Fixed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {asset.current_value
                        ? `$${asset.current_value.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/assets/${asset.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/assets/${asset.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {asset.is_movable && (
                          <Link href={`/dashboard/assets/${asset.id}/barcode`}>
                            <Button variant="ghost" size="icon">
                              <Barcode className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assets found</p>
              <p className="text-sm">Add assets to start tracking inventory</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
