"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Download,
  Package,
  MapPin,
  AlertTriangle,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  asset_number: string;
  name: string;
  category: string | null;
  location: string | null;
  purchase_price: number | null;
  current_value: number | null;
  status: "functional" | "missing" | "disposed";
  is_movable: boolean;
}

interface CategorySummary {
  category: string;
  count: number;
  total_value: number;
  functional: number;
  missing: number;
  disposed: number;
}

interface LocationSummary {
  location: string;
  count: number;
  total_value: number;
}

export default function AssetReportsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("category");

      if (error) throw error;
      setAssets((data as Asset[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Calculate summaries
  const categoryData: Record<string, CategorySummary> = {};
  const locationData: Record<string, LocationSummary> = {};

  for (const asset of assets) {
    // Category summary
    const cat = asset.category || "Uncategorized";
    if (!categoryData[cat]) {
      categoryData[cat] = {
        category: cat,
        count: 0,
        total_value: 0,
        functional: 0,
        missing: 0,
        disposed: 0,
      };
    }
    categoryData[cat].count++;
    categoryData[cat].total_value += asset.current_value || 0;
    categoryData[cat][asset.status]++;

    // Location summary
    const loc = asset.location || "Unspecified";
    if (!locationData[loc]) {
      locationData[loc] = {
        location: loc,
        count: 0,
        total_value: 0,
      };
    }
    locationData[loc].count++;
    locationData[loc].total_value += asset.current_value || 0;
  }

  const categorySummary = Object.values(categoryData).sort((a, b) => b.total_value - a.total_value);
  const locationSummary = Object.values(locationData).sort((a, b) => b.count - a.count);
  const missingAssets = assets.filter((a) => a.status === "missing");
  const highValueAssets = assets
    .filter((a) => a.current_value && a.current_value >= 1000)
    .sort((a, b) => (b.current_value || 0) - (a.current_value || 0));

  // Totals
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.purchase_price || 0), 0);
  const totalDepreciation = totalPurchaseValue - totalValue;

  const exportReport = (type: string) => {
    let csv = "";
    let filename = "";

    switch (type) {
      case "category":
        csv = "Category,Count,Total Value,Functional,Missing,Disposed\n";
        for (const cat of categorySummary) {
          csv += `"${cat.category}",${cat.count},${cat.total_value.toFixed(2)},${cat.functional},${cat.missing},${cat.disposed}\n`;
        }
        filename = "asset_report_by_category.csv";
        break;
      case "location":
        csv = "Location,Count,Total Value\n";
        for (const loc of locationSummary) {
          csv += `"${loc.location}",${loc.count},${loc.total_value.toFixed(2)}\n`;
        }
        filename = "asset_report_by_location.csv";
        break;
      case "missing":
        csv = "Asset No,Name,Category,Location,Value\n";
        for (const asset of missingAssets) {
          csv += `"${asset.asset_number}","${asset.name}","${asset.category || ""}","${asset.location || ""}",${asset.current_value?.toFixed(2) || ""}\n`;
        }
        filename = "missing_assets_report.csv";
        break;
      case "high-value":
        csv = "Asset No,Name,Category,Location,Current Value\n";
        for (const asset of highValueAssets) {
          csv += `"${asset.asset_number}","${asset.name}","${asset.category || ""}","${asset.location || ""}",${asset.current_value?.toFixed(2) || ""}\n`;
        }
        filename = "high_value_assets_report.csv";
        break;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported");
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asset Reports</h1>
        <p className="text-muted-foreground">
          Analyze and export asset data
        </p>
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
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Depreciation</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totalDepreciation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missing</p>
                <p className="text-2xl font-bold text-yellow-600">{missingAssets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="category" className="space-y-4">
        <TabsList>
          <TabsTrigger value="category">By Category</TabsTrigger>
          <TabsTrigger value="location">By Location</TabsTrigger>
          <TabsTrigger value="missing">Missing Assets</TabsTrigger>
          <TabsTrigger value="high-value">High Value</TabsTrigger>
        </TabsList>

        {/* By Category */}
        <TabsContent value="category">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Assets by Category
                </CardTitle>
                <CardDescription>Breakdown of assets by category</CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportReport("category")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Functional</TableHead>
                    <TableHead className="text-right">Missing</TableHead>
                    <TableHead className="text-right">Disposed</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorySummary.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium">{cat.category}</TableCell>
                      <TableCell className="text-right">{cat.count}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-green-50">
                          {cat.functional}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cat.missing > 0 ? (
                          <Badge variant="destructive">{cat.missing}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">{cat.disposed}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${cat.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{totalAssets}</TableCell>
                    <TableCell className="text-right font-bold">
                      {assets.filter((a) => a.status === "functional").length}
                    </TableCell>
                    <TableCell className="text-right font-bold">{missingAssets.length}</TableCell>
                    <TableCell className="text-right font-bold">
                      {assets.filter((a) => a.status === "disposed").length}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Location */}
        <TabsContent value="location">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Assets by Location
                </CardTitle>
                <CardDescription>Distribution of assets across locations</CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportReport("location")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Asset Count</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationSummary.map((loc) => (
                    <TableRow key={loc.location}>
                      <TableCell className="font-medium">{loc.location}</TableCell>
                      <TableCell className="text-right">{loc.count}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${loc.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Missing Assets */}
        <TabsContent value="missing">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Missing Assets
                </CardTitle>
                <CardDescription>{missingAssets.length} assets marked as missing</CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportReport("missing")} disabled={missingAssets.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {missingAssets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Known Location</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono">{asset.asset_number}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>
                          {asset.category ? (
                            <Badge variant="outline">{asset.category}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{asset.location || "-"}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {asset.current_value ? `$${asset.current_value.toFixed(2)}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No missing assets</p>
                  <p className="text-sm">All assets are accounted for</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* High Value Assets */}
        <TabsContent value="high-value">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>High Value Assets</CardTitle>
                <CardDescription>Assets valued at $1,000 or more</CardDescription>
              </div>
              <Button variant="outline" onClick={() => exportReport("high-value")} disabled={highValueAssets.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {highValueAssets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset No.</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {highValueAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono">{asset.asset_number}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>
                          {asset.category ? (
                            <Badge variant="outline">{asset.category}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{asset.location || "-"}</TableCell>
                        <TableCell>
                          <Badge className={asset.status === "functional" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-600">
                          ${asset.current_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No high value assets</p>
                  <p className="text-sm">No assets valued at $1,000 or more</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
