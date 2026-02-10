"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Search, 
  Bell, 
  Calendar, 
  FileText,
  Clock,
  CheckSquare,
  Scale,
  LogOut,
  ChevronRight,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Edit2, Maximize2, Star, TrendingUp, Info, ShoppingBag, Gem,
  Copy, Share2, Phone, Mail, Scan, User, Command
} from "lucide-react";
import { AceternitySidebar, AceternitySidebarBody, AceternitySidebarLink } from "@/components/ui/aceternity-sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SettingsView } from "./SettingsView";
import { TasksView } from "./TasksView";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Notifications } from "@/components/lawyer_dashboard/notifications";

// ... [existing imports]

// --- Design Tokens ---
const THEME = {
  bg: "#F9F6EE", // Warm creamy background
  cards: {
    orange: "#FCE4D6",
    blue: "#D9EAFD",
    purple: "#E8D9FD",
    red: "#FDD9E3",
    green: "#D9FDE8",
  },
  text: "#2D2D2D",
};

export default function LawyerDashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "matters" | "calendar" | "documents" | "settings" | "tasks">("overview");

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("overview"),
    },
    {
      label: "My Matters",
      href: "#",
      icon: <Briefcase className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("matters"),
    },
    {
      label: "Schedule",
      href: "#",
      icon: <Calendar className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("calendar"),
    },
    {
      label: "Documents",
      href: "#",
      icon: <FileText className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("documents"),
    },
    {
      label: "Settings",
      href: "#",
      icon: <Settings className="h-4 w-4 shrink-0 text-zinc-500 group-hover/sidebar:text-[#1a2238]" />,
      onClick: () => setActiveTab("settings"),
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
               {activeTab === "overview" && "Attorney Dashboard"}
               {activeTab === "matters" && "Case Management"}
               {activeTab === "calendar" && "Schedule & Deadlines"}
               {activeTab === "tasks" && "Task Center"}

               {activeTab === "documents" && "Document Repository"}
               {activeTab === "settings" && "Settings & Preferences"}
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
                placeholder="Search matters, clients..." 
                className="h-8 w-64 rounded border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-xs shadow-none transition-all focus:border-[#af9164] focus:bg-white focus:outline-none placeholder:text-zinc-400"
              />
            </div>
            
            <div className="h-8 w-[1px] bg-zinc-200 mx-1"></div>

            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-1.5 rounded text-zinc-500 hover:text-[#1a2238] hover:bg-zinc-100 transition-all outline-none">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#af9164] ring-1 ring-white"></span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 border-zinc-200 shadow-xl rounded-lg bg-white" align="end">
                <Notifications className="border-0 shadow-none rounded-lg" />
              </PopoverContent>
            </Popover>
            
            <div className="h-7 w-7 rounded bg-[#1a2238] text-white flex items-center justify-center text-[10px] font-bold tracking-wider cursor-pointer hover:opacity-90 border border-[#af9164]">
              JD
            </div>
          </div>
        </header>

        {/* Dense Content Area */}
        <main className="flex-1 overflow-y-auto p-5 scroll-smooth">
          <div className="mx-auto max-w-[1600px]">
            {activeTab === "overview" && <OverviewContent />}
            {activeTab === "settings" && <div className="animate-in fade-in duration-300"><SettingsView /></div>}
            {activeTab === "tasks" && <div className="animate-in fade-in duration-300"><TasksView /></div>}
            {activeTab === "matters" && <div className="text-zinc-500 text-sm p-10 text-center">Matters View Coming Soon</div>}
            {activeTab === "calendar" && <div className="text-zinc-500 text-sm p-10 text-center">Calendar View Coming Soon</div>}
            {activeTab === "documents" && <div className="text-zinc-500 text-sm p-10 text-center">Documents View Coming Soon</div>}
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
      <span className="text-[9px] text-zinc-400 font-medium tracking-wider">COUNSEL</span>
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 p-2 pb-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Business Summary & Variance (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Business Summary Grid */}
          <div className="rounded-[32px] bg-white/50 p-6 shadow-sm border border-white">
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="flex items-center gap-2">
                <div className="bg-black p-2 rounded-lg text-white"><Briefcase size={16}/></div>
                <h2 className="font-bold text-lg">Business Summary</h2>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-zinc-100 rounded-full"><Edit2 size={16}/></button>
                <button className="p-2 hover:bg-zinc-100 rounded-full"><Plus size={16}/></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard title="Total Sales" value="$1,284" sub="+30% compared to last month" color="bg-[#FCE4D6]" />
              <GlassCard title="Total Making" value="$42,215" sub="+30% Includes labor + materials" color="bg-[#D9EAFD]" />
              <GlassCard title="Today's Sales" value="$124" sub="+30% since yesterday" color="bg-[#E8D9FD]" />
              <GlassCard title="Order not Initiated" value="$3,842" sub="+30% drop from yesterday" color="bg-[#FBD9C9]" />
              <GlassCard title="Delayed job Orders" value="$845.84" sub="+30% from previous weeks" color="bg-[#F1D9FD]" />
              <GlassCard title="Jobs on Hold" value="$45.82" sub="+30% from previous month" color="bg-[#FDB9C9]" />
            </div>
          </div>

          {/* Jewellery Sales Variance Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <VarianceCard 
                title="Jewellery Sales Variance" 
                label="Gold Jewellery" 
                forecasted="$120,000" 
                actual="$115,000" 
                variance="-$5,000" 
                error="-4.2%"
                color="bg-purple-400"
             />
             <ValuableCustomerCard />
          </div>
        </div>

        {/* Right Column: Mason Walker Detail (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <ClientDetailCard />
        </div>

      </div>
    </motion.div>
  );
}

// --- Components: High-Density UI ---

function CompactMetric({ label, value, trend, trendDir, meta, isAlert, icon }: any) {
  return (
    <div className={cn(
      "rounded-lg border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-zinc-300 transition-colors relative overflow-hidden",
      isAlert ? "border-red-200 bg-red-50/30" : "border-zinc-200"
    )}>
      {isAlert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-full blur-2xl -mr-8 -mt-8 opacity-50"></div>}
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
            {icon} {label}
        </span>
        {!isAlert && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
            trendDir === "up" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-amber-700 bg-amber-50 border-amber-100"
          )}>
            {trend}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 relative z-10">
        <h3 className={cn("text-2xl font-bold tracking-tight", isAlert ? "text-red-700" : "text-[#1a2238]")}>
          {value}
        </h3>
        <span className="text-[10px] text-zinc-400 font-medium">{meta}</span>
      </div>
    </div>
  );
}

function GlassCard({ title, value, sub, color }: any) {
  return (
    <div className={cn("relative p-6 rounded-[24px] overflow-hidden shadow-sm transition-transform hover:scale-[1.02]", color)}>
      <div className="flex justify-between items-start mb-8">
        <span className="text-sm font-medium text-zinc-700">{title}</span>
        <button className="p-1 bg-white/40 rounded-full"><Maximize2 size={12}/></button>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-zinc-900">{value}</h3>
        <p className="text-[10px] font-medium text-zinc-600">{sub}</p>
      </div>
    </div>
  );
}

function ProfileTab({ name, role, growth, color }: any) {
  return (
    <div className="flex items-center gap-3 bg-white/40 border border-white py-1.5 pl-1.5 pr-4 rounded-full shrink-0 shadow-sm">
      <div className="h-8 w-8 rounded-full bg-zinc-300 overflow-hidden border border-white" />
      <div>
        <p className="text-[11px] font-bold leading-none">{name}</p>
        <p className="text-[9px] text-zinc-500">{role}</p>
      </div>
      <span className={cn("ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full", color)}>
        {growth}
      </span>
    </div>
  );
}

function VarianceCard({ title, label, forecasted, actual, variance, error, color }: any) {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-zinc-100/50">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold flex items-center gap-3 text-zinc-900">
                    <div className="bg-black text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-200">
                        <TrendingUp size={16} strokeWidth={2.5}/>
                    </div>
                    Jewellery Sales Variance
                </h3>
                <button className="h-9 w-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 text-zinc-400 transition-colors">
                    <Plus size={18} />
                </button>
            </div>
            
            <div className="space-y-10">
                <VarianceItem
                    icon={<ShoppingBag size={14} className="text-zinc-700"/>}
                    label="Gold Jewellery"
                    error="-4.2%"
                    forecast="$120,000"
                    actual="$115,000"
                    variance="-$5,000"
                    gradient="from-purple-200 via-purple-300 to-purple-100"
                    thumbColor="border-purple-300 ring-purple-100"
                    progress="45%"
                />

                <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent w-full" />

                <VarianceItem
                    icon={<Gem size={14} className="text-zinc-700"/>}
                    label="Diamond Jewellery"
                    error="+3.8%"
                    errorColor="text-emerald-500"
                    errorSign="+"
                    forecast="$180,000"
                    actual="$187,000"
                    variance="+$7,000"
                    varianceColor="text-emerald-600"
                    gradient="from-rose-200 via-rose-300 to-rose-100"
                    thumbColor="border-rose-300 ring-rose-100"
                    progress="65%"
                />
            </div>
        </div>
    );
}

function VarianceItem({ 
    icon, label, error, errorColor = "text-red-500", errorSign = "-",
    forecast, actual, variance, varianceColor = "text-red-600",
    gradient, thumbColor, progress 
}: any) {
    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                        {icon}
                    </div>
                    <span className="font-bold text-zinc-800 text-sm tracking-tight">{label}</span>
                </div>
                <div className="text-right">
                    <span className="block text-[9px] text-zinc-400 font-medium uppercase tracking-wider mb-0.5">Error</span>
                    <span className={cn("text-xs font-bold", errorColor)}>{error}</span>
                </div>
            </div>

            <div className="relative h-3 w-full bg-zinc-50 rounded-full shadow-inner ring-1 ring-zinc-100/50">
                <div 
                    className={cn("absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r shadow-sm", gradient)} 
                    style={{ width: progress }} 
                />
                <div 
                    className={cn("absolute top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full bg-white border-2 shadow-md cursor-pointer transition-transform hover:scale-110", thumbColor)}
                    style={{ left: progress }}
                />
            </div>

            <div className="grid grid-cols-4 gap-4 pt-1">
                <div className="space-y-1">
                    <span className="block text-[9px] text-zinc-400 font-medium tracking-wide">Forecasted</span>
                    <span className="block text-sm font-bold text-zinc-700 tracking-tight">{forecast}</span>
                </div>
                <div className="space-y-1">
                    <span className="block text-[9px] text-zinc-400 font-medium tracking-wide">Actual</span>
                    <span className="block text-sm font-bold text-zinc-800 tracking-tight">{actual}</span>
                </div>
                <div className="space-y-1">
                     <span className="block text-[9px] text-zinc-400 font-medium tracking-wide">Confidence</span>
                     <div className="flex text-zinc-800 gap-0.5 pt-0.5">
                        <Star size={10} fill="currentColor" className="text-zinc-800"/>
                        <Star size={10} fill="currentColor" className="text-zinc-800"/>
                        <Star size={10} fill="currentColor" className="text-zinc-800"/>
                        <Star size={10} fill="currentColor" className="text-zinc-800"/>
                        <Star size={10} className="text-zinc-300"/>
                     </div>
                </div>
                <div className="space-y-1 text-right">
                     <span className="block text-[9px] text-zinc-400 font-medium tracking-wide">Variance</span>
                     <span className={cn("block text-sm font-bold tracking-tight", varianceColor)}>{variance}</span>
                </div>
            </div>
        </div>
    )
}

function ValuableCustomerCard() {
    return (
        <div className="rounded-[32px] bg-white p-8 shadow-sm border border-zinc-100/50 flex flex-col h-full">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold flex items-center gap-3 text-zinc-900">
                    <div className="bg-black text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-200">
                        <Users size={16} strokeWidth={2.5}/>
                    </div>
                    Valuable Customer
                </h3>
                <button className="h-9 w-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 text-zinc-400 transition-colors">
                    <Plus size={18} />
                </button>
            </div>
            
            <div className="space-y-8 flex-1">
                {/* Progress Section */}
                <div>
                    <div className="flex justify-between items-end mb-3">
                         <h4 className="font-bold text-zinc-700 text-sm">Milestones Progress</h4>
                    </div>
                    
                    <div className="relative h-4 w-full bg-zinc-50 rounded-full ring-1 ring-zinc-200/50 p-0.5 mb-2">
                         <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-200 to-purple-400 rounded-full shadow-sm" style={{ width: '55%'}} />
                    </div>

                    <div className="flex justify-between text-[10px] text-zinc-400 font-medium px-1">
                        <span>0%</span>
                        <span>20%</span>
                        <span>55%</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative pl-2 ml-1 space-y-7">
                    {/* Vertical Line */}
                    <div className="absolute top-2 bottom-4 left-[3px] w-px bg-zinc-200" />
                    
                    <TimelineItem
                        title="Restock Emerald Necklace"
                        subtitle="Main Inventory"
                        date="May 24 – 2 days from now"
                        tag="Inventory"
                        tagStyles="bg-blue-100 text-blue-700 font-bold"
                        dotColor="bg-black ring-4 ring-white"
                        isFirst
                    />
                     <TimelineItem
                        title="Finalize Client Order"
                        subtitle="Isabella Reed"
                        date="May 24 – 2 days from now"
                        tag="Custom Order"
                        tagStyles="bg-orange-100 text-orange-700 font-bold"
                        dotColor="bg-black ring-4 ring-white"
                        image="https://i.pravatar.cc/150?u=a042581f4e29026024d"
                    />
                     <TimelineItem
                        title="Schedule Diamond Polishing"
                        date="May 24 – 2 days from now"
                        tag="Maintenance"
                        tagStyles="bg-pink-100 text-pink-700 font-bold"
                        dotColor="bg-black ring-4 ring-white"
                        image="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                    />
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ title, subtitle, date, tag, tagStyles, dotColor, image, isFirst }: any) {
    return (
        <div className="relative pl-6">
            {/* Timeline Dot */}
            <div className={cn("absolute left-[-1px] top-1 h-2.5 w-2.5 rounded-full z-10", dotColor, isFirst ? "bg-zinc-200" : "bg-black")} />
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 p-0.5">
                    <div className="text-xs font-bold text-zinc-800 leading-tight">
                        {title} {subtitle && <span className="font-normal text-zinc-500">– {subtitle}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-zinc-100 border border-white shadow-sm overflow-hidden">
                            {image ? (
                                <img src={image} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-zinc-200 to-zinc-300" />
                            )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium">{date}</span>
                    </div>
                </div>
                
                <div className={cn("text-[9px] px-2.5 py-1 rounded-full whitespace-nowrap self-start flex items-center gap-1.5 shadow-sm min-w-[85px] justify-center", tagStyles)}>
                    <div className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                    {tag}
                </div>
            </div>
        </div>
    )
}

function ClientDetailCard() {
    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-[32px] bg-white p-6 text-center shadow-sm border border-zinc-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6 relative z-10">
                     <div className="flex gap-2">
                        <button className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"><Copy size={14}/></button>
                        <button className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"><Share2 size={14}/></button>
                     </div>
                     <div className="flex gap-2">
                        <button className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"><Edit2 size={14}/></button>
                        <button className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"><Maximize2 size={14}/></button>
                     </div>
                </div>

                <div className="relative w-28 h-28 mx-auto mb-4">
                    <div className="w-full h-full rounded-full overflow-hidden border border-zinc-100 shadow-sm">
                         <img src="https://i.pravatar.cc/300?u=mason" alt="Mason Walker" className="w-full h-full object-cover" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-zinc-900 mb-1 tracking-tight">Mason Walker</h2>
                <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide max-w-[200px] mx-auto">
                    High-End Client Coordinator
                </p>

                <div className="flex justify-center gap-3 mt-6">
                    <ActionButton icon={<Edit2 size={14}/>} />
                    <ActionButton icon={<Mail size={14}/>} />
                    <ActionButton icon={<Phone size={14}/>} />
                    <ActionButton icon={<Plus size={16}/>} />
                    <ActionButton icon={<Scan size={14}/>} />
                    <ActionButton icon={<Calendar size={14}/>} />
                </div>
            </div>

            {/* Detailed Info Card */}
            <div className="rounded-[32px] bg-white p-6 shadow-sm border border-zinc-100 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white shadow-md">
                            <FileText size={14} strokeWidth={2.5}/>
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900">Detailed Information</h3>
                    </div>
                    <div className="flex gap-2">
                         <button className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 text-zinc-400 transition-colors"><Edit2 size={12}/></button>
                         <button className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 text-zinc-400 transition-colors"><Plus size={14}/></button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <DetailItem label="First Name" value="Mason" icon={<User size={14} />} />
                    <DetailItem label="Last Name" value="Walker" icon={<User size={14} />} />
                    <DetailItem label="Email" value="masonwalker@gmail.com" icon={<Mail size={14} />} />
                    <DetailItem label="Phone Number" value="+9446357359" icon={<Phone size={14} />} />
                    
                    {/* Source Item Custom */}
                     <div className="flex items-center gap-3 group p-2 rounded-xl hover:bg-zinc-50 transition-colors cursor-default">
                        <div className="h-8 w-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                            <Command size={14} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide mb-1">Source</p>
                            <div className="flex gap-2">
                                <SocialIcon>X</SocialIcon>
                                <SocialIcon>in</SocialIcon>
                                <SocialIcon>m</SocialIcon>
                                <SocialIcon>d</SocialIcon>
                            </div>
                        </div>
                    </div>

                    <DetailItem label="Last Connected" value="05/15/2025 at 7:16 pm" icon={<Calendar size={14} />} />
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="h-9 w-9 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition-all shadow-sm">
            {icon}
        </button>
    )
}

function SocialIcon({ children }: { children: React.ReactNode }) {
   return (
       <div className="h-5 w-5 rounded-full border border-zinc-200 flex items-center justify-center text-[8px] font-bold text-zinc-500 bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
        {children}
       </div>
   )
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 group p-2 rounded-xl hover:bg-zinc-50 transition-colors cursor-default">
            <div className="h-8 w-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-xs font-bold text-zinc-800 leading-tight">{value}</p>
            </div>
            <button className="h-7 w-7 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-zinc-300 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:text-zinc-600">
                <Edit2 size={10} />
            </button>
        </div>
    );
}
