"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  User,
  UsersRound,
  ChevronLeft,
  MoreHorizontal,
  Filter,
  Download,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

// --- Design Tokens (align with MyCasesView theme) ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";

export default function CasesView() {
  // --- STATE MANAGEMENT ---
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState("");

  // Drawer state
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [classifyFullscreen, setClassifyFullscreen] = useState(false);
  const [drawerAnim, setDrawerAnim] = useState("none");
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  // Drawer Layout State
  const [isLeftColumnCollapsed, setIsLeftColumnCollapsed] = useState(false);
  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = useState(false);

  // AI Logic State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPhaseIdx, setAiPhaseIdx] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiResult, setAiResult] = useState(null);

  // Selection State
  const [overrideCategory, setOverrideCategory] = useState("");
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [expandedLawyerId, setExpandedLawyerId] = useState("");
  const [showLawyerDetails, setShowLawyerDetails] = useState(false);

  // Local UI controls
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- REAL DATA FETCHING LOGIC ---
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingApps(true);
        setAppsError("");
        const res = await fetch("/api/admin/case-requests?limit=10");
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const serverMsg =
            data && (data.error || data.message)
              ? String(data.error || data.message)
              : "";
          const detail = serverMsg ? `: ${serverMsg}` : "";
          throw new Error(
            `Failed to load applications (${res.status})${detail}`,
          );
        }
        if (!ignore) setApps(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        if (!ignore) setAppsError(e?.message || "Failed to load applications");
      } finally {
        if (!ignore) setLoadingApps(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // --- AI CLASSIFICATION LOGIC ---
  async function startAILoad() {
    if (!selectedApp) return;

    setAiPhaseIdx(0);
    setAiProgress(0);
    setAiResult(null);

    // Progress bar simulation
    let p = 0;
    const progressTimer = setInterval(() => {
      p = Math.min(100, p + Math.random() * 7 + 2);
      setAiProgress(p);
    }, 180);

    // Phase text simulation
    let phase = 0;
    const phases = [
      "Analyzing case context…",
      "Reviewing legal documents…",
      "Generating classification insights…",
    ];
    const phaseTimer = setInterval(() => {
      phase = Math.min(phases.length - 1, phase + 1);
      setAiPhaseIdx(phase);
    }, 1600);

    try {
      // 1. Fetch document content from R2
      const desc = String(selectedApp?.case?.description || "");
      const docs = Array.isArray(selectedApp?.documents)
        ? selectedApp.documents
        : [];
      const toTry = docs.slice(0, 2);
      const texts = [];

      for (const d of toTry) {
        try {
          if (!d?.url) continue;
          if (/\.txt($|\?)/i.test(d.url)) {
            const r = await fetch(d.url);
            if (!r.ok) continue;
            const t = await r.text();
            texts.push(`\n\n[Attached Document]\n${t}`);
          }
        } catch {
          /* ignore */
        }
      }

      const combined = (desc + (texts.join(" ") || "")).slice(0, 20000);

      if (!combined && !selectedApp?.case?.title)
        throw new Error("No case content available");

      // 2. Call BART classification API
      const res = await fetch("/api/admin/classify-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case: {
            title: selectedApp?.case?.title || "",
            description: combined || selectedApp?.case?.title,
          },
          excludedLawyerIds: selectedApp?.deniedLawyerIds || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Classification failed");

      // 3. Set the result and defaults
      setAiResult(data);
      if (data.predictions && data.predictions.length > 0) {
        setOverrideCategory(data.predictions[0].label);
      }
    } catch (err) {
      console.error("Classification error:", err);
      setAiResult({
        error: true,
        message: err.message || "Classification failed - Model unavailable",
      });
    } finally {
      clearInterval(progressTimer);
      clearInterval(phaseTimer);
      setAiLoading(false);
    }
  }

  function handleClassify(id) {
    const app = apps.find((a) => String(a.id || a._id) === id);
    setSelectedAppId(id);
    setSelectedApp(app);

    // Reset Drawer State
    setOverrideCategory("");
    setSelectedLawyerId("");
    setExpandedLawyerId("");
    setShowLawyerDetails(false);
    setIsLeftColumnCollapsed(true); // Default to focused AI view
    setIsRightColumnCollapsed(false);

    setAiResult(null);
    setAiLoading(true);

    setClassifyOpen(true);
    setClassifyFullscreen(false);
    setDrawerAnim("none");

    startAILoad();
  }

  function onCancelClassify() {
    setClassifyOpen(false);
    setClassifyFullscreen(false);
    setSelectedAppId(null);
    setAiLoading(false);
    setAiResult(null);
  }

  function onReanalyze() {
    setAiLoading(true);
    startAILoad();
  }

  async function onConfirmAssign() {
    if (!selectedLawyerId || !selectedAppId) return;

    const lawyer = aiResult?.topLawyers?.find(
      (l) => l.lawyer_id === selectedLawyerId,
    );
    if (!lawyer) {
      alert("Selected lawyer details not found.");
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/case-requests/${selectedAppId}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lawyerId: lawyer.lawyer_id,
            lawyerName: lawyer.lawyer_name,
          }),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to assign case");
      }

      // Success: optimistic update or refresh
      // Remove assigned case from list or update status
      setApps((prev) =>
        prev.map((a) => {
          if (String(a.id || a._id) === selectedAppId) {
            return {
              ...a,
              status: "lawyer_assigned",
              assignedLawyer: {
                id: lawyer.lawyer_id,
                name: lawyer.lawyer_name,
              },
            };
          }
          return a;
        }),
      );

      // Close drawer
      setClassifyOpen(false);
      alert(`Case assigned to ${lawyer.lawyer_name} successfully.`);
    } catch (error) {
      console.error("Assign Error:", error);
      alert(`Failed to assign: ${error.message}`);
    }
  }

  function handleLawyerSelect(lawyerId) {
    if (selectedLawyerId === lawyerId) {
      setSelectedLawyerId("");
      setExpandedLawyerId("");
      setShowLawyerDetails(false);
    } else {
      setSelectedLawyerId(lawyerId);
      setExpandedLawyerId(lawyerId);
      setShowLawyerDetails(false);
    }
  }

  function handleLawyerInfo(lawyerId) {
    if (selectedLawyerId === lawyerId) {
      setShowLawyerDetails(!showLawyerDetails);
    }
  }

  function handleCloseLawyerDetails() {
    setShowLawyerDetails(false);
  }

  function handleCancelSelection() {
    setSelectedLawyerId("");
    setExpandedLawyerId("");
    setShowLawyerDetails(false);
  }

  async function handleRejectCase(caseId) {
    if (
      !confirm(
        "Are you sure you want to reject this case? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/case-requests/${caseId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: "Case rejected by administrator",
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to reject case");
      }

      // Refresh the cases list
      const refreshRes = await fetch("/api/admin/case-requests?limit=10");
      const data = await refreshRes.json();
      if (refreshRes.ok) {
        setApps(Array.isArray(data?.items) ? data.items : []);
      }
    } catch (err) {
      console.error("Error rejecting case:", err);
      alert(err.message || "Failed to reject case");
    }
  }

  const panelAnimClass = useMemo(
    () =>
      drawerAnim === "expand"
        ? "ls-anim-expand"
        : drawerAnim === "collapse"
          ? "ls-anim-collapse"
          : "",
    [drawerAnim],
  );

  return (
    <>
      <div className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-[#af9164]/30 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-end border-b-2 border-slate-900 pb-6 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
              </div>
              <h1 className="font-serif text-4xl text-slate-900 leading-tight">
                Admin Case Intake <br className="hidden sm:block" />
                <span className="italic text-slate-500">Dashboard</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden lg:flex gap-8 mr-8">
                <div className="flex flex-col border-l-2 border-slate-200 pl-6 first:border-0 first:pl-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Open Intakes
                  </span>
                  <span className="font-serif text-2xl text-slate-900">
                    {
                      apps.filter((a) => (a.status || "pending") !== "rejected")
                        .length
                    }
                  </span>
                </div>
                <div className="flex flex-col border-l-2 border-slate-200 pl-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Pending AI
                  </span>
                  <span className="font-serif text-2xl text-slate-900">
                    {
                      apps.filter((a) => !a.status || a.status === "pending")
                        .length
                    }
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                  <Filter size={12} /> Filter
                </button>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                  <Download size={12} /> Export
                </button>
              </div>
            </div>
          </header>

          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8 w-full md:w-auto border-b border-slate-200 pb-px overflow-x-auto">
              {["all", "pending", "classification", "assigned", "rejected"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterStatus(tab)}
                    className={cn(
                      "pb-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap relative",
                      filterStatus === tab
                        ? "text-[#1a2238]"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#af9164] transition-colors" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Case ID, Title, or Client..."
                className="w-full bg-transparent border-b border-slate-300 pl-8 py-2 text-sm focus:outline-none focus:border-[#1a2238] transition-colors placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {loadingApps && (
              <div className="col-span-3 flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                  <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 italic mb-2">
                  Loading Intake
                </h3>
                <p className="text-slate-500 text-sm">
                  Please wait while we fetch new case applications...
                </p>
              </div>
            )}

            {!loadingApps && appsError && (
              <div className="col-span-3 p-8 text-center text-xs text-red-500">
                {appsError}
              </div>
            )}

            {!loadingApps && !appsError && apps.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-lg">
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                  <Filter className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 italic mb-2">
                  No Intake Records
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  There are currently no case applications in the intake queue.
                </p>
              </div>
            )}

            {!loadingApps &&
              !appsError &&
              apps.map((a) => {
                // basic filtering (search + tab)
                const matchesSearch =
                  !searchTerm ||
                  (
                    String(a.id || a._id) +
                    " " +
                    (a.case?.title || "") +
                    " " +
                    (a.client?.fullName || "")
                  )
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());
                if (!matchesSearch) return null;
                if (
                  filterStatus === "pending" &&
                  (a.status || "pending") !== "pending"
                )
                  return null;
                if (
                  filterStatus === "assigned" &&
                  a.status !== "lawyer_assigned"
                )
                  return null;
                if (filterStatus === "rejected" && a.status !== "rejected")
                  return null;

                const topColor =
                  a.status === "Completed"
                    ? "#163020"
                    : a.status === "rejected"
                      ? "#7a1d1d"
                      : a.status === "lawyer_assigned"
                        ? "#92784e"
                        : "#2d3648";

                return (
                  <div
                    key={a.id || a._id}
                    className="group relative bg-white flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-2"
                    style={{
                      boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div
                      className="h-1 w-full"
                      style={{ background: topColor }}
                    />

                    <div className="p-8 flex flex-col h-full relative overflow-hidden border border-t-0 border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start mb-4 z-10">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "text-[8px] font-bold uppercase tracking-[0.2em] px-2.5 py-1.5 border transition-colors",
                              a.status === "rejected"
                                ? "text-red-600 border-red-200 bg-red-50"
                                : "text-slate-500 border-slate-200 bg-slate-50",
                            )}
                          >
                            {a.status || "Pending"}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                handleClassify(String(a.id || a._id))
                              }
                              className="cursor-pointer text-xs font-medium"
                            >
                              <span className="text-[#af9164]">✦</span> &nbsp;
                              AI Analysis & Assign
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-xs">
                              View Documents
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleRejectCase(String(a.id || a._id))
                              }
                              className="cursor-pointer text-xs text-red-600"
                            >
                              Reject Case
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mb-6 z-10">
                        <h3 className="font-serif text-2xl text-slate-900 leading-tight group-hover:text-[#af9164] transition-colors mb-2 line-clamp-2">
                          {a.case?.title || "Untitled Case"}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="font-mono text-[10px] text-slate-400">
                            {String(a.id || a._id).substring(0, 10)}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                            {a.case?.category || "Uncategorized"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-50 z-10 mt-auto">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.15em]">
                            Client
                          </span>
                          <div className="text-xs font-medium text-slate-700">
                            {a.client?.fullName || "—"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.15em]">
                            Submitted
                          </span>
                          <div className="text-xs text-slate-600">
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleDateString()
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-6 right-6 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#af9164]">
                          Manage Case
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="text-center pt-12">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              LegalSphere Admin • Intake Queue
            </p>
          </div>
        </div>
      </div>

      {/* AI DRAWER PORTAL (Untouched from Version 1) */}
      {classifyOpen && typeof document !== "undefined"
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                onClick={onCancelClassify}
              />
              <div
                role="dialog"
                aria-modal="true"
                className={
                  classifyFullscreen
                    ? "fixed inset-0 z-50 h-screen w-screen shadow-2xl"
                    : "fixed right-0 top-0 z-50 h-screen w-full sm:w-[560px] md:w-[640px] shadow-2xl"
                }
              >
                <div
                  className={`ai-drawer-root relative h-full bg-[rgb(10,10,10)] text-zinc-100 ${panelAnimClass} isolate`}
                  style={{
                    boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
                    willChange: "transform, opacity",
                    transformOrigin: "right center",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* gold edge */}
                  <div
                    className="absolute left-0 top-0 h-full w-[1px]"
                    style={{
                      background: "linear-gradient(180deg,#d4af37,#7a5c0a)",
                    }}
                  />
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                        LegalSphere
                      </p>
                      <h3 className="text-lg font-semibold">
                        AI-Assisted Case Review
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onReanalyze}
                        className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900"
                      >
                        Re-analyze
                      </button>
                      <button
                        onClick={() =>
                          setClassifyFullscreen((v) => {
                            const next = !v;
                            setDrawerAnim(next ? "expand" : "collapse");
                            if (next) setIsRightColumnCollapsed(false);
                            setTimeout(() => setDrawerAnim("none"), 820);
                            return next;
                          })
                        }
                        className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900"
                      >
                        {classifyFullscreen ? "Collapse" : "Expand"}
                      </button>
                      <button
                        onClick={onCancelClassify}
                        className="rounded px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  {/* Body split */}
                  <div
                    className="grid h-[calc(100%-56px)]"
                    style={{
                      gridTemplateColumns: classifyFullscreen
                        ? isLeftColumnCollapsed
                          ? "48px 1fr"
                          : "minmax(320px,480px) 1fr"
                        : isRightColumnCollapsed
                          ? "1fr 48px"
                          : isLeftColumnCollapsed
                            ? "48px 1fr"
                            : "minmax(280px,420px) 1fr",
                    }}
                  >
                    {/* LEFT: Case Context */}
                    <div
                      className={`relative border-b md:border-b-0 md:border-r border-zinc-800 overflow-y-auto no-scrollbar transition-all duration-300 ${isLeftColumnCollapsed ? "px-2" : "p-6"}`}
                    >
                      {/* Collapse Toggle */}
                      <div className="sticky top-0 z-10 flex items-center justify-end py-2 bg-[rgb(10,10,10)]/80 backdrop-blur-sm">
                        <button
                          onClick={() => {
                            if (!classifyFullscreen) {
                              if (isLeftColumnCollapsed) {
                                setIsLeftColumnCollapsed(false);
                                setIsRightColumnCollapsed(true);
                              } else {
                                setIsLeftColumnCollapsed(true);
                                setIsRightColumnCollapsed(false);
                              }
                            } else {
                              setIsLeftColumnCollapsed(!isLeftColumnCollapsed);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-[12px] text-zinc-300 hover:bg-zinc-900 transition-colors"
                        >
                          <ChevronLeft
                            className={`h-3.5 w-3.5 transition-transform duration-300 ${isLeftColumnCollapsed ? "rotate-180" : ""}`}
                          />
                          {!isLeftColumnCollapsed && <span>AI</span>}
                        </button>
                      </div>
                      <div
                        className={`space-y-6 transition-all duration-300 ${isLeftColumnCollapsed ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}`}
                      >
                        {/* Client Info */}
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800">
                            <User className="h-4 w-4 text-zinc-400" />
                          </span>
                          <div className="leading-tight">
                            <p className="text-sm text-zinc-400">Client</p>
                            <p className="font-medium">
                              {selectedApp?.client?.fullName ?? "—"}
                            </p>
                          </div>
                        </div>

                        {/* Case Title & Description */}
                        <div>
                          <p className="text-sm text-zinc-400 mb-1">
                            Case Title
                          </p>
                          <p className="font-medium">
                            {selectedApp?.case?.title ?? "—"}
                          </p>
                          {selectedApp?.case?.description && (
                            <p className="mt-1 text-sm text-zinc-300/80 leading-relaxed">
                              {selectedApp?.case?.description}
                            </p>
                          )}
                        </div>

                        {/* Documents Section */}
                        <div>
                          <p className="text-sm text-zinc-400 mb-2">
                            Documents
                          </p>
                          <div className="space-y-2">
                            {(selectedApp?.documents ?? []).map((d, i) => (
                              <div
                                key={`doc-${i}`}
                                className="flex items-center justify-between rounded-lg bg-zinc-950/60 ring-1 ring-zinc-800 px-3 py-2"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-zinc-900 ring-1 ring-zinc-800">
                                    <FileText className="h-4 w-4 text-zinc-400" />
                                  </span>
                                  <div className="leading-tight">
                                    <p className="text-sm font-medium text-zinc-200 truncate max-w-[160px]">
                                      {d.name || d.key || `Document ${i + 1}`}
                                    </p>
                                    <p className="text-[11px] text-zinc-500">
                                      {(d.key || "")
                                        .split(".")
                                        .pop()
                                        ?.toUpperCase() || "FILE"}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={d.url || "#"}
                                  download={String(
                                    d.name || d.key || `document-${i + 1}`,
                                  )}
                                  rel="noreferrer"
                                  onClick={(e) => {
                                    if (!d.url) e.preventDefault();
                                  }}
                                  className="text-xs text-amber-400 hover:text-amber-300"
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                            {(selectedApp?.documents ?? []).length === 0 && (
                              <div className="text-sm text-zinc-500">
                                No documents uploaded.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reference ID & Metadata */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-2">
                          <div>
                            <p className="text-zinc-400">Reference ID</p>
                            <p className="font-medium break-all font-mono text-[13px]">
                              {String(
                                selectedApp?.id || selectedApp?._id || "—",
                              ).substring(0, 10)}
                              ...
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Submitted</p>
                            <p className="font-medium">
                              {selectedApp?.createdAt
                                ? new Date(
                                    selectedApp.createdAt,
                                  ).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium ring-1 ring-zinc-800">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: "#d4af37" }}
                            />
                            Pending Classification
                          </span>
                        </div>
                      </div>
                      {/* Collapsed Label */}
                      {isLeftColumnCollapsed && (
                        <div className="absolute inset-0 flex items-center justify-center select-none">
                          <span className="text-[10px] tracking-widest text-zinc-500 rotate-[-90deg]">
                            CASE INFO
                          </span>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: AI-Assisted Classification */}
                    <div
                      className={`relative border-l border-zinc-800 overflow-y-auto transition-all duration-300 ${isRightColumnCollapsed ? "px-2" : "p-6"}`}
                    >
                      <div
                        className={`transition-all duration-300 ${isRightColumnCollapsed ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}`}
                      >
                        {aiLoading && (
                          <AILoadingScene
                            phaseIdx={aiPhaseIdx}
                            progress={aiProgress}
                          />
                        )}
                        {!aiLoading && aiResult && (
                          <div className="space-y-6">
                            {aiResult.error ? (
                              <section className="text-center py-8">
                                <div className="rounded-lg bg-red-900/20 border border-red-800/50 p-6">
                                  <h4 className="text-lg font-semibold text-red-400 mb-2">
                                    Classification Failed
                                  </h4>
                                  <p className="text-sm text-red-300">
                                    {aiResult.message}
                                  </p>
                                  <button
                                    onClick={onReanalyze}
                                    className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-black bg-amber-500 hover:bg-amber-400"
                                  >
                                    Try Again
                                  </button>
                                </div>
                              </section>
                            ) : (
                              <>
                                <section>
                                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
                                    AI suggests — Admin decides
                                  </p>
                                  <h4 className="mt-1 text-xl font-semibold">
                                    Classification
                                  </h4>
                                  <div className="mt-4 space-y-3">
                                    <div className="text-sm text-zinc-300">
                                      Case Category
                                    </div>
                                    {aiResult.predictions &&
                                    aiResult.predictions.length > 0 ? (
                                      <div className="rounded-md bg-zinc-950/60 px-3 py-2 ring-1 ring-zinc-800">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium">
                                            {aiResult.predictions[0].label}
                                          </span>
                                          <span className="text-xs text-zinc-400">
                                            {(aiResult.predictions[0].score * 100).toFixed(1)}% confidence
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="rounded-md bg-zinc-950/60 px-3 py-2 ring-1 ring-zinc-800">
                                        <span className="text-sm text-zinc-500">
                                          No category available
                                        </span>
                                      </div>
                                    )}
                                    <div className="mt-2">
                                      {aiResult.predictions &&
                                        aiResult.predictions.length > 0 && (
                                          <ConfidenceBar
                                            value={
                                              aiResult.predictions[0].score *
                                              100
                                            }
                                          />
                                        )}
                                    </div>
                                  </div>
                                </section>

                                <section>
                                  <h4 className="text-base font-semibold">
                                    Suggested Lawyers
                                  </h4>
                                  {!selectedLawyerId && (
                                    <div className="flex pt-1 relative z-10">
                                      <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                        <UsersRound className="h-3.5 w-3.5" />
                                        <span>
                                          Select a lawyer to assign this case
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="mt-3 space-y-2">
                                    {aiResult.topLawyers.map((l) => {
                                      const isSelected =
                                        selectedLawyerId === l.lawyer_id;
                                      const isDeemphasized =
                                        selectedLawyerId && !isSelected;

                                      return (
                                        <div
                                          key={l.lawyer_id}
                                          className="transition-all duration-300"
                                        >
                                          {showLawyerDetails && isSelected ? (
                                            // Details view for selected lawyer
                                            <div className="rounded-lg bg-zinc-900/80 ring-1 ring-amber-500/30 p-4">
                                              <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/50 text-[13px] font-semibold text-amber-300">
                                                    {getInitials(l.lawyer_name)}
                                                  </span>
                                                  <div>
                                                    <h5 className="text-base font-semibold text-amber-100">
                                                      {l.lawyer_name}
                                                    </h5>
                                                    <p className="text-sm text-zinc-400">
                                                      Score:{" "}
                                                      {l.total.toFixed(2)} |
                                                      Success:{" "}
                                                      {(
                                                        l.success_rate * 100
                                                      ).toFixed(0)}
                                                      % |{" "}
                                                      {l.years_experience ||
                                                        "N/A"}{" "}
                                                      years
                                                    </p>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={
                                                    handleCloseLawyerDetails
                                                  }
                                                  className="h-6 w-6 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-center"
                                                >
                                                  ×
                                                </button>
                                              </div>

                                              <div className="space-y-3 text-sm">
                                                <div>
                                                  <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                                                    Practice Areas
                                                  </span>
                                                  <p className="mt-1 text-zinc-200">
                                                    {l.case_types.join(", ")}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                                                    Case History
                                                  </span>
                                                  <p className="mt-1 text-zinc-200 text-xs leading-relaxed">
                                                    {l.case_history_summary ||
                                                      "No case history available"}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">
                                                    Experience
                                                  </span>
                                                  <p className="mt-1 text-zinc-200 text-xs">
                                                    {l.years_experience ||
                                                      "N/A"}{" "}
                                                    years
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            // Normal list view
                                            <label
                                              className={`
                                              flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer
                                              transition-all duration-300 ease-out
                                              ${isSelected ? "bg-zinc-900/80 ring-1 ring-amber-500/30 shadow-lg" : "bg-zinc-950/60 ring-1 ring-zinc-800 hover:bg-zinc-900/40"}
                                              ${isDeemphasized ? "opacity-50" : "opacity-100"}
                                            `}
                                            >
                                              <div className="flex items-center gap-3">
                                                <span
                                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300 ${isSelected ? "bg-amber-500/20 ring-1 ring-amber-500/50 text-amber-300" : "bg-zinc-900 ring-1 ring-zinc-800 text-zinc-400"}`}
                                                >
                                                  {getInitials(l.lawyer_name)}
                                                </span>
                                                <div className="leading-tight">
                                                  <p
                                                    className={`text-sm font-medium transition-colors duration-300 ${isSelected ? "text-amber-100" : "text-zinc-200"}`}
                                                  >
                                                    {l.lawyer_name}
                                                  </p>
                                                  <p className="text-[11px] text-zinc-500">
                                                    Score: {l.total.toFixed(2)}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {isSelected &&
                                                  !showLawyerDetails && (
                                                    <button
                                                      onClick={() =>
                                                        handleLawyerInfo(
                                                          l.lawyer_id,
                                                        )
                                                      }
                                                      className="h-6 px-2 rounded-full border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 hover:text-amber-300 transition-all duration-300 flex items-center justify-center text-[10px] font-medium"
                                                    >
                                                      Info
                                                    </button>
                                                  )}
                                                <input
                                                  type="radio"
                                                  name="lawyer"
                                                  checked={isSelected}
                                                  onChange={() =>
                                                    handleLawyerSelect(
                                                      l.lawyer_id,
                                                    )
                                                  }
                                                  className="h-4 w-4 accent-amber-400"
                                                />
                                              </div>
                                            </label>
                                          )}
                                          {/* Action buttons - only show for selected lawyer */}
                                          {isSelected && (
                                            <div className="mt-2 flex justify-end gap-2 animate-in slide-in-from-top-2 duration-300">
                                              <button
                                                onClick={handleCancelSelection}
                                                className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900 transition-colors"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                onClick={onConfirmAssign}
                                                className="rounded px-3 py-1.5 text-sm font-medium text-black transition-all duration-300 hover:shadow-lg"
                                                style={{
                                                  background:
                                                    "linear-gradient(180deg,#d4af37,#b9921f)",
                                                }}
                                                disabled={
                                                  !overrideCategory ||
                                                  !selectedLawyerId
                                                }
                                              >
                                                Confirm & Assign
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </section>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Collapsed Label */}
                      {isRightColumnCollapsed && (
                        <div className="absolute inset-0 flex items-center justify-center select-none">
                          <span className="text-[10px] tracking-widest text-zinc-500 rotate-[-90deg] whitespace-nowrap">
                            AI CLASSIFY
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}

      {/* Inline styles for bounce animation and theme isolation */}
      <style>{`
        @keyframes lsDrawerExpand {
          0% { transform: scale(0.992) translateX(6px); opacity: 0.96; }
          55% { transform: scale(1.008) translateX(0); opacity: 1; }
          85% { transform: scale(0.999); }
          100% { transform: scale(1); }
        }
        @keyframes lsDrawerCollapse {
          0% { transform: scale(1.006); }
          40% { transform: scale(0.995) translateX(1px); }
          100% { transform: scale(1); }
        }
        .ls-anim-expand { animation: lsDrawerExpand 720ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ls-anim-collapse { animation: lsDrawerCollapse 560ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation-fill-mode: both; }
        .slide-in-from-top-2 { animation-name: slideInFromTop; animation-duration: 300ms; animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
        
        /* Theme isolation for AI drawer */
        .ai-drawer-root {
          background-color: rgb(10, 10, 10) !important;
          color: rgb(244, 244, 245) !important;
        }
        .ai-drawer-root button { color: inherit; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}

// --- HELPER COMPONENTS (From Version 1) ---

function getInitials(name) {
  const parts = String(name || "")
    .split(" ")
    .filter(Boolean);
  return (
    (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase()
  );
}

function ConfidenceBar({ value }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="w-full h-1.5 rounded bg-zinc-800 overflow-hidden">
      <div
        className="h-full"
        style={{
          width: `${v}%`,
          background: "linear-gradient(90deg,#7a5c0a,#d4af37)",
        }}
      />
      <div className="mt-2 text-xs text-zinc-400">
        {v.toFixed(1)}% confidence
      </div>
    </div>
  );
}

function AILoadingScene({ phaseIdx, progress }) {
  const phrases = [
    "Analyzing case context…",
    "Reviewing legal documents…",
    "Generating classification insights…",
  ];
  return (
    <div className="relative h-full min-h-[575px] rounded-xl bg-[rgb(8,8,8)] ring-1 ring-zinc-800 overflow-hidden">
      {/* abstract gold geometry */}
      <div className="absolute inset-0" aria-hidden>
        <div
          className="absolute -left-20 top-10 h-72 w-72 rounded-full opacity-20 blur-2xl"
          style={{
            background: "radial-gradient(closest-side,#d4af37,transparent)",
          }}
        />
        <div
          className="absolute right-[-60px] bottom-[-40px] h-80 w-80 rounded-full opacity-10 blur-2xl"
          style={{
            background: "radial-gradient(closest-side,#b9921f,transparent)",
          }}
        />
        {/* floating lines */}
        <div className="absolute inset-0 [perspective:900px]">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-px w-72 -translate-x-1/2 -translate-y-1/2 opacity-30"
              style={{
                background:
                  "linear-gradient(90deg,transparent,#d4af37,transparent)",
                transform: `translate3d(${(i - 6) * 18}px, ${(i % 3) * 22 - 30}px, 0) rotate(${i * 9}deg)`,
                filter: "drop-shadow(0 0 6px rgba(212,175,55,0.2))",
              }}
            />
          ))}
        </div>
      </div>
      {/* phrase */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          LegalSphere
        </p>
        <h4 className="mt-2 text-lg font-semibold">AI is preparing insights</h4>
        <p className="mt-2 text-sm text-zinc-300/90" key={phaseIdx}>
          {phrases[Math.min(phrases.length - 1, phaseIdx)]}
        </p>
        <div className="mt-6 w-full max-w-md">
          <div className="h-[2px] w-full overflow-hidden rounded bg-zinc-800">
            <div
              className="h-full"
              style={{
                width: `${Math.min(100, Math.floor(progress))}%`,
                background: "linear-gradient(90deg,#7a5c0a,#d4af37)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
