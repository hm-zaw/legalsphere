"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Send,
  Edit3,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Scale,
  Gavel,
  DollarSign,
  User,
  ChevronRight,
  Download,
  Eye,
  Plus,
  Play,
  Pause,
  XCircle,
  Archive,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import apiClient from "@/lib/api";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";

// --- Types ---
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  category: "pleading" | "evidence" | "contract" | "correspondence" | "other";
}

interface TimeEntry {
  id: string;
  date: string;
  description: string;
  hours: number;
  rate: number;
  billable: boolean;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  isPrivate: boolean;
}

interface Activity {
  id: string;
  type:
    | "status_change"
    | "document_upload"
    | "note_added"
    | "message"
    | "time_logged";
  description: string;
  timestamp: string;
  actor: string;
}

interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface CaseDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  caseStage?:
    | "discovery"
    | "pleadings"
    | "pre_trial"
    | "trial"
    | "settlement"
    | "appeal"
    | "closed";
  client: Client;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  totalLoggedHours: number;
  documents: Document[];
  timeEntries: TimeEntry[];
  notes: Note[];
  activities: Activity[];
  closedAt?: string;
  closingRemarks?: string;
  billing_ledger?: { id: string; date: string; description: string; amount: number; type: string; }[];
}

// --- Blank Data (No Mocks) ---
const BLANK_CASE: CaseDetail = {
  id: "CASE-NEW",
  title: "Case Details",
  description: "No description provided.",
  status: "pending",
  category: "General",
  priority: "medium",
  caseStage: "discovery",
  client: {
    id: "CLI-000",
    fullName: "Unknown Client",
    email: "",
    phone: "",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalLoggedHours: 0,
  documents: [],
  timeEntries: [],
  notes: [],
  activities: [],
  billing_ledger: [],
};


// --- Helper Components ---

const StatusBadge = ({
  status,
  priority,
}: {
  status: string;
  priority: string;
}) => {
  const statusConfig: Record<
    string,
    { color: string; icon: React.ElementType }
  > = {
    active: { color: "bg-[#1a2238] text-white", icon: Play },
    pending: { color: "bg-amber-100 text-amber-800", icon: Clock },
    completed: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    on_hold: { color: "bg-slate-200 text-slate-700", icon: Pause },
    cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const priorityColor =
    priority === "urgent"
      ? "border-red-400 text-red-700"
      : priority === "high"
        ? "border-amber-400 text-amber-700"
        : priority === "medium"
          ? "border-blue-400 text-blue-700"
          : "border-slate-300 text-slate-600";

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
          config.color,
        )}
      >
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
      <span
        className={cn(
          "px-2 py-1 rounded-sm text-[9px] font-bold uppercase border",
          priorityColor,
        )}
      >
        {priority} Priority
      </span>
    </div>
  );
};

const QuickActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}) => {
  const variants = {
    default: "bg-white border-slate-200 text-slate-700 hover:border-[#af9164]",
    primary: "bg-[#1a2238] border-[#1a2238] text-white hover:bg-[#2d3a5e]",
    danger: "bg-[#1a2238] border-[#1a2238] text-[#af9164] hover:bg-[#af9164] hover:text-white hover:border-[#af9164]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
};

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
}) => (
  <div className="bg-white border border-slate-200 p-4 rounded-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
          {label}
        </p>
        <p className="font-serif text-xl text-slate-900">{value}</p>
        {subtext && (
          <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>
        )}
      </div>
      <div className="p-2 bg-slate-50 rounded-sm">
        <Icon className="w-4 h-4 text-[#af9164]" />
      </div>
    </div>
  </div>
);

const TabButton = ({
  active,
  label,
  onClick,
  count,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
      active ? "text-[#1a2238]" : "text-slate-400 hover:text-slate-500",
    )}
  >
    {label}
    {count !== undefined && (
      <span
        className={cn(
          "ml-2 px-1.5 py-0.5 rounded-full text-[9px]",
          active ? "bg-[#1a2238] text-white" : "bg-slate-200 text-slate-600",
        )}
      >
        {count}
      </span>
    )}
    {active && (
      <motion.div
        layoutId="lawyer-tab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a2238]"
      />
    )}
  </button>
);

