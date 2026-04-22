"use client";

import { AssetForm } from "@/components/assets/asset-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewAssetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/assets">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
          <p className="text-muted-foreground">
            Register a new asset in the inventory
          </p>
        </div>
      </div>

      <AssetForm mode="create" />
    </div>
  );
}
