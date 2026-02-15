"use client";

import { useState, useEffect } from "react";
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
}

// --- Mock Data ---
const MOCK_CASE: CaseDetail = {
  id: "CASE-2024-0042",
  title: "Corporate Merger Review - TechCorp Acquisition",
  description:
    "Comprehensive legal review of TechCorp's acquisition of StartupXYZ. Due diligence on intellectual property, employment agreements, and regulatory compliance. Requires thorough examination of all material contracts and potential liability exposures.",
  status: "active",
  category: "Corporate Law",
  priority: "high",
  client: {
    id: "CLI-001",
    fullName: "Michael Chen",
    email: "m.chen@techcorp.com",
    phone: "+1 (415) 555-0123",
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-20T14:22:00Z",
  dueDate: "2024-02-28T17:00:00Z",
  estimatedHours: 120,
  totalLoggedHours: 47.5,
  documents: [
    {
      id: "DOC-001",
      name: "Letter of Intent - TechCorp.pdf",
      type: "PDF",
      size: "2.4 MB",
      uploadedAt: "2024-01-15T11:00:00Z",
      uploadedBy: "Michael Chen",
      category: "contract",
    },
    {
      id: "DOC-002",
      name: "IP Assignment Agreements.zip",
      type: "ZIP",
      size: "15.8 MB",
      uploadedAt: "2024-01-16T09:30:00Z",
      uploadedBy: "Sarah Jenkins",
      category: "contract",
    },
    {
      id: "DOC-003",
      name: "Due Diligence Checklist.xlsx",
      type: "XLSX",
      size: "485 KB",
      uploadedAt: "2024-01-18T16:45:00Z",
      uploadedBy: "You",
      category: "other",
    },
  ],
  timeEntries: [
    {
      id: "TIME-001",
      date: "2024-01-15",
      description: "Initial client consultation and scope review",
      hours: 2.5,
      rate: 450,
      billable: true,
    },
    {
      id: "TIME-002",
      date: "2024-01-16",
      description: "Review of Letter of Intent and preliminary documents",
      hours: 4.0,
      rate: 450,
      billable: true,
    },
    {
      id: "TIME-003",
      date: "2024-01-17",
      description: "IP portfolio analysis and risk assessment",
      hours: 6.5,
      rate: 450,
      billable: true,
    },
  ],
  activities: [
    {
      id: "ACT-001",
      type: "status_change",
      description: "Case status changed from 'Pending' to 'Active'",
      timestamp: "2024-01-15T11:00:00Z",
      actor: "Sarah Jenkins",
    },
    {
      id: "ACT-002",
      type: "document_upload",
      description: "Uploaded 'IP Assignment Agreements' (12 files)",
      timestamp: "2024-01-16T09:30:00Z",
      actor: "Sarah Jenkins",
    },
    {
      id: "ACT-003",
      type: "time_logged",
      description: "Logged 6.5 hours - IP portfolio analysis",
      timestamp: "2024-01-17T18:00:00Z",
      actor: "You",
    },
  ],
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
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
}) => {
  const variants = {
    default: "bg-white border-slate-200 text-slate-700 hover:border-[#af9164]",
    primary: "bg-[#1a2238] border-[#1a2238] text-white hover:bg-[#2d3a5e]",
    danger: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 border rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-sm",
        variants[variant],
      )}
    >
      <Icon className="w-3.5 h-3.5" />
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

const OverviewTab = ({ caseData }: { caseData: CaseDetail }) => (
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

const DocumentsTab = ({ documents }: { documents: Document[] }) => (
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
                  by {doc.uploadedBy}
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

// --- Main Component ---

export default function LawyerCaseDetailView({ caseId }: { caseId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [caseData, setCaseData] = useState<CaseDetail>(MOCK_CASE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

          // Map backend case shape to CaseDetail used by this component
          const mapped: CaseDetail = {
            id: apiCase?.id || apiCase?._id || caseId,
            title: apiCase?.case?.title || apiCase?.title || MOCK_CASE.title,
            description:
              apiCase?.case?.description ||
              apiCase?.description ||
              MOCK_CASE.description,
            status:
              (apiCase?.status && String(apiCase.status).toLowerCase()) ||
              (apiCase?.rawStatus as string) ||
              MOCK_CASE.status,
            category:
              apiCase?.case?.category ||
              apiCase?.category ||
              MOCK_CASE.category,
            priority:
              (apiCase?.case?.urgency &&
                String(apiCase.case.urgency).toLowerCase()) ||
              (apiCase?.priority && String(apiCase.priority).toLowerCase()) ||
              MOCK_CASE.priority,
            client: {
              id:
                apiCase?.client?.id ||
                apiCase?.client?._id ||
                apiCase?.client?.email ||
                MOCK_CASE.client.id,
              fullName:
                apiCase?.client?.name ||
                apiCase?.client?.fullName ||
                MOCK_CASE.client.fullName,
              email: apiCase?.client?.email || MOCK_CASE.client.email,
              phone: apiCase?.client?.phone || MOCK_CASE.client.phone,
              avatar: apiCase?.client?.avatar,
            },
            createdAt: apiCase?.createdAt || MOCK_CASE.createdAt,
            updatedAt: apiCase?.updatedAt || MOCK_CASE.updatedAt,
            dueDate:
              apiCase?.case?.dueDate || apiCase?.dueDate || MOCK_CASE.dueDate,
            estimatedHours:
              apiCase?.case?.estimatedHours ||
              apiCase?.estimatedHours ||
              MOCK_CASE.estimatedHours,
            totalLoggedHours: apiCase?.timeEntries
              ? apiCase.timeEntries.reduce(
                  (s: number, e: any) => s + (e.hours || 0),
                  0,
                )
              : MOCK_CASE.totalLoggedHours,
            documents: apiCase?.documents || MOCK_CASE.documents,
            timeEntries: apiCase?.timeEntries || MOCK_CASE.timeEntries,
            notes: apiCase?.notes || MOCK_CASE.notes,
            activities: apiCase?.activities || MOCK_CASE.activities,
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

  const tabs = [
    { id: "overview", label: "Overview", count: undefined },
    { id: "documents", label: "Documents", count: caseData.documents.length },
    { id: "time", label: "Time Tracking", count: caseData.timeEntries.length },
    { id: "notes", label: "Notes", count: caseData.notes?.length || 0 },
    { id: "activity", label: "Activity", count: caseData.activities.length },
  ];

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-[#efefec] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#af9164] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading case details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-[#af9164]/30 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto p-6 lg:p-8 space-y-6">
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
              <QuickActionButton icon={MessageSquare} label="Message Client" />
              <QuickActionButton icon={Upload} label="Upload Doc" />
              <QuickActionButton icon={Clock} label="Log Time" />
              <QuickActionButton
                icon={Edit3}
                label="Update Status"
                variant="primary"
              />
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
            {activeTab === "overview" && <OverviewTab caseData={caseData} />}
            {activeTab === "documents" && (
              <DocumentsTab documents={caseData.documents} />
            )}
            {activeTab === "time" && (
              <TimeTrackingTab entries={caseData.timeEntries} />
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
    </div>
  );
}
