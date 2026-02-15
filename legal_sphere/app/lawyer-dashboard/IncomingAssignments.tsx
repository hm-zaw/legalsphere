"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface CaseAssignment {
  _id?: string;
  id?: string;
  description?: string;
  case?: {
    title?: string;
    description?: string;
    category?: string;
    urgency?: string;
    incidentDate?: string;
  };
  client?: {
    fullName?: string;
    email?: string;
    phone?: string;
  };
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: string;
  priority?: string;
  assignedLawyer?: {
    id: string;
    name: string;
    assignedAt: string;
  };
  lawyerDetails?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export function IncomingAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<CaseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Get auth token from localStorage (useAuth uses userToken)
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      
      // Fetch incoming assignments for logged-in lawyer
      const lawyerIdParam = user?.id
        ? `&lawyerId=${encodeURIComponent(user.id)}`
        : "";
      const res = await fetch(
        `http://127.0.0.1:5000/api/lawyer/assignments?status=incoming${lawyerIdParam}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await res.json();
      console.log("API Response:", data);
      console.log("User ID:", user?.id);
      if (res.ok) {
        setAssignments(data.cases || []);
        console.log("Assignments set:", data.cases || []);
      } else {
        console.log("API Error:", data);
      }
    } catch (error) {
      console.error("Failed to fetch assignments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // Poll for new assignments
    const interval = setInterval(fetchAssignments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (
    caseId: string,
    status: "accepted" | "denied",
    lawyerId: string | undefined,
  ) => {
    try {
      const token = localStorage.getItem('userToken') || localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:5000/api/lawyer/case-requests/${caseId}/respond`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          status,
          lawyerId: lawyerId || user?.id, // Use logged-in lawyer's ID as fallback
        }),
      });

      if (res.ok) {
        // Remove from list
        setAssignments((prev) =>
          prev.filter((c) => c.id !== caseId && c._id !== caseId),
        );
      } else {
        alert("Failed to process response");
      }
    } catch (error) {
      console.error("Error responding to assignment", error);
      alert("Error responding to assignment");
    }
  };

  if (loading && assignments.length === 0) return null; // Or skeleton
  if (assignments.length === 0) return null; // Hide if empty

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-[#af9164] animate-pulse" />
        <h3 className="font-serif text-[#1a2238] text-lg">
          Incoming Case Assignments
        </h3>
        <span className="bg-[#af9164] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {assignments.length}
        </span>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id || assignment._id}
            className="bg-white rounded-xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] border border-[#af9164]/30 overflow-hidden"
          >
            <div className="p-5 flex flex-col md:flex-row gap-6 md:items-center justify-between bg-gradient-to-r from-white to-zinc-50/50">
              {/* Case Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-[#af9164] border border-[#af9164]/20 px-1.5 py-0.5 rounded">
                    Review Required
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {assignment.updatedAt
                      ? new Date(assignment.updatedAt).toLocaleString()
                      : "No date"}
                  </span>
                </div>
                <h4 className="font-serif text-xl text-[#1a2238]">
                  {assignment.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <AlertCircle size={12} />
                    {assignment.category || "General"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {assignment.priority || "Normal"} Priority
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    handleRespond(
                      assignment.id || assignment._id || "",
                      "denied",
                      user?.id || "unknown",
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  <XCircle size={16} /> Decline
                </button>
                <button
                  onClick={() =>
                    handleRespond(
                      assignment.id || assignment._id || "",
                      "accepted",
                      user?.id || "unknown",
                    )
                  }
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#1a2238] text-white hover:bg-[#2d3a5e] text-xs font-bold uppercase tracking-wide transition-colors shadow-lg shadow-[#1a2238]/20"
                >
                  <CheckCircle2 size={16} /> Accept Case
                </button>
                <button
                  onClick={() =>
                    setExpandedId(
                      expandedId === (assignment.id || assignment._id)
                        ? null
                        : assignment.id || assignment._id || null,
                    )
                  }
                  className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors"
                >
                  {expandedId === (assignment.id || assignment._id) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedId === (assignment.id || assignment._id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-100 bg-zinc-50/50"
                >
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-widest text-[#1a2238] mb-3 flex items-center gap-2">
                        <FileText size={14} /> Case Description
                      </h5>
                      <p className="text-sm text-slate-600 leading-relaxed font-serif">
                        {assignment.case?.description ||
                          assignment.description ||
                          "No description provided."}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent"></div>
                      <div className="pl-8">
                        <h5 className="font-bold text-xs uppercase tracking-widest text-[#1a2238] mb-3">
                          Client Details
                        </h5>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex justify-between border-b border-zinc-200 pb-2">
                            <span>Name</span>
                            <span className="font-medium text-[#1a2238]">
                              {assignment.client?.fullName || "Confidential"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-200 pb-2">
                            <span>Email</span>
                            <span className="font-medium text-[#1a2238]">
                              {assignment.client?.email || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-200 pb-2">
                            <span>Phone</span>
                            <span className="font-medium text-[#1a2238]">
                              {assignment.client?.phone || "—"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800">
                          <strong>Note:</strong> Full contact details will be
                          added to your contacts upon acceptance.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
