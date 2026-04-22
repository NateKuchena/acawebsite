"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AssetForm } from "@/components/assets/asset-form";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Package } from "lucide-react";
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
}

export default function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/assets/${asset.id}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          <p className="text-muted-foreground">{asset.asset_number} - {asset.name}</p>
        </div>
      </div>

      <AssetForm asset={asset} mode="edit" />
    </div>
  );
}
