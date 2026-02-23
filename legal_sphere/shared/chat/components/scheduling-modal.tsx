"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  SchedulingModalProps,
  AppointmentFormData,
  LocationType,
} from "../types/appointments";

const modalVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
};

const formItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

export function SchedulingModal({
  isOpen,
  onClose,
  caseId,
  clientId,
  lawyerId,
  onSubmit,
  userRole,
}: SchedulingModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    primaryDateTime: "",
    alternateDateTime: "",
    locationType: "virtual",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.primaryDateTime) return;

    setIsSubmitting(true);

    const proposedTimes = [new Date(formData.primaryDateTime).toISOString()];
    if (formData.alternateDateTime) {
      proposedTimes.push(new Date(formData.alternateDateTime).toISOString());
    }

    const payload = {
      case_id: caseId,
      client_id: clientId,
      lawyer_id: lawyerId,
      proposed_times: proposedTimes,
      location_type: formData.locationType,
    };

    try {
      await onSubmit(payload);
      // Reset form
      setFormData({
        primaryDateTime: "",
        alternateDateTime: "",
        locationType: "virtual",
      });
      onClose();
    } catch (error) {
      console.error("Failed to submit appointment proposal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const hours = formData.locationType === "in-person" ? 48 : 24;
    now.setHours(now.getHours() + hours);
    
    // Round up to next 30 minutes
    const ms = 1000 * 60 * 30;
    const rounded = new Date(Math.ceil(now.getTime() / ms) * ms);
    
    rounded.setMinutes(rounded.getMinutes() - rounded.getTimezoneOffset());
    return rounded.toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const max = new Date();
    max.setDate(max.getDate() + 30);
    
    max.setMinutes(max.getMinutes() - max.getTimezoneOffset());
    return max.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border border-border shadow-2xl">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
            >
              {/* Header */}
              <DialogHeader className="px-8 pt-8 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/5">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-medium tracking-tight font-[family-name:var(--font-geist-sans)]">
                      Request Appointment
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      Schedule a meeting with your lawyer
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                {/* Primary Date/Time */}
                <motion.div
                  custom={0}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  <Label
                    htmlFor="primaryDateTime"
                    className="flex items-center gap-2 text-sm font-normal text-foreground"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Preferred Date & Time
                  </Label>
                  <Input
                    id="primaryDateTime"
                    type="datetime-local"
                    required
                    min={getMinDateTime()}
                    max={getMaxDateTime()}
                    step="1800"
                    value={formData.primaryDateTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryDateTime: e.target.value,
                      }))
                    }
                    className="w-full bg-background border-border focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </motion.div>

                {/* Alternate Date/Time */}
                <motion.div
                  custom={1}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2.5"
                >
                  <Label
                    htmlFor="alternateDateTime"
                    className="flex items-center gap-2 text-sm font-normal text-foreground"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Alternate Date & Time
                    <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="alternateDateTime"
                    type="datetime-local"
                    min={getMinDateTime()}
                    max={getMaxDateTime()}
                    step="1800"
                    value={formData.alternateDateTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        alternateDateTime: e.target.value,
                      }))
                    }
                    className="w-full bg-background border-border focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Providing an alternate time increases the chance of scheduling
                  </p>
                </motion.div>

                {/* Location Type Toggle */}
                <motion.div
                  custom={2}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <Label className="flex items-center gap-2 text-sm font-normal text-foreground">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Meeting Location
                  </Label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          locationType: "virtual" as LocationType,
                        }))
                      }
                      className={cn(
                        "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200",
                        formData.locationType === "virtual"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground/30"
                      )}
                    >
                      <Video className="w-4 h-4" />
                      <span className="text-sm font-normal">Virtual</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          locationType: "in-person" as LocationType,
                        }))
                      }
                      className={cn(
                        "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200",
                        formData.locationType === "in-person"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background hover:border-foreground/30"
                      )}
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-normal">In-Person</span>
                    </button>
                  </div>
                </motion.div>

                {/* Summary */}
                <motion.div
                  custom={3}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-4 rounded-lg bg-muted/40 border border-border"
                >
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    {formData.primaryDateTime && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Preferred:</span>
                        <span className="font-medium text-foreground">
                          {format(
                            new Date(formData.primaryDateTime),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </span>
                      </div>
                    )}
                    {formData.alternateDateTime && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Alternate:</span>
                        <span className="font-medium text-foreground">
                          {format(
                            new Date(formData.alternateDateTime),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium text-foreground">
                        {formData.locationType === "virtual"
                          ? "Virtual Meeting"
                          : "In-Person Meeting"}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  custom={4}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex gap-3 pt-4"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 border-border hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.primaryDateTime}
                    className="flex-1 gap-2"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Send Request
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
