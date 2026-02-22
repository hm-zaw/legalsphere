"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isThisWeek, addDays } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ChevronRight,
  MoreHorizontal,
  User,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  UpcomingAppointmentsWidgetProps,
  AppointmentData,
} from "../types/appointments";

type GroupedAppointments = {
  today: AppointmentData[];
  tomorrow: AppointmentData[];
  thisWeek: AppointmentData[];
  later: AppointmentData[];
};

function groupAppointments(appointments: AppointmentData[]): GroupedAppointments {
  const grouped: GroupedAppointments = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  };

  appointments.forEach((apt) => {
    const date = new Date(apt.agreed_time!);
    if (isToday(date)) {
      grouped.today.push(apt);
    } else if (isTomorrow(date)) {
      grouped.tomorrow.push(apt);
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      grouped.thisWeek.push(apt);
    } else {
      grouped.later.push(apt);
    }
  });

  return grouped;
}

function getRelativeDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isThisWeek(date, { weekStartsOn: 1 })) {
    return format(date, "EEEE"); // Day name
  }
  return format(date, "MMM d, yyyy");
}

function AppointmentItem({
  appointment,
  userRole,
  compact = false,
}: {
  appointment: AppointmentData;
  userRole: "lawyer" | "admin" | "client";
  compact?: boolean;
}) {
  const agreedTime = appointment.agreed_time!;
  const date = new Date(agreedTime);
  const otherParty = userRole === "client" ? "lawyer" : "client";
  const otherPartyId =
    userRole === "client" ? appointment.lawyer_id : appointment.client_id;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-xl",
              "bg-white dark:bg-slate-900/50",
              "border border-slate-200 dark:border-slate-800",
              "hover:border-indigo-300 dark:hover:border-indigo-800",
              "hover:shadow-sm transition-all duration-200",
              compact && "p-2"
            )}
          >
            {/* Time Block */}
            <div
              className={cn(
                "flex flex-col items-center justify-center",
                "px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30",
                "border border-indigo-100 dark:border-indigo-900",
                compact && "px-2 py-1"
              )}
            >
              <span
                className={cn(
                  "text-lg font-bold text-indigo-700 dark:text-indigo-400",
                  compact && "text-sm"
                )}
              >
                {format(date, "h:mm")}
              </span>
              <span
                className={cn(
                  "text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70",
                  compact && "text-[10px]"
                )}
              >
                {format(date, "a")}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "font-medium text-slate-900 dark:text-slate-100 truncate",
                    compact && "text-sm"
                  )}
                >
                  {getRelativeDateLabel(agreedTime)}
                </p>
                {appointment.location_type === "virtual" ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Virtual
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    In-Person
                  </Badge>
                )}
              </div>

              {!compact && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-3 h-3" />
                    <span className="truncate">Case #{appointment.case_id.slice(-6)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <User className="w-3 h-3" />
                    <span className="truncate">{otherParty} #{otherPartyId.slice(-4)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "h-8 w-8 text-slate-400 hover:text-indigo-600",
                compact && "h-6 w-6"
              )}
            >
              <ChevronRight className={cn("w-4 h-4", compact && "w-3 h-3")} />
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Case: {appointment.case_id}</p>
            <p className="text-xs text-slate-500">
              {userRole === "client" ? "Lawyer" : "Client"}: {" "}
              {userRole === "client" ? appointment.lawyer_id : appointment.client_id}
            </p>
            <p className="text-xs text-slate-500">
              Scheduled: {format(new Date(agreedTime), "PPpp")}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionHeader({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <Badge
        variant="secondary"
        className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
      >
        {count}
      </Badge>
    </div>
  );
}

