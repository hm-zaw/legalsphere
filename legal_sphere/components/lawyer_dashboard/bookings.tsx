"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bookingsData, type Booking } from "@/lib/data";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function parseBookingDate(dateStr: string) {
  // Best: ISO "YYYY-MM-DD"
  const d1 = new Date(dateStr);
  if (!Number.isNaN(d1.getTime())) return d1;

  // fallback: try DD/MM/YYYY or MM/DD/YYYY
  const parts = dateStr.split(/[\/\-\.]/).map((x) => x.trim());
  if (parts.length === 3) {
    const [a, b, c] = parts.map((n) => Number(n));
    if (c > 31) {
      const d2 = new Date(c, b - 1, a);
      if (!Number.isNaN(d2.getTime())) return d2;
      const d3 = new Date(c, a - 1, b);
      if (!Number.isNaN(d3.getTime())) return d3;
    }
  }
  return null;
}

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getMonthGrid(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const startDay = first.getDay(); // 0=Sun
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startDay);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return { first, days };
}

function minutesFromTimeLabel(timeStr: string) {
  const t = (timeStr || "").trim();
  if (!t) return Number.POSITIVE_INFINITY;

  const m12 = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (m12) {
    let hh = Number(m12[1]);
    const mm = Number(m12[2] ?? "0");
    const ap = m12[3].toUpperCase();
    if (ap === "PM" && hh < 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return Number(m24[1]) * 60 + Number(m24[2]);

  return Number.POSITIVE_INFINITY;
}

export function Bookings() {
  const [month, setMonth] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    setMonth(startOfMonth(new Date()));
  }, []);

  // Map: dayKey -> Booking[]
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookingsData) {
      const d = parseBookingDate(b.date);
      if (!d) continue;
      const key = ymd(d);
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    // sort each day by time
    for (const [k, arr] of map.entries()) {
      arr.sort(
        (a, b) => minutesFromTimeLabel(a.time) - minutesFromTimeLabel(b.time)
      );
      map.set(k, arr);
    }
    return map;
  }, []);

  const { first, days } = useMemo(() => {
    if (!month) return { first: new Date(), days: [] };
    return getMonthGrid(month);
  }, [month]);

  // If month changes, clear selection if it’s not in this month
  useEffect(() => {
    if (!selectedDay || !month) return;
    const d = new Date(selectedDay);
    if (Number.isNaN(d.getTime()) || !sameMonth(d, month)) {
      setSelectedDay(null);
    }
  }, [month, selectedDay]);

  // Default: show bookings for visible month
  const visibleMonthBookings = useMemo(() => {
    const res: Booking[] = [];
    if (!month) return res;
    for (const [key, list] of bookingsByDay.entries()) {
      const d = new Date(key);
      if (!Number.isNaN(d.getTime()) && sameMonth(d, month)) res.push(...list);
    }
    // sort by date then time
    res.sort((a, b) => {
      const da = parseBookingDate(a.date);
      const db = parseBookingDate(b.date);
      const ka = da ? ymd(da) : "";
      const kb = db ? ymd(db) : "";
      if (ka !== kb) return ka < kb ? -1 : 1;
      return minutesFromTimeLabel(a.time) - minutesFromTimeLabel(b.time);
    });
    return res;
  }, [bookingsByDay, month]);

  const displayedBookings = useMemo(() => {
    if (!selectedDay) return visibleMonthBookings;
    return bookingsByDay.get(selectedDay) ?? [];
  }, [selectedDay, visibleMonthBookings, bookingsByDay]);

  const monthLabel = month?.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const selectedLabel = useMemo(() => {
    if (!month) return "";
    if (!selectedDay) return `Upcoming bookings for ${monthLabel}`;
    const d = new Date(selectedDay);
    return `Bookings for ${d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  }, [selectedDay, monthLabel, month]);

  const selectedCount = displayedBookings.length;
  
  if (!month) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Scheduled Bookings</CardTitle>
          <CardDescription>
            Click a date in the calendar to view bookings for that day.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div>
              <Skeleton className="h-6 w-72 mb-3" />
              <div className="space-y-3">
                <Skeleton className="h-[88px] w-full" />
                <Skeleton className="h-[88px] w-full" />
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Scheduled Bookings</CardTitle>
        <CardDescription>
          Click a date in the calendar to view bookings for that day.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* LEFT: bookings list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium">{selectedLabel}</div>
              {selectedDay && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {displayedBookings.length === 0 ? (
                <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                  No bookings found.
                </div>
              ) : (
                displayedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={b.avatar} alt={b.client} data-ai-hint="person face" />
                        <AvatarFallback>
                          {b.client
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">{b.client}</div>
                          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                            Active
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {b.purpose}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium">{b.date}</div>
                      <div className="text-xs text-muted-foreground">{b.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: calendar */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-medium">Calendar</div>

            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m!, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-sm font-medium">{monthLabel}</div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m!, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 text-[11px] text-muted-foreground mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const inMonth = d.getMonth() === first.getMonth();
                const key = ymd(d);
                const count = bookingsByDay.get(key)?.length ?? 0;
                const hasBookings = count > 0;
                const isSelected = selectedDay === key;

                return (
                  <button
                    key={key}
                    onClick={() =>
                      setSelectedDay((cur) => (cur === key ? null : key))
                    }
                    className={cn(
                      "h-9 rounded-md text-sm flex items-center justify-center relative",
                      "hover:bg-muted transition",
                      !inMonth && "text-muted-foreground/50",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                    aria-label={`Select ${d.toDateString()}`}
                  >
                    {d.getDate()}

                    {hasBookings && (
                      <span
                        className={cn(
                          "absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 text-center",
                          isSelected
                            ? "bg-primary-foreground/90 text-primary"
                            : "bg-primary text-primary-foreground"
                        )}
                        title={`${count} booking(s)`}
                      >
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs">
              <div className="font-medium">Bookings on this date</div>
              <div className="text-muted-foreground">
                {selectedDay ? `${selectedCount} booking(s)` : "Select a date"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
