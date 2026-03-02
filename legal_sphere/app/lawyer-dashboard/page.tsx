"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Scale,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import {
  AceternitySidebar,
  AceternitySidebarBody,
  AceternitySidebarLink,
} from "@/components/ui/aceternity-sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SettingsView } from "./SettingsView";
import { TasksView } from "./TasksView";
import LawyerCasesView from "./LawyerCasesView";
import LawyerCaseDetailView from "./LawyerCaseDetailView";
import ClientCommunicationView from "./ClientCommunicationView";
import LawyerOfflineCaseView from "./LawyerOfflineCaseView";
import LawyerCalendarView from "./LawyerCalendarView";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Notifications } from "@/components/lawyer_dashboard/notifications";
import { withRoleProtection, useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";

function LawyerDashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view");
  const caseId = searchParams.get("id");
  const isCaseDetail = view === "case-details" && caseId;
  const { user } = useAuth();
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "JD";

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isCaseDetail) {
      router.push("/lawyer-dashboard");
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("overview"),
    },
    {
      label: "Active Matters",
      href: "#",
      icon: (
        <Briefcase className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("matters"),
    },
    {
      label: "My Calendar",
      href: "#",
      icon: (
        <Calendar className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("calendar"),
    },
    {
      label: "Documents",
      href: "#",
      icon: (
        <FileText className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("documents"),
    },
    {
      label: "Client Communications",
      href: "#",
      icon: (
        <MessageCircle className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("communications"),
    },
    {
      label: "Offline Intake",
      href: "#",
      icon: (
        <Plus className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("offline"),
    },
    {
      label: "Firm Settings",
      href: "#",
      icon: (
        <Settings className="h-4 w-4 shrink-0 text-slate-500 group-hover/sidebar:text-[#1a2238]" />
      ),
      onClick: () => handleTabChange("settings"),
    },
  ];

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col overflow-hidden md:flex-row h-screen bg-[#efefec]",
      )}
    >
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
                    activeTab === "overview" &&
                      link.label === "Dashboard" &&
                      "bg-zinc-100 font-semibold text-[#1a2238] border-l-2 border-[#af9164]",
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
                icon: (
                  <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover/sidebar:text-red-700 transition-colors" />
                ),
              }}
              className="h-10 p-2"
            />
          </div>
        </AceternitySidebarBody>
      </AceternitySidebar>

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col overflow-hidden h-full z-10 bg-[#efefec]">
        {/* Glassmorphism Header */}
        <header className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/50 bg-[#efefec]/80 px-8 backdrop-blur-md",
          activeTab === "communications" && !isCaseDetail ? "hidden" : ""
        )}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="font-serif text-lg text-[#1a2238] tracking-tight">
                {activeTab === "overview" && "Managing Partner Dashboard"}
                {activeTab === "matters" && "Case Management Registry"}
                {activeTab === "calendar" && "Court Schedule"}
                {activeTab === "tasks" && "Task Delegation"}
                {activeTab === "documents" && "Secure Document Vault"}
                {activeTab === "communications" && "Client Communications"}
                {activeTab === "offline" && "Ghost Client Intake"}
                {activeTab === "settings" && "Firm Configuration"}
              </h2>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#af9164] font-bold">
                <span>LegalSphere</span>
                <span className="text-zinc-300">•</span>
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
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
              <PopoverContent
                className="w-72 p-0 border-zinc-200 shadow-xl rounded-xl bg-white"
                align="end"
              >
                <Notifications className="border-0 shadow-none rounded-xl" />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-3 pl-2 border-l border-zinc-200/50">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-[#1a2238]">
                  {user?.name ?? "J. Doe, Esq."}
                </span>
                <span className="text-[9px] text-[#af9164] uppercase tracking-widest">
                  {(user?.role &&
                    user.role.charAt(0).toUpperCase() + user.role.slice(1)) ??
                    "Senior Partner"}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#1a2238] text-[#af9164] flex items-center justify-center text-xs font-serif border border-[#af9164]/30 shadow-sm cursor-pointer hover:ring-2 hover:ring-[#af9164]/20 transition-all">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Dense Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto scroll-smooth flex flex-col min-h-0", 
          (activeTab === "communications" && !isCaseDetail) ? "p-0" : "p-6"
        )}>
          {/* ADDED: flex-1 flex flex-col min-h-0 so the child stretches properly */}
          <div className={cn(
            "mx-auto flex-1 flex flex-col w-full min-h-0", 
            (activeTab === "communications" && !isCaseDetail) 
              ? "h-full" // CHANGED: Removed h-[calc(100vh-64px)]
              : "max-w-[1600px] space-y-8"
          )}>
            {isCaseDetail ? (
              <LawyerCaseDetailView caseId={caseId} />
            ) : (
              <>
                {activeTab === "overview" && <OverviewContent />}
                {activeTab === "settings" && (
                  <div className="animate-in fade-in duration-500">
                    <SettingsView />
                  </div>
                )}
                {activeTab === "tasks" && (
                  <div className="animate-in fade-in duration-500">
                    <TasksView />
                  </div>
                )}
                {activeTab === "matters" && (
                  <div className="animate-in fade-in duration-500 -mx-6 -mt-6">
                    <LawyerCasesView />
                  </div>
                )}
                {activeTab === "calendar" && (
                  <div className="animate-in fade-in duration-500 -mx-6 -mt-6">
                    <LawyerCalendarView />
                  </div>
                )}
                {activeTab === "documents" && (
                  <div className="flex h-[60vh] items-center justify-center text-slate-400 font-serif italic">
                    Document Vault Loading...
                  </div>
                )}
                {activeTab === "communications" && (
                  <div className="animate-in fade-in duration-500 h-full w-full">
                    <ClientCommunicationView />
                  </div>
                )}
                {activeTab === "offline" && (
                  <div className="animate-in fade-in duration-500 h-full w-full">
                    <LawyerOfflineCaseView />
                  </div>
                )}
              </>
            )}
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
      <img
        src="/logo.png"
        alt="LegalSphere Logo"
        className="object-contain w-full h-full"
      />
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
      <img
        src="/logo.png"
        alt="LegalSphere Logo"
        className="object-contain w-full h-full"
      />
    </div>
  </div>
);

