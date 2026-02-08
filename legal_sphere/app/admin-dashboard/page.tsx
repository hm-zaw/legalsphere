"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  BarChart3, 
  Scale, 
  ShieldAlert, 
  Activity,
  LogOut,
  TrendingUp,
  Clock,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  ChevronRight,
  Filter,
  Download
} from "lucide-react";
import { AceternitySidebar, AceternitySidebarBody, AceternitySidebarLink } from "@/components/ui/aceternity-sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CasesView from "./CasesView";
import LegalTeamView from "./LegalTeamView";

// --- Design Tokens ---
// We use a "Zinc" palette for a colder, more professional look.
const THEME = {
  navy: "#1a2238",
  gold: "#af9164",
};

export default function AdminDashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cases" | "legal-team">("overview");

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("overview"),
    },
    {
      label: "Case Intake",
      href: "#",
      icon: <Briefcase className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("cases"),
    },
    {
      label: "Attorneys",
      href: "#",
      icon: <Users className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("legal-team"),
    },
    {
      label: "Financials",
      href: "#",
      icon: <BarChart3 className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
    },
    {
      label: "Settings",
      href: "#",
      icon: <Settings className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
    },
  ];

  return (
    <div className={cn("flex w-full flex-1 flex-col overflow-hidden md:flex-row h-screen bg-[#f8f9fa]")}>
      
      {/* Sidebar - Compact Mode */}
      <AceternitySidebar open={open} setOpen={setOpen}>
        <AceternitySidebarBody className="justify-between gap-6 bg-white border-r border-zinc-200 py-4 w-[60px] md:w-[240px]">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-1">
              {links.map((link, idx) => (
                <AceternitySidebarLink 
                  key={idx} 
                  link={link} 
                  onClick={link.onClick}
                  className={cn(
                    "hover:bg-zinc-100 transition-colors duration-200 rounded-md p-1.5 h-9",
                    activeTab === "overview" && link.label === "Dashboard" && "bg-zinc-100 font-medium text-[#1a2238]"
                  )}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-zinc-100 pt-3">
             <AceternitySidebarLink
              link={{
                label: "Log Out",
                href: "/login",
                icon: <LogOut className="h-4 w-4 shrink-0 text-zinc-400 group-hover/sidebar:text-red-600 transition-colors" />,
              }}
              className="h-9 p-1.5"
            />
          </div>
        </AceternitySidebarBody>
      </AceternitySidebar>
      
      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden h-full z-10 bg-[#f8f9fa]">
        
        {/* Slim Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-800 tracking-tight">
               {activeTab === "overview" && "Executive Dashboard"}
               {activeTab === "cases" && "Case Management"}
               {activeTab === "legal-team" && "Directory"}
            </h2>
            <div className="h-4 w-[1px] bg-zinc-300 mx-1"></div>
            <span className="text-xs text-zinc-500 font-medium">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block group">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
              <input 
                type="search" 
                placeholder="Search..." 
                className="h-8 w-64 rounded border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-xs shadow-none transition-all focus:border-[#af9164] focus:bg-white focus:outline-none placeholder:text-zinc-400"
              />
            </div>
            
            <div className="h-8 w-[1px] bg-zinc-200 mx-1"></div>

            <button className="relative p-1.5 rounded text-zinc-500 hover:text-[#1a2238] hover:bg-zinc-100 transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#af9164] ring-1 ring-white"></span>
            </button>
            
            <div className="h-7 w-7 rounded bg-[#1a2238] text-white flex items-center justify-center text-[10px] font-bold tracking-wider cursor-pointer hover:opacity-90">
              AD
            </div>
          </div>
        </header>

        {/* Dense Content Area */}
        <main className="flex-1 overflow-y-auto p-5 scroll-smooth">
          <div className="mx-auto max-w-[1600px]">
            {activeTab === "overview" && <OverviewContent />}
            {activeTab === "cases" && <div className="animate-in fade-in duration-300"><CasesView /></div>}
            {activeTab === "legal-team" && <div className="animate-in fade-in duration-300"><LegalTeamView /></div>}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Compact Logo ---
const Logo = () => (
  <div className="flex items-center space-x-2 py-1 px-1">
    <div className="h-6 w-6 shrink-0 rounded bg-[#1a2238] flex items-center justify-center">
      <Scale size={14} className="text-[#af9164]" />
    </div>
    <div className="flex flex-col">
      <span className="font-semibold text-sm text-[#1a2238] leading-none tracking-tight">LegalSphere</span>
    </div>
  </div>
);

const LogoIcon = () => (
  <div className="py-1 px-1">
    <div className="h-6 w-6 shrink-0 rounded bg-[#1a2238] flex items-center justify-center">
      <Scale size={14} className="text-[#af9164]" />
    </div>
  </div>
);

// --- Dense Overview Layout ---
function OverviewContent() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* 1. High-Density Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CompactMetric 
          label="Active Matters" 
          value="142" 
          trend="+12%" 
          trendDir="up"
          meta="14 pending intake"
        />
        <CompactMetric 
          label="Revenue (MTD)" 
          value="$1.24M" 
          trend="+8.4%" 
          trendDir="up"
          meta="92% of target"
        />
        <CompactMetric 
          label="Billable Hours" 
          value="1,240" 
          trend="-2.1%" 
          trendDir="down"
          meta="Avg 6.4/attorney"
        />
        <CompactMetric 
          label="Critical Alerts" 
          value="8" 
          isAlert
          meta="Immediate action req"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
        {/* 2. Main Chart (Spans 8 columns) */}
        <div className="lg:col-span-8 rounded-lg bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-800">Case Velocity & Resolution</h3>
              <p className="text-[11px] text-zinc-500">Intake vs. Closed volume (Trailing 12 Months)</p>
            </div>
            <div className="flex items-center gap-2">
               <button className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                 <Filter size={12} /> Filter
               </button>
               <button className="flex items-center gap-1.5 px-2 py-1 rounded border border-zinc-200 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                 <Download size={12} /> Export
               </button>
            </div>
          </div>
          
          {/* Chart Placeholder - keeping it clean */}
          <div className="flex-1 w-full bg-zinc-50/50 rounded border border-dashed border-zinc-200 flex items-end justify-between px-4 pb-0 relative">
             <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 font-mono">
               [ Interactive Data Visualization ]
             </div>
             {/* Simple aesthetic bars for visual density */}
             {[40, 65, 50, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
               <div key={i} className="w-[6%] bg-[#1a2238] opacity-90 rounded-t-[2px]" style={{ height: `${h}%` }} />
             ))}
          </div>
        </div>

        {/* 3. Feed & Actions (Spans 4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
           
           {/* Quick Action Strip */}
           <div className="grid grid-cols-2 gap-3">
              <ActionButton icon={<Plus size={14} />} label="New Case" shortcut="C" />
              <ActionButton icon={<Users size={14} />} label="Add Client" shortcut="U" />
           </div>

           {/* Dense Activity Feed */}
           <div className="flex-1 rounded-lg bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-0 overflow-hidden flex flex-col">
             <div className="px-4 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
               <h3 className="text-xs font-semibold text-zinc-700">Recent Activity</h3>
               <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Live Feed</span>
             </div>
             <div className="flex-1 overflow-y-auto p-0">
               {[
                 { title: "Smith v. Doe Filing", user: "SysAdmin", time: "10m ago", type: "doc" },
                 { title: "Conflict Check: Acme Corp", user: "S. Chen", time: "32m ago", type: "alert" },
                 { title: "Invoice #2049 Paid", user: "Billing", time: "1h ago", type: "money" },
                 { title: "Discovery Uploaded", user: "J. Doe", time: "2h ago", type: "doc" },
                 { title: "Merger Agreement Draft", user: "AI Bot", time: "3h ago", type: "ai" },
                 { title: "Client Intake: TechStart", user: "Reception", time: "4h ago", type: "user" },
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 group cursor-default transition-colors">
                   <div className={cn(
                     "h-6 w-6 rounded flex items-center justify-center shrink-0 border",
                     item.type === 'doc' && "bg-blue-50 border-blue-100 text-blue-600",
                     item.type === 'alert' && "bg-amber-50 border-amber-100 text-amber-600",
                     item.type === 'money' && "bg-emerald-50 border-emerald-100 text-emerald-600",
                     item.type === 'ai' && "bg-purple-50 border-purple-100 text-purple-600",
                     item.type === 'user' && "bg-zinc-100 border-zinc-200 text-zinc-500",
                   )}>
                      {item.type === 'doc' && <Briefcase size={12} />}
                      {item.type === 'alert' && <ShieldAlert size={12} />}
                      {item.type === 'money' && <ArrowUpRight size={12} />}
                      {item.type === 'ai' && <Activity size={12} />}
                      {item.type === 'user' && <Users size={12} />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline">
                        <p className="text-xs font-medium text-zinc-800 truncate">{item.title}</p>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap ml-2">{item.time}</span>
                     </div>
                     <p className="text-[10px] text-zinc-500 truncate">by {item.user}</p>
                   </div>
                 </div>
               ))}
             </div>
             <div className="p-2 border-t border-zinc-100 bg-zinc-50/50">
               <button className="w-full py-1.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 rounded transition-all">
                 View All History
               </button>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Components: High-Density UI ---

function CompactMetric({ label, value, trend, trendDir, meta, isAlert }: any) {
  return (
    <div className={cn(
      "rounded-lg border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-zinc-300 transition-colors",
      isAlert ? "border-red-200 bg-red-50/30" : "border-zinc-200"
    )}>
      <div className="flex justify-between items-start mb-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        {isAlert ? (
          <ShieldAlert size={14} className="text-red-500" />
        ) : (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded",
            trendDir === "up" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
          )}>
            {trend}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={cn("text-xl font-semibold tracking-tight", isAlert ? "text-red-700" : "text-zinc-900")}>
          {value}
        </h3>
        <span className="text-[10px] text-zinc-400">{meta}</span>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, shortcut }: any) {
  return (
    <button className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-[#af9164] hover:text-[#af9164] shadow-sm transition-all group">
      <div className="flex items-center gap-2">
        <div className="text-zinc-400 group-hover:text-[#af9164] transition-colors">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
      </div>
      {shortcut && <span className="text-[9px] text-zinc-300 font-mono border border-zinc-100 rounded px-1 group-hover:border-[#af9164]/30 group-hover:text-[#af9164]/70">{shortcut}</span>}
    </button>
  )
}