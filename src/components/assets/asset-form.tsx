"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Package, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";

const assetSchema = z.object({
  asset_number: z.string().min(1, "Asset number is required"),
  name: z.string().min(1, "Asset name is required"),
  category: z.string().optional(),
  location: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.string().optional(),
  current_value: z.string().optional(),
  status: z.enum(["functional", "missing", "disposed"]),
  is_movable: z.boolean(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormProps {
  asset?: {
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
  };
  mode: "create" | "edit";
}

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

const locations = [
  "Main Office",
  "Staff Room",
  "Library",
  "Computer Lab",
  "Science Lab",
  "Classroom Block A",
  "Classroom Block B",
  "Assembly Hall",
  "Kitchen",
  "Store Room",
  "Sports Field",
  "Workshop",
  "Other",
];

export function AssetForm({ asset, mode }: AssetFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_number: asset?.asset_number || "",
      name: asset?.name || "",
      category: asset?.category || "",
      location: asset?.location || "",
      purchase_date: asset?.purchase_date || "",
      purchase_price: asset?.purchase_price?.toString() || "",
      current_value: asset?.current_value?.toString() || "",
      status: asset?.status || "functional",
      is_movable: asset?.is_movable ?? true,
      notes: asset?.notes || "",
    },
  });

  const generateBarcode = (assetNumber: string, isMovable: boolean) => {
    if (!isMovable) return null;
    // Generate a unique barcode based on asset number and timestamp
    return `AST-${assetNumber}-${Date.now().toString(36).toUpperCase()}`;
  };

  async function onSubmit(data: AssetFormValues) {
    setLoading(true);

    try {
      const assetData = {
        asset_number: data.asset_number,
        name: data.name,
        category: data.category || null,
        location: data.location || null,
        purchase_date: data.purchase_date || null,
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
        current_value: data.current_value ? parseFloat(data.current_value) : null,
        status: data.status,
        is_movable: data.is_movable,
        notes: data.notes || null,
      };

      if (mode === "create") {
        // Generate barcode for movable assets
        const barcode = generateBarcode(data.asset_number, data.is_movable);

        const { error } = await supabase.from("assets").insert({
          ...assetData,
          barcode,
        } as never);

        if (error) {
          if (error.code === "23505") {
            toast.error("An asset with this asset number already exists");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Asset added successfully");
        router.push("/dashboard/assets");
      } else {
        const { error } = await supabase
          .from("assets")
          .update(assetData as never)
          .eq("id", asset!.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Asset updated successfully");
        router.push(`/dashboard/assets/${asset!.id}`);
      }

      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Asset identification details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="asset_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="AST-001" {...field} disabled={mode === "edit"} />
                  </FormControl>
                  <FormDescription>Unique identifier for this asset</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dell Laptop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_movable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Movable Asset</FormLabel>
                    <FormDescription>
                      Check this if the asset can be moved (generates barcode for tracking)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>Where the asset is located</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </CardTitle>
            <CardDescription>Purchase and valuation details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="current_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>Estimated current value</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Notes and remarks</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this asset..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Adding..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Add Asset" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