import { IncomingAssignments } from "./IncomingAssignments";

function OverviewContent({ setActiveTab }: { setActiveTab?: any }) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [allCases, setAllCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, casesRes] = await Promise.all([
        apiClient.getLawyerDashboard(),
        apiClient.getLawyerCases("all"),
      ]);
      if (dashRes.data) setDashboardData(dashRes.data);
      if (casesRes.data) setAllCases((casesRes.data as any).cases || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const summary = dashboardData?.summary || {
    incomingCases: 0,
    activeCases: 0,
    completedCases: 0,
    totalCases: 0,
  };
  const recentCases: any[] = dashboardData?.recentCases || [];

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
      <FirmIntelligenceHero
        setActiveTab={setActiveTab}
        userName={user?.name}
        incomingCount={summary.incomingCases}
        activeCount={summary.activeCases}
        totalCases={summary.totalCases}
        completedCount={summary.completedCases}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left MAIN Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              title="Active Matters"
              value={loading ? "—" : String(summary.activeCases)}
              unit="cases"
              trend={`${summary.incomingCases} incoming`}
              trendColor="text-[#af9164]"
              icon={<Briefcase size={18} />} 
            />
            <StatCard
              title="Total Cases"
              value={loading ? "—" : String(summary.totalCases)}
              unit="all time"
              trend={`${summary.completedCases} completed`}
              icon={<Scale size={18} />}
            />
            <StatCard
              title="Pending Review"
              value={loading ? "—" : String(summary.incomingCases)}
              unit="cases"
              trend={summary.incomingCases > 0 ? "Action required" : "All clear"}
              isAlert={summary.incomingCases > 0}
              icon={<FileText size={18} />} 
            />
          </div>

          {/* Priority Matters List */}
          <PriorityMattersList cases={allCases} loading={loading} />
        </div>

        {/* Right SIDEBAR Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
          <ClientProfileSnapshot cases={allCases} loading={loading} />

          {/* Recent Activity */}
          <RecentCasesActivity recentCases={recentCases} loading={loading} />
        </div>
      </div>
    </motion.div>
  );
}

// --- 1. Firm Intelligence Hero Component ---
function FirmIntelligenceHero({
  setActiveTab,
  userName,
  incomingCount,
  activeCount,
  totalCases,
  completedCount,
}: {
  setActiveTab?: any;
  userName?: string;
  incomingCount: number;
  activeCount: number;
  totalCases: number;
  completedCount: number;
}) {
  const firstName = userName?.split(" ")[0] || "Counselor";
  const successRate =
    totalCases > 0 ? Math.round((completedCount / totalCases) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1a2238] text-white shadow-2xl">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#af9164]/30 via-transparent to-transparent"></div>

      <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#af9164]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#af9164] animate-pulse"></span>
            Firm Intelligence • Daily Brief
          </div>
          <h1 className="font-serif text-3xl md:text-4xl leading-tight">
            Welcome back,{" "}
            <span className="text-[#af9164] italic">{userName}</span>
          </h1>
          <p className="text-slate-300 font-light text-sm md:text-base max-w-lg leading-relaxed">
            You have{" "}
            <span className="text-white font-medium border-b border-[#af9164]">
              {activeCount} active {activeCount === 1 ? "case" : "cases"}
            </span>{" "}
            in progress
            {incomingCount > 0 && (
              <>
                {" "}and{" "}
                <span className="text-white font-medium border-b border-[#af9164]">
                  {incomingCount} new{" "}
                  {incomingCount === 1 ? "assignment" : "assignments"}
                </span>{" "}
                pending review
              </>
            )}
            .
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right px-4 border-r border-white/10 hidden sm:block">
            <span className="block text-2xl font-serif leading-none">
              {totalCases > 0 ? `${successRate}%` : "—"}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400">
              Completion Rate
            </span>
          </div>
          <button
            onClick={() => setActiveTab?.("offline")}
            className="bg-[#af9164] hover:bg-[#9c7f56] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#af9164]/20 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> New Matter
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 2. Minimalist Stat Card ---
function StatCard({
  title,
  value,
  unit,
  trend,
  trendColor = "text-emerald-700",
  icon,
  isAlert,
}: any) {
  return (
    <div
      className={cn(
        "bg-white p-6 rounded-xl border transition-all h-full flex flex-col justify-between group hover:border-[#1a2238]/20",
        isAlert
          ? "border-amber-200/50 shadow-[0_4px_20px_-5px_rgba(251,191,36,0.1)]"
          : "border-zinc-200/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]",
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="font-serif text-3xl text-[#1a2238] leading-none">
              {value}
            </h3>
            <span className="text-xs font-medium text-slate-400">{unit}</span>
          </div>
        </div>
        <div
          className={cn(
            "p-2 rounded-full",
            isAlert
              ? "bg-amber-50 text-amber-600"
              : "bg-slate-50 text-[#1a2238] group-hover:bg-[#1a2238] group-hover:text-white transition-colors",
          )}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-zinc-100">
        {isAlert ? (
          <AlertCircle size={12} className="text-amber-600" />
        ) : (
          <TrendingUp size={12} className={trendColor} />
        )}
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            isAlert ? "text-amber-700" : trendColor,
          )}
        >
          {trend}
        </p>
      </div>
    </div>
  );
}

// --- Status helpers ---
function getStatusDisplay(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    active: {
      label: "Active",
      color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    in_progress: {
      label: "In Progress",
      color: "text-[#af9164] bg-amber-50/50 border-amber-100",
    },
    lawyer_assigned: {
      label: "Pending",
      color: "text-[#1a2238] bg-slate-100 border-slate-200",
    },
    completed: {
      label: "Completed",
      color: "text-purple-700 bg-purple-50 border-purple-100",
    },
  };
  return map[status] || { label: status, color: "text-slate-500 bg-slate-50 border-slate-200" };
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  } catch {
    return "—";
  }
}

// --- 3. Priority Matters List (Table) ---
function PriorityMattersList({ cases, loading }: { cases: any[]; loading: boolean }) {
  const router = useRouter();
  // Show active + in_progress cases first, then most recently updated
  const priorityCases = [...cases]
    .sort((a, b) => {
      const statusOrder: Record<string, number> = { active: 0, in_progress: 1, lawyer_assigned: 2, completed: 3 };
      const aOrder = statusOrder[a.status] ?? 99;
      const bOrder = statusOrder[b.status] ?? 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    })
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center">
        <h3 className="font-serif text-[#1a2238] text-xl">Priority Matters</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {cases.length} total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#fcfcfc] text-[9px] uppercase tracking-widest text-slate-400 font-bold border-b border-zinc-100">
            <tr>
              <th className="px-6 py-3">Case Title</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Update</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400 italic">
                  Loading cases...
                </td>
              </tr>
            ) : priorityCases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400 italic">
                  No cases assigned yet.
                </td>
              </tr>
            ) : (
              priorityCases.map((c: any) => {
                const statusInfo = getStatusDisplay(c.status);
                return (
                  <tr
                    key={c.id || c._id}
                    className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/lawyer-dashboard?view=case-details&id=${c.id || c._id}`
                      )
                    }
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1a2238] text-sm font-serif line-clamp-1">
                        {c.title || "Untitled Case"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {(c.id || c._id || "").substring(0, 12)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-serif">
                          {(c.client?.fullName || "C").charAt(0)}
                        </div>
                        <span className="text-xs text-slate-700 font-medium">
                          {c.client?.fullName || "Confidential"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border",
                          statusInfo.color
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(c.updatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-[#af9164] transition-colors">
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 4. Client Snapshot — shows most recent active client ---
function ClientProfileSnapshot({ cases, loading }: { cases: any[]; loading: boolean }) {
  // Pick the most recently updated active case's client
  const activeCase = cases.find(
    (c: any) => c.status === "active" || c.status === "in_progress"
  );
  const client = activeCase?.client;

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 animate-pulse">
        <div className="h-14 w-14 rounded-full bg-slate-100 mb-4" />
        <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-white p-0 rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 overflow-hidden">
        <div className="h-1.5 w-full bg-[#af9164]" />
        <div className="p-6 text-center">
          <p className="text-sm text-slate-400 italic font-serif">No active clients</p>
          <p className="text-[10px] text-slate-400 mt-1">
            Accept a case to see client details here.
          </p>
        </div>
      </div>
    );
  }

  const initials = (client.fullName || "C")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="bg-white p-0 rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 relative overflow-hidden group">
      <div className="h-1.5 w-full bg-[#af9164]"></div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="h-14 w-14 rounded-full bg-[#1a2238] flex items-center justify-center text-[#af9164] text-lg font-serif border border-[#af9164]/30">
            {initials}
          </div>
          <div className="flex gap-2">
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="p-2 border border-zinc-100 rounded-full hover:border-[#af9164] hover:text-[#af9164] transition-colors text-slate-400 bg-white shadow-sm"
              >
                <Phone size={12} />
              </a>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="p-2 border border-zinc-100 rounded-full hover:border-[#af9164] hover:text-[#af9164] transition-colors text-slate-400 bg-white shadow-sm"
              >
                <Mail size={12} />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <h3 className="font-serif text-xl text-[#1a2238]">
            {client.fullName || "Unknown Client"}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#af9164]">
            Active Client
          </p>
        </div>

        <div className="space-y-4">
          {client.email && (
            <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
              <Mail size={14} className="text-slate-400 ml-1" />
              <div className="flex-1">
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {client.email}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
            <Briefcase size={14} className="text-slate-400 ml-1" />
            <div className="flex-1">
              <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                Associated Matter
              </p>
              <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                {activeCase?.title || "—"} ({activeCase?.status || "—"})
              </p>
            </div>
          </div>
          {client.phone && (
            <div className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
              <Phone size={14} className="text-slate-400 ml-1" />
              <div className="flex-1">
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                  Phone
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {client.phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 5. Recent Cases Activity (replaces Recent Correspondence) ---
function RecentCasesActivity({
  recentCases,
  loading,
}: {
  recentCases: any[];
  loading: boolean;
}) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60">
      <h3 className="font-serif text-[#1a2238] text-lg mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-3 pb-3 border-b border-zinc-100">
                <div className="h-8 w-8 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                  <div className="h-2 w-40 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : recentCases.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">
            No recent activity.
          </p>
        ) : (
          recentCases.slice(0, 4).map((rc: any) => {
            const statusInfo = getStatusDisplay(rc.status);
            return (
              <div
                key={rc.id}
                className="flex items-start gap-3 pb-3 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50/50 -mx-2 px-2 rounded transition-colors"
                onClick={() =>
                  router.push(`/lawyer-dashboard?view=case-details&id=${rc.id}`)
                }
              >
                <div className="h-8 w-8 rounded-full bg-[#1a2238] flex items-center justify-center text-[#af9164] font-serif text-xs shrink-0">
                  {(rc.clientName || "C").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a2238] truncate">
                    {rc.title || "Untitled Case"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">
                      {rc.clientName || "Unknown Client"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase",
                        statusInfo.color.split(" ")[0]
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatRelativeTime(rc.updatedAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Export the protected component
export default withRoleProtection(LawyerDashboardPage, ["lawyer"]);