// --- Tab Content Components ---

const OverviewTab = ({ 
  caseData, 
  stageUpdating, 
  CASE_STAGES, 
  updateStage 
}: { 
  caseData: CaseDetail;
  stageUpdating: boolean;
  CASE_STAGES: { id: NonNullable<CaseDetail["caseStage"]>; label: string }[];
  updateStage: (stage: NonNullable<CaseDetail["caseStage"]>) => void;
}) => (
  <div className="space-y-6">
    {/* Client Info Card */}
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
        Client Information
      </h3>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1a2238] flex items-center justify-center text-[#af9164] font-serif text-xl font-bold">
          {caseData.client.fullName.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-serif text-lg text-slate-900">
            {caseData.client.fullName}
          </h4>
          <p className="text-sm text-slate-500 mb-3">
            Client since {format(new Date(caseData.createdAt), "MMMM yyyy")}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${caseData.client.email}`}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#af9164] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {caseData.client.email}
            </a>
            <a
              href={`tel:${caseData.client.phone}`}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#af9164] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {caseData.client.phone}
            </a>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-[#1a2238] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#2d3a5e] transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />
          Message
        </button>
      </div>
    </div>

    {/* Case Details Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border border-slate-200 rounded-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" /> Key Dates
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Case Opened</span>
            <span className="text-sm font-medium text-slate-900">
              {format(new Date(caseData.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Last Updated</span>
            <span className="text-sm font-medium text-slate-900">
              {format(new Date(caseData.updatedAt), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Due Date</span>
            <span
              className={cn(
                "text-sm font-medium",
                caseData.dueDate && new Date(caseData.dueDate) < new Date()
                  ? "text-red-600"
                  : "text-slate-900",
              )}
            >
              {caseData.dueDate
                ? format(new Date(caseData.dueDate), "MMM d, yyyy")
                : "Not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Time Tracking
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Logged Hours</span>
            <span className="text-sm font-medium text-slate-900">
              {caseData.totalLoggedHours}h
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Estimated</span>
            <span className="text-sm font-medium text-slate-900">
              {caseData.estimatedHours || "—"}h
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Remaining</span>
            <span
              className={cn(
                "text-sm font-medium",
                caseData.estimatedHours &&
                  caseData.totalLoggedHours > caseData.estimatedHours
                  ? "text-red-600"
                  : "text-emerald-600",
              )}
            >
              {caseData.estimatedHours
                ? `${Math.max(0, caseData.estimatedHours - caseData.totalLoggedHours)}h`
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Description */}
    <div className="bg-white border border-slate-200 rounded-sm p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Case Description
      </h3>
      <p className="text-sm text-slate-700 leading-relaxed">
        {caseData.description}
      </p>
    </div>
  </div>
);

const DocumentsTab = ({ documents, uploaderNames }: { documents: Document[]; uploaderNames: Record<string, string> }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
        Case Documents
      </h3>
      <QuickActionButton
        icon={Upload}
        label="Upload Document"
        variant="primary"
      />
    </div>

    <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <div>Document Name</div>
        <div>Category</div>
        <div>Size</div>
        <div>Uploaded</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1a2238]/5 rounded-sm">
                <FileText className="w-4 h-4 text-[#1a2238]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                <p className="text-[10px] text-slate-400">
                  by {uploaderNames[doc.uploadedBy] || doc.uploadedBy}
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded-sm">
              {doc.category}
            </span>
            <span className="text-xs text-slate-600">{doc.size}</span>
            <span className="text-xs text-slate-500">
              {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
            </span>
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 hover:bg-slate-200 rounded-sm text-slate-500">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-slate-200 rounded-sm text-slate-500">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No documents uploaded yet</p>
        </div>
      )}
    </div>
  </div>
);

const TimeTrackingTab = ({ entries }: { entries: TimeEntry[] }) => {
  const totalBillable = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.hours * e.rate, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Time Entries
          </h3>
          <span className="text-sm text-slate-600">
            Billable:{" "}
            <span className="font-medium text-[#1a2238]">
              ${totalBillable.toLocaleString()}
            </span>
          </span>
        </div>
        <QuickActionButton icon={Clock} label="Log Time" variant="primary" />
      </div>

      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <div>Date</div>
          <div>Description</div>
          <div>Hours</div>
          <div>Rate</div>
          <div className="text-right">Amount</div>
        </div>

        <div className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-4 items-center"
            >
              <span className="text-xs font-medium text-slate-900">
                {format(new Date(entry.date), "MMM d")}
              </span>
              <div>
                <p className="text-sm text-slate-700">{entry.description}</p>
              </div>
              <span className="text-xs font-medium text-slate-900">
                {entry.hours}h
              </span>
              <span className="text-xs text-slate-500">${entry.rate}/hr</span>
              <span
                className={cn(
                  "text-sm font-medium text-right",
                  entry.billable ? "text-emerald-600" : "text-slate-400",
                )}
              >
                $
                {entry.billable
                  ? (entry.hours * entry.rate).toLocaleString()
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActivityTab = ({ activities }: { activities: Activity[] }) => (
  <div className="space-y-4">
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
      Activity Log
    </h3>

    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

      <div className="space-y-0">
        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-12 py-4">
            <div className="absolute left-2 top-4 w-5 h-5 rounded-full bg-white border-2 border-[#af9164] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#af9164]" />
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-800">{activity.description}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  by{" "}
                  <span className="font-medium text-slate-600">
                    {activity.actor}
                  </span>
                </p>
              </div>
              <span className="text-[10px] text-slate-400">
                {format(new Date(activity.timestamp), "MMM d, h:mm a")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NotesTab = ({
  notes,
  onAddNote,
}: {
  notes: Note[];
  onAddNote: (content: string, isPrivate: boolean) => Promise<void>;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAddNote(content.trim(), isPrivate);
      setContent("");
      setIsPrivate(true);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Case Notes</h3>
        <QuickActionButton
          icon={Plus}
          label={showForm ? "Close" : "Add Note"}
          variant="primary"
          onClick={() => setShowForm((s) => !s)}
        />
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-sm p-4">
          <textarea
            className="w-full p-3 border border-slate-200 rounded-sm resize-y text-slate-900"
            rows={4}
            placeholder="Write a note to the case..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4"
              />
              Private
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 bg-slate-100 rounded-sm text-sm text-slate-700"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-3 py-1.5 bg-[#1a2238] text-white rounded-sm text-sm"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="bg-white border border-slate-200 rounded-sm p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-900">{note.createdBy}</span>
                {note.isPrivate && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-sm uppercase font-bold tracking-wider">Private</span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-sm">
            <Edit3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BillingTab = ({
  ledger,
  onAddCharge,
  loading,
}: {
  ledger: { id: string; date: string; description: string; amount: number; type: string; }[];
  onAddCharge: (amount: number, description: string) => Promise<void>;
  loading: boolean;
}) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = (ledger || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const handleSubmit = async () => {
    if (!amount || !description.trim()) return;
    setSubmitting(true);
    try {
      await onAddCharge(parseInt(amount.replace(/,/g, ''), 10), description.trim());
      setAmount("");
      setDescription("");
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Billing & Expenses
          </h3>
          <p className="text-sm text-slate-500 font-light mt-1">
            Comprehensive ledger of all billable events and expenses.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1a2238] to-[#2d3a5e] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:from-[#2d3a5e] hover:to-[#1a2238] transition-all shadow-lg shadow-[#1a2238]/20"
        >
          <Plus className="w-4 h-4" />
          Add Custom Charge
        </button>
      </div>

      <div className="bg-white/95 backdrop-blur-md border border-[#1a2238]/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-[1.5fr_2fr_1fr] md:grid-cols-[1.5fr_3fr_1fr] gap-4 px-6 py-4 bg-[#1a2238] text-white text-xs font-bold uppercase tracking-widest border-b border-white/20">
          <div>Date</div>
          <div>Description</div>
          <div className="text-right">Amount</div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-slate-100/80">
          {(!ledger || ledger.length === 0) ? (
            <div className="px-6 py-8 text-center text-sm text-slate-400 italic">
              No financial records found for this case.
            </div>
          ) : (
            ledger.map((item, idx) => (
              <div key={item.id || idx} className="grid grid-cols-[1.5fr_2fr_1fr] md:grid-cols-[1.5fr_3fr_1fr] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors">
                <div className="text-sm text-slate-500 font-mono">
                  {new Date(item.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
                <div className="font-serif text-slate-800 text-[15px]">
                  {item.description}
                </div>
                <div className="text-right font-mono text-[15px] font-medium text-[#1a2238]">
                  {new Intl.NumberFormat('en-US').format(item.amount || 0)} MMK
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Footer */}
        <div className="grid grid-cols-[1.5fr_2fr_1fr] md:grid-cols-[1.5fr_3fr_1fr] gap-4 px-6 py-5 bg-[#af9164] text-white">
          <div className="col-span-2 md:col-span-2 flex items-center justify-end font-serif text-lg md:text-xl font-medium">
            Total Outstanding Balance
          </div>
          <div className="text-right font-mono text-lg md:text-xl font-bold bg-[#1a2238]/20 px-3 py-1.5 rounded-xl backdrop-blur-sm self-center border border-white/20">
            {new Intl.NumberFormat('en-US').format(total)} MMK
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#1a2238] to-[#2d3a5e] flex justify-between items-center">
                <h3 className="font-serif text-lg text-white">Add Custom Charge</h3>
                <button
                  onClick={() => !submitting && setShowModal(false)}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Description <span className="text-[#af9164]">*</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Document Filing Fee"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#af9164]/20 focus:border-[#af9164]/40 transition-all font-serif"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Amount (MMK) <span className="text-[#af9164]">*</span>
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in MMK"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#af9164]/20 focus:border-[#af9164]/40 transition-all font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !amount || !description}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-[#1a2238] text-white hover:bg-[#2d3a5e] disabled:opacity-50 transition-all"
                  >
                    {submitting ? "Adding..." : "Add Charge"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Component ---

export default function LawyerCaseDetailView({ caseId }: { caseId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [caseData, setCaseData] = useState<CaseDetail>(BLANK_CASE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploaderNames, setUploaderNames] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stageUpdating, setStageUpdating] = useState(false);

  // --- Close Matter state ---
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingRemarks, setClosingRemarks] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const isCaseClosed = caseData.status === "completed" || caseData.caseStage === "closed";

  const handleCloseMatter = async () => {
    if (!caseId || !closingRemarks.trim()) return;
    setIsClosing(true);
    setError(null);
    try {
      const resp = await apiClient.closeCase(caseId, closingRemarks.trim());
      if (resp.error) {
        setError(resp.error);
        return;
      }
      setShowCloseModal(false);
      router.push("/lawyer-dashboard?view=cases");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setIsClosing(false);
    }
  };

  // In real implementation, fetch case data
  useEffect(() => {
    if (caseId) {
      setLoading(true);
      setError(null);
      (async () => {
        try {
          const resp = await apiClient.getCaseDetails(caseId);
          if (resp.error) {
            setError(resp.error);
            setLoading(false);
            return;
          }

          const apiCase: any = resp.data;

          // Build activities log dynamically
          const synthesizedActivities: Activity[] = [];

          // 1. Case Creation
          if (apiCase?.createdAt) {
            synthesizedActivities.push({
              id: `act-create-${apiCase.id || caseId}`,
              type: "status_change",
              description: "Case submitted into LegalSphere",
              timestamp: apiCase.createdAt,
              actor: apiCase?.client?.fullName || apiCase?.client?.name || "Client"
            });
          }

          // 2. Lawyer Assignment (Admin action)
          if (apiCase?.assignedLawyer?.assignedAt) {
            synthesizedActivities.push({
              id: `act-assign-${apiCase.id || caseId}-${apiCase.assignedLawyer.assignedAt}`,
              type: "status_change",
              description: `Assigned case to ${apiCase.assignedLawyer?.name || "lawyer"}`,
              timestamp: apiCase.assignedLawyer.assignedAt,
              actor: "Administrator"
            });
          }

          // 3. Lawyer Rejection
          if (apiCase?.lawyerRejectedAt) {
            synthesizedActivities.push({
              id: `act-reject-${apiCase.id || caseId}-${apiCase.lawyerRejectedAt}`,
              type: "status_change",
              description: `Case assignment declined: ${apiCase.rejectionReason || "No reason provided"}`,
              timestamp: apiCase.lawyerRejectedAt,
              actor: apiCase.lawyerRejectedBy || "A Lawyer"
            });
          }

          // 4. Lawyer Acceptance
          if (apiCase?.lawyerAcceptedAt) {
            synthesizedActivities.push({
              id: `act-accept-${apiCase.id || caseId}-${apiCase.lawyerAcceptedAt}`,
              type: "status_change",
              description: "Case assignment accepted",
              timestamp: apiCase.lawyerAcceptedAt,
              actor: apiCase.lawyerAcceptedBy || "Lawyer"
            });
          }

          // 5. Document Uploads
          if (Array.isArray(apiCase?.documents)) {
            apiCase.documents.forEach((doc: any, i: number) => {
              if (doc.createdAt || doc.uploadedAt) {
                synthesizedActivities.push({
                  id: `act-doc-${doc.id || i}`,
                  type: "document_upload",
                  description: `Uploaded document: ${doc.name || doc.fileName || 'File'}`,
                  timestamp: doc.createdAt || doc.uploadedAt,
                  actor: doc.uploadedBy || doc.createdBy || "System"
                });
              }
            });
          }

          // 6. Notes Added
          if (Array.isArray(apiCase?.notes)) {
            apiCase.notes.forEach((note: any, i: number) => {
              if (note.createdAt) {
                synthesizedActivities.push({
                  id: `act-note-${note.id || i}`,
                  type: "note_added",
                  description: note.isPrivate ? "Added a private note" : "Added a case note",
                  timestamp: note.createdAt,
                  actor: note.createdBy || "System"
                });
              }
            });
          }

          // 7. Time entries
          if (Array.isArray(apiCase?.timeEntries)) {
            apiCase.timeEntries.forEach((entry: any, i: number) => {
              if (entry.date || entry.createdAt) {
                synthesizedActivities.push({
                  id: `act-time-${entry.id || i}`,
                  type: "time_logged",
                  description: `Logged ${entry.hours} hours: ${entry.description}`,
                  timestamp: entry.date || entry.createdAt,
                  actor: entry.lawyerName || "Lawyer"
                });
              }
            });
          }

          // Sort activities by timestamp descending (newest first)
          synthesizedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          const mapped: CaseDetail = {
            id: apiCase?.id || apiCase?._id || caseId,
            title: apiCase?.case?.title || apiCase?.title || BLANK_CASE.title,
            description:
              apiCase?.case?.description ||
              apiCase?.description ||
              BLANK_CASE.description,
            caseStage:
              (apiCase?.caseStage as any) ||
              (apiCase?.case_stage as any) ||
              (apiCase?.case?.caseStage as any) ||
              "discovery",
            status:
              (apiCase?.status && String(apiCase.status).toLowerCase()) ||
              (apiCase?.rawStatus as string) ||
              BLANK_CASE.status,
            category:
              apiCase?.case?.category ||
              apiCase?.category ||
              BLANK_CASE.category,
            priority:
              (apiCase?.case?.urgency &&
                String(apiCase.case.urgency).toLowerCase()) ||
              (apiCase?.priority && String(apiCase.priority).toLowerCase()) ||
              BLANK_CASE.priority,
            client: {
              id:
                apiCase?.client?.id ||
                apiCase?.client?._id ||
                apiCase?.client?.email ||
                BLANK_CASE.client.id,
              fullName:
                apiCase?.client?.name ||
                apiCase?.client?.fullName ||
                BLANK_CASE.client.fullName,
              email: apiCase?.client?.email || BLANK_CASE.client.email,
              phone: apiCase?.client?.phone || BLANK_CASE.client.phone,
              avatar: apiCase?.client?.avatar,
            },
            createdAt: apiCase?.createdAt || BLANK_CASE.createdAt,
            updatedAt: apiCase?.updatedAt || BLANK_CASE.updatedAt,
            dueDate:
              apiCase?.case?.dueDate || apiCase?.dueDate || BLANK_CASE.dueDate,
            estimatedHours:
              apiCase?.case?.estimatedHours ||
              apiCase?.estimatedHours ||
              BLANK_CASE.estimatedHours,
            totalLoggedHours: apiCase?.timeEntries
              ? apiCase.timeEntries.reduce(
                  (s: number, e: any) => s + (e.hours || 0),
                  0,
                )
              : BLANK_CASE.totalLoggedHours,
            documents: apiCase?.documents || BLANK_CASE.documents,
            timeEntries: apiCase?.timeEntries || BLANK_CASE.timeEntries,
            notes: apiCase?.notes || BLANK_CASE.notes,
            activities: synthesizedActivities,
            closedAt: apiCase?.closedAt,
            closingRemarks: apiCase?.closingRemarks,
            billing_ledger: apiCase?.billing_ledger || [],
          };

          setCaseData(mapped);
        } catch (e: any) {
          setError(e?.message || String(e));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [caseId]);

  const CASE_STAGES: { id: NonNullable<CaseDetail["caseStage"]>; label: string }[] = [
    { id: "discovery", label: "DISCOVERY" },
    { id: "pleadings", label: "PLEADINGS" },
    { id: "pre_trial", label: "PRE-TRIAL" },
    { id: "trial", label: "TRIAL" },
    { id: "settlement", label: "SETTLEMENT" },
    { id: "appeal", label: "APPEAL" },
  ];

  const updateStage = async (nextStage: NonNullable<CaseDetail["caseStage"]>) => {
    if (!caseId) return;
    setStageUpdating(true);
    setError(null);
    try {
      const resp = await apiClient.updateCaseStage(caseId, nextStage as any);
      if (resp.error) {
        setError(resp.error);
        return;
      }
      setCaseData((prev) => ({ ...prev, caseStage: nextStage }));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setStageUpdating(false);
    }
  };

  // Fetch uploader names for documents with numeric IDs
  useEffect(() => {
    const fetchUploaderNames = async () => {
      if (!caseData?.documents) return;

      const uniqueUploaderIds = Array.from(new Set(
        caseData.documents
          .map(doc => doc.uploadedBy)
          .filter(by => by && !isNaN(Number(by))) // Filter for numeric IDs
      ));

      if (uniqueUploaderIds.length === 0) return;

      try {
        const newUploaderNames: Record<string, string> = {};
        
        // Try to fetch user names for each numeric ID
        for (const userId of uniqueUploaderIds) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/users/${userId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('userToken') || localStorage.getItem('adminToken')}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              newUploaderNames[userId] = userData.user?.name || userData.user?.email || `User ${userId}`;
            } else {
              newUploaderNames[userId] = `Lawyer ${userId}`;
            }
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            newUploaderNames[userId] = `Lawyer ${userId}`;
          }
        }
        
        setUploaderNames(prev => ({ ...prev, ...newUploaderNames }));
      } catch (error) {
        console.error("Error fetching uploader names:", error);
      }
    };

    fetchUploaderNames();
  }, [caseData?.documents]);

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type) && !/\.(pdf|jpg|jpeg|png|docx)$/i.test(file.name)) {
      alert("Please upload a valid file (PDF, JPG, PNG, or DOCX)");
      return;
    }

    try {
      setUploadingDoc(true);

      // Step 1: Get presigned URL from R2
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/pdf",
        }),
      });

      if (!presignRes.ok) {
        throw new Error("Failed to prepare upload");
      }

      const { url, key, contentType } = await presignRes.json();

      // Step 2: Upload file to R2
      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed for ${file.name}`);
      }

      // Determine the case ID and ensure it exists to satisfy TypeScript
      const targetCaseId = caseData.id || caseId;

      if (!targetCaseId) {
        throw new Error("Case ID is missing. Cannot upload document.");
      }

      // Step 3: Save document metadata to backend
      const docData = {
        caseId: targetCaseId,
        document: {
          key,
          name: file.name,
          size: file.size,
          type: contentType,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.name || user?.email || 'Unknown',
        },
      };

      const resp = await apiClient.post(`/api/cases/${targetCaseId}/documents`, docData);

      if (resp.error) {
        throw new Error(resp.error || "Failed to save document to case");
      }

      // Refresh case data to show new document
      const caseResp = await apiClient.getCaseDetails(targetCaseId);
      
      // ADD THIS BLOCK: Update the state so the UI re-renders with the new document
      if (!caseResp.error && caseResp.data) {
        const apiCase: any = caseResp.data;
        setCaseData((prev) => ({
          ...prev,
          documents: apiCase.documents || [],
        }));
      }

      alert("Document uploaded successfully!");
      
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(err?.message || "Failed to upload document. Please try again.");
    } finally {
      setUploadingDoc(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddNote = async (content: string, isPrivate: boolean) => {
    try {
      const resp = await apiClient.post(`/api/case-requests/${caseData.id}/notes`, {
        content,
        isPrivate,
      });

      if (resp.error) {
        setError(resp.error);
        return;
      }

      const note = (resp.data as any)?.note || resp.data;
      if (note) {
        setCaseData((prev) => ({ ...prev, notes: [note, ...(prev.notes || [])] }));
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  const handleAddCharge = async (amount: number, description: string) => {
    if (!caseId) return;
    try {
      const resp = await apiClient.addManualBilling(caseId, { amount, description });
      if (resp.error) {
        setError(resp.error);
        return;
      }
      if (resp.data?.charge) {
        setCaseData(prev => ({ 
          ...prev, 
          billing_ledger: resp.data.billing_ledger || [...(prev.billing_ledger || []), resp.data.charge] 
        }));
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", count: undefined },
    { id: "documents", label: "Documents", count: caseData.documents.length },
    { id: "time", label: "Time Tracking", count: caseData.timeEntries.length },
    { id: "billing", label: "Billing & Expenses", count: caseData.billing_ledger?.length || 0 },
    { id: "notes", label: "Notes", count: caseData.notes?.length || 0 },
    { id: "activity", label: "Activity", count: caseData.activities.length },
  ];

  if (loading) {
    return (
      <div className="flex-1 w-full h-full bg-[#efefec] flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#af9164] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading case details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full bg-[#efefec] selection:bg-[#af9164]/30">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* --- Header Section --- */}
        <header className="space-y-6">
          {/* Breadcrumb & Back */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/lawyer-dashboard?view=cases")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#af9164] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cases
            </button>
          </div>

          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-3xl lg:text-4xl text-slate-900 leading-tight">
                  {caseData.title}
                </h1>
                <span className="font-mono text-[#af9164] text-sm bg-[#af9164]/10 px-2 py-1 rounded-sm">
                  {caseData.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={caseData.status}
                  priority={caseData.priority}
                />
                <span className="text-sm text-slate-500">
                  {caseData.category}
                </span>
              </div>
            </div>

            {/* Quick Actions - Now pushed to the right on large screens */}
            <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:ml-auto">
              <QuickActionButton 
                icon={MessageSquare} 
                label="Message Client" 
                onClick={() => router.push(`/lawyer-dashboard/communication?caseId=${caseData.id}`)} // Changed _id to id
              />
              <QuickActionButton 
                icon={Upload} 
                label="Upload Doc" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <QuickActionButton
                icon={Edit3}
                label="Update Status"
                variant="primary"
              />
              {!isCaseClosed && (
                <QuickActionButton
                  icon={Archive}
                  label="Close Matter"
                  variant="danger"
                  onClick={() => setShowCloseModal(true)}
                />
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <StatCard
              label="Hours Active"
              value={`${Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(caseData.createdAt).getTime()) /
                    (1000 * 60 * 60),
                ),
              )}h`}
              subtext={`Since ${format(new Date(caseData.createdAt), "MMM d, yyyy")}`}
              icon={Clock}
            />
            <StatCard
              label="Documents"
              value={String(caseData.documents.length)}
              subtext={`${caseData.documents.length} files`}
              icon={FileText}
            />
            <StatCard
              label="Days Active"
              value={`${Math.max(1, Math.floor((Date.now() - new Date(caseData.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} days`}
              subtext={`Since ${format(new Date(caseData.createdAt), "MMM d")}`}
              icon={Calendar}
            />
            <StatCard
              label="Billing"
              value={`$${caseData.timeEntries
                .reduce((s, e) => s + (e.hours || 0) * (e.rate || 0), 0)
                .toLocaleString()}`}
              subtext={
                caseData.timeEntries.length
                  ? `${caseData.timeEntries.length} entries`
                  : "$0"
              }
              icon={DollarSign}
            />
          </div>
        </header>

        {/* --- Tabs Navigation --- */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                count={tab.count}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* --- Tab Content --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab 
                caseData={caseData} 
                stageUpdating={stageUpdating}
                CASE_STAGES={CASE_STAGES}
                updateStage={updateStage}
              />
            )}
            {activeTab === "documents" && (
              <DocumentsTab documents={caseData.documents} uploaderNames={uploaderNames} />
            )}
            {activeTab === "time" && (
              <TimeTrackingTab entries={caseData.timeEntries} />
            )}
            {activeTab === "billing" && (
              <BillingTab ledger={caseData.billing_ledger || []} onAddCharge={handleAddCharge} loading={false} />
            )}
            {activeTab === "notes" && (
              <NotesTab notes={caseData.notes} onAddNote={handleAddNote} />
            )}
            {activeTab === "activity" && (
              <ActivityTab activities={caseData.activities} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* --- Footer --- */}
        <div className="text-center pt-12 pb-6">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            LegalSphere Lawyer Portal • Case {caseData.id} • Confidential
            Attorney-Client Privileged
          </p>
        </div>
      </div>

      {/* ═══ CLOSE MATTER – Premium Modal ═══ */}
      <AnimatePresence>
        {showCloseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isClosing && setShowCloseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#1a2238] to-[#2d3a5e]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#af9164]/20 flex items-center justify-center">
                      <Archive className="w-4.5 h-4.5 text-[#af9164]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-white leading-tight">Close Matter</h3>
                      <p className="text-xs text-slate-300/70 mt-0.5">
                        Case {caseData.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => !isClosing && setShowCloseModal(false)}
                    className="p-1.5 rounded-lg text-slate-300/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <span className="font-semibold">Please note:</span> Closing this matter will archive all conversations, cancel pending appointments, and notify the client. This action cannot be undone.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Closing Remarks <span className="text-[#af9164]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={closingRemarks}
                    onChange={(e) => setClosingRemarks(e.target.value)}
                    placeholder="Provide a brief summary of the case outcome..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-sm p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#af9164]/20 focus:border-[#af9164]/40 transition-all"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    disabled={isClosing}
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isClosing || !closingRemarks.trim()}
                    onClick={handleCloseMatter}
                    className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-[#1a2238] text-white hover:bg-[#2d3a5e] shadow-lg shadow-[#1a2238]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isClosing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : "Confirm Closure"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
