"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface EventType {
  name: string;
  color: string;
}

interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  event_type?: EventType;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function ParentCalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const supabase = useMemo(() => createClient(), []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("school_events")
        .select("*, event_type:event_type_id(name, color)")
        .eq("is_public", true)
        .order("start_date");

      if (error) throw error;
      setEvents((data as SchoolEvent[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const navigateMonth = (direction: number) => {
    let newMonth = viewMonth + direction;
    let newYear = viewYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  // Filter events for current month
  const monthEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return eventDate.getMonth() === viewMonth && eventDate.getFullYear() === viewYear;
    });
  }, [events, viewMonth, viewYear]);

  // Upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    return events
      .filter((event) => {
        const eventDate = new Date(event.start_date);
        return eventDate >= today && eventDate <= thirtyDaysLater;
      })
      .slice(0, 10);
  }, [events]);

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
        <h1 className="text-3xl font-bold tracking-tight">School Calendar</h1>
        <p className="text-muted-foreground">
          View upcoming school events and important dates
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Events for Current Month */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {MONTHS[viewMonth]} {viewYear}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewMonth(new Date().getMonth());
                    setViewYear(new Date().getFullYear());
                  }}
                >
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {monthEvents.length} event{monthEvents.length !== 1 ? "s" : ""} this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthEvents.length > 0 ? (
              <div className="space-y-4">
                {monthEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="w-1 rounded-full shrink-0"
                      style={{ backgroundColor: event.event_type?.color || "#3B82F6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.start_date)}
                            {event.start_date !== event.end_date && (
                              <> - {formatDate(event.end_date)}</>
                            )}
                          </p>
                        </div>
                        {event.event_type && (
                          <Badge
                            style={{
                              backgroundColor: event.event_type.color,
                              color: "white",
                            }}
                          >
                            {event.event_type.name}
                          </Badge>
                        )}
                      </div>
                      {!event.all_day && event.start_time && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.start_time)}
                          {event.end_time && ` - ${formatTime(event.end_time)}`}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No events scheduled for {MONTHS[viewMonth]}</p>
                <p className="text-sm">Check other months for upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <CardDescription>Next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div
                      className="w-1 h-10 rounded-full mt-1"
                      style={{ backgroundColor: event.event_type?.color || "#3B82F6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(event.start_date)}
                        {event.start_date !== event.end_date && (
                          <> - {formatShortDate(event.end_date)}</>
                        )}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
