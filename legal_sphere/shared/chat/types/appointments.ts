/**
 * TypeScript interfaces for Smart Chat Scheduling feature
 * Defines all data types for appointments and related Socket.IO events
 */

export type AppointmentStatus = "pending" | "accepted" | "declined" | "completed";
export type LocationType = "in-person" | "virtual";
export type AppointmentResponse = "accept" | "decline" | "propose_new";

/**
 * Core appointment data structure matching MongoDB schema
 */
export interface AppointmentData {
  appointment_id: string;
  case_id: string;
  client_id: string;
  lawyer_id: string;
  proposed_times: string[];
  agreed_time: string | null;
  status: AppointmentStatus;
  location_type: LocationType;
  waiting_for?: "lawyer" | "client";
  created_at: string;
  updated_at: string;
}

/**
 * Payload for appointment_proposal Socket.IO event
 */
export interface AppointmentProposalPayload {
  case_id: string;
  client_id: string;
  lawyer_id: string;
  proposed_times: string[];
  location_type: LocationType;
  chat_id?: string; // MongoDB chat ID for socket room (not the same as case_id)
}

/**
 * Payload for appointment_response Socket.IO event
 */
export interface AppointmentResponsePayload {
  appointment_id: string;
  case_id: string;
  response: AppointmentResponse;
  agreed_time?: string;
  new_proposed_times?: string[];
}

/**
 * Payload for appointment notifications broadcast to clients
 */
export interface AppointmentNotificationPayload {
  appointment_id: string;
  case_id: string;
  client_id: string;
  lawyer_id: string;
  proposed_times: string[];
  location_type: LocationType;
  status: AppointmentStatus;
  agreed_time: string | null;
  waiting_for?: "lawyer" | "client";
  responded_by?: string;
  response?: string;
  timestamp: string;
}

/**
 * Props for the Scheduling Modal component
 */
export interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  clientId: string;
  lawyerId: string;
  onSubmit: (data: AppointmentProposalPayload) => void;
  userRole: "client" | "lawyer" | "admin";
}

/**
 * Props for the Appointment Chat Card component
 */
export interface AppointmentChatCardProps {
  appointment: AppointmentNotificationPayload;
  currentUserId: string;
  userRole: "client" | "lawyer" | "admin";
  onRespond: (response: AppointmentResponsePayload) => void;
  onProposeNew: (newTimes: string[]) => void;
}

/**
 * Props for the Upcoming Appointments Widget
 */
export interface UpcomingAppointmentsWidgetProps {
  userId: string;
  userRole: "lawyer" | "admin" | "client";
  limit?: number;
}

/**
 * Form data for appointment proposal
 */
export interface AppointmentFormData {
  primaryDateTime: string;
  alternateDateTime: string;
  locationType: LocationType;
}
