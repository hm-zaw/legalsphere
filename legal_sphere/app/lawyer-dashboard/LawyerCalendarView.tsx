"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
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
  Hourglass,
  Plus,
  X,
  MapPin,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import apiClient, { LawyerCalendarEvent } from "@/lib/api";

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
    email?: string;
  };
  isAppointment?: boolean;
  isCourtEvent?: boolean;
  location?: string;
  notes?: string;
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
  
  // Form State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formCaseId, setFormCaseId] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formEventType, setFormEventType] = useState<"hearing" | "trial_date" | "deadline">("hearing");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  
  // Lawyer matters state
  const [lawyerMatters, setLawyerMatters] = useState<CaseItem[]>([]);
  const [mattersLoading, setMattersLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredMatterId, setHoveredMatterId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      console.log("User authenticated:", user);
      console.log("User ID type:", typeof user.id);
      console.log("User ID value:", user.id);
      fetchCases();
      fetchLawyerMatters();
    } else {
      console.log("No user ID found, user:", user);
    }
  }, [user?.id, currentDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.matter-dropdown')) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const fetchLawyerMatters = async () => {
    setMattersLoading(true);
    try {
      console.log("Fetching lawyer matters...");
      const resp = await apiClient.getLawyerCases('all');
      console.log("API Response:", resp);
      
      if (resp.error) {
        console.error("API Error:", resp.error);
        setLawyerMatters([]);
        return;
      }

      const matters = (resp.data as any)?.cases || [];
      console.log("Raw matters from API:", matters);
      
      const mappedMatters: CaseItem[] = matters.map((matter: any) => ({
        id: matter.id || matter._id,
        _id: matter._id || matter.id,
        title: matter.case?.title || matter.title || 'Untitled Case',
        category: matter.case?.category || matter.category,
        status: matter.status,
        client: matter.client,
      }));
      
      console.log("Mapped matters:", mappedMatters);
      setLawyerMatters(mappedMatters);
    } catch (err) {
      console.error("Failed to fetch lawyer matters:", err);
      setLawyerMatters([]);
    } finally {
      setMattersLoading(false);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();

      const resp = await apiClient.getLawyerCalendar(start, end);
      if (resp.error) {
        setCases([]);
        return;
      }

      const events = (resp.data as any)?.events as LawyerCalendarEvent[] | undefined;
      const mapped: CaseItem[] = (events || []).map((ev) => {
        const isAppointment = ev.source === "appointment";
        const isCourtEvent = ev.source === "court_event";
        return {
          id: ev.id,
          _id: ev.case_id,
          title: ev.title,
          status: isAppointment ? "active" : "active",
          dueDate: ev.scheduled_at,
          createdAt: ev.scheduled_at,
          isAppointment,
          isCourtEvent,
          location: ev.location,
          notes: ev.notes,
        };
      });

      setCases(mapped);
    } catch (err) {
      console.error("Failed to fetch cases for calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitCourtEvent = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await apiClient.createCourtEvent({
        case_id: formCaseId,
        client_id: formClientId,
        title: formTitle,
        event_type: formEventType,
        scheduled_at: formScheduledAt,
        location: formLocation,
        notes: formNotes,
      });
      if (res.error) {
        setCreateError(res.error);
        return;
      }
      setCreateOpen(false);
      setFormTitle("");
      setFormScheduledAt("");
      setFormLocation("");
      setFormNotes("");
      await fetchCases();
    } catch (e: any) {
      setCreateError(e?.message || String(e));
    } finally {
      setCreating(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventsForDay = (date: Date) => {
    return cases.filter((c) => {
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
        
        {/* Redesigned Header Layout */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-300 pb-6 gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl text-slate-900 leading-tight">
                Court Calendar
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-[#af9164] mt-2">
                Appointments & Deadlines
              </p>
            </div>
            
            {/* Month Navigation - Centered organically near context */}
            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-slate-200 shadow-sm mt-2 md:mt-0 md:ml-4">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-50 rounded-md transition-colors text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-serif text-lg text-[#1a2238] min-w-[150px] text-center font-medium">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-50 rounded-md transition-colors text-slate-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a2238] text-white rounded-md text-sm font-medium hover:bg-[#2a3454] transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4 text-[#af9164]" />
            New Court Event
          </button>
        </header>

        {/* Upgraded Modal - Premium Legal Firm Design (Landscape Layout) */}
        {createOpen && typeof document !== "undefined" && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Animated background with gradient mesh */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#af9164]/20 rounded-full blur-[100px] animate-pulse" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1a2238]/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* WIDENED CONTAINER: Changed max-w-2xl to max-w-5xl */}
            <div className="relative w-full max-w-5xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              {/* Main card with glass effect */}
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden border border-white/20 flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[90vh]">
                
                {/* Luxury Header with Gradient (Protected with shrink-0) */}
                <div className="relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a2238] via-[#2a3448] to-[#1a2238]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#af9164]/20 via-transparent to-[#af9164]/10" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#af9164]/10 rounded-full blur-2xl" />
                  
                  <div className="relative px-8 py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#af9164] to-[#8b7347] shadow-lg shadow-[#af9164]/30 flex items-center justify-center">
                            <Gavel className="w-7 h-7 text-white" />
                          </div>
                        </div>
                        <div>
                          <h2 className="font-serif text-2xl text-white font-medium tracking-tight">Schedule Court Event</h2>
                          <p className="text-sm text-slate-400 mt-0.5">Create a new hearing, trial date, or filing deadline</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCreateOpen(false)}
                        className="group p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Body - Landscape 2-Column Grid */}
                <div className="px-8 py-12 overflow-y-auto flex-1">
                  
                  {/* Error State (Full Width at top) */}
                  {createError && (
                    <div className="mb-6 flex items-start gap-3 text-sm text-rose-700 bg-rose-50/80 border border-rose-200 p-4 rounded-xl animate-in slide-in-from-top-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-rose-800">Unable to schedule event</p>
                        <p className="text-rose-600 mt-0.5">{createError}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                    
                    {/* LEFT COLUMN: Core Details */}
                    <div className="space-y-6">
                      {/* Event Title */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <FileText className="w-3.5 h-3.5 text-[#af9164]" />
                          Event Title
                        </label>
                        <div className="relative group">
                          <input
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#af9164] focus:bg-white focus:ring-4 focus:ring-[#af9164]/10 transition-all duration-200"
                            placeholder="e.g., Motion Hearing - Smith v. Jones"
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#af9164]/5 to-transparent opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-200" />
                        </div>
                      </div>

                      {/* Matter ID & Client */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <Briefcase className="w-3.5 h-3.5 text-[#af9164]" />
                            Matter ID
                          </label>
                          <div className="relative matter-dropdown">
                            <button
                              type="button"
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#af9164] focus:bg-white focus:ring-4 focus:ring-[#af9164]/10 transition-all duration-200 flex items-center justify-between"
                              disabled={mattersLoading}
                            >
                              <span className="truncate">
                                {formCaseId 
                                  ? lawyerMatters.find(m => m.id === formCaseId)?.title || formCaseId
                                  : mattersLoading 
                                    ? "Loading matters..." 
                                    : "Select a matter"
                                }
                              </span>
                              <ChevronDown className={cn("w-4 h-4 transition-transform", dropdownOpen && "rotate-180")} />
                            </button>
                            
                            {dropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-50">
                                {mattersLoading ? (
                                  <div className="px-4 py-3 text-sm text-slate-500">Loading matters...</div>
                                ) : lawyerMatters.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-slate-500">No matters found</div>
                                ) : (
                                  lawyerMatters.map((matter) => (
                                    <div
                                      key={matter.id}
                                      className="relative"
                                      onMouseEnter={() => setHoveredMatterId(matter.id || null)}
                                      onMouseLeave={() => setHoveredMatterId(null)}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFormCaseId(matter.id || "");
                                          setFormClientId(matter.client?.email || "");
                                          setDropdownOpen(false);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm text-slate-900 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium">{matter.title}</div>
                                          <div className="text-xs text-slate-500">
                                            {matter.client?.fullName && `Client: ${matter.client.fullName}`}
                                          </div>
                                        </div>
                                        <div className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                                          {matter.id?.slice(0, 8)}...
                                        </div>
                                      </button>
                                      
                                      {/* Tooltip */}
                                      {hoveredMatterId === matter.id && (
                                        <div className="absolute left-full ml-2 top-0 z-[100] w-80 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-sm">
                                          <div className="font-semibold mb-1">{matter.title}</div>
                                          <div className="text-slate-300 text-xs space-y-1">
                                            <div>ID: {matter.id}</div>
                                            {matter.client?.fullName && <div>Client: {matter.client.fullName}</div>}
                                            {matter.category && <div>Category: {matter.category}</div>}
                                            {matter.status && <div>Status: {matter.status}</div>}
                                          </div>
                                          <div className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-slate-900"></div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <User className="w-3.5 h-3.5 text-[#af9164]" />
                            Client
                          </label>
                          <div className="relative">
                            <input
                              value={formClientId}
                              onChange={(e) => setFormClientId(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#af9164] focus:bg-white focus:ring-4 focus:ring-[#af9164]/10 transition-all duration-200"
                              placeholder="client@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Event Type Selector */}
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          <Scale className="w-3.5 h-3.5 text-[#af9164]" />
                          Event Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: "hearing", label: "Hearing", icon: Gavel, color: "blue", desc: "Court proceeding" },
                            { value: "trial_date", label: "Trial Date", icon: Scale, color: "amber", desc: "Full trial" },
                            { value: "deadline", label: "Deadline", icon: Clock, color: "rose", desc: "Filing due" },
                          ].map((type) => {
                            const isSelected = formEventType === type.value;
                            const Icon = type.icon;
                            const colors = {
                              blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", ring: "ring-blue-500/20", icon: "text-blue-500" },
                              amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", ring: "ring-amber-500/20", icon: "text-amber-500" },
                              rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", ring: "ring-rose-500/20", icon: "text-rose-500" },
                            }[type.color];
                            
                            return (
                              <button
                                key={type.value}
                                onClick={() => setFormEventType(type.value as any)}
                                className={cn(
                                  "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                                  isSelected 
                                    ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}` 
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon className={cn("w-4 h-4", isSelected ? colors.icon : "text-slate-400")} />
                                  <span className={cn("text-sm font-semibold", isSelected ? colors.text : "text-slate-700")}>
                                    {type.label}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500">{type.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Logistics & Expanding Notes */}
                    <div className="flex flex-col gap-6">
                      
                      {/* Date & Location Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 shrink-0">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-[#af9164]" />
                            Date & Time
                          </label>
                          <div className="relative">
                            <input
                              type="datetime-local"
                              value={formScheduledAt}
                              onChange={(e) => setFormScheduledAt(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#af9164] focus:bg-white focus:ring-4 focus:ring-[#af9164]/10 transition-all duration-200"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            <MapPin className="w-3.5 h-3.5 text-[#af9164]" />
                            Location
                          </label>
                          <div className="relative">
                            <input
                              value={formLocation}
                              onChange={(e) => setFormLocation(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#af9164] focus:bg-white focus:ring-4 focus:ring-[#af9164]/10 transition-all duration-200"
                              placeholder="District Court Room 4"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expanding Notes Textarea */}
                      <div className="space-y-2 flex flex-col flex-1 min-h-[150px]">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider shrink-0">
                          <FileText className="w-3.5 h-3.5 text-[#af9164]" />
                          Additional Notes
                        </label>
                        <textarea
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          className="w-full px-4 py-3 flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#af9164] focus:bg-white focus:ring-4 focus:ring-[#af9164]/10 transition-all duration-200 resize-none"
                          placeholder="Enter any additional details, requirements, or preparation notes..."
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Premium Footer (Protected with shrink-0) */}
                <div className="px-8 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>All fields are securely encrypted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCreateOpen(false)}
                      className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitCourtEvent}
                      disabled={creating || !formTitle || !formScheduledAt}
                      className="group relative px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 shadow-lg shadow-[#1a2238]/25 hover:shadow-xl hover:shadow-[#1a2238]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#1a2238] via-[#2a3448] to-[#1a2238]" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#af9164]/0 via-[#af9164]/20 to-[#af9164]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="relative flex items-center gap-2">
                        {creating ? (
                          <>
                            <Hourglass className="w-4 h-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Save Event
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-24 h-24 bg-[#af9164]/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-3 -left-3 w-20 h-20 bg-[#1a2238]/10 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>,
          document.body 
        )}

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
                    "hover:z-50", 
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
                          className={cn("relative", isHovered && "z-50")}
                          onMouseEnter={() => setHoveredEventId(eventKey)}
                          onMouseLeave={() => setHoveredEventId(null)}
                        >
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
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-md", config.accentColor)} />
                            
                            <div className="flex items-center gap-1.5 pl-1.5">
                              <span className={cn(
                                "text-[10px] font-semibold leading-tight truncate",
                                config.textColor
                              )}>
                                {e.title || "Matter Update"}
                              </span>
                            </div>
                            
                            {e.dueDate && (
                              <div className="flex items-center gap-1 pl-1.5 mt-0.5">
                                <Clock className={cn("w-2.5 h-2.5", config.subTextColor)} />
                                <span className={cn("text-[9px] font-medium", config.subTextColor)}>
                                  {format(new Date(e.dueDate), "h:mm a")}
                                </span>
                              </div>
                            )}
                          </div>

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
                              
                              <div className="px-4 py-3 space-y-3">
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