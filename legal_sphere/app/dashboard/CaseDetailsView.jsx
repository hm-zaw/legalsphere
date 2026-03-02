"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Filter,
  FileText,
  Gavel,
  Clock,
  MapPin,
  Activity,
  User,
  Users,
  Tag,
  Calendar as CalendarIcon,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Hourglass
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useEffect } from "react";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";
const PAPER_SHADOW = "0 10px 40px -15px rgba(0,0,0,0.1)";

const CASE_STAGES = [
  { id: "discovery", label: "DISCOVERY" },
  { id: "pleadings", label: "PLEADINGS" },
  { id: "pre_trial", label: "PRE-TRIAL" },
  { id: "trial", label: "TRIAL" },
  { id: "settlement", label: "SETTLEMENT" },
  { id: "appeal", label: "APPEAL" },
];

// --- Helpers for building tasks from real data ---
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function buildDaysForWeek(offset = 0) {
  const { start } = getWeekRange(offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
  });
}

function formatWeekLabel(offset = 0) {
  const { start, end } = getWeekRange(offset);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} - ${fmt(end)}`;
}

function categorizeEvent(event, eventType) {
  const now = new Date();
  const eventDate = new Date(event.scheduled_at || event.agreed_time || "");
  const isPast = eventDate < now;

  // Court hearings & trial dates are always urgent if upcoming
  if (eventType === "hearing" || eventType === "trial_date") {
    return isPast ? "done" : "urgent";
  }
  // Deadlines are urgent if upcoming
  if (eventType === "deadline") {
    return isPast ? "done" : "urgent";
  }
  // Appointments: accepted = done (confirmed), pending = pending
  if (event.status === "accepted" || event.status === "completed") {
    return "done";
  }
  if (event.status === "pending" || event.status === "declined") {
    return "pending";
  }
  return isPast ? "done" : "pending";
}

function getStatusLabel(event, eventType) {
  const now = new Date();
  const eventDate = new Date(event.scheduled_at || event.agreed_time || "");
  const isPast = eventDate < now;

  if (eventType === "hearing" || eventType === "trial_date") {
    return isPast ? "Completed" : "Attendance Mandatory";
  }
  if (eventType === "deadline") {
    return isPast ? "Completed" : "Action Required";
  }
  if (event.status === "accepted") return "Confirmed";
  if (event.status === "completed") return "Completed";
  if (event.status === "pending") return "Pending";
  if (event.status === "declined") return "Declined";
  return isPast ? "Completed" : "Pending";
}

function getStatusColors(category) {
  if (category === "urgent") return { statusColor: "bg-red-50 text-red-900 border-red-200", border: "border-l-[#1a2238]" };
  if (category === "done") return { statusColor: "bg-slate-100 text-slate-700 border-slate-200", border: "border-l-slate-600" };
  return { statusColor: "bg-slate-50 text-slate-600 border-slate-200", border: "border-l-slate-400" };
}

function getEventIcon(eventType) {
  if (eventType === "hearing" || eventType === "trial_date") return <Gavel className="w-3 h-3" />;
  if (eventType === "appointment") return <Users className="w-3 h-3" />;
  return <FileText className="w-3 h-3" />;
}

function getEventTags(eventType) {
  if (eventType === "hearing") return ["Hearing"];
  if (eventType === "trial_date") return ["Trial"];
  if (eventType === "deadline") return ["Deadline"];
  if (eventType === "appointment") return ["Appointment"];
  return ["Event"];
}

function buildTaskFromEvent(event, source, weekStart) {
  const eventType = source === "appointment" ? "appointment" : (event.event_type || "deadline");
  const dateStr = event.scheduled_at || event.agreed_time || "";
  const d = new Date(dateStr);
  const category = categorizeEvent(event, eventType);
  const { statusColor, border } = getStatusColors(category);

  // Calculate grid position for timeline
  const dayOfWeek = d.getDay(); // 0=Sun
  const colStart = dayOfWeek === 0 ? 7 : dayOfWeek; // Mon=1,...,Sun=7
  const hour = d.getHours();
  const rowStart = Math.max(1, Math.min(6, Math.floor((hour - 6) / 3) + 1)); // map 6am-24h to rows 1-6

  const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " at "
    + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return {
    id: event.id || event.appointment_id || event._id || Math.random().toString(36),
    title: source === "appointment"
      ? (event.title || "Client Appointment")
      : (event.title || "Untitled Event"),
    type: eventType === "appointment" ? "Meeting" : eventType === "hearing" ? "Court" : eventType === "trial_date" ? "Court" : "Document",
    location: event.location || event.location_type || "-",
    date: formattedDate,
    tags: getEventTags(eventType),
    status: getStatusLabel(event, eventType),
    statusColor,
    border,
    icon: getEventIcon(eventType),
    day: DAY_NAMES[d.getDay()],
    colStart,
    rowStart,
    category,
  };
}

// --- Helper Components ---

const MetadataField = ({ icon: Icon, label, value, subValue }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 p-1.5 bg-slate-100 rounded text-slate-500">
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
         <p className="font-serif text-sm text-slate-900 font-medium">{value}</p>
         {subValue && <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{subValue}</span>}
      </div>
    </div>
  </div>
);

const TaskCard = ({ task, className }) => {
  const timePart = task.date && task.date.includes('at') ? task.date.split('at')[1].trim() : '';
  return (
    <div className={cn(
        "bg-white border-l-2 border-slate-200 hover:border-[#1a2238] transition-colors pl-4 py-2 pr-2",
        "relative group/card cursor-pointer hover:bg-slate-50",
        className
      )}>
        
      <div className="flex gap-4 items-baseline mb-1">
        {timePart && (
          <span className="font-mono text-[10px] text-[#af9164] font-bold">
            {timePart}
          </span>
        )}
        <h4 className="font-serif text-sm font-medium text-slate-900 group-hover:underline decoration-[#af9164] underline-offset-4 decoration-2">
          {task.title}
        </h4>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2">
        <span className="text-[9px] uppercase tracking-widest text-slate-400">Loc</span>
        <span className="text-[10px] text-slate-600 truncate">{task.location}</span>
        
        <span className="text-[9px] uppercase tracking-widest text-slate-400">Stat</span>
        <span className={cn(
          "text-[10px] font-bold uppercase",
          task.category === 'urgent' ? "text-red-700" : "text-slate-600"
        )}>
          {task.status}
        </span>
      </div>
      
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <ArrowUpRight className="w-3 h-3 text-slate-400" />
      </div>
    </div>
  );
};
// Note: You'd need to import ArrowUpRight from lucide-react for this one.

// --- VIEW IMPLEMENTATIONS ---

const TimelineView = ({ days, tasks }) => (
  <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white h-[600px]">
    <div className="min-w-[1000px] h-full flex flex-col relative">
      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/30 sticky top-0 z-30">
        {days.map((day, idx) => {
          const isToday = idx === 3;
          return (
            <div key={day} className={cn("py-4 text-center text-xs font-bold tracking-wider relative border-r border-slate-100 last:border-0", isToday ? "text-[#1a2238] bg-[#af9164]/5" : "text-slate-400")}>
              {day}
              {isToday && <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#af9164]" />}
            </div>
          );
        })}
      </div>
      
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        {/* Horizontal Lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="absolute w-full border-t border-slate-100" style={{ top: `${(i / 24) * 100}%` }}>
              {i % 4 === 0 && <span className={cn("absolute left-2 text-[9px] text-slate-300 font-mono", i === 0 ? "top-1" : "-top-2.5")}>{i === 0 ? "12 AM" : i === 12 ? "12 PM" : i > 12 ? `${i - 12} PM` : `${i} AM`}</span>}
            </div>
          ))}
        </div>
        {/* Vertical Lines */}
        <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={cn("border-r border-slate-100 h-full relative", i === 3 && "bg-[#af9164]/5")}>
              {i === 3 && (
                <div className="absolute top-0 bottom-0 w-[1px] bg-[#af9164] left-1/2 z-20 opacity-60 dashed border-l border-dashed border-[#af9164]">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#af9164] text-white text-[8px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest shadow-sm">NOW</div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Cards */}
        <div className="grid grid-cols-7 grid-rows-6 gap-3 p-4 relative z-10 h-full">
          {tasks.map((task) => (
            <div key={task.id} style={{ gridColumnStart: task.colStart, gridRowStart: task.rowStart }} className="relative group/wrapper">
              <TaskCard task={task} className="min-w-[200px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const KanbanView = ({ tasks }) => {
  const columns = [
    { id: "pending", title: "Pending Review", icon: Hourglass, color: "text-slate-500" },
    { id: "urgent", title: "Action Required", icon: AlertCircle, color: "text-amber-600" },
    { id: "done", title: "Completed", icon: CheckCircle2, color: "text-green-600" },
  ];

  return (
    <div className="flex-1 overflow-x-auto bg-slate-50/50 p-6 min-h-[600px]">
      <div className="flex h-full gap-6 min-w-[1000px]">
        {columns.map((col) => (
          <div key={col.id} className="flex-1 flex flex-col min-w-[300px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <col.icon className={cn("w-4 h-4", col.color)} />
                <h3 className="font-serif text-sm font-bold text-slate-700 uppercase tracking-wide">{col.title}</h3>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 rounded-full">
                  {tasks.filter(t => t.category === col.id).length}
                </span>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-300 cursor-pointer hover:text-slate-500" />
            </div>
            
            <div className="flex-1 bg-slate-100/50 rounded-lg p-2 border-2 border-dashed border-slate-200">
               <div className="flex flex-col gap-3">
                 {tasks.filter(t => t.category === col.id).map(task => (
                    <TaskCard key={task.id} task={task} />
                 ))}
                 {tasks.filter(t => t.category === col.id).length === 0 && (
                    <div className="h-24 flex items-center justify-center text-slate-400 text-xs italic">
                       No tasks in this stage
                    </div>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ListView = ({ tasks }) => (
  <div className="flex-1 bg-white p-6 min-h-[600px]">
    <div className="border border-slate-200 rounded-sm overflow-hidden">
      {/* List Header */}
      <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <div>Status</div>
        <div>Task / Event</div>
        <div>Schedule</div>
        <div>Location</div>
        <div className="text-right">Action</div>
      </div>

      {/* List Rows */}
      <div className="divide-y divide-slate-100">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group cursor-pointer"
          >
            <div>
              <span className={cn("text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider inline-flex items-center gap-2", task.statusColor)}>
                 {task.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                 {task.status}
              </span>
            </div>
            <div>
              <h4 className="font-serif font-medium text-sm text-slate-900 leading-tight mb-1 group-hover:text-[#af9164] transition-colors">
                {task.title}
              </h4>
              <div className="flex gap-2 text-[10px] text-slate-400">
                {task.tags.map(t => <span key={t}>#{t}</span>)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              {task.date}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {task.location}
            </div>
            <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="text-xs font-bold text-[#af9164] hover:underline uppercase tracking-wide">
                 View
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function CaseDetailsView({ caseId, onNavigate }) {
  const [viewMode, setViewMode] = useState("Timeline");
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courtEvents, setCourtEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const days = useMemo(() => buildDaysForWeek(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekLabel(weekOffset), [weekOffset]);
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  useEffect(() => {
    if (caseId) {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await apiClient.getCaseDetails(caseId);
                if (res.data) {
                    setCaseData(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch case details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }
  }, [caseId]);

  useEffect(() => {
    if (!caseId) return;
    setEventsLoading(true);
    setEventsError(null);
    (async () => {
      try {
        const res = await apiClient.getCaseCourtEvents(caseId);
        if (res.error) {
          setEventsError(res.error);
          setCourtEvents([]);
          return;
        }
        const events = res?.data?.events || res?.data?.events || [];
        setCourtEvents(Array.isArray(events) ? events : []);
      } catch (e) {
        setEventsError(e?.message || String(e));
        setCourtEvents([]);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [caseId]);

  // Fetch appointments for this case
  useEffect(() => {
    if (!caseId) return;
    setAppointmentsLoading(true);
    (async () => {
      try {
        const res = await apiClient.getCaseAppointments(caseId);
        const appts = res?.data?.appointments || [];
        setAppointments(Array.isArray(appts) ? appts : []);
      } catch (e) {
        console.error("Failed to fetch appointments:", e);
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    })();
  }, [caseId]);

  // Build tasks from real court events + appointments, filtered by current week
  const tasks = useMemo(() => {
    const allTasks = [];

    // From court events
    for (const ev of courtEvents) {
      const d = new Date(ev.scheduled_at || "");
      if (d >= weekStart && d <= weekEnd) {
        allTasks.push(buildTaskFromEvent(ev, "court_event", weekStart));
      }
    }

    // From appointments
    for (const apt of appointments) {
      const dateVal = apt.agreed_time || apt.scheduled_at || (apt.proposed_times && apt.proposed_times[0]) || "";
      const d = new Date(dateVal);
      if (d >= weekStart && d <= weekEnd) {
        const normalized = { ...apt, scheduled_at: dateVal, title: apt.title || "Client Appointment" };
        allTasks.push(buildTaskFromEvent(normalized, "appointment", weekStart));
      }
    }

    // Sort by date
    allTasks.sort((a, b) => {
      const dA = new Date(a.date.replace(' at ', ' '));
      const dB = new Date(b.date.replace(' at ', ' '));
      return dA - dB;
    });

    return allTasks;
  }, [courtEvents, appointments, weekStart, weekEnd]);

  // All tasks regardless of week (for Kanban & List)
  const allTasks = useMemo(() => {
    const result = [];
    for (const ev of courtEvents) {
      result.push(buildTaskFromEvent(ev, "court_event", weekStart));
    }
    for (const apt of appointments) {
      const dateVal = apt.agreed_time || apt.scheduled_at || (apt.proposed_times && apt.proposed_times[0]) || "";
      const normalized = { ...apt, scheduled_at: dateVal, title: apt.title || "Client Appointment" };
      result.push(buildTaskFromEvent(normalized, "appointment", weekStart));
    }
    result.sort((a, b) => {
      const dA = new Date(a.date.replace(' at ', ' '));
      const dB = new Date(b.date.replace(' at ', ' '));
      return dA - dB;
    });
    return result;
  }, [courtEvents, appointments, weekStart]);

  const tasksLoading = eventsLoading || appointmentsLoading;

  const currentStage = String(caseData?.caseStage || "discovery");
  const currentStageIndex = Math.max(
    0,
    CASE_STAGES.findIndex((s) => s.id === currentStage),
  );

  return (
    <div
      className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-slate-200 overflow-y-auto"
      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}
    >
      <div className="w-full max-w-[1400px] mx-auto p-6 lg:p-8 space-y-8">

        {/* --- Header Section --- */}
        <header className="flex flex-col gap-6 border-b-2 border-slate-900 pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
              <div className="flex items-center gap-3">
                  <h1 className="font-serif text-3xl md:text-4xl text-slate-900 leading-tight">
                    {loading ? "Loading..." : caseData?.case?.title || "Contract Dispute Resolution"}
                  </h1>
                  <span className="font-mono text-[#af9164] text-sm bg-[#af9164]/10 px-2 py-1 rounded">
                    CASE #{caseId ? caseId.slice(0, 8) : "57"}
                  </span>
              </div>
              <p className="text-sm text-slate-500 max-w-2xl font-light">
                  {caseData?.case?.description || "Legal proceedings regarding breach of contract seeking damages and resolution pursuant to Article 4.2 of the corporate bylaws."}
              </p>
            </div>
            <div className="flex gap-2">
                <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:border-[#af9164] hover:text-[#af9164] transition-colors shadow-sm">
                  <FileText className="w-3.5 h-3.5" /> Documents
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1a2238] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#af9164] transition-colors shadow-md">
                  <Activity className="w-3.5 h-3.5" /> Actions
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              <MetadataField icon={Gavel} label="Current Status" value={caseData?.status || "Active Litigation"} subValue="On Track" />
              <MetadataField icon={User} label="Lead Counsel" value={caseData?.assignedLawyer?.name || "Assigning..."} subValue={caseData?.assignedLawyer?.name ? "Assigned" : "Pending Assignment"} />
              <MetadataField icon={Tag} label="Classification" value={caseData?.case?.category || "Civil Litigation"} subValue="Contract" />
              <MetadataField icon={Users} label="Legal Team" value={caseData?.assignedLawyer?.name ? `${caseData.assignedLawyer.name.split(' ').slice(-1).join(', ')}, M. Chen` : "Team Formation"} subValue={caseData?.assignedLawyer?.name ? "Active" : "In Progress"} />
          </div>
        </header>

        {/* --- Closed Case Banner --- */}
        {(caseData?.status === "completed" || caseData?.caseStage === "closed") && (
          <div className="bg-white/95 backdrop-blur-md border border-emerald-200/60 rounded-2xl shadow-lg px-6 py-5 mx-4 mt-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif text-lg text-slate-800 leading-tight">
                  Matter Successfully Closed
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  {caseData?.closedAt
                    ? `This case was concluded on ${new Date(caseData.closedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`
                    : "This case has been concluded."}
                </p>
                {caseData?.closingRemarks && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Closing Remarks</p>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      "{caseData.closingRemarks}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Main Paper Sheet Container --- */}
        <div className="bg-white relative flex flex-col min-h-[600px] shadow-2xl" style={{ boxShadow: PAPER_SHADOW }}>
          
          {/* Toolbar */}
          <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b border-slate-100 gap-4">
            <div className="flex items-center gap-6 border-b border-slate-200 md:border-none w-full md:w-auto pb-2 md:pb-0">
              {["Kanban", "List", "Timeline"].map((view) => (
                <button
                  key={view}
                  onClick={() => setViewMode(view)}
                  className={cn(
                      "text-xs font-bold uppercase tracking-widest transition-all",
                      view === viewMode ? "text-[#1a2238] border-b-2 border-[#1a2238] pb-1 md:pb-0 md:border-none" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {view}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center border border-slate-200 rounded-sm bg-slate-50/50">
                <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 hover:bg-slate-200 text-slate-500 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <span className="text-xs font-medium text-slate-700 flex items-center gap-2 px-3 border-l border-r border-slate-200 h-8 font-serif">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#af9164]" />
                  {weekLabel}
                </span>
                <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 hover:bg-slate-200 text-slate-500 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-medium text-slate-600 hover:border-[#af9164] hover:text-[#af9164] transition-colors">
                  Today
                </button>
              )}
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-medium text-slate-600 hover:border-[#af9164] hover:text-[#af9164] transition-colors">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {tasksLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-3">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-[#af9164] rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 uppercase tracking-widest">Loading events…</p>
              </div>
            </div>
          ) : viewMode === "Timeline" ? (
            tasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-slate-400 italic">No events scheduled for this week.</p>
              </div>
            ) : (
              <TimelineView days={days} tasks={tasks} />
            )
          ) : viewMode === "Kanban" ? (
            <KanbanView tasks={allTasks} />
          ) : (
            <ListView tasks={allTasks} />
          )}

        </div>
        
        <div className="text-center pb-8">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">LegalSphere Case File #57 • Confidential</p>
        </div>
      </div>
    </div>
  );
}
