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
import { SchedulingModal } from "@shared/chat/components/scheduling-modal";
import { io } from "socket.io-client";

// Design Tokens
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";

const LawyerCard = ({ caseItem, onSelect, isActive }) => {
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const status = caseItem.status?.toLowerCase() || 'pending';
  const isActiveStatus = status === "active";

  return (
    <div
      onClick={() => onSelect(caseItem)}
      className={cn(
        "group flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 rounded-lg border",
        isActive 
          ? "bg-[#af9164]/[0.08] border-[#af9164]/30 shadow-sm" 
          : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
      )}
    >
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold font-serif transition-colors shadow-sm",
          isActive ? "bg-[#af9164] text-[#1a2238]" : "bg-[#1a2238] text-[#af9164]"
        )}>
          {typeof caseItem.assignedLawyer?.name === 'string' ? caseItem.assignedLawyer.name.charAt(0) : "L"}
        </div>
        {isActiveStatus && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className={cn(
            "font-serif text-[14px] truncate",
            isActive ? "text-[#1a2238] font-bold" : "text-[#1a2238] font-semibold"
          )}>
            {caseItem.assignedLawyer?.name || "Unknown Counsel"}
          </h3>
          <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
            {formatTime(caseItem.updatedAt || caseItem.assignedLawyer?.assignedAt || Date.now())}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-[12px] truncate",
            isActive ? "text-[#1a2238]/70" : "text-slate-500"
          )}>
            {caseItem.case?.title || "Untitled Case"}
          </p>
          {status === "pending" && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 ml-2"></span>
          )}
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
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  const currentUser = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem("userData") || "{}")
    : {};

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return;

    const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    const newSocket = io(SOCKET_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
    
    const matchesFilter = filterStatus === "all" || caseItem.status?.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  // Handle appointment proposal submission
  const handleAppointmentSubmit = async (data) => {
    if (!socket || !selectedCase) {
      throw new Error("Socket not connected or no case selected");
    }

    return new Promise((resolve, reject) => {
      socket.emit(
        "appointment_proposal",
        {
          ...data,
          chat_id: selectedCase.id,
        },
        (response) => {
          if (response.success) {
            console.log("✅ Appointment request sent successfully!");
            alert("Appointment request sent successfully!");
            resolve();
          } else {
            reject(new Error(response.error || "Failed to send appointment proposal"));
          }
        }
      );
    });
  };

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
    <div className="flex-1 w-full h-full bg-[#efefec] overflow-hidden">
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
        <div className="flex-1 flex flex-col min-w-0">
          {selectedCase ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Selected Case Header */}
              <div className="bg-white border-b border-slate-200 p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#1a2238]">
                      {selectedCase.assignedLawyer?.name || selectedCase.lawyer}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        Case: {selectedCase.case?.title}
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
                    {selectedCase?.status?.toLowerCase() !== "completed" && (
                    <button
                      onClick={() => setIsSchedulingModalOpen(true)}
                      className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors"
                      title="Request Appointment"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Communication Interface */}
              <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
                <LawyerCommunicationInterface 
                  caseData={{...selectedCase, lawyer: selectedCase.assignedLawyer?.name}} 
                  currentUser={currentUser} 
                />
              </div>

              {/* Scheduling Modal */}
              <SchedulingModal
                isOpen={isSchedulingModalOpen}
                onClose={() => setIsSchedulingModalOpen(false)}
                caseId={selectedCase.id || ""}
                clientId={currentUser.id || currentUser._id || ""}
                lawyerId={selectedCase.assignedLawyer?.id || selectedCase.lawyer_id || ""}
                userRole="client"
                onSubmit={handleAppointmentSubmit}
              />
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
