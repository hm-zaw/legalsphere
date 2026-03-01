"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Scale,
  Gavel,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Hourglass
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface CaseItem {
  id?: string;
  _id?: string;
  title?: string;
  category?: string;
  status?: string;
  dueDate?: string;
  createdAt?: string;
  client?: {
    fullName?: string;
  };
  isAppointment?: boolean;
}

// Status configuration for professional legal styling
const getStatusConfig = (status: string, isAppointment: boolean) => {
  if (isAppointment) {
    return {
      icon: Clock,
      label: "Appointment",
      color: "amber",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-300",
      accentColor: "bg-amber-500",
      textColor: "text-amber-900",
      subTextColor: "text-amber-700",
      badgeBg: "bg-amber-100",
    };
  }
  
  switch (status?.toLowerCase()) {
    case "active":
    case "in_progress":
      return {
        icon: Scale,
        label: "Active Case",
        color: "slate",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-300",
        accentColor: "bg-[#1a2238]",
        textColor: "text-slate-900",
        subTextColor: "text-slate-600",
        badgeBg: "bg-slate-100",
      };
    case "pending":
    case "submitted":
      return {
        icon: Hourglass,
        label: "Pending Review",
        color: "blue",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        accentColor: "bg-blue-500",
        textColor: "text-blue-900",
        subTextColor: "text-blue-700",
        badgeBg: "bg-blue-100",
      };
    case "resolved":
    case "completed":
      return {
        icon: CheckCircle2,
        label: "Resolved",
        color: "emerald",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        accentColor: "bg-emerald-500",
        textColor: "text-emerald-900",
        subTextColor: "text-emerald-700",
        badgeBg: "bg-emerald-100",
      };
    case "urgent":
    case "high_priority":
      return {
        icon: AlertCircle,
        label: "Urgent",
        color: "rose",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-300",
        accentColor: "bg-rose-500",
        textColor: "text-rose-900",
        subTextColor: "text-rose-700",
        badgeBg: "bg-rose-100",
      };
    default:
      return {
        icon: FileText,
        label: "Matter",
        color: "stone",
        bgColor: "bg-stone-50",
        borderColor: "border-stone-300",
        accentColor: "bg-stone-400",
        textColor: "text-stone-900",
        subTextColor: "text-stone-600",
        badgeBg: "bg-stone-100",
      };
  }
};

// Category icon mapping
const getCategoryIcon = (category?: string) => {
  if (!category) return Gavel;
  const cat = category.toLowerCase();
  if (cat.includes("litigation") || cat.includes("court")) return Gavel;
  if (cat.includes("contract") || cat.includes("agreement")) return FileText;
  if (cat.includes("property") || cat.includes("real estate")) return Scale;
  return FileText;
};