export function UpcomingAppointmentsWidget({
  userId,
  userRole,
  limit = 10,
}: UpcomingAppointmentsWidgetProps) {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/appointments/upcoming?userId=${userId}&role=${userRole}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }

        const data = await response.json();
        setAppointments(data.appointments || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [userId, userRole, limit]);

  const grouped = groupAppointments(appointments);

  // Determine aesthetic based on user role
  const isLawyerView = userRole === "lawyer";
  const isAdminView = userRole === "admin";

  const headerGradient = isLawyerView
    ? "from-slate-900 via-slate-800 to-slate-900"
    : isAdminView
    ? "from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950"
    : "from-slate-50 to-white dark:from-slate-900 dark:to-slate-950";

  const cardBorder = isLawyerView
    ? "border-slate-700 dark:border-slate-600"
    : "border-slate-200 dark:border-slate-800";

  if (isLoading) {
    return (
      <Card
        className={cn(
          "overflow-hidden",
          cardBorder,
          isLawyerView && "bg-gradient-to-br from-slate-900 to-slate-800 text-white"
        )}
      >
        <CardHeader className={cn("p-4", isLawyerView && `bg-gradient-to-r ${headerGradient}`)}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle
              className={cn(
                "text-lg",
                isLawyerView ? "text-white" : "text-slate-900 dark:text-slate-100"
              )}
            >
              Upcoming Appointments
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("overflow-hidden", cardBorder)}>
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Calendar className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
              Upcoming Appointments
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-6">
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card
        className={cn(
          "overflow-hidden",
          cardBorder,
          isLawyerView && "bg-gradient-to-br from-slate-900 to-slate-800"
        )}
      >
        <CardHeader className={cn("p-4", isLawyerView && `bg-gradient-to-r ${headerGradient}`)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                isLawyerView
                  ? "bg-slate-800/50 border border-slate-700"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Calendar
                className={cn(
                  "w-5 h-5",
                  isLawyerView ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
                )}
              />
            </div>
            <CardTitle
              className={cn(
                "text-lg",
                isLawyerView ? "text-white" : "text-slate-900 dark:text-slate-100"
              )}
            >
              Upcoming Appointments
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <div
              className={cn(
                "w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center",
                isLawyerView
                  ? "bg-slate-800/50 border border-slate-700"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Calendar
                className={cn(
                  "w-8 h-8",
                  isLawyerView ? "text-slate-400" : "text-slate-400 dark:text-slate-500"
                )}
              />
            </div>
            <p
              className={cn(
                "text-sm",
                isLawyerView ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
              )}
            >
              No upcoming appointments scheduled
            </p>
            <p
              className={cn(
                "text-xs mt-1",
                isLawyerView ? "text-slate-400" : "text-slate-400 dark:text-slate-500"
              )}
            >
              Appointments will appear here when scheduled
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden",
        cardBorder,
        isLawyerView && "bg-gradient-to-br from-slate-900 to-slate-800"
      )}
    >
      <CardHeader className={cn("p-4", isLawyerView && `bg-gradient-to-r ${headerGradient}`)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                isLawyerView
                  ? "bg-slate-800/50 border border-slate-700"
                  : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Calendar
                className={cn(
                  "w-5 h-5",
                  isLawyerView ? "text-indigo-400" : "text-indigo-600 dark:text-indigo-400"
                )}
              />
            </div>
            <div>
              <CardTitle
                className={cn(
                  "text-lg",
                  isLawyerView ? "text-white" : "text-slate-900 dark:text-slate-100"
                )}
              >
                Upcoming Appointments
              </CardTitle>
              <p
                className={cn(
                  "text-xs",
                  isLawyerView ? "text-slate-400" : "text-slate-500 dark:text-slate-400"
                )}
              >
                {appointments.length} scheduled appointment{appointments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              isLawyerView
                ? "text-slate-300 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn("p-4", isLawyerView && "bg-transparent")}>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            <AnimatePresence>
              {/* Today */}
              {grouped.today.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SectionHeader
                    title="Today"
                    count={grouped.today.length}
                    icon={Clock}
                  />
                  <div className="space-y-2">
                    {grouped.today.map((apt) => (
                      <AppointmentItem
                        key={apt.appointment_id}
                        appointment={apt}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tomorrow */}
              {grouped.tomorrow.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SectionHeader
                    title="Tomorrow"
                    count={grouped.tomorrow.length}
                    icon={Calendar}
                  />
                  <div className="space-y-2">
                    {grouped.tomorrow.map((apt) => (
                      <AppointmentItem
                        key={apt.appointment_id}
                        appointment={apt}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* This Week */}
              {grouped.thisWeek.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SectionHeader
                    title="This Week"
                    count={grouped.thisWeek.length}
                    icon={Calendar}
                  />
                  <div className="space-y-2">
                    {grouped.thisWeek.map((apt) => (
                      <AppointmentItem
                        key={apt.appointment_id}
                        appointment={apt}
                        userRole={userRole}
                        compact={grouped.thisWeek.length > 3}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Later */}
              {grouped.later.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SectionHeader
                    title="Upcoming"
                    count={grouped.later.length}
                    icon={MoreHorizontal}
                  />
                  <div className="space-y-2">
                    {grouped.later.slice(0, 3).map((apt) => (
                      <AppointmentItem
                        key={apt.appointment_id}
                        appointment={apt}
                        userRole={userRole}
                        compact
                      />
                    ))}
                    {grouped.later.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-slate-500 hover:text-slate-700"
                      >
                        +{grouped.later.length - 3} more
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
