"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Clock, 
  Briefcase,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Scale,
  FileText,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164"; 

// --- Helper Components ---

const StatSummary = ({ label, value, subtext }) => (
  <div className="flex flex-col border-l-2 border-slate-200 pl-6 first:border-0 first:pl-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</span>
    <span className="font-serif text-3xl text-slate-900">{value}</span>
    {subtext && <span className="text-xs text-slate-500 mt-1">{subtext}</span>}
  </div>
);

export default function MyCasesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const cases = [
    {
      id: "CASE-2024-001",
      title: "Meridian Corp vs. State: Contract Review",
      category: "Corporate Litigation",
      status: "Lawyer Assigned",
      priority: "High",
      progress: 60,
      submittedDate: "Jan 15, 2024",
      lastUpdated: "2h ago",
      lawyer: "Sarah Chen, Esq.",
      amount: "$2.5M", 
    },
    {
      id: "CASE-2024-002",
      title: "Employment Dispute: Severance Negotiation",
      category: "Employment Law",
      status: "Under Review",
      priority: "Medium",
      progress: 30,
      submittedDate: "Jan 20, 2024",
      lastUpdated: "1d ago",
      lawyer: "Pending Assignment",
      amount: "N/A",
    },
    {
      id: "CASE-2024-003",
      title: "Trademark Registration: 'Solaris'",
      category: "Intellectual Property",
      status: "Completed",
      priority: "Low",
      progress: 100,
      submittedDate: "Dec 10, 2023",
      lastUpdated: "2w ago",
      lawyer: "Michael Rodriguez, Esq.",
      amount: "$15k",
    },
    {
      id: "CASE-2024-004",
      title: "Estate Planning & Trust Formation",
      category: "Property Law",
      status: "Document Required",
      priority: "Urgent",
      progress: 45,
      submittedDate: "Jan 25, 2024",
      lastUpdated: "3h ago",
      lawyer: "Emily Watson, Esq.",
      amount: "$500k",
    },
    {
      id: "CASE-2024-005",
      title: "Annual Compliance Audit 2024",
      category: "Corporate Governance",
      status: "Lawyer Assigned",
      priority: "Medium",
      progress: 75,
      submittedDate: "Jan 18, 2024",
      lastUpdated: "5h ago",
      lawyer: "David Kim, Esq.",
      amount: "Internal",
    },
  ];

  const handleCaseClick = (caseId) => {
    router.push(`/my-cases/case-details?id=${caseId}`);
  };

  const filteredCases = useMemo(() => {
    return cases.filter(caseItem => {
      const matchesSearch = 
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || 
        (filterStatus === "active" && caseItem.status !== "Completed") ||
        (filterStatus === "completed" && caseItem.status === "Completed") ||
        (filterStatus === "pending" && caseItem.lawyer.includes("Pending"));
      
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterStatus]);

  if (!isClient) return null;

  return (
    <AceternitySidebarDemo>
      <div
        className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-slate-200 overflow-y-auto"
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}
      >
        <div className="w-full max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
          
          {/* --- Header Section --- */}
          <header className="flex flex-col md:flex-row justify-between items-end border-b-2 border-slate-900 pb-6 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
              </div>
              <h1 className="font-serif text-4xl text-slate-900 leading-tight">
                Case Management <br className="hidden sm:block" />
                <span className="italic text-slate-500">Dashboard</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden lg:flex gap-8 mr-8">
                  <StatSummary label="Active Matters" value={cases.filter(c => c.status !== "Completed").length} />
                  <StatSummary label="Pending Action" value={cases.filter(c => c.status === "Document Required").length} />
               </div>

              <button
                onClick={() => router.push('/apply-new')}
                className="group relative overflow-hidden bg-slate-900 px-6 py-3 text-white transition-all hover:bg-[#af9164] shadow-lg active:scale-95"
              >
                <div className="relative z-10 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">New Filing</span>
                </div>
              </button>
            </div>
          </header>

          {/* --- Controls --- */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8 w-full md:w-auto border-b border-slate-200 pb-px overflow-x-auto">
               {["all", "active", "pending", "completed"].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setFilterStatus(tab)}
                   className={cn(
                     "pb-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                     filterStatus === tab 
                      ? "text-slate-900 border-b-2 border-slate-900" 
                      : "text-slate-400 hover:text-slate-600 border-transparent"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#af9164] transition-colors" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Case ID or Title..." 
                className="w-full bg-transparent border-b border-slate-300 pl-8 py-2 text-sm focus:outline-none focus:border-slate-900 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* --- The New "Dossier" Grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCases.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleCaseClick(item.id)}
                className="group relative bg-white flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{ 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
                }}
              >
                {/* 1. The "Tab" visual at the top */}
                <div className={cn(
                    "h-1.5 w-full transition-colors duration-300",
                    item.status === "Completed" ? "bg-green-600" :
                    item.status === "Document Required" ? "bg-red-500" :
                    "bg-[#af9164]"
                )} />

                <div className="p-7 flex flex-col h-full relative overflow-hidden border border-t-0 border-slate-200 hover:border-slate-300 transition-colors">
                  
                  {/* Watermark Background Icon */}
                  <div className="absolute -right-6 -top-6 text-slate-50 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-500 pointer-events-none rotate-12 scale-150">
                    {item.category.includes("Corporate") ? <Briefcase size={120} /> : 
                     item.category.includes("Property") ? <FileText size={120} /> :
                     item.category.includes("Intellectual") ? <Scale size={120} /> :
                     <ShieldAlert size={120} />}
                  </div>

                  {/* Header Row: Status & Menu */}
                  <div className="flex justify-between items-start mb-6 z-10">
                    <div className="flex items-center gap-2">
                        {/* Status Stamp */}
                        <div className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2 py-1 border",
                            item.status === "Completed" ? "text-green-700 border-green-200 bg-green-50" :
                            item.status === "Document Required" ? "text-red-700 border-red-200 bg-red-50" :
                            "text-slate-600 border-slate-200 bg-slate-50"
                        )}>
                            {item.status}
                        </div>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>

                  {/* Case Title */}
                  <div className="mb-8 z-10">
                    <h3 className="font-serif text-2xl text-slate-900 leading-snug group-hover:text-[#af9164] transition-colors mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.id}</span>
                        <span className="text-xs text-slate-500 font-medium">• {item.category}</span>
                    </div>
                  </div>

                  {/* Footer Stats Grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6 border-t border-slate-100 z-10 mt-auto">
                     {/* Lawyer */}
                     <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Legal Counsel</span>
                        <div className="flex items-center gap-2">
                            {item.lawyer.includes("Pending") ? (
                                <span className="text-xs text-slate-400 italic">Unassigned</span>
                            ) : (
                                <>
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                        {item.lawyer.charAt(0)}
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 truncate">{item.lawyer}</span>
                                </>
                            )}
                        </div>
                     </div>

                     {/* Last Update - Now animated to swap with button */}
                     <div className="flex flex-col gap-1 transition-all duration-300 group-hover:translate-x-4 group-hover:opacity-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Activity</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="w-3 h-3 text-[#af9164]" />
                            {item.lastUpdated}
                        </div>
                     </div>
                  </div>

                  {/* Hover Interaction: The "Open File" Action */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#af9164] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  
                  {/* Fixed Button Position and Animation */}
                  <div className="absolute bottom-6 right-7 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#af9164] bg-white pl-2">
                          View Case <ArrowRight className="w-4 h-4" />
                      </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* --- Empty State --- */}
          {filteredCases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <Filter className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="font-serif text-xl text-slate-900 italic mb-2">No Records Found</h3>
              <p className="text-slate-500 text-sm mb-6">There are no cases matching your current criteria.</p>
              <button 
                onClick={() => {setFilterStatus("all"); setSearchTerm("")}}
                className="text-xs font-bold uppercase tracking-widest text-[#af9164] hover:text-[#92784e] underline underline-offset-4"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* --- Footer --- */}
          <div className="text-center pt-12">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              LegalSphere Secure Client Portal • Encrypted E2EE
            </p>
          </div>

        </div>
      </div>
    </AceternitySidebarDemo>
  );
}