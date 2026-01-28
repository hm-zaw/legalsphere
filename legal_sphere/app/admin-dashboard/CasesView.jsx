"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Activity, BarChart3, Briefcase, FileText, LayoutDashboard, Settings, Users, User, UsersRound, ChevronLeft, MoreHorizontal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CasesView() {
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [classifyResults, setClassifyResults] = useState({});
  
  // Drawer state
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [classifyFullscreen, setClassifyFullscreen] = useState(false);
  const [drawerAnim, setDrawerAnim] = useState("none");
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isLeftColumnCollapsed, setIsLeftColumnCollapsed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPhaseIdx, setAiPhaseIdx] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [overrideCategory, setOverrideCategory] = useState("");
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [expandedLawyerId, setExpandedLawyerId] = useState("");
  const [showLawyerDetails, setShowLawyerDetails] = useState(false);
  const [isRightColumnCollapsed, setIsRightColumnCollapsed] = useState(false);

  function handleClassify(id) {
    const app = apps.find(a => String(a.id || a._id) === id);
    setSelectedAppId(id);
    setSelectedApp(app);
    setOverrideCategory("");
    setSelectedLawyerId("");
    setExpandedLawyerId("");
    setShowLawyerDetails(false);
    setAiResult(null);
    setAiLoading(true); // Set loading state immediately
    setClassifyOpen(true);
    setClassifyFullscreen(false);
    setIsLeftColumnCollapsed(true);
    setIsRightColumnCollapsed(false);
    setDrawerAnim("none");
    startAILoad();
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoadingApps(true);
        setAppsError("");
        const res = await fetch("/api/admin/case-requests?limit=10");
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
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

  const panelAnimClass = useMemo(() => (drawerAnim === "expand" ? "ls-anim-expand" : drawerAnim === "collapse" ? "ls-anim-collapse" : ""), [drawerAnim]);

  async function startAILoad() {
    if (!selectedApp) return;
    
    // aiLoading is already set to true in handleClassify
    // setAiLoading(true);
    setAiPhaseIdx(0);
    setAiProgress(0);
    setAiResult(null);
    
    let p = 0;
    const phases = [
      "Analyzing case context…",
      "Reviewing legal documents…",
      "Generating classification insights…",
    ];
    const progressTimer = setInterval(() => {
      p = Math.min(100, p + Math.random() * 7 + 2);
      setAiProgress(p);
    }, 180);
    let phase = 0;
    const phaseTimer = setInterval(() => {
      phase = Math.min(phases.length - 1, phase + 1);
      setAiPhaseIdx(phase);
    }, 1600);

    try {
      // Fetch document content from R2
      const desc = String(selectedApp?.case?.description || "");
      const docs = Array.isArray(selectedApp?.documents) ? selectedApp.documents : [];
      const toTry = docs.slice(0, 2);
      const texts = [];
      
      for (const d of toTry) {
        try {
          if (!d?.url) continue;
          // Best-effort: only fetch text files to avoid heavy parsing
          if (/\.txt($|\?)/i.test(d.url)) {
            const r = await fetch(d.url);
            if (!r.ok) continue;
            const t = await r.text();
            texts.push(`\n\n[Attached Document]\n${t}`);
          }
        } catch {
          // Continue if document fetch fails
        }
      }
      
      const combined = (desc + (texts.join(" ") || "")).slice(0, 20000);
      
      if (!combined) {
        throw new Error("No case description or documents available for classification");
      }

      // Call BART classification API
      const res = await fetch("/api/dev/test-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          case: { 
            title: selectedApp?.case?.title || "", 
            description: combined 
          } 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Classification failed");
      
      // Set the result from BART model
      setAiResult(data);
      
      // Set default values for UI
      if (data.predictions && data.predictions.length > 0) {
        setOverrideCategory(data.predictions[0].label);
      }
      // Don't auto-select any lawyer by default
      // if (data.topLawyers && data.topLawyers.length > 0) {
      //   setSelectedLawyerId(data.topLawyers[0].lawyer_id);
      // }
      
    } catch (err) {
      console.error("Classification error:", err);
      // Show error to user instead of fallback mock data
      setAiResult({
        error: true,
        message: err.message || "Classification failed - BART model unavailable"
      });
    } finally {
      clearInterval(progressTimer);
      clearInterval(phaseTimer);
      setAiLoading(false);
    }
  }

  function onCancelClassify() {
    setClassifyOpen(false);
    setClassifyFullscreen(false);
    setSelectedAppId(null);
    setAiLoading(false);
    setAiResult(null);
  }

  async function onReanalyze() {
    setAiLoading(true);
    startAILoad();
  }

  function onConfirmAssign() {
    // Wire to backend later. For now, optimistic close.
    setClassifyOpen(false);
  }

  function handleLawyerSelect(lawyerId) {
    if (selectedLawyerId === lawyerId) {
      // Deselect if clicking the same lawyer again
      setSelectedLawyerId("");
      setExpandedLawyerId("");
      setShowLawyerDetails(false);
    } else {
      // Select new lawyer
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Case Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingApps && <div className="text-sm text-muted-foreground">Loading...</div>}
          {appsError && <div className="text-sm text-destructive">{appsError}</div>}
          {!loadingApps && !appsError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Case Title</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => (
                  <TableRow key={a.id || a._id}>
                    <TableCell className="font-medium">{a?.client?.fullName || "-"}</TableCell>
                    <TableCell>{a?.case?.title || "-"}</TableCell>
                    <TableCell>{a?.createdAt ? new Date(a.createdAt).toLocaleString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(a?.documents || []).map((d, idx) => (
                          <a
                            key={`${a.id || a._id}-doc-${idx}`}
                            href={d.url || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-primary hover:text-primary/80"
                            onClick={(e) => { if (!d.url) e.preventDefault(); }}
                            title={d.key}
                          >
                            {d.name || d.key || `Document ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a?.status || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleClassify(String(a.id || a._id))}>
                            Classify
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {apps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No applications yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Portal: AI-Assisted Case Review Drawer */}
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
                <div className={`ai-drawer-root relative h-full bg-[rgb(10,10,10)] text-zinc-100 ${panelAnimClass} isolate`} style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", willChange: "transform, opacity", transformOrigin: "right center", backfaceVisibility: "hidden" }}>
                  {/* gold edge */}
                  <div className="absolute left-0 top-0 h-full w-[1px]" style={{ background: "linear-gradient(180deg,#d4af37,#7a5c0a)" }} />
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">LegalSphere</p>
                      <h3 className="text-lg font-semibold">AI-Assisted Case Review</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onReanalyze}
                        className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900"
                        aria-label="Re-analyze case"
                      >
                        Re-analyze
                      </button>
                      <button
                        onClick={() =>
                          setClassifyFullscreen((v) => {
                            const next = !v;
                            setDrawerAnim(next ? "expand" : "collapse");
                            // Reset right column state when switching to fullscreen
                            if (next) {
                              setIsRightColumnCollapsed(false);
                            }
                            // clear the anim class after it runs
                            setTimeout(() => setDrawerAnim("none"), 820);
                            return next;
                          })
                        }
                        className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900"
                        aria-label={classifyFullscreen ? "Collapse panel" : "Expand to full screen"}
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
                        ? (isLeftColumnCollapsed
                            ? "48px 1fr"
                            : "minmax(320px,480px) 1fr")
                        : (isRightColumnCollapsed
                            ? "1fr 48px"
                            : (isLeftColumnCollapsed
                                ? "48px 1fr"
                                : "minmax(280px,420px) 1fr")),
                    }}
                  >
                    {/* LEFT: Case Context */}
                    <div className={`relative border-b md:border-b-0 md:border-r border-zinc-800 overflow-y-auto no-scrollbar transition-all duration-300 ${isLeftColumnCollapsed ? "px-2" : "p-6"}`}>
                      {/* Collapse Toggle */}
                      <div className="sticky top-0 z-10 flex items-center justify-end py-2 bg-[rgb(10,10,10)]/80 backdrop-blur-sm">
                        <button
                          onClick={() => {
                            // Toggle between left and right in collapsed drawer mode
                            if (!classifyFullscreen) {
                              if (isLeftColumnCollapsed) {
                                // Currently showing AI, switch to case info
                                setIsLeftColumnCollapsed(false);
                                setIsRightColumnCollapsed(true);
                              } else {
                                // Currently showing case info, switch to AI
                                setIsLeftColumnCollapsed(true);
                                setIsRightColumnCollapsed(false);
                              }
                            } else {
                              // In fullscreen mode, just toggle left column as before
                              setIsLeftColumnCollapsed(!isLeftColumnCollapsed);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-[12px] text-zinc-300 hover:bg-zinc-900 transition-colors"
                          aria-label={isLeftColumnCollapsed ? "Show Case Info" : "Show AI Classification"}
                          title={isLeftColumnCollapsed ? "Show Case Info" : "Show AI Classification"}
                        >
                          <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-300 ${isLeftColumnCollapsed ? "rotate-180" : ""}`} />
                          {!isLeftColumnCollapsed && <span>AI</span>}
                        </button>
                      </div>
                      <div className={`space-y-6 transition-all duration-300 ${isLeftColumnCollapsed ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}`}>
                        {/* 1. Client Info */}
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-800">
                            <User className="h-4 w-4 text-zinc-400" />
                          </span>
                          <div className="leading-tight">
                            <p className="text-sm text-zinc-400">Client</p>
                            <p className="font-medium">{selectedApp?.client?.fullName ?? "—"}</p>
                          </div>
                        </div>

                        {/* 2. Case Title & Description */}
                        <div>
                          <p className="text-sm text-zinc-400 mb-1">Case Title</p>
                          <p className="font-medium">{selectedApp?.case?.title ?? "—"}</p>
                          {selectedApp?.case?.description && (
                            <p className="mt-1 text-sm text-zinc-300/80 leading-relaxed">
                              {selectedApp?.case?.description}
                            </p>
                          )}
                        </div>

                        {/* 3. Documents Section */}
                        <div>
                          <p className="text-sm text-zinc-400 mb-2">Documents</p>
                          <div className="space-y-2">
                            {(selectedApp?.documents ?? []).map((d, i) => (
                              <div key={`doc-${i}`} className="flex items-center justify-between rounded-lg bg-zinc-950/60 ring-1 ring-zinc-800 px-3 py-2">
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-zinc-900 ring-1 ring-zinc-800">
                                    <FileText className="h-4 w-4 text-zinc-400" />
                                  </span>
                                  <div className="leading-tight">
                                    <p className="text-sm font-medium text-zinc-200 truncate max-w-[160px]">
                                      {d.name || d.key || `Document ${i + 1}`}
                                    </p>
                                    <p className="text-[11px] text-zinc-500">
                                      {(d.key || "").split(".").pop()?.toUpperCase() || "FILE"}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={d.url || "#"}
                                  download={String(d.name || d.key || `document-${i + 1}`)}
                                  rel="noreferrer"
                                  onClick={(e) => { if (!d.url) e.preventDefault(); }}
                                  className="text-xs text-amber-400 hover:text-amber-300"
                                  title={d.key}
                                >
                                  Download
                                </a>
                              </div>
                            ))}
                            {(selectedApp?.documents ?? []).length === 0 && (
                              <div className="text-sm text-zinc-500">No documents uploaded.</div>
                            )}
                          </div>
                        </div>

                        {/* 4. Reference ID & Metadata */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-2">
                          <div>
                            <p className="text-zinc-400">Reference ID</p>
                            <p className="font-medium break-all font-mono text-[13px]">
                              {String(selectedApp?.id || selectedApp?._id || "—")}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Submitted</p>
                            <p className="font-medium">
                              {selectedApp?.createdAt ? new Date(selectedApp.createdAt).toLocaleString() : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium ring-1 ring-zinc-800">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#d4af37" }} />
                            Pending Classification
                          </span>
                        </div>
                      </div>
                      {/* Collapsed Label */}
                      {isLeftColumnCollapsed && (
                        <div className="absolute inset-0 flex items-center justify-center select-none">
                          <span className="text-[10px] tracking-widest text-zinc-500 rotate-[-90deg]">CASE INFO</span>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: AI-Assisted Classification */}
                    <div className={`relative border-l border-zinc-800 overflow-y-auto transition-all duration-300 ${isRightColumnCollapsed ? "px-2" : "p-6"}`}>
                      <div className={`transition-all duration-300 ${isRightColumnCollapsed ? "opacity-0 pointer-events-none h-0 overflow-hidden" : "opacity-100"}`}>
                      {aiLoading && (
                        <AILoadingScene phaseIdx={aiPhaseIdx} progress={aiProgress} />
                      )}
                      {!aiLoading && aiResult && (
                        <div className="space-y-6">
                          {aiResult.error ? (
                            <section className="text-center py-8">
                              <div className="rounded-lg bg-red-900/20 border border-red-800/50 p-6">
                                <h4 className="text-lg font-semibold text-red-400 mb-2">Classification Failed</h4>
                                <p className="text-sm text-red-300">{aiResult.message}</p>
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
                                <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">AI suggests — Admin decides</p>
                                <h4 className="mt-1 text-xl font-semibold">Classification</h4>
                                <div className="mt-4 space-y-3">
                                  <label className="text-sm text-zinc-300">Case Category</label>
                                  <select
                                    value={overrideCategory}
                                    onChange={(e) => setOverrideCategory(e.target.value)}
                                    className="w-full rounded-md bg-zinc-950/60 px-3 py-2 text-sm ring-1 ring-zinc-800 focus:outline-none focus:ring-amber-500/50"
                                  >
                                    {aiResult.predictions && aiResult.predictions.length > 0 ? (
                                      aiResult.predictions.slice(0, 5).map((p, index) => (
                                        <option key={p.label} value={p.label}>
                                          {p.label} ({(p.score * 100).toFixed(1)}% confidence)
                                        </option>
                                      ))
                                    ) : (
                                      <option value="">No categories available</option>
                                    )}
                                  </select>
                                  <div className="mt-2">
                                    {aiResult.predictions && aiResult.predictions.length > 0 && (
                                      <ConfidenceBar value={aiResult.predictions[0].score * 100} />
                                    )}
                                  </div>
                                </div>
                              </section>

                              <section>
                                <h4 className="text-base font-semibold">Suggested Lawyers</h4>
                                {!selectedLawyerId && (
                                <div className="flex pt-1 relative z-10">
                                  <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                    <UsersRound className="h-3.5 w-3.5" />
                                    <span>Select a lawyer to assign this case</span>
                                  </div>
                                </div>
                              )}
                                <div className="mt-3 space-y-2">
                                  {aiResult.topLawyers.map((l) => {
                                    const isSelected = selectedLawyerId === l.lawyer_id;
                                    const isExpanded = expandedLawyerId === l.lawyer_id;
                                    const isDeemphasized = selectedLawyerId && !isSelected;
                                    
                                    return (
                                      <div key={l.lawyer_id} className="transition-all duration-300">
                                        {showLawyerDetails && isSelected ? (
                                          // Details view for selected lawyer
                                          <div className="rounded-lg bg-zinc-900/80 ring-1 ring-amber-500/30 p-4">
                                            <div className="flex items-start justify-between mb-4">
                                              <div className="flex items-center gap-3">
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/50 text-[13px] font-semibold text-amber-300">
                                                  {getInitials(l.lawyer_name)}
                                                </span>
                                                <div>
                                                  <h5 className="text-base font-semibold text-amber-100">{l.lawyer_name}</h5>
                                                  <p className="text-sm text-zinc-400">
                                                    Score: {l.total.toFixed(2)} | Success: {(l.success_rate * 100).toFixed(0)}%
                                                  </p>
                                                </div>
                                              </div>
                                              <button
                                                onClick={handleCloseLawyerDetails}
                                                className="h-6 w-6 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-center"
                                                aria-label="Close details"
                                              >
                                                ×
                                              </button>
                                            </div>
                                            
                                            <div className="space-y-3 text-sm">
                                              <div>
                                                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">Practice Areas</span>
                                                <p className="mt-1 text-zinc-200">{l.case_types.join(", ")}</p>
                                              </div>
                                              <div>
                                                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">Experience</span>
                                                <p className="mt-1 text-zinc-200">{l.years_experience || 'N/A'} years</p>
                                              </div>
                                              <div>
                                                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">Availability</span>
                                                <p className="mt-1 text-zinc-200">{l.availability || 'Available'}</p>
                                              </div>
                                              <div>
                                                <span className="text-xs uppercase tracking-[0.1em] text-zinc-500">Case History</span>
                                                <p className="mt-1 text-zinc-300 text-xs leading-relaxed">
                                                  {l.case_history_summary || 'Experienced in handling complex cases with high success rate.'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          // Normal list view for all lawyers
                                          <label 
                                            className={`
                                              flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer
                                              transition-all duration-300 ease-out
                                              ${isSelected 
                                                ? 'bg-zinc-900/80 ring-1 ring-amber-500/30 shadow-lg' 
                                                : 'bg-zinc-950/60 ring-1 ring-zinc-800 hover:bg-zinc-900/40'
                                              }
                                              ${isDeemphasized ? 'opacity-50' : 'opacity-100'}
                                            `}
                                          >
                                            <div className="flex items-center gap-3">
                                              <span className={`
                                                inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300
                                                ${isSelected 
                                                  ? 'bg-amber-500/20 ring-1 ring-amber-500/50 text-amber-300' 
                                                  : 'bg-zinc-900 ring-1 ring-zinc-800 text-zinc-400'
                                                }
                                              `}>
                                                {getInitials(l.lawyer_name)}
                                              </span>
                                              <div className="leading-tight">
                                                <p className={`text-sm font-medium transition-colors duration-300 ${
                                                  isSelected ? 'text-amber-100' : 'text-zinc-200'
                                                }`}>
                                                  {l.lawyer_name}
                                                </p>
                                                <p className="text-[11px] text-zinc-500">
                                                  Score: {l.total.toFixed(2)} | Success: {(l.success_rate * 100).toFixed(0)}%
                                                </p>
                                                <p className="text-[10px] text-zinc-600">
                                                  {l.case_types.slice(0, 2).join(", ")}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {/* Info button - only show for selected lawyer */}
                                              {isSelected && !showLawyerDetails && (
                                                <button
                                                  onClick={() => handleLawyerInfo(l.lawyer_id)}
                                                  className="h-6 px-2 rounded-full border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 hover:text-amber-300 transition-all duration-300 flex items-center justify-center text-[10px] font-medium"
                                                  aria-label="View lawyer details"
                                                >
                                                  Info
                                                </button>
                                              )}
                                              <input
                                                type="radio"
                                                name="lawyer"
                                                checked={isSelected}
                                                onChange={() => handleLawyerSelect(l.lawyer_id)}
                                                className="h-4 w-4 accent-amber-400"
                                              />
                                            </div>
                                          </label>
                                        )}
                                        
                                        {/* Action buttons - only show for selected lawyer */}
                                        {isSelected && !showLawyerDetails && (
                                          <div className="mt-2 flex justify-end gap-2 animate-in slide-in-from-top-2 duration-300">
                                            <button
                                              onClick={handleCancelSelection}
                                              className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900 transition-colors"
                                            >
                                              Cancel Selection
                                            </button>
                                            <button
                                              onClick={onConfirmAssign}
                                              className="rounded px-3 py-1.5 text-sm font-medium text-black transition-all duration-300 hover:shadow-lg"
                                              style={{ background: "linear-gradient(180deg,#d4af37,#b9921f)" }}
                                              disabled={!overrideCategory || !selectedLawyerId}
                                            >
                                              Confirm & Assign
                                            </button>
                                          </div>
                                        )}
                                        
                                        {/* Action buttons in detail view */}
                                        {isSelected && showLawyerDetails && (
                                          <div className="mt-4 flex justify-end gap-2">
                                            <button
                                              onClick={handleCancelSelection}
                                              className="rounded px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-900 transition-colors"
                                            >
                                              Cancel Selection
                                            </button>
                                            <button
                                              onClick={onConfirmAssign}
                                              className="rounded px-3 py-1.5 text-sm font-medium text-black transition-all duration-300 hover:shadow-lg"
                                              style={{ background: "linear-gradient(180deg,#d4af37,#b9921f)" }}
                                              disabled={!overrideCategory || !selectedLawyerId}
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
                          <span className="text-[10px] tracking-widest text-zinc-500 rotate-[-90deg] whitespace-nowrap">AI CLASSIFY</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>,
            document.body
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
        
        /* Custom animations for lawyer selection */
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .slide-in-from-top-2 {
          animation-name: slideInFromTop;
          animation-duration: 300ms;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* Theme isolation for AI drawer - prevents global theme leakage */
        .ai-drawer-root {
          /* Force dark theme regardless of global state */
          background-color: rgb(10, 10, 10) !important;
          color: rgb(244, 244, 245) !important;
          
          /* Isolate common UI components */
        }
        .ai-drawer-root .bg-card {
          background-color: rgb(17, 17, 17) !important;
        }
        .ai-drawer-root .bg-muted {
          background-color: rgb(24, 24, 24) !important;
        }
        .ai-drawer-root .text-foreground {
          color: rgb(244, 244, 245) !important;
        }
        .ai-drawer-root .text-muted-foreground {
          color: rgb(161, 161, 170) !important;
        }
        .ai-drawer-root .border {
          border-color: rgb(63, 63, 70) !important;
        }
        .ai-drawer-root input,
        .ai-drawer-root select,
        .ai-drawer-root textarea {
          background-color: rgb(17, 17, 17) !important;
          color: rgb(244, 244, 245) !important;
          border-color: rgb(63, 63, 70) !important;
        }
        .ai-drawer-root button {
          color: inherit !important;
        }
      `}</style>
    </>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Th({ children }) {
  return <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-600">{children}</th>;
}
function Td({ children, className = "", ...rest }) {
  return (
    <td className={`px-3 py-3 align-middle text-gray-900 ${className}`} {...rest}>
      {children}
    </td>
  );
}

// Helper components and constants
const CATEGORY_OPTIONS = [
  "Contract Dispute",
  "Employment",
  "Intellectual Property",
  "Real Estate",
  "Corporate Governance",
  "Regulatory Compliance",
];

function getInitials(name) {
  const parts = String(name || "").split(" ").filter(Boolean);
  return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

function ConfidenceBar({ value }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="w-full h-1.5 rounded bg-zinc-800 overflow-hidden">
      <div
        className="h-full"
        style={{ width: `${v}%`, background: "linear-gradient(90deg,#7a5c0a,#d4af37)" }}
      />
      <div className="mt-2 text-xs text-zinc-400">{v}% confidence</div>
    </div>
  );
}

function AILoadingScene({ phaseIdx, progress }) {
  const phrases = [
    "Analyzing case context…",
    "Reviewing legal documents…",
    "Generating classification insights…",
  ];
  const canvasRef = useRef(null);
  // lightweight parallax nodes via CSS transforms
  return (
    <div className="relative h-full min-h-[575px] rounded-xl bg-[rgb(8,8,8)] ring-1 ring-zinc-800 overflow-hidden">
      {/* abstract gold geometry */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full opacity-20 blur-2xl" style={{ background: "radial-gradient(closest-side,#d4af37,transparent)" }} />
        <div className="absolute right-[-60px] bottom-[-40px] h-80 w-80 rounded-full opacity-10 blur-2xl" style={{ background: "radial-gradient(closest-side,#b9921f,transparent)" }} />
        {/* floating lines */}
        <div className="absolute inset-0 [perspective:900px]">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-px w-72 -translate-x-1/2 -translate-y-1/2 opacity-30"
              style={{
                background: "linear-gradient(90deg,transparent,#d4af37,transparent)",
                transform: `translate3d(${(i - 6) * 18}px, ${(i % 3) * 22 - 30}px, 0) rotate(${i * 9}deg)`,
                filter: "drop-shadow(0 0 6px rgba(212,175,55,0.2))",
              }}
            />
          ))}
        </div>
      </div>
      {/* phrase */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">LegalSphere</p>
        <h4 className="mt-2 text-lg font-semibold">AI is preparing insights</h4>
        <p className="mt-2 text-sm text-zinc-300/90" key={phaseIdx}>{phrases[Math.min(phrases.length - 1, phaseIdx)]}</p>
        <div className="mt-6 w-full max-w-md">
          <div className="h-[2px] w-full overflow-hidden rounded bg-zinc-800">
            <div className="h-full" style={{ width: `${Math.min(100, Math.floor(progress))}%`, background: "linear-gradient(90deg,#7a5c0a,#d4af37)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
