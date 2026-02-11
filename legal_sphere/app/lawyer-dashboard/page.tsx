"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Settings, 
  Search, 
  Bell, 
  Calendar, 
  FileText,
  LogOut,
  Plus,
  MoreHorizontal,
  Scale,
  Clock,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRight
} from "lucide-react";
import { AceternitySidebar, AceternitySidebarBody, AceternitySidebarLink } from "@/components/ui/aceternity-sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SettingsView } from "./SettingsView";
import { TasksView } from "./TasksView";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Notifications } from "@/components/lawyer_dashboard/notifications";
import { withRoleProtection } from "@/hooks/useAuth";

function LawyerDashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("overview"),
    },
    {
      label: "Active Matters",
      href: "#",
      icon: <Briefcase className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("matters"),
    },
    {
      label: "My Calendar",
      href: "#",
      icon: <Calendar className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("calendar"),
    },
    {
      label: "Documents",
      href: "#",
      icon: <FileText className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("documents"),
    },
    {
      label: "Firm Settings",
      href: "#",
      icon: <Settings className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("settings"),
    },
  ];

  return (
    <div className={cn("flex w-full flex-1 flex-col overflow-hidden md:flex-row h-screen bg-[#efefec]")}>
      
      {/* Sidebar - Legal Luxury Style */}
      <AceternitySidebar open={open} setOpen={setOpen}>
        <AceternitySidebarBody className="justify-between gap-6 bg-[#fcfcfc] border-r border-zinc-200/60 py-4 w-[60px] md:w-[240px] shadow-sm">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-10 flex flex-col gap-2">
              {links.map((link, idx) => (
                <AceternitySidebarLink 
                  key={idx} 
                  link={link} 
                  onClick={link.onClick}
                  className={cn(
                    "hover:bg-zinc-100/80 transition-all duration-200 rounded-lg p-2 h-10 group/sidebar",
                    activeTab === "overview" && link.label === "Dashboard" && "bg-zinc-100 font-semibold text-[#1a2238] border-l-2 border-[#af9164]"
                  )}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-zinc-100 pt-4">
             <AceternitySidebarLink
              link={{
                label: "Sign Out",
                href: "/login",
                icon: <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover/sidebar:text-red-700 transition-colors" />,
              }}
              className="h-10 p-2"
            />
          </div>
        </AceternitySidebarBody>
      </AceternitySidebar>
      
      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden h-full z-10 bg-[#efefec]">
        
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/50 bg-[#efefec]/80 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <h2 className="font-serif text-lg text-[#1a2238] tracking-tight">
                  {activeTab === "overview" && "Managing Partner Dashboard"}
                  {activeTab === "matters" && "Case Management Registry"}
                  {activeTab === "calendar" && "Court Schedule"}
                  {activeTab === "tasks" && "Task Delegation"}
                  {activeTab === "documents" && "Secure Document Vault"}
                  {activeTab === "settings" && "Firm Configuration"}
               </h2>
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#af9164] font-bold">
                  <span>LegalSphere</span>
                  <span className="text-zinc-300">•</span>
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 grouping-hover:text-[#af9164] transition-colors" />
              <input 
                type="search" 
                placeholder="Search matter, client, or citation..." 
                className="h-9 w-72 rounded-lg border border-zinc-200 bg-white/50 pl-9 pr-4 text-xs shadow-sm transition-all focus:border-[#af9164] focus:bg-white focus:outline-none placeholder:text-zinc-400 font-medium"
              />
            </div>
            
            <div className="h-6 w-[1px] bg-zinc-300/50 mx-2"></div>

            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg text-slate-500 hover:text-[#1a2238] hover:bg-white transition-all outline-none">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#af9164] ring-2 ring-[#efefec]"></span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 border-zinc-200 shadow-xl rounded-xl bg-white" align="end">
                <Notifications className="border-0 shadow-none rounded-xl" />
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-200/50">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-bold text-[#1a2238]">J. Doe, Esq.</span>
                    <span className="text-[9px] text-[#af9164] uppercase tracking-widest">Senior Partner</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#1a2238] text-[#af9164] flex items-center justify-center text-xs font-serif border border-[#af9164]/30 shadow-sm cursor-pointer hover:ring-2 hover:ring-[#af9164]/20 transition-all">
                  JD
                </div>
            </div>
          </div>
        </header>

        {/* Dense Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="mx-auto max-w-[1600px] space-y-8">
            {activeTab === "overview" && <OverviewContent />}
            {activeTab === "settings" && <div className="animate-in fade-in duration-500"><SettingsView /></div>}
            {activeTab === "tasks" && <div className="animate-in fade-in duration-500"><TasksView /></div>}
            {activeTab === "matters" && <div className="flex h-[60vh] items-center justify-center text-slate-400 font-serif italic">Matters Registry Module Loading...</div>}
            {activeTab === "calendar" && <div className="flex h-[60vh] items-center justify-center text-slate-400 font-serif italic">Calendar Module Loading...</div>}
            {activeTab === "documents" && <div className="flex h-[60vh] items-center justify-center text-slate-400 font-serif italic">Document Vault Loading...</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Components ---

// --- Logo Components (Fixed Size & Alignment) ---
const Logo = () => (
  // We keep p-1.5 to align the left edge with the sidebar links below.
  // We increased the logo size to h-9 w-9 to match the original design prominence.
  <div className="flex items-center -ml-2">
    <div className="h-14 w-14 shrink-0 flex items-center justify-center">
      <img src="/logo.png" alt="LegalSphere Logo" className="object-contain w-full h-full" />
    </div>
    <span className="font-bold text-lg text-[#1a2238] leading-none tracking-tight">
      LegalSphere
    </span>
  </div>
);

const LogoIcon = () => (
  // In the collapsed state, we ensure the logo is visible and not tiny (h-8 w-8).
  // The wrapper p-1 maintains the vertical rhythm with the links.
  <div className="flex items-center justify-start -ml-2">
    <div className="h-12 w-12 shrink-0 flex items-center justify-center">
       <img src="/logo.png" alt="LegalSphere Logo" className="object-contain w-full h-full" />
    </div>
  </div>
);

import { IncomingAssignments } from "./IncomingAssignments";

function OverviewContent() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Incoming Assignments Section */}
      <IncomingAssignments />

      {/* 1. Firm Intelligence Hero */}
      <FirmIntelligenceHero />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left MAIN Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard 
                title="Billable Hours" 
                value="142.5" 
                unit="hrs" 
                trend="+12% vs last month" 
                icon={<Clock className="text-[#1a2238]" size={18} />} 
            />
             <StatCard 
                title="Active Matters" 
                value="24" 
                unit="cases" 
                trend="3 critical updates" 
                trendColor="text-[#af9164]"
                icon={<Briefcase className="text-[#1a2238]" size={18} />} 
            />
             <StatCard 
                title="Pending Review" 
                value="7" 
                unit="docs" 
                trend="Due by EOD" 
                isAlert
                icon={<FileText className="text-[#1a2238]" size={18} />} 
            />
          </div>

          {/* Priority Matters List */}
          <PriorityMattersList />
        </div>

        {/* Right SIDEBAR Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
            <ClientProfileSnapshot />
            
            {/* Quick Actions / Recent Calls */}
            <div className="bg-white rounded-xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60">
                <h3 className="font-serif text-[#1a2238] text-lg mb-4">Recent Correspondence</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 pb-3 border-b border-zinc-100">
                         <div className="h-8 w-8 rounded-full bg-[#efefec] flex items-center justify-center text-[#1a2238] font-serif text-xs">RJ</div>
                         <div>
                             <p className="text-sm font-bold text-[#1a2238]">Robert Johnson</p>
                             <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Estate Planning • Re: Trust Fund</p>
                             <p className="text-xs text-slate-600 line-clamp-2">"Here are the updated documents for the trust fund allocation..."</p>
                         </div>
                    </div>
                    <div className="flex items-start gap-3 pb-3 border-b border-zinc-100">
                         <div className="h-8 w-8 rounded-full bg-[#1a2238] flex items-center justify-center text-white font-serif text-xs">SA</div>
                         <div>
                             <p className="text-sm font-bold text-[#1a2238]">Sarah Al-Fayed</p>
                             <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Corporate Merger • Re: NDA</p>
                             <p className="text-xs text-slate-600 line-clamp-2">"Can we schedule a call to discuss the new NDA terms?"</p>
                         </div>
                    </div>
                </div>
                <button className="w-full mt-4 py-2 border border-zinc-200 rounded text-xs font-bold text-slate-500 hover:text-[#1a2238] hover:border-[#1a2238] transition-colors uppercase tracking-widest">
                    View All Messages
                </button>
            </div>
        </div>

      </div>
    </motion.div>
  );
}

// --- 1. Firm Intelligence Hero Component ---
function FirmIntelligenceHero() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-[#1a2238] text-white shadow-2xl">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#af9164]/30 via-transparent to-transparent"></div>
            
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                <div className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#af9164]">
                         <span className="h-1.5 w-1.5 rounded-full bg-[#af9164] animate-pulse"></span>
                         Firm Intelligence • Morning Brief
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl leading-tight">
                        Good Morning, <span className="text-[#af9164] italic">Counselor.</span>
                    </h1>
                    <p className="text-slate-300 font-light text-sm md:text-base max-w-lg leading-relaxed">
                        You have <span className="text-white font-medium border-b border-[#af9164]">3 court deadlines</span> approaching and <span className="text-white font-medium border-b border-[#af9164]">2 new client inquiries</span> pending review.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="text-right px-4 border-r border-white/10 hidden sm:block">
                        <span className="block text-2xl font-serif leading-none">98%</span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-400">Success Rate</span>
                     </div>
                     <button className="bg-[#af9164] hover:bg-[#9c7f56] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#af9164]/20 transition-all flex items-center gap-2">
                        <Plus size={14} /> New Matter
                     </button>
                </div>
            </div>
        </div>
    )
}

// --- 2. Minimalist Stat Card ---
function StatCard({ title, value, unit, trend, trendColor = "text-emerald-700", icon, isAlert }: any) {
    return (
        <div className={cn(
            "bg-white p-6 rounded-xl border transition-all h-full flex flex-col justify-between group hover:border-[#1a2238]/20",
            isAlert ? "border-amber-200/50 shadow-[0_4px_20px_-5px_rgba(251,191,36,0.1)]" : "border-zinc-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                     <div className="flex items-baseline gap-1">
                        <h3 className="font-serif text-3xl text-[#1a2238] leading-none">{value}</h3>
                        <span className="text-xs font-medium text-slate-400">{unit}</span>
                     </div>
                </div>
                <div className={cn("p-2 rounded-full", isAlert ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400 group-hover:bg-[#1a2238] group-hover:text-white transition-colors")}>
                    {icon}
                </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-zinc-100">
                {isAlert ? <AlertCircle size={12} className="text-amber-600" /> : <TrendingUp size={12} className={trendColor} />}
                <p className={cn("text-[10px] font-bold uppercase tracking-wide", isAlert ? "text-amber-700" : trendColor)}>
                    {trend}
                </p>
            </div>
        </div>
    )
}

// --- 3. Priority Matters List (Table) ---
function PriorityMattersList() {
    return (
        <div className="bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="font-serif text-[#1a2238] text-xl">Priority Matters</h3>
                <button className="text-[10px] font-bold text-[#af9164] uppercase tracking-widest hover:text-[#8e734c] flex items-center gap-1">
                    View All <ArrowRight size={10} />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#fcfcfc] text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-3">Case Title</th>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Last Activity</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        <MatterRow 
                            title="Estate of H. Kensington" 
                            refId="PRO-2024-001"
                            client="Eleanor Kensington"
                            status="In Review"
                            statusColor="text-emerald-700 bg-emerald-50 border-emerald-100"
                            activity="Doc Verified"
                            time="2h ago"
                        />
                        <MatterRow 
                            title="TechFlow Merger vs. State" 
                            refId="CORP-2024-089"
                            client="TechFlow Inc."
                            status="Hearing Prep"
                            statusColor="text-[#af9164] bg-amber-50/50 border-amber-100"
                            activity="Brief Drafted"
                            time="5h ago"
                        />
                         <MatterRow 
                            title="Vanderbilt Trust Dispute" 
                            refId="LIT-2023-112"
                            client="Cornelius Vanderbilt IV"
                            status="Pending Info"
                            statusColor="text-[#1a2238] bg-slate-100 border-slate-200"
                            activity="Client Email"
                            time="1d ago"
                        />
                         <MatterRow 
                            title="Global Shipping Liability" 
                            refId="MAR-2024-003"
                            client="Oceanic Logistics"
                            status="Discovery"
                            statusColor="text-purple-700 bg-purple-50 border-purple-100"
                            activity="Motion Filed"
                            time="2d ago"
                        />
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function MatterRow({ title, refId, client, status, statusColor, activity, time }: any) {
    return (
        <tr className="hover:bg-zinc-50/50 transition-colors group">
            <td className="px-6 py-4">
                <p className="font-bold text-[#1a2238] text-sm font-serif">{title}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{refId}</p>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-serif">
                        {client.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-700 font-medium">{client}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                 <span className={cn("text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border", statusColor)}>
                    {status}
                 </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="text-xs text-slate-700 font-medium">{activity}</span>
                    <span className="text-[10px] text-slate-400">{time}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <button className="p-1.5 text-slate-400 hover:text-[#af9164] transition-colors">
                    <MoreHorizontal size={14} />
                </button>
            </td>
        </tr>
    )
}

// --- 4. Client Snapshot (Index Card Style) ---
function ClientProfileSnapshot() {
    return (
        <div className="bg-white p-0 rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 relative overflow-hidden group">
            <div className="h-1.5 w-full bg-[#af9164]"></div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                     <div className="h-14 w-14 rounded-full bg-slate-100 p-1 border border-zinc-200">
                        <img src="https://i.pravatar.cc/150?u=mason" alt="Client" className="h-full w-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                     </div>
                     <div className="flex gap-2">
                         <button className="p-2 border border-zinc-100 rounded-full hover:border-[#af9164] hover:text-[#af9164] transition-colors text-slate-400 bg-white shadow-sm"><Phone size={12} /></button>
                         <button className="p-2 border border-zinc-100 rounded-full hover:border-[#af9164] hover:text-[#af9164] transition-colors text-slate-400 bg-white shadow-sm"><Mail size={12} /></button>
                     </div>
                </div>

                <div className="space-y-1 mb-6">
                    <h3 className="font-serif text-xl text-[#1a2238]">Mason Walker</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#af9164]">Active Client • VIP</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                        <MapPin size={14} className="text-slate-400 ml-1" />
                        <div className="flex-1">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Location</p>
                            <p className="text-xs font-semibold text-slate-700">New York, NY</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                        <Briefcase size={14} className="text-slate-400 ml-1" />
                        <div className="flex-1">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wide">Associated Matter</p>
                            <p className="text-xs font-semibold text-slate-700">Walker vs. State (Pending)</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100">
                     <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-medium uppercase tracking-wide">
                        <span>Profile Completion</span>
                        <span>85%</span>
                     </div>
                     <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full w-[85%] bg-[#1a2238]"></div>
                     </div>
                </div>
            </div>
        </div>
    );
}

// Export the protected component
export default withRoleProtection(LawyerDashboardPage, ['lawyer']);
