"use client";

import { useState, useEffect, useCallback, useRef, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ChevronLeft,
  Printer,
  Download,
  Package,
  Barcode as BarcodeIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import JsBarcode from "jsbarcode";

interface Asset {
  id: string;
  asset_number: string;
  barcode: string | null;
  name: string;
  category: string | null;
  location: string | null;
  is_movable: boolean;
}

export default function AssetBarcodePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState(1);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchAsset = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_number, barcode, name, category, location, is_movable")
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

  useEffect(() => {
    if (asset?.barcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, asset.barcode, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch (error) {
        console.error("Barcode generation error:", error);
      }
    }
  }, [asset]);

  const regenerateBarcode = async () => {
    if (!asset) return;

    try {
      const newBarcode = `AST-${asset.asset_number}-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase
        .from("assets")
        .update({ barcode: newBarcode } as never)
        .eq("id", asset.id);

      if (error) throw error;

      toast.success("Barcode regenerated");
      fetchAsset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to regenerate barcode");
    }
  };

  const printBarcodes = () => {
    if (!asset?.barcode) return;

    const barcodeHtml = Array(copies)
      .fill(null)
      .map(
        () => `
        <div class="barcode-label">
          <div class="school-name">SCHOOL PROPERTY</div>
          <div class="asset-name">${asset.name}</div>
          <svg id="barcode-${Math.random()}"></svg>
          <div class="asset-number">${asset.asset_number}</div>
          <div class="location">${asset.location || ""}</div>
        </div>
      `
      )
      .join("");

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Asset Barcodes - ${asset.asset_number}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 10px;
    }
    .barcode-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .barcode-label {
      border: 1px dashed #ccc;
      padding: 10px;
      width: 200px;
      text-align: center;
      page-break-inside: avoid;
    }
    .school-name {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .asset-name {
      font-size: 12px;
      margin-bottom: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .asset-number {
      font-size: 11px;
      font-weight: bold;
      margin-top: 5px;
    }
    .location {
      font-size: 9px;
      color: #666;
    }
    svg {
      max-width: 100%;
      height: auto;
    }
    @media print {
      .barcode-label {
        border: 1px solid #000;
      }
    }
  </style>
</head>
<body>
  <div class="barcode-container">
    ${barcodeHtml}
  </div>
  <script>
    document.querySelectorAll('svg[id^="barcode-"]').forEach(svg => {
      JsBarcode(svg, "${asset.barcode}", {
        format: "CODE128",
        width: 1.5,
        height: 50,
        displayValue: false,
        margin: 5,
      });
    });
    setTimeout(() => window.print(), 500);
  </script>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  const downloadBarcode = () => {
    if (!barcodeRef.current) return;

    const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `barcode_${asset?.asset_number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
        <Link href="/dashboard/assets">
          <Button className="mt-4">Back to Assets</Button>
        </Link>
      </div>
    );
  }

  if (!asset.is_movable) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Not a Movable Asset</h2>
        <p className="text-muted-foreground">Barcodes are only available for movable assets.</p>
        <Link href={`/dashboard/assets/${asset.id}`}>
          <Button className="mt-4">Back to Asset</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/assets/${asset.id}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Barcode</h1>
            <p className="text-muted-foreground">{asset.asset_number} - {asset.name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Barcode Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarcodeIcon className="h-5 w-5" />
              Barcode Preview
            </CardTitle>
            <CardDescription>
              {asset.barcode || "No barcode generated"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {asset.barcode ? (
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg border">
                  <svg ref={barcodeRef}></svg>
                </div>
                <p className="mt-4 text-sm text-muted-foreground font-mono">
                  {asset.barcode}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarcodeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No barcode has been generated for this asset.</p>
                <Button onClick={regenerateBarcode} className="mt-4">
                  Generate Barcode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Print or download the barcode</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {asset.barcode && (
              <>
                <div className="space-y-2">
                  <Label>Number of Copies</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                    className="w-32"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={printBarcodes} className="w-full">
                    <Printer className="mr-2 h-4 w-4" />
                    Print {copies} Barcode{copies > 1 ? "s" : ""}
                  </Button>

                  <Button variant="outline" onClick={downloadBarcode} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download as PNG
                  </Button>

                  <Button variant="outline" onClick={regenerateBarcode} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Barcode
                  </Button>
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Asset Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset Number:</span>
                  <span className="font-mono">{asset.asset_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{asset.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{asset.category || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{asset.location || "-"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
