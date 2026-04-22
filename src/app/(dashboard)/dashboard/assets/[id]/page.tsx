"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  Edit,
  Barcode,
  Package,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Printer,
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
  updated_at: string;
}

const statusColors: Record<string, string> = {
  functional: "bg-green-100 text-green-800",
  missing: "bg-red-100 text-red-800",
  disposed: "bg-gray-100 text-gray-800",
};

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchAsset = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) throw error;
      setAsset(data as Asset);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load asset");
    } finally {
      setLoading(false);
    }
  }, [supabase, resolvedParams.id]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  const printAssetLabel = () => {
    if (!asset) return;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Asset Label - ${asset.asset_number}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    .label {
      border: 2px solid #000;
      padding: 15px;
      max-width: 300px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .header h3 {
      margin: 0;
      font-size: 14px;
    }
    .asset-number {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 10px 0;
    }
    .barcode {
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      margin: 10px 0;
      padding: 10px;
      background: #f0f0f0;
    }
    .details {
      font-size: 11px;
    }
    .details p {
      margin: 5px 0;
    }
    @media print {
      body { padding: 0; }
      .label { border: 1px solid #000; }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <h3>SCHOOL PROPERTY</h3>
    </div>
    <div class="asset-number">${asset.asset_number}</div>
    ${asset.barcode ? `<div class="barcode">${asset.barcode}</div>` : ""}
    <div class="details">
      <p><strong>Name:</strong> ${asset.name}</p>
      <p><strong>Category:</strong> ${asset.category || "N/A"}</p>
      <p><strong>Location:</strong> ${asset.location || "N/A"}</p>
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank", "width=400,height=400");
    if (printWindow) {
      printWindow.document.write(printContent);
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

  if (!asset) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Asset Not Found</h2>
        <p className="text-muted-foreground">The requested asset could not be found.</p>
        <Link href="/dashboard/assets">
          <Button className="mt-4">Back to Assets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/assets">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <p className="text-muted-foreground font-mono">{asset.asset_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printAssetLabel}>
            <Printer className="mr-2 h-4 w-4" />
            Print Label
          </Button>
          {asset.is_movable && (
            <Link href={`/dashboard/assets/${asset.id}/barcode`}>
              <Button variant="outline">
                <Barcode className="mr-2 h-4 w-4" />
                View Barcode
              </Button>
            </Link>
          )}
          <Link href={`/dashboard/assets/${asset.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-2">
        <Badge className={statusColors[asset.status]}>
          {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
        </Badge>
        <Badge variant={asset.is_movable ? "secondary" : "outline"}>
          {asset.is_movable ? "Movable Asset" : "Fixed Asset"}
        </Badge>
        {asset.category && <Badge variant="outline">{asset.category}</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Asset Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset Number</p>
                <p className="font-mono font-medium">{asset.asset_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{asset.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{asset.category || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={statusColors[asset.status]}>
                  {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                </Badge>
              </div>
            </div>
            {asset.barcode && (
              <div>
                <p className="text-sm text-muted-foreground">Barcode</p>
                <p className="font-mono text-sm bg-muted p-2 rounded">{asset.barcode}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{asset.location || "Not specified"}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {asset.is_movable
                ? "This is a movable asset - location may change"
                : "This is a fixed asset"}
            </p>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="text-xl font-mono font-medium">
                  {asset.purchase_price ? `$${asset.purchase_price.toFixed(2)}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-xl font-mono font-medium text-green-600">
                  {asset.current_value ? `$${asset.current_value.toFixed(2)}` : "-"}
                </p>
              </div>
            </div>
            {asset.purchase_price && asset.current_value && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Depreciation</p>
                <p className="font-medium text-red-600">
                  ${(asset.purchase_price - asset.current_value).toFixed(2)} (
                  {(((asset.purchase_price - asset.current_value) / asset.purchase_price) * 100).toFixed(1)}%)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">
                  {asset.purchase_date
                    ? new Date(asset.purchase_date).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Added to System</p>
                <p className="font-medium">
                  {new Date(asset.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(asset.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {asset.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{asset.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
