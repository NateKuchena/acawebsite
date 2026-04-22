"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Loader2, Palette, Edit, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";

interface EventType {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  is_system: boolean;
  is_public: boolean;
  created_at: string;
}

const PRESET_COLORS = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Lime", value: "#84CC16" },
];

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isPublic, setIsPublic] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchEventTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("event_types")
        .select("*")
        .order("is_system", { ascending: false })
        .order("name");

      setEventTypes((data as EventType[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load event types");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  const resetForm = () => {
    setName("");
    setColor("#3B82F6");
    setIsPublic(true);
    setEditingId(null);
  };

  const handleEdit = (eventType: EventType) => {
    if (eventType.is_system) {
      // Only allow editing visibility for system types
      setName(eventType.name);
      setColor(eventType.color);
      setIsPublic(eventType.is_public);
      setEditingId(eventType.id);
      setDialogOpen(true);
    } else {
      setName(eventType.name);
      setColor(eventType.color);
      setIsPublic(eventType.is_public);
      setEditingId(eventType.id);
      setDialogOpen(true);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Event type name is required");
      return;
    }

    setSaving(true);
    try {
      const eventTypeData = {
        name: name.trim(),
        color,
        is_public: isPublic,
      };

      if (editingId) {
        const { error } = await supabase
          .from("event_types")
          .update(eventTypeData as never)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Event type updated");
      } else {
        const { error } = await supabase
          .from("event_types")
          .insert({ ...eventTypeData, is_system: false } as never);

        if (error) throw error;
        toast.success("Event type created");
      }

      setDialogOpen(false);
      resetForm();
      fetchEventTypes();
    } catch (error) {
      toast.error("Failed to save event type");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventType: EventType) => {
    if (eventType.is_system) {
      toast.error("Cannot delete system event types");
      return;
    }

    if (!confirm("Are you sure you want to delete this event type?")) return;

    try {
      const { error } = await supabase
        .from("event_types")
        .delete()
        .eq("id", eventType.id);

      if (error) throw error;
      toast.success("Event type deleted");
      fetchEventTypes();
    } catch (error) {
      toast.error("Failed to delete event type. It may be in use.");
      console.error(error);
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
          <h1 className="text-3xl font-bold tracking-tight">Event Types</h1>
          <p className="text-muted-foreground">
            Manage calendar event categories and their colors
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Event Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Event Type" : "Add Event Type"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update the event type details" : "Create a new event type for the calendar"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Event Type Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Workshop, Field Trip, Ceremony"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`h-8 w-full rounded-md border-2 transition-all ${
                        color === preset.value
                          ? "border-foreground scale-110"
                          : "border-transparent hover:border-muted-foreground/50"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      onClick={() => setColor(preset.value)}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-sm text-muted-foreground">Custom:</Label>
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 p-0 border-0"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="w-24 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked === true)}
                />
                <Label htmlFor="is_public" className="text-sm font-normal">
                  Visible to parents (public events)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Types List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            All Event Types
          </CardTitle>
          <CardDescription>
            {eventTypes.length} event types configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventTypes.map((eventType) => (
                  <TableRow key={eventType.id}>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: eventType.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{eventType.name}</TableCell>
                    <TableCell>
                      <Badge variant={eventType.is_public ? "default" : "secondary"}>
                        {eventType.is_public ? "Public" : "Staff Only"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {eventType.is_system ? (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          System
                        </Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(eventType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!eventType.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(eventType)}
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
              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No event types configured</p>
              <p className="text-sm">Create event types to categorize calendar events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
