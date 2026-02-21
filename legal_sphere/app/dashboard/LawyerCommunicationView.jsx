"use client";

import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  Search, 
  Filter,
  Calendar,
  Clock,
  User,
  Phone,
  Video,
  Mail,
  Star,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import LawyerCommunicationInterface from "@/components/lawyer/LawyerCommunicationInterface";

// Design Tokens
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";

const LawyerCard = ({ caseItem, onSelect, isActive }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div
      onClick={() => onSelect(caseItem)}
      className={cn(
        "bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
        isActive ? "border-[#af9164] shadow-md" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1a2238] flex items-center justify-center text-sm font-bold text-[#af9164]">
            {caseItem.assignedLawyer?.name?.charAt(0) || "L"}
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#1a2238]">
              {caseItem.assignedLawyer?.name || "Unknown Counsel"}
            </h3>
            <p className="text-xs text-slate-500">Lead Counsel</p>
          </div>
        </div>
        <div className={cn(
          "text-[8px] font-bold uppercase tracking-[0.2em] px-2.5 py-1.5 border",
          caseItem.status === "active" 
            ? "text-green-700 border-green-200 bg-green-50" 
            : "text-slate-500 border-slate-200 bg-slate-50"
        )}>
          {caseItem.status}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Case Title</p>
          <p className="text-sm text-slate-800 font-medium line-clamp-2">
            {caseItem.case?.title || "Untitled Case"}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Category</p>
            <p className="text-xs text-slate-600">{caseItem.case?.category || "Other"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Assigned</p>
            <p className="text-xs text-slate-600">
              {formatDate(caseItem.assignedLawyer?.assignedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>Last updated: {formatDate(caseItem.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-[#1a2238] transition-colors">
            <Phone className="w-3 h-3" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-[#1a2238] transition-colors">
            <Video className="w-3 h-3" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-[#1a2238] transition-colors">
            <Mail className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function LawyerCommunicationView({ onNavigate }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.getMyCases(1, 50); // Get more cases to filter
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        // Filter only cases with assigned lawyers
        const casesWithLawyers = response.data.cases.filter(
          caseItem => caseItem.assignedLawyer && caseItem.assignedLawyer.name
        );
        setCases(casesWithLawyers);
        
        // Auto-select first case if available
        if (casesWithLawyers.length > 0) {
          setSelectedCase(casesWithLawyers[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = 
      caseItem.case?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.assignedLawyer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || caseItem.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-[#efefec] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 mx-auto">
            <MessageCircle className="w-6 h-6 text-slate-300 animate-pulse" />
          </div>
          <h3 className="font-serif text-xl text-slate-900 italic mb-2">Loading Counsel Communications</h3>
          <p className="text-slate-500 text-sm">Please wait while we fetch your active cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-[#efefec] overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar - Cases List */}
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
            </div>
            <h1 className="font-serif text-2xl text-[#1a2238] leading-tight mb-2">
              Counsel <span className="italic text-slate-500">Communications</span>
            </h1>
            <p className="text-sm text-slate-500">
              Chat with your assigned legal counsel
            </p>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cases or lawyers..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#1a2238]"
              />
            </div>
            
            <div className="flex gap-2">
              {["all", "active", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors",
                    filterStatus === status
                      ? "bg-[#1a2238] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 mx-auto">
                  <MessageCircle className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No assigned cases found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {cases.length === 0 
                    ? "You don't have any cases with assigned lawyers yet."
                    : "No cases match your current criteria."
                  }
                </p>
              </div>
            ) : (
              filteredCases.map((caseItem) => (
                <LawyerCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onSelect={setSelectedCase}
                  isActive={selectedCase?.id === caseItem.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Content - Communication Interface */}
        <div className="flex-1 flex flex-col">
          {selectedCase ? (
            <div className="flex-1 flex flex-col">
              {/* Selected Case Header */}
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#1a2238]">
                      {selectedCase.case?.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        Case ID: {selectedCase.id?.slice(0, 8)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-500">
                        {selectedCase.case?.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Communication Interface */}
              <div className="flex-1 p-6">
                <LawyerCommunicationInterface 
                  caseData={{...selectedCase, lawyer: selectedCase.assignedLawyer?.name}} 
                  currentUser={JSON.parse(localStorage.getItem("userData") || "{}")} 
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 italic mb-2">Select a Case</h3>
                <p className="text-slate-500 text-sm">
                  Choose a case from the left to start communicating with your assigned counsel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
