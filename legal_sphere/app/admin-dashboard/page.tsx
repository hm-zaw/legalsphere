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
  Download,
  TrendingDown,
  FileText,
  AlertTriangle,
  DollarSign,
  Sparkles
} from "lucide-react";
import { AceternitySidebar, AceternitySidebarBody, AceternitySidebarLink } from "@/components/ui/aceternity-sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CasesView from "./CasesView";
import LegalTeamView from "./LegalTeamView";
import AdminManualEntryView from "./AdminManualEntryView";
import { AdminNotifications } from "./AdminNotifications";
import { withRoleProtection } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// --- Design Tokens ---
const THEME = {
  navy: "#1a2238",
  gold: "#af9164",
};

function AdminDashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cases" | "legal-team" | "manual-entry">("overview");
  const [openLawyerModal, setOpenLawyerModal] = useState(false);

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
      label: "Manual Intake",
      href: "#",
      icon: <Plus className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("manual-entry"),
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
    <div className={cn("flex w-full flex-1 flex-col overflow-hidden md:flex-row h-screen bg-white text-zinc-900")}>
      
      {/* Sidebar - Refined Integration */}
      <AceternitySidebar open={open} setOpen={setOpen}>
        <AceternitySidebarBody className="justify-between gap-6 bg-white border-r border-zinc-200/80 py-4 w-[60px] md:w-[240px]">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-6 flex flex-col gap-1 px-2">
              {links.map((link, idx) => (
                <AceternitySidebarLink 
                  key={idx} 
                  link={link} 
                  onClick={link.onClick}
                  className={cn(
                    "hover:bg-zinc-50 transition-all duration-200 rounded-md px-3 h-9",
                    activeTab === "overview" && link.label === "Dashboard" && "bg-zinc-100 font-medium text-[#1a2238] border-l-2 border-l-[#1a2238] -ml-[2px]",
                    activeTab === "cases" && link.label === "Case Intake" && "bg-zinc-100 font-medium text-[#1a2238] border-l-2 border-l-[#1a2238] -ml-[2px]",
                    activeTab === "legal-team" && link.label === "Attorneys" && "bg-zinc-100 font-medium text-[#1a2238] border-l-2 border-l-[#1a2238] -ml-[2px]",
                    activeTab === "manual-entry" && link.label === "Manual Intake" && "bg-zinc-100 font-medium text-[#1a2238] border-l-2 border-l-[#1a2238] -ml-[2px]"
                  )}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-zinc-100 pt-3 px-2">
             <AceternitySidebarLink
              link={{
                label: "Log Out",
                href: "/login",
                icon: <LogOut className="h-4 w-4 shrink-0 text-zinc-400 group-hover/sidebar:text-red-600 transition-colors" />,
              }}
              className="h-9 px-3"
            />
          </div>
        </AceternitySidebarBody>
      </AceternitySidebar>
      
      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden h-full z-10 bg-zinc-50/50">
        
        {/* Slim Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/95 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight uppercase">
               {activeTab === "overview" && "Executive Dashboard"}
               {activeTab === "cases" && "Case Management"}
               {activeTab === "legal-team" && "Directory"}
               {activeTab === "manual-entry" && "Manual Case Intake"}
            </h2>
            <div className="h-4 w-[1px] bg-zinc-300"></div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest tabular-nums">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
              <input 
                type="search" 
                placeholder="SEARCH..." 
                className="h-8 w-64 rounded border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-[10px] uppercase tracking-widest font-medium shadow-none transition-all focus:border-[#af9164] focus:bg-white focus:outline-none placeholder:text-zinc-400"
              />
            </div>
            
            <div className="h-8 w-[1px] bg-zinc-200"></div>

            <AdminNotifications />
            
            <div className="h-7 w-7 rounded bg-[#1a2238] text-white flex items-center justify-center text-[10px] font-bold tracking-wider cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
              AD
            </div>
          </div>
        </header>

        {/* Dense Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto w-full scroll-smooth",
          activeTab === "overview" ? "p-6" : "p-0"
        )}>
          <div className={cn(
            "mx-auto w-full h-full",
            activeTab === "overview" && "max-w-[1400px]"
          )}>
            {activeTab === "overview" && <OverviewContent setActiveTab={setActiveTab} setOpenLawyerModal={setOpenLawyerModal} />}
            {activeTab === "cases" && <div className="animate-in fade-in duration-300 h-full"><CasesView /></div>}
            {activeTab === "legal-team" && <div className="animate-in fade-in duration-300 h-full"><LegalTeamView openModalExternal={openLawyerModal} setOpenModalExternal={setOpenLawyerModal} /></div>}
            {activeTab === "manual-entry" && <div className="animate-in fade-in duration-300 h-full"><AdminManualEntryView /></div>}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Logo Components (Fixed Size & Alignment) ---
const Logo = () => (
  <div className="flex items-center -ml-2 px-1">
    <div className="h-14 w-14 shrink-0 flex items-center justify-center">
      <img src="/logo.png" alt="LegalSphere Logo" className="object-contain w-full h-full" />
    </div>
    <span className="font-bold text-lg text-[#1a2238] leading-none tracking-tight">
      LegalSphere
    </span>
  </div>
);

const LogoIcon = () => (
  <div className="flex items-center justify-start -ml-2 px-1">
    <div className="h-12 w-12 shrink-0 flex items-center justify-center">
       <img src="/logo.png" alt="LegalSphere Logo" className="object-contain w-full h-full" />
    </div>
  </div>
);

// --- Dense Overview Layout ---
function OverviewContent({ setActiveTab, setOpenLawyerModal }: { setActiveTab?: any, setOpenLawyerModal?: any }) {
  const chartData = [
    { m: 'JAN', in: 45, out: 30 }, { m: 'FEB', in: 52, out: 40 },
    { m: 'MAR', in: 38, out: 45 }, { m: 'APR', in: 65, out: 50 },
    { m: 'MAY', in: 48, out: 42 }, { m: 'JUN', in: 70, out: 60 },
    { m: 'JUL', in: 85, out: 75 }, { m: 'AUG', in: 60, out: 55 },
    { m: 'SEP', in: 75, out: 65 }, { m: 'OCT', in: 90, out: 80 },
    { m: 'NOV', in: 65, out: 70 }, { m: 'DEC', in: 95, out: 85 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* 1. High-Density Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Active Matters" 
          value="142" 
          trend="+12%" 
          trendDir="up"
          meta="14 pending intake"
          icon={Briefcase}
        />
        <MetricCard 
          label="Revenue (MTD)" 
          value="$1.24M" 
          trend="+8.4%" 
          trendDir="up"
          meta="92% of target"
          icon={DollarSign}
        />
        <MetricCard 
          label="Billable Hours" 
          value="1,240" 
          trend="-2.1%" 
          trendDir="down"
          meta="Avg 6.4/attorney"
          icon={Clock}
        />
        <MetricCard 
          label="Critical Alerts" 
          value="8" 
          isAlert
          meta="Immediate action req"
          icon={ShieldAlert}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2. Main Chart (Spans 8 columns) */}
        <Card className="lg:col-span-8 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col h-[420px] bg-white">
          <CardHeader className="px-6 py-4 border-b border-zinc-100 flex flex-row items-center justify-between bg-white">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <TrendingUp size={16} className="text-[#af9164]" />
                CASE VELOCITY & RESOLUTION
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1a2238]"></span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">New Intake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#af9164]"></span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Resolved</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center bg-zinc-50 p-0.5 rounded-md border border-zinc-200">
              {['1W', '1M', '3M', '1Y'].map((range) => (
                <button 
                  key={range} 
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded transition-all",
                    range === '1Y' ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-6 flex flex-col justify-between">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E4E4E7" />
                  <XAxis 
                    dataKey="m" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717A', fontWeight: 700, fontFamily: 'system-ui' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#71717A', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }} 
                    width={40}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F4F4F5' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
                            {payload.map((entry: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                                <span 
                                  className="h-2 w-2 rounded-full" 
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wide">
                                  {entry.name}:
                                </span>
                                <span className="text-[12px] font-bold text-zinc-900 tabular-nums">
                                  {entry.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="in" name="New Intake" fill="#1a2238" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar dataKey="out" name="Resolved" fill="#af9164" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>

          {/* Bottom Summary Bar */}
          <div className="px-6 py-3 bg-zinc-50/70 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-[0.15em]">Avg. Processing Time</span>
                <span className="text-sm font-semibold text-zinc-900 tabular-nums">14.2 Days</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-[0.15em]">Efficiency Rate</span>
                <span className="text-sm font-semibold text-emerald-700 tabular-nums">+4.2%</span>
              </div>
            </div>
            <button className="text-[10px] font-bold text-[#1a2238] hover:text-[#af9164] flex items-center gap-1 uppercase tracking-widest transition-colors">
              Generate Full Report <ChevronRight size={14} />
            </button>
          </div>
        </Card>

        {/* 3. Feed & Actions (Spans 4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
           
           {/* Quick Action Strip */}
           <div className="grid grid-cols-2 gap-3">
              <ActionButton onClick={() => setActiveTab?.("manual-entry")} icon={<Plus size={14} />} label="New Case" shortcut="C" />
              <ActionButton 
                onClick={() => {
                  setActiveTab?.("legal-team");
                  setOpenLawyerModal?.(true);
                }} 
                icon={<Users size={14} />} 
                label="Add Lawyer" 
                shortcut="U" 
              />
           </div>

           {/* Enterprise Activity Feed */}
           <Card className="flex-1 border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col bg-white">
             <CardHeader className="px-5 py-3.5 border-b border-zinc-100 flex flex-row justify-between items-center bg-zinc-50/40">
               <CardTitle className="text-xs font-bold text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                 <Activity size={12} className="text-[#af9164]" />
                 Recent Activity
               </CardTitle>
               <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 relative">
                   <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                 </span>
                 Live Log
               </span>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto p-0 max-h-[294px]">
               {[
                 { title: "Smith v. Doe Filing", user: "SYSADMIN", time: "10m ago", type: "doc" },
                 { title: "Conflict Check: Acme Corp", user: "S. CHEN", time: "32m ago", type: "alert" },
                 { title: "Invoice #2049 Paid", user: "BILLING", time: "1h ago", type: "money" },
                 { title: "Discovery Uploaded", user: "J. DOE", time: "2h ago", type: "doc" },
                 { title: "Merger Agreement Draft", user: "AI AGENT", time: "3h ago", type: "ai" },
                 { title: "Client Intake: TechStart", user: "RECEPTION", time: "4h ago", type: "user" },
               ].map((item, i) => (
                 <div key={i} className="flex items-start gap-3.5 px-5 py-3.5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors group">
                   <div className={cn(
                     "h-7 w-7 rounded flex items-center justify-center shrink-0 border mt-0.5 transition-colors",
                     item.type === 'doc' && "bg-blue-50/70 border-blue-200 text-blue-600 group-hover:bg-blue-100",
                     item.type === 'alert' && "bg-amber-50/70 border-amber-200 text-amber-600 group-hover:bg-amber-100",
                     item.type === 'money' && "bg-emerald-50/70 border-emerald-200 text-emerald-600 group-hover:bg-emerald-100",
                     item.type === 'ai' && "bg-[#1a2238]/5 border-[#1a2238]/20 text-[#1a2238] group-hover:bg-[#1a2238]/10",
                     item.type === 'user' && "bg-zinc-100 border-zinc-300 text-zinc-600 group-hover:bg-zinc-200",
                   )}>
                      {item.type === 'doc' && <FileText size={12} strokeWidth={2.5} />}
                      {item.type === 'alert' && <AlertTriangle size={12} strokeWidth={2.5} />}
                      {item.type === 'money' && <ArrowUpRight size={12} strokeWidth={2.5} />}
                      {item.type === 'ai' && <Sparkles size={12} strokeWidth={2.5} />}
                      {item.type === 'user' && <Users size={12} strokeWidth={2.5} />}
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                     <div className="flex justify-between items-baseline gap-2">
                        <p className="text-xs font-semibold text-zinc-900 truncate tracking-tight group-hover:text-[#1a2238] transition-colors">{item.title}</p>
                        <span className="text-[10px] text-zinc-400 whitespace-nowrap font-mono font-medium">{item.time}</span>
                     </div>
                     <p className="text-[9px] text-zinc-500 uppercase tracking-[0.1em] font-semibold">BY: {item.user}</p>
                   </div>
                 </div>
               ))}
             </CardContent>
             <div className="p-2 border-t border-zinc-100 bg-zinc-50/40">
               <button className="w-full py-2 text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-[#1a2238] hover:bg-white border border-transparent hover:border-zinc-200 rounded-md transition-all">
                 View Complete Audit Log
               </button>
             </div>
           </Card>
        </div>
      </div>
    </motion.div>
  );
}

// --- Components: High-Density UI ---

function MetricCard({ label, value, trend, trendDir, meta, isAlert, icon: Icon }: any) {
  return (
    <Card className={cn(
      "border border-zinc-200/80 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md bg-white overflow-hidden",
      isAlert && "border-red-200 bg-red-50/10"
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-5 px-5">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center transition-colors",
            isAlert ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-600"
          )}>
            <Icon size={16} strokeWidth={2} />
          </div>
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</CardTitle>
        </div>
        {!isAlert && trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full tracking-wider",
            trendDir === "up" ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-amber-700 bg-amber-50 border border-amber-200"
          )}>
            {trendDir === "up" ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
            {trend}
          </div>
        )}
        {isAlert && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full tracking-wider text-red-700 bg-red-50 border border-red-200">
            <ShieldAlert size={10} strokeWidth={2.5} />
            ALERT
          </div>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">
        <div className="flex items-baseline gap-2">
          <h3 className={cn("text-2xl font-bold tracking-tight tabular-nums", isAlert ? "text-red-700" : "text-zinc-900")}>
            {value}
          </h3>
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{meta}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon, label, shortcut, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-[#1a2238] hover:text-[#1a2238] hover:shadow-sm transition-all group">
      <div className="flex items-center gap-2.5">
        <div className="text-zinc-500 group-hover:text-[#af9164] transition-colors">{icon}</div>
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      {shortcut && <span className="text-[9px] text-zinc-400 font-mono font-bold border border-zinc-200 rounded px-1.5 py-0.5 group-hover:border-[#af9164]/30 group-hover:bg-[#af9164]/5 group-hover:text-[#af9164]">{shortcut}</span>}
    </button>
  )
}

// Export the protected component
export default withRoleProtection(AdminDashboardPage, ['admin']);