"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Search,
  Plus,
  ArrowRight,
  MoreHorizontal,
  FileText,
  Clock,
  Shield,
  Scale,
  Users,
  Briefcase,
  ChevronRight,
  Twitter,
  Instagram,
  Youtube,
  Download,
  Mail,
  MessageSquare,
  Paperclip,
  Eye
} from "lucide-react";
import Image from "next/image";
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ApplyNewForm } from "@/components/apply-new-form";
import { cn } from "@/lib/utils";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164"; 
const PAPER_SHADOW = "0 10px 40px -15px rgba(0,0,0,0.1)";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState(null);
  const section = searchParams.get("section");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview"); // Default tab
  const [selectedCaseId, setSelectedCaseId] = useState("CASE-2024-001");

  // Sample Case Data
  const userCases = [
    {
      id: "CASE-2024-001",
      title: "Business Contract Review",
      description: "Verification of legal documents and M&A terms.",
      status: "Lawyer Assigned",
      progress: 60,
      lastUpdated: "2h ago",
      statusColor: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      id: "CASE-2024-002",
      title: "Property Dispute Resolution",
      description: "Boundary dispute arbitration for Commercial Lot 4B.",
      status: "AI Analysis",
      progress: 30,
      lastUpdated: "1d ago",
      statusColor: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      id: "CASE-2024-003",
      title: "Employment Agreement",
      description: "Drafting of executive severance package.",
      status: "Under Review",
      progress: 15,
      lastUpdated: "3d ago",
      statusColor: "text-slate-600 bg-slate-50 border-slate-200",
    },
  ];

  // Detailed Data for Tabs
  const timelineEvents = [
    { title: "Case Submitted", date: "Jan 15, 2024", description: "Initial filing via portal.", completed: true },
    { title: "Documents Verified", date: "Jan 16, 2024", description: "Identity and contract verified.", completed: true },
    { title: "AI Classification", date: "Jan 17, 2024", description: "Categorized as Corporate Litigation.", completed: true },
    { title: "Lawyer Matched", date: "Jan 18, 2024", description: "Assigned to Sarah Chen, Esq.", completed: true },
    { title: "Initial Consultation", date: "Jan 20, 2024", description: "Video conference scheduled.", completed: false },
    { title: "Court Processing", date: "Pending", description: "Waiting for docket number.", completed: false },
  ];

  const documents = [
    { name: "Meridian_Contract_v4.pdf", type: "PDF", size: "2.4 MB", date: "Jan 15, 2024", status: "Verified" },
    { name: "Evidence_Photo_Set_A.zip", type: "ZIP", size: "14.1 MB", date: "Jan 16, 2024", status: "Pending Review" },
    { name: "Legal_Brief_Draft_v1.docx", type: "DOCX", size: "1.2 MB", date: "Jan 18, 2024", status: "Draft" },
    { name: "NDA_Signed.pdf", type: "PDF", size: "0.8 MB", date: "Jan 19, 2024", status: "Verified" },
  ];

  const messages = [
    { id: 1, sender: "Sarah Chen, Esq.", role: "Counsel", time: "2h ago", text: "I've uploaded the final settlement draft. Please review Section 4 regarding the liability clause.", initial: "SC" },
    { id: 2, sender: "You", role: "Client", time: "1d ago", text: "Thank you, Sarah. I will take a look tomorrow morning.", initial: "ME" },
    { id: 3, sender: "System", role: "Automated", time: "2d ago", text: "New document added: Legal_Brief_Draft_v1.docx", initial: "AI" },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  const handleStartNewCase = () => router.push("/dashboard?section=apply-new");
  const handleViewCases = () => router.push("/my-cases");

  return (
    <AceternitySidebarDemo>
      {section === "apply-new" ? (
        <ApplyNewForm />
      ) : (
        <main
          className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-slate-200 overflow-y-auto"
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            color: "var(--foreground)",
          }}
        >
          {/* --- Top Navigation Bar --- */}
          <div className="sticky top-0 z-50 bg-[#efefec]/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />

              <div className="flex items-center space-x-6">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-1 text-slate-500 hover:text-[#af9164] transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#efefec]"></span>
                  </button>
                </div>

                <div className="flex items-center gap-3 pl-6 border-l border-slate-300">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{userData?.name || "Client User"}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Premium Plan</p>
                  </div>
                  <div className="w-9 h-9 bg-[#1a2238] rounded-full flex items-center justify-center text-white font-serif text-sm border-2 border-[#af9164]">
                    {userData?.name ? userData.name[0] : "U"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 py-8 space-y-12">
            
            {/* --- Hero Section --- */}
            <section className="relative bg-[#1a2238] rounded-2xl overflow-hidden shadow-2xl text-white">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
               <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#af9164]/20 to-transparent" />

               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 p-10 lg:p-14 items-center">
                  <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-[#af9164] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#af9164] animate-pulse" />
                        LegalSphere Intelligence v2.0
                    </div>
                    
                    <div className="space-y-4">
                        <h1 className="font-serif text-4xl lg:text-5xl leading-tight">
                            Good Morning, <br/>
                            <span className="text-[#af9164] italic">{userData?.name || "Counselor"}.</span>
                        </h1>
                        <p className="text-slate-300 text-lg font-light max-w-md leading-relaxed">
                            Your legal portfolio is active. You have <strong className="text-white font-medium">3 actions</strong> requiring attention today.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button onClick={handleStartNewCase} className="bg-[#af9164] text-white px-8 py-3.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#9c7f56] transition-all shadow-lg hover:shadow-[#af9164]/20 flex items-center gap-3">
                            <Plus className="w-4 h-4" /> Start New Filing
                        </button>
                        <button onClick={handleViewCases} className="px-8 py-3.5 rounded-lg text-sm font-bold uppercase tracking-widest border border-white/20 hover:bg-white/5 transition-all text-white flex items-center gap-3">
                            View Dossiers <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 pr-6 border-r border-white/10">
                            <Users className="w-4 h-4 text-[#af9164]" />
                            <div>
                                <span className="block text-xl font-serif leading-none">12</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Attorneys</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pr-6 border-r border-white/10">
                            <Briefcase className="w-4 h-4 text-[#af9164]" />
                            <div>
                                <span className="block text-xl font-serif leading-none">5</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Open Cases</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex justify-end relative">
                      <Image
                        src="/hero-svg-dsh.png"
                        alt="Dashboard Preview"
                        width={500}
                        height={400}
                        className="object-contain max-w-full h-auto drop-shadow-2xl"
                      />
                  </div>
               </div>
            </section>

            {/* --- Main Dashboard Body: The "Desk" --- */}
            <div className="grid grid-cols-12 gap-8">
                
                {/* Left Column: Quick Navigation */}
                <div className="col-span-12 lg:col-span-3 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Quick Access</h4>
                        <nav className="space-y-1">
                            {["Active Matters", "Document Archive", "Billing & Invoices", "Counsel Directory"].map((item, i) => (
                                <button key={i} className="w-full flex items-center justify-between p-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-[#1a2238] group transition-colors">
                                    <span className="font-medium">{item}</span>
                                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-[#af9164]" />
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="bg-[#af9164] p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <Shield className="w-8 h-8 mb-4 text-white" />
                            <h4 className="font-serif text-lg mb-2">Secure Line</h4>
                            <p className="text-xs text-white/80 mb-4 leading-relaxed">
                                Need immediate legal counsel? Connect with your dedicated case manager instantly.
                            </p>
                            <button className="text-xs font-bold uppercase tracking-widest border-b border-white pb-0.5 hover:opacity-80">Contact Now</button>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-20"><Scale size={120} /></div>
                    </div>
                </div>

                {/* Right Column: The "Active File" */}
                <div className="col-span-12 lg:col-span-9">
                    <div 
                        className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 flex flex-col min-h-[600px]"
                        style={{ boxShadow: PAPER_SHADOW }}
                    >
                        {/* Tab Bar */}
                        <div className="flex border-b border-slate-100 px-6 pt-2 overflow-x-auto bg-slate-50/50">
                            {["Overview", "Timeline", "Documents", "Correspondence"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 relative top-[1px]",
                                        activeTab === tab 
                                            ? "border-[#1a2238] text-[#1a2238] bg-white rounded-t-lg border-x border-t border-slate-200 border-b-white"
                                            : "border-transparent text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Inner Left: Case List (Persistent) */}
                            <div className="w-1/3 border-r border-slate-100 bg-[#f8f9fa] flex flex-col">
                                <div className="p-4 border-b border-slate-100 sticky top-0 bg-[#f8f9fa] z-10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input placeholder="Filter cases..." className="w-full bg-white border border-slate-200 rounded-md py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#af9164]" />
                                    </div>
                                </div>
                                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                                    {userCases.map((c) => (
                                        <div 
                                            key={c.id}
                                            onClick={() => setSelectedCaseId(c.id)}
                                            className={cn(
                                                "p-4 rounded-lg cursor-pointer transition-all border",
                                                selectedCaseId === c.id 
                                                    ? "bg-white border-[#af9164] shadow-md"
                                                    : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex justify-between mb-2">
                                                <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border", c.statusColor)}>{c.status}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{c.lastUpdated}</span>
                                            </div>
                                            <h4 className="font-serif font-bold text-slate-800 text-sm mb-1 leading-snug">{c.title}</h4>
                                            <p className="text-[10px] text-slate-500 line-clamp-2">{c.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Inner Right: Content Area (Dynamic) */}
                            <div className="flex-1 p-8 overflow-y-auto bg-white relative">
                                
                                {/* Persistent Case Header */}
                                <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-slate-400 text-xs bg-slate-100 px-2 py-1 rounded">{selectedCaseId}</span>
                                            <div className="h-4 w-[1px] bg-slate-300"></div>
                                            <span className="text-xs font-bold text-[#af9164] uppercase tracking-wider">Corporate Litigation</span>
                                        </div>
                                        <h2 className="font-serif text-3xl text-[#1a2238] mb-2">{userCases.find(c => c.id === selectedCaseId)?.title}</h2>
                                        <p className="text-slate-500 text-sm">{userCases.find(c => c.id === selectedCaseId)?.description}</p>
                                    </div>
                                    <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:border-[#1a2238] transition-colors flex items-center gap-2">
                                        <MoreHorizontal className="w-4 h-4" /> Options
                                    </button>
                                </div>

                                {/* Dynamic Content based on activeTab */}
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    
                                    {/* 1. OVERVIEW VIEW */}
                                    {activeTab === "Overview" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-8 mb-10">
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Recent Timeline</h4>
                                                    <div className="space-y-0 relative border-l border-slate-200 ml-1.5 pl-6 py-2">
                                                        {timelineEvents.slice(0, 3).map((step, i) => (
                                                            <div key={i} className="relative mb-6 last:mb-0">
                                                                <div className={cn("absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm", step.completed ? "bg-[#af9164]" : "bg-slate-200")} />
                                                                <p className={cn("text-xs font-bold", step.completed ? "text-slate-800" : "text-slate-400")}>{step.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono">{step.date}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Legal Team</h4>
                                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="w-10 h-10 bg-[#1a2238] rounded-full flex items-center justify-center text-white font-serif">SC</div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">Sarah Chen, Esq.</p>
                                                            <p className="text-[10px] text-slate-500">Lead Counsel • Corporate Law</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-serif">MR</div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">Michael Rodriguez</p>
                                                            <p className="text-[10px] text-slate-500">Paralegal • Research</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-[#af9164]/10 rounded-lg p-4 border border-[#af9164]/20 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-full text-[#af9164]"><FileText className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#1a2238]">Review Required: Final Settlement Draft</p>
                                                        <p className="text-[10px] text-[#af9164]">Uploaded 2 hours ago by Sarah Chen</p>
                                                    </div>
                                                </div>
                                                <button className="text-xs font-bold text-white bg-[#af9164] px-4 py-2 rounded hover:bg-[#9c7f56]">Review Now</button>
                                            </div>
                                        </>
                                    )}

                                    {/* 2. TIMELINE VIEW */}
                                    {activeTab === "Timeline" && (
                                        <div className="space-y-8">
                                            {timelineEvents.map((event, i) => (
                                                <div key={i} className="flex gap-4 group">
                                                    <div className="w-24 text-right pt-1">
                                                        <p className="text-xs font-bold text-slate-900">{event.date}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{event.date.includes("Pending") ? "Est" : "Done"}</p>
                                                    </div>
                                                    <div className="relative border-l-2 border-slate-200 pl-8 pb-8 last:pb-0 last:border-transparent">
                                                        <div className={cn(
                                                            "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-colors",
                                                            event.completed ? "bg-[#af9164]" : "bg-slate-300"
                                                        )} />
                                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 group-hover:border-[#af9164]/30 transition-colors">
                                                            <h4 className="text-sm font-bold text-[#1a2238]">{event.title}</h4>
                                                            <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 3. DOCUMENTS VIEW */}
                                    {activeTab === "Documents" && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Case Files</h4>
                                                <button className="text-[10px] font-bold text-[#af9164] uppercase tracking-wider flex items-center gap-1 hover:underline">
                                                    <Download className="w-3 h-3" /> Download All
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {documents.map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md hover:border-[#af9164]/30 transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 group-hover:text-[#af9164] transition-colors">{doc.name}</p>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                                    <span>{doc.type}</span>
                                                                    <span>•</span>
                                                                    <span>{doc.size}</span>
                                                                    <span>•</span>
                                                                    <span>{doc.date}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                                                                doc.status === "Verified" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                            )}>
                                                                {doc.status}
                                                            </span>
                                                            <button className="p-2 text-slate-400 hover:text-[#1a2238]"><Eye className="w-4 h-4" /></button>
                                                            <button className="p-2 text-slate-400 hover:text-[#1a2238]"><Download className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. CORRESPONDENCE VIEW */}
                                    {activeTab === "Correspondence" && (
                                        <div className="flex flex-col h-[500px]">
                                            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                                                {messages.map((msg) => (
                                                    <div key={msg.id} className={cn("flex gap-4", msg.role === "Client" ? "flex-row-reverse" : "")}>
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                            msg.role === "Client" ? "bg-[#af9164] text-white" : "bg-[#1a2238] text-white"
                                                        )}>
                                                            {msg.initial}
                                                        </div>
                                                        <div className={cn(
                                                            "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                                            msg.role === "Client" 
                                                                ? "bg-[#af9164]/10 text-slate-800 rounded-tr-none" 
                                                                : "bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none"
                                                        )}>
                                                            <div className="flex justify-between items-center mb-1 gap-4">
                                                                <span className="font-bold text-xs">{msg.sender}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">{msg.time}</span>
                                                            </div>
                                                            {msg.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="relative">
                                                    <input 
                                                        placeholder="Type your message securely..." 
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-5 pr-12 text-sm focus:outline-none focus:border-[#af9164] focus:bg-white transition-colors"
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                        <button className="p-2 text-slate-400 hover:text-[#af9164] rounded-full hover:bg-slate-100"><Paperclip className="w-4 h-4" /></button>
                                                        <button className="p-2 bg-[#1a2238] text-white rounded-full hover:bg-[#af9164] transition-colors"><ArrowRight className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

          </div>

          {/* --- Footer --- */}
          <footer className="bg-white border-t border-slate-200 mt-24 py-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-4">
                    <h2 className="font-serif text-2xl text-[#1a2238]">LEGALSPHERE</h2>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        Elevating legal management through secure, intelligent, and transparent digital infrastructure.
                    </p>
                    <div className="flex gap-4">
                        {[Twitter, Instagram, Youtube].map((Icon, i) => (
                            <a key={i} href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-[#af9164] hover:text-white transition-colors text-slate-400">
                                <Icon size={14} />
                            </a>
                        ))}
                    </div>
                </div>
                
                <div className="md:col-span-8 grid grid-cols-3 gap-8">
                    {[
                        { title: "Platform", links: ["Case Management", "Document Vault", "Attorney Network", "Security"] },
                        { title: "Company", links: ["About Us", "Careers", "Press", "Contact"] },
                        { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Settings", "Compliance"] }
                    ].map((col, i) => (
                        <div key={i}>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#af9164] mb-4">{col.title}</h4>
                            <ul className="space-y-2">
                                {col.links.map(link => (
                                    <li key={link}><a href="#" className="text-xs text-slate-500 hover:text-[#1a2238] transition-colors">{link}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest">
                <p>© 2026 LegalSphere Inc. All rights reserved.</p>
                <p>Designed for Excellence</p>
            </div>
          </footer>
        </main>
      )}
    </AceternitySidebarDemo>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#efefec]" />}>
      <DashboardContent />
    </Suspense>
  );
}