"use client";

import { useState } from "react";
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
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";
const PAPER_SHADOW = "0 10px 40px -15px rgba(0,0,0,0.1)";

// --- Data ---
const tasks = [
  {
    id: 1,
    title: "Initial Case Strategy",
    type: "Meeting",
    location: "Office / Zoom",
    date: "May 21, 2024 at 10:00 am",
    tags: ["Civil Litigation"],
    status: "Completed",
    statusColor: "bg-slate-100 text-slate-700 border-slate-200",
    border: "border-l-slate-600",
    icon: <Users className="w-3 h-3" />,
    day: "TUE",
    colStart: 2,
    rowStart: 2,
    category: "done"
  },
  {
    id: 2,
    title: "Evidence Submission Deadline",
    type: "Document",
    location: "Client Portal",
    date: "May 22, 2024 at 5:00 pm",
    tags: ["Discovery"],
    status: "Action Required",
    statusColor: "bg-amber-50 text-amber-800 border-amber-200",
    border: "border-l-[#af9164]",
    icon: <FileText className="w-3 h-3" />,
    day: "WED",
    colStart: 3,
    rowStart: 4,
    category: "urgent"
  },
  {
    id: 3,
    title: "Review Settlement Offer",
    type: "Review",
    location: "Pending Review",
    date: "May 22, 2024 at 9:00 am",
    tags: ["Negotiation"],
    status: "Pending",
    statusColor: "bg-slate-50 text-slate-600 border-slate-200",
    border: "border-l-slate-400",
    icon: <FileText className="w-3 h-3" />,
    day: "WED",
    colStart: 3,
    rowStart: 1,
    category: "pending"
  },
  {
    id: 4,
    title: "Prelim. Court Hearing",
    type: "Court",
    location: "Superior Court, Rm 304",
    date: "May 23, 2024 at 2:00 pm",
    tags: ["Appearance"],
    status: "Attendance Mandatory",
    statusColor: "bg-red-50 text-red-900 border-red-200",
    border: "border-l-[#1a2238]",
    icon: <Gavel className="w-3 h-3" />,
    day: "THU",
    colStart: 4,
    rowStart: 3,
    category: "urgent"
  },
  {
    id: 5,
    title: "Deposition Prep w/ Attorney",
    type: "Meeting",
    location: "Conference Room A",
    date: "May 24, 2024 at 11:15 am",
    tags: ["Discovery"],
    status: "Confirmed",
    statusColor: "bg-blue-50 text-blue-900 border-blue-200",
    border: "border-l-blue-800",
    icon: <Users className="w-3 h-3" />,
    day: "FRI",
    colStart: 5,
    rowStart: 2,
    category: "done"
  },
];

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

const TaskCard = ({ task, className }) => (
  <div className={cn(
      "bg-white border-l-2 border-slate-200 hover:border-[#1a2238] transition-colors pl-4 py-2 pr-2",
      "relative group/card cursor-pointer hover:bg-slate-50",
      className
    )}>
      
    <div className="flex gap-4 items-baseline mb-1">
      <span className="font-mono text-[10px] text-[#af9164] font-bold">
        {task.date.split('at')[1].trim()}
      </span>
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


export default function CaseDetailsPage() {
  const [viewMode, setViewMode] = useState("Timeline");
  
  const days = ["MON 20", "TUE 21", "WED 22", "THU 23", "FRI 24", "SAT 25", "SUN 26"];

  return (
    <AceternitySidebarDemo>
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
                    <h1 className="font-serif text-3xl md:text-4xl text-slate-900 leading-tight">Contract Dispute Resolution</h1>
                    <span className="font-mono text-[#af9164] text-sm bg-[#af9164]/10 px-2 py-1 rounded">CASE #57</span>
                </div>
                <p className="text-sm text-slate-500 max-w-2xl font-light">
                   Legal proceedings regarding breach of contract seeking damages and resolution pursuant to Article 4.2 of the corporate bylaws.
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
                <MetadataField icon={Gavel} label="Current Status" value="Active Litigation" subValue="On Track" />
                <MetadataField icon={User} label="Lead Counsel" value="Sarah Jenkins, Esq." />
                <MetadataField icon={Tag} label="Classification" value="Civil Litigation" subValue="Contract" />
                <MetadataField icon={Users} label="Legal Team" value="S. Jenkins, M. Chen" />
            </div>
          </header>

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
                  <button className="p-1.5 hover:bg-slate-200 text-slate-500 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-2 px-3 border-l border-r border-slate-200 h-8 font-serif">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#af9164]" />
                    May 20 - May 26
                  </span>
                  <button className="p-1.5 hover:bg-slate-200 text-slate-500 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-medium text-slate-600 hover:border-[#af9164] hover:text-[#af9164] transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {viewMode === "Timeline" && <TimelineView days={days} tasks={tasks} />}
            {viewMode === "Kanban" && <KanbanView tasks={tasks} />}
            {viewMode === "List" && <ListView tasks={tasks} />}

          </div>
          
          <div className="text-center pb-8">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest">LegalSphere Case File #57 • Confidential</p>
          </div>
        </div>
      </div>
    </AceternitySidebarDemo>
  );
}