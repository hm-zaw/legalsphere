"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Clock,
  Briefcase,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Scale,
  FileText,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";

// --- Types ---
interface StatSummaryProps {
  label: string;
  value: number | string;
  subtext?: string;
}

interface Client {
  fullName?: string;
  email?: string;
  phone?: string;
}

interface CaseItem {
  id?: string;
  _id?: string;
  title?: string;
  category?: string;
  status?: string;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  client?: Client;
}

// --- Helper Components ---

const StatSummary = ({ label, value, subtext }: StatSummaryProps) => (
  <div className="flex flex-col border-l-2 border-slate-200 pl-6 first:border-0 first:pl-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</span>
    <span className="font-serif text-3xl text-slate-900">{value}</span>
    {subtext && <span className="text-xs text-slate-500 mt-1">{subtext}</span>}
  </div>
);

export default function LawyerCasesView() {
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user?.id) {
      fetchCases();
    }
  }, [isClient, filterStatus, pagination.page, user?.id]);

  const fetchCases = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      
      // Build status filter
      let statusParam = '';
      if (filterStatus === 'all') {
        statusParam = '&status=all';
      } else if (filterStatus === 'active') {
        statusParam = '&status=active';
      } else if (filterStatus === 'completed') {
        statusParam = '&status=completed';
      } else if (filterStatus === 'incoming') {
        statusParam = '&status=incoming';
      }

      const res = await fetch(
        `http://127.0.0.1:5000/api/lawyer/assignments?limit=${pagination.limit}&page=${pagination.page}${statusParam}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setCases(data.cases || []);
        setPagination((prev: any) => ({
          ...prev,
          total: data.total || data.cases?.length || 0,
        }));
      } else {
        setError(data.error || "Failed to fetch cases");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch cases");
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (caseId: string | undefined) => {
    if (caseId) {
      router.push(`/lawyer-dashboard?view=case-details&id=${caseId}`);
    }
  };

  const handleRespond = async (
    caseId: string | undefined,
    responseStatus: "accepted" | "denied",
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (!caseId) return;

    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:5000/api/lawyer/cases/${caseId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          status: responseStatus,
          lawyerId: user?.id,
        }),
      });

      if (res.ok) {
        // Refresh cases after response
        fetchCases();
      } else {
        alert("Failed to process response");
      }
    } catch (error) {
      console.error("Error responding to case", error);
      alert("Error responding to case");
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter((item: CaseItem) => {
      const matchesSearch =
        (item.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.client?.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [searchTerm, cases]);

  if (!isClient) return null;

  return (
    <div
      className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-[#af9164]/30 overflow-y-auto"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="w-full max-w-7xl mx-auto p-1 lg:p-12 space-y-12">
        {/* --- Header Section --- */}
        <header className="flex flex-col md:flex-row justify-between items-end border-b-2 border-slate-900 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
            </div>
            <h1 className="font-serif text-4xl text-slate-900 leading-tight">
              My Cases <br className="hidden sm:block" />
              <span className="italic text-slate-500">Registry</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex gap-8 mr-8">
              <StatSummary
                label="Active Cases"
                value={cases.filter((c: CaseItem) => c.status === "active" || c.status === "in_progress").length}
              />
              <StatSummary
                label="Incoming"
                value={cases.filter((c: CaseItem) => c.status === "lawyer_assigned").length}
              />
              <StatSummary
                label="Completed"
                value={cases.filter((c: CaseItem) => c.status === "completed").length}
              />
            </div>

            <button
              onClick={fetchCases}
              className="group relative overflow-hidden bg-white px-4 py-3 text-slate-700 transition-all hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md active:scale-95 rounded-sm"
              title="Refresh cases"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* --- Controls --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8 w-full md:w-auto border-b border-slate-200 pb-px overflow-x-auto">
            {["all", "active", "incoming", "completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={cn(
                  "pb-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap relative",
                  filterStatus === tab
                    ? "text-[#1a2238]"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
                {filterStatus === tab && (
                  <motion.div
                    layoutId="lawyer-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a2238]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#af9164] transition-colors" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Case ID, Title, or Client..."
              className="w-full bg-transparent border-b border-slate-300 pl-8 py-2 text-sm focus:outline-none focus:border-[#1a2238] transition-colors placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* --- The "Dossier" Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCases.map((item: CaseItem) => (
            <div
              key={item.id || item._id}
              onClick={() => handleCaseClick(item.id || item._id)}
              className="group relative bg-white flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-2"
              style={{
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* 1. The "Tab" visual - Muted Luxury Tones */}
              <div
                className={cn(
                  "h-1 w-full transition-colors duration-300",
                  item.status === "completed"
                    ? "bg-[#163020]" // Forest
                    : item.status === "active" || item.status === "in_progress"
                    ? "bg-[#1a2238]" // Navy
                    : item.status === "lawyer_assigned"
                    ? "bg-[#92784e]" // Antique Gold
                    : "bg-slate-400"
                )}
              />

              <div className="p-8 flex flex-col h-full relative overflow-hidden border border-t-0 border-slate-100 hover:border-slate-200 transition-colors">
                {/* Watermark Background Icon */}
                <div className="absolute -right-6 -top-6 text-slate-100 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700 pointer-events-none rotate-12 scale-150">
                  {item.category?.includes("Corporate") ? (
                    <Briefcase size={120} />
                  ) : item.category?.includes("Property") ? (
                    <FileText size={120} />
                  ) : item.category?.includes("Intellectual") ? (
                    <Scale size={120} />
                  ) : (
                    <ShieldAlert size={120} />
                  )}
                </div>

                {/* Header Row: Status Stamp - Subtle "Ghost" Style */}
                <div className="flex justify-between items-start mb-8 z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "text-[8px] font-bold uppercase tracking-[0.2em] px-2.5 py-1.5 border transition-colors",
                        item.status === "completed"
                          ? "text-[#163020] border-[#163020]/20 bg-[#163020]/5"
                          : item.status === "active" || item.status === "in_progress"
                          ? "text-[#1a2238] border-[#1a2238]/20 bg-[#1a2238]/5"
                          : item.status === "lawyer_assigned"
                          ? "text-[#92784e] border-[#92784e]/20 bg-[#92784e]/5"
                          : "text-slate-500 border-slate-200 bg-slate-50"
                      )}
                    >
                      {item.status === "lawyer_assigned" ? "Pending Acceptance" : item.status}
                    </div>
                  </div>
                  <MoreHorizontal className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>

                {/* Case Title - Serif Typography */}
                <div className="mb-10 z-10">
                  <h3 className="font-serif text-2xl text-slate-900 leading-tight group-hover:text-[#af9164] transition-colors mb-3 line-clamp-2">
                    {item.title || "Untitled Case"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                      {item.id?.substring(0, 12) || item._id?.substring(0, 12)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                      {item.category || "General"}
                    </span>
                  </div>
                </div>

                {/* Footer Stats Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-8 border-t border-slate-50 z-10 mt-auto">
                  {/* Client */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.15em]">
                      Client
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1a2238] border border-[#1a2238] flex items-center justify-center text-[9px] font-bold text-[#af9164]">
                        {item.client?.fullName?.charAt(0) || "C"}
                      </div>
                      <span className="text-xs font-bold text-[#1a2238]">
                        {item.client?.fullName || "Confidential"}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Date */}
                  <div className="flex flex-col gap-1.5 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.15em]">
                      {item.status === "lawyer_assigned" ? "Assigned" : "Accepted"}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Calendar className="w-3 h-3 text-[#af9164] opacity-70" />
                      {item.assignedAt
                        ? new Date(item.assignedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Action Reveal - Show Accept/Decline for incoming cases */}
                {item.status === "lawyer_assigned" ? (
                  <div className="absolute bottom-8 right-8 left-8 flex items-center gap-2">
                    <button
                      onClick={(e) => handleRespond(item.id || item._id, "denied", e)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-wide transition-colors"
                    >
                      <XCircle size={14} /> Decline
                    </button>
                    <button
                      onClick={(e) => handleRespond(item.id || item._id, "accepted", e)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1a2238] text-white hover:bg-[#2d3a5e] text-[10px] font-bold uppercase tracking-wide transition-colors shadow-lg shadow-[#1a2238]/20"
                    >
                      <CheckCircle2 size={14} /> Accept
                    </button>
                  </div>
                ) : (
                  <div className="absolute bottom-8 right-8 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#af9164]">
                      View Case <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* --- Loading State --- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
            <h3 className="font-serif text-xl text-slate-900 italic mb-2">Loading Cases</h3>
            <p className="text-slate-500 text-sm">Please wait while we fetch your case information...</p>
          </div>
        )}

        {/* --- Error State --- */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-red-200 bg-red-50/50 rounded-lg">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-serif text-xl text-slate-900 italic mb-2">Error Loading Cases</h3>
            <p className="text-slate-500 text-sm mb-6">{error}</p>
            <button
              onClick={fetchCases}
              className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-800 underline underline-offset-4"
            >
              Try Again
            </button>
          </div>
        )}

        {/* --- Empty State --- */}
        {!loading && !error && filteredCases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-lg">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
              <CheckCircle2 className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="font-serif text-xl text-slate-900 italic mb-2">
              {cases.length === 0 ? "No Cases Found" : "No Records Found"}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {cases.length === 0
                ? "You don't have any assigned cases yet. Cases will appear here when the admin assigns them to you."
                : "There are no cases matching your current criteria."}
            </p>
            {cases.length > 0 && (
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setSearchTerm("");
                }}
                className="text-xs font-bold uppercase tracking-widest text-[#af9164] hover:text-[#92784e] underline underline-offset-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* --- Footer --- */}
        <div className="text-center pt-12">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            LegalSphere Lawyer Portal • Secure Access
          </p>
        </div>
      </div>
    </div>
  );
}