export default function LawyerCalendarView() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchCases();
    }
  }, [user?.id, currentDate]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("userToken") || localStorage.getItem("token");

      // Fetch assignments
      const assignmentsPromise = fetch(
        `http://127.0.0.1:5000/api/lawyer/assignments?status=all&limit=200&page=1`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      // Fetch appointments
      const appointmentsPromise = fetch(
        `http://127.0.0.1:5000/api/appointments/upcoming?userId=${user?.id}&role=lawyer`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      const [resAssignments, resAppointments] = await Promise.all([
        assignmentsPromise,
        appointmentsPromise,
      ]);

      let allEvents: CaseItem[] = [];

      if (resAssignments.ok) {
        const data = await resAssignments.json();
        allEvents = [...(data.cases || [])];
      }

      if (resAppointments.ok) {
        const data = await resAppointments.json();
        const appts = (data.appointments || []).map((appt: any) => ({
          id: appt._id || appt.id,
          title: `Appointment with ${appt.client_name || "Client"}`,
          status: "active", // Make it show as prominent
          dueDate: appt.agreed_time || appt.proposed_times?.[0], 
          isAppointment: true,
          client: { fullName: appt.client_name },
          // Reference the underlying case ID if needed to redirect
          _id: appt.case_id 
        }));
        allEvents = [...allEvents, ...appts];
      }

      setCases(allEvents);
    } catch (err) {
      console.error("Failed to fetch cases for calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Calculate events per day
  const getEventsForDay = (date: Date) => {
    return cases.filter((c) => {
      // Use dueDate if exists, otherwise fallback to assignment/create date to show *something* in the calendar
      const dateString = c.dueDate || c.createdAt;
      if (!dateString) return false;
      return isSameDay(new Date(dateString), date);
    });
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex-1 w-full h-full bg-[#efefec] flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <CalendarIcon className="w-8 h-8 text-[#af9164] mb-4 opacity-50" />
          <p className="text-sm font-serif text-slate-500 italic">
            Synchronizing Court Schedule...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-[#efefec] overflow-y-auto" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="w-full max-w-7xl mx-auto p-6 lg:p-12 space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between border-b-2 border-slate-900 pb-6 gap-6">
          <div>
            <h1 className="font-serif text-4xl text-slate-900 leading-tight">
              Court Calendar
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[#af9164] mt-2">
              Appointments & Deadlines
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)]">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors text-slate-600 border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-serif text-xl text-[#1a2238] min-w-[160px] text-center tracking-tight">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors text-slate-600 border border-transparent hover:border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="bg-white border border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] rounded-xl relative">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-[#fcfcfc] text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 rounded-t-xl">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-4 border-r border-slate-50 last:border-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-[140px] lg:auto-rows-[180px] divide-x divide-y divide-slate-100 bg-white">
            {/* Empty slots before start of month */}
            {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-slate-50/50" />
            ))}

            {daysInMonth.map((day) => {
              const events = getEventsForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 lg:p-3 relative transition-all duration-300 flex flex-col group",
                    "hover:z-50", // 1. FIXED: Elevates the z-index of the whole day cell on hover
                    isCurrentDay ? "bg-gradient-to-br from-amber-50/30 to-transparent" : "hover:bg-slate-50/40"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={cn(
                        "text-xs lg:text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300",
                        isCurrentDay
                          ? "bg-[#1a2238] text-white shadow-lg shadow-[#1a2238]/20"
                          : "text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-100"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[9px] font-semibold text-[#af9164] uppercase tracking-wider bg-[#af9164]/10 px-2 py-1 rounded-md border border-[#af9164]/20">
                        {events.length}
                      </span>
                    )}
                  </div>

                  {/* 2. FIXED: Removed "overflow-hidden" from this container */}
                  <div className="flex-1 space-y-1.5">
                    {events.slice(0, 3).map((e, idx) => {
                      const config = getStatusConfig(e.status || "", e.isAppointment || false);
                      const CategoryIcon = getCategoryIcon(e.category);
                      const StatusIcon = config.icon;
                      const eventKey = e.id || e._id || `${day.toISOString()}-${idx}`;
                      const isHovered = hoveredEventId === eventKey;
                      
                      return (
                        <div 
                          key={eventKey} 
                          // 3. FIXED: Dynamically apply z-index to the specific event wrapper when hovered
                          className={cn("relative", isHovered && "z-50")}
                          onMouseEnter={() => setHoveredEventId(eventKey)}
                          onMouseLeave={() => setHoveredEventId(null)}
                        >
                          {/* Premium Event Card */}
                          <div
                            onClick={() => {
                              if (e._id) {
                                router.push(`/lawyer-dashboard?view=case-details&id=${e._id}`);
                              }
                            }}
                            className={cn(
                              "relative px-2 py-1.5 rounded-md border text-left cursor-pointer transition-all duration-300",
                              "hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5",
                              config.bgColor,
                              config.borderColor,
                              "border-l-4"
                            )}
                          >
                            {/* Left accent bar */}
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-md", config.accentColor)} />
                            
                            {/* Event Header */}
                            <div className="flex items-center gap-1.5 pl-1.5">
                              <span className={cn(
                                "text-[10px] font-semibold leading-tight truncate",
                                config.textColor
                              )}>
                                {e.title || "Matter Update"}
                              </span>
                            </div>
                            
                            {/* Time hint */}
                            {e.dueDate && (
                              <div className="flex items-center gap-1 pl-1.5 mt-0.5">
                                <Clock className={cn("w-2.5 h-2.5", config.subTextColor)} />
                                <span className={cn("text-[9px] font-medium", config.subTextColor)}>
                                  {format(new Date(e.dueDate), "h:mm a")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Premium Hover Overlay Card - Positioned above */}
                          <div 
                            className={cn(
                              "absolute left-0 bottom-full mb-2 z-[100] w-[220px]",
                              "transition-all duration-300 ease-out",
                              isHovered ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-1"
                            )}
                          >
                            <div className={cn(
                              "rounded-xl shadow-2xl border overflow-hidden",
                              "bg-white border-slate-200",
                              "ring-1 ring-black/5"
                            )}>
                              {/* Header with gradient */}
                              <div className={cn(
                                "px-4 py-3 border-b flex items-start gap-3",
                                config.bgColor,
                                config.borderColor
                              )}>
                                <div className="flex-1 min-w-0">
                                  <span className={cn(
                                    "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-1",
                                    config.badgeBg,
                                    config.textColor
                                  )}>
                                    {config.label}
                                  </span>
                                  <h4 className={cn("text-sm font-semibold leading-tight", config.textColor)}>
                                    {e.title || "Matter Update"}
                                  </h4>
                                </div>
                              </div>
                              
                              {/* Body */}
                              <div className="px-4 py-3 space-y-3">
                                {/* Date & Time */}
                                {e.dueDate && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {format(new Date(e.dueDate), "EEEE, MMMM d, yyyy")}
                                      </p>
                                      <p className="text-slate-500">
                                        {format(new Date(e.dueDate), "h:mm a")}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Client */}
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-slate-500" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Client</p>
                                    <p className="font-medium text-slate-900">
                                      {e.client?.fullName || "Confidential"}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Category if available */}
                                {e.category && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                                      <CategoryIcon className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Practice Area</p>
                                      <p className="font-medium text-slate-900 capitalize">
                                        {e.category}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Footer */}
                              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">
                                  Click to view details
                                </span>
                                <div className="w-5 h-5 rounded-full bg-[#af9164]/10 flex items-center justify-center">
                                  <ChevronRight className="w-3 h-3 text-[#af9164]" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Show "+ more" indicator if more than 3 events */}
                    {events.length > 3 && (
                      <div className="text-[9px] font-medium text-slate-400 pl-2 italic">
                        +{events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
