"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Check,
  X,
  RefreshCw,
  Hourglass,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AppointmentChatCardProps,
  AppointmentResponse,
  AppointmentResponsePayload,
} from "../types/appointments";

const statusConfig = {
  pending: {
    icon: Hourglass,
    accent: "bg-[#af9164]",
    bg: "bg-[#af9164]/5",
    border: "border-[#af9164]/20",
    text: "text-[#af9164]",
    label: "Pending",
  },
  accepted: {
    icon: CheckCircle2,
    accent: "bg-[#1a2238]",
    bg: "bg-[#1a2238]/5",
    border: "border-[#1a2238]/20",
    text: "text-[#1a2238]",
    label: "Confirmed",
  },
  declined: {
    icon: XCircle,
    accent: "bg-red-800",
    bg: "bg-red-50",
    border: "border-red-100",
    text: "text-red-800",
    label: "Declined",
  },
  completed: {
    icon: CheckCircle2,
    accent: "bg-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
    label: "Completed",
  },
};

export function AppointmentChatCard({
  appointment,
  currentUserId,
  userRole,
  onRespond,
  onProposeNew,
}: AppointmentChatCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [newProposedTime, setNewProposedTime] = useState("");

  const status = appointment.status || "pending";
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  const isClient = userRole === "client";
  const isLawyer = userRole === "lawyer";

  const handleResponse = async (response: AppointmentResponse) => {
    if (response === "propose_new") {
      setShowProposeModal(true);
      return;
    }

    setIsLoading(response);

    const payload: AppointmentResponsePayload = {
      appointment_id: appointment.appointment_id,
      case_id: appointment.case_id,
      response,
    };

    if (response === "accept" && appointment.proposed_times && appointment.proposed_times.length > 0) {
      payload.agreed_time = appointment.proposed_times[0];
    }

    try {
      await onRespond(payload);
    } finally {
      setIsLoading(null);
    }
  };

  const handleProposeNewTime = async () => {
    if (!newProposedTime) return;

    setIsLoading("propose_new");

    try {
      await onProposeNew([newProposedTime]);
      setShowProposeModal(false);
      setNewProposedTime("");
    } finally {
      setIsLoading(null);
    }
  };

  const getActionButtons = () => {
    if (status === "pending" && isLawyer) {
      return (
        <div className="flex flex-col gap-2 w-full pt-4 mt-4 border-t border-slate-100">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleResponse("accept")}
              disabled={isLoading !== null}
              className="flex-1 bg-[#1a2238] hover:bg-[#2d3648] text-white rounded-sm shadow-none font-bold text-[10px] tracking-widest uppercase h-10 transition-colors"
            >
              {isLoading === "accept" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-2" />
                  Accept
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResponse("decline")}
              disabled={isLoading !== null}
              className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm shadow-none font-bold text-[10px] tracking-widest uppercase h-10 transition-colors"
            >
              {isLoading === "decline" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-3.5 h-3.5 mr-2" />
                  Decline
                </>
              )}
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleResponse("propose_new")}
            disabled={isLoading !== null}
            className="w-full text-[#af9164] hover:text-[#937851] hover:bg-transparent text-[10px] tracking-widest uppercase rounded-sm h-8 font-bold transition-colors mt-1"
          >
            {isLoading === "propose_new" && !showProposeModal ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
            )}
            Propose Alternatives
          </Button>
        </div>
      );
    }

    if (status === "pending" && isClient) {
      return (
        <div className="flex items-center justify-center gap-2 pt-5 mt-4 border-t border-slate-100 text-[#af9164]">
          <Hourglass className="w-4 h-4 animate-pulse opacity-70" />
          <span className="text-[11px] font-serif italic tracking-wide text-[#1a2238]/70">Awaiting Lawyer Response</span>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto my-3"
    >
      <div 
        className={cn(
          "bg-white border relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 rounded-sm",
          config.border
        )}
      >
        {/* Accent top bar */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", config.accent)} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h4 className="font-serif text-[1.1rem] font-medium text-[#1a2238] tracking-tight leading-tight flex items-center gap-2">
                Appointment Request
              </h4>
              <div className="flex items-center gap-2 mt-2">
               {appointment.location_type === "virtual" ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-sm border border-slate-100">
                    <Video className="w-3.5 h-3.5 text-[#af9164]" />
                    <span>Virtual Meeting</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-sm border border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-[#af9164]" />
                    <span>In-Person</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] font-bold border rounded-sm",
              config.bg,
              config.border,
              config.text
            )}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </div>
          </div>

          {/* Time and Date Content */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 block">
                {status === "accepted" ? "Scheduled For" : "Proposed Times"}
              </span>
              
              <div className="space-y-2.5">
                {status === "accepted" && appointment.agreed_time ? (
                  <div className="flex items-center bg-white border border-slate-200 shadow-sm p-3.5 rounded-sm relative overflow-hidden group hover:border-[#af9164]/30 transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a2238] rounded-l-sm" />
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-50 border border-slate-100 rounded-sm flex flex-col items-center justify-center mr-4 ml-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                        {format(new Date(appointment.agreed_time), "MMM")}
                      </span>
                      <span className="text-[1.1rem] font-serif text-[#1a2238] leading-none">
                        {format(new Date(appointment.agreed_time), "d")}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-[#1a2238] font-bold">
                        {format(new Date(appointment.agreed_time), "EEEE")}
                      </div>
                      <div className="text-[13px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#af9164]" />
                        {format(new Date(appointment.agreed_time), "h:mm a")}
                      </div>
                    </div>
                  </div>
                ) : (
                  appointment.proposed_times && appointment.proposed_times.map((time, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center p-3.5 rounded-sm transition-colors relative",
                        index === 0 
                          ? "bg-[#af9164]/[0.03] border border-[#af9164]/20" 
                          : "bg-white border border-slate-100 shadow-sm"
                      )}
                    >
                      {index === 0 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#af9164] rounded-l-sm" />}
                      <div className={cn(
                        "flex-shrink-0 w-11 h-11 border rounded-sm flex flex-col items-center justify-center mr-4 ml-1",
                        index === 0 ? "border-[#af9164]/30 bg-white" : "border-slate-100 bg-slate-50"
                      )}>
                        <span className={cn(
                          "text-[10px] font-bold uppercase leading-none mb-1",
                          index === 0 ? "text-[#af9164]" : "text-slate-500"
                        )}>
                          {format(new Date(time), "MMM")}
                        </span>
                        <span className="text-base font-serif text-[#1a2238] leading-none">
                          {format(new Date(time), "d")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-[#1a2238] font-bold">
                            {format(new Date(time), "EEEE")}
                          </div>
                          {index === 0 && (
                            <span className="text-[9px] uppercase tracking-widest font-bold text-[#af9164] bg-[#af9164]/10 px-2 py-0.5 rounded-sm">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                          <Clock className={cn("w-3.5 h-3.5", index === 0 ? "text-[#af9164]" : "text-slate-400")} />
                          {format(new Date(time), "h:mm a")}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {getActionButtons()}
        </div>
      </div>

      {/* Propose New Time Modal */}
      <AnimatePresence>
        {showProposeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a2238]/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white rounded-sm shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-[1.3rem] text-[#1a2238] leading-tight">
                    Propose Alternative
                  </h3>
                  <button 
                    onClick={() => {
                      setShowProposeModal(false);
                      setNewProposedTime("");
                    }}
                    className="p-1.5 hover:bg-slate-50 rounded-sm text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 mb-2">
                      New Date & Time
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={newProposedTime}
                        onChange={(e) => setNewProposedTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-sm 
                                bg-slate-50 text-sm text-[#1a2238] font-medium shadow-inner
                                focus:bg-white focus:outline-none focus:border-[#af9164] transition-colors"
                      />
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProposeModal(false);
                        setNewProposedTime("");
                      }}
                      className="flex-1 rounded-sm border-slate-200 text-slate-600 hover:bg-slate-50 h-12 text-[10px] uppercase tracking-widest font-bold transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleProposeNewTime}
                      disabled={!newProposedTime || isLoading === "propose_new"}
                      className="flex-1 rounded-sm bg-[#1a2238] hover:bg-[#2d3648] text-white h-12 text-[10px] uppercase tracking-widest font-bold shadow-md transition-all disabled:opacity-70 disabled:shadow-none"
                    >
                      {isLoading === "propose_new" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
