"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Clock, 
  Briefcase,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Scale,
  FileText,
  ShieldAlert,
  Calendar,
  AlertCircle,
  RefreshCw,
  Bell,
  Check,
  Trash2,
  CheckCheck,
  X
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164"; 

// --- Helper Components ---

const StatSummary = ({ label, value, subtext }) => (
  <div className="flex flex-col border-l-2 border-slate-200 pl-6 first:border-0 first:pl-0">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</span>
    <span className="font-serif text-3xl text-slate-900">{value}</span>
    {subtext && <span className="text-xs text-slate-500 mt-1">{subtext}</span>}
  </div>
);

export default function MyCasesView({ onNavigate }) {
  const router = useRouter();
  const notificationRef = useRef(null);
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchCases();
      fetchNotifications();
    }
  }, [isClient, filterStatus, pagination.page]);

  // Polling for notifications
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s is usually sufficient
    return () => clearInterval(interval);
  }, [isClient]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const userData = localStorage.getItem("userData");
      if (!userData) return;
      
      const parsed = JSON.parse(userData);
      const user = Array.isArray(parsed) ? parsed[0] : parsed;
      const clientId = user?.id || user?.clientId || user?.userId || user?._id || user?.client?.id || user?.email || '';
      
      if (!clientId) return;
      
      const response = await fetch(`/api/notifications?clientId=${clientId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      // Optimistic UI update
      const targetNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (targetNotif && !targetNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      const response = await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        const err = new Error("Failed to delete");
        throw err;
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Assuming you have an endpoint for this, otherwise loop requests (not ideal but functional for MVP)
      const userData = localStorage.getItem("userData");
      const parsed = JSON.parse(userData || "{}");
      const clientId = parsed.id || parsed.clientId || parsed._id;
      
      await fetch(`/api/notifications/mark-all-read`, { 
        method: "POST",
        body: JSON.stringify({ clientId })
      });
    } catch (error) {
        console.error("Error marking all read");
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    setError("");
    try {
      const statusParam = filterStatus === "all" ? undefined : filterStatus;
      const response = await apiClient.getMyCases(pagination.page, pagination.limit, statusParam);
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCases(response.data.cases);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseClick = (caseId) => {
    // If navigation should open details in dashboard, implement here.
    // Otherwise route to details page.
    router.push(`/dashboard?view=case-details&id=${caseId}`);
  };

  const filteredCases = useMemo(() => {
    return cases.filter(caseItem => {
      const matchesSearch = 
        caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || 
        (filterStatus === "active" && caseItem.status !== "Completed") ||
        (filterStatus === "completed" && caseItem.status === "Completed") ||
        (filterStatus === "pending" && (
          caseItem.lawyer.includes("Pending") || 
          caseItem.status.includes("Pending") || 
          caseItem.status.includes("Review") ||
          caseItem.status === "Analysis Completed"
        ));
      
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterStatus, cases]);

  if (!isClient) return null;

  return (
    <div
    className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-[#af9164]/30 overflow-y-auto"
    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
        <div className="w-full max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
          
          {/* --- Header Section --- */}
          <header className="flex flex-col md:flex-row justify-between items-end border-b-2 border-slate-900 pb-6 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
              </div>
              <h1 className="font-serif text-4xl text-slate-900 leading-tight">
                Case Management <br className="hidden sm:block" />
                <span className="italic text-slate-500">Dashboard</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4 relative">
               {/* --- Notification Center --- */}
               <div ref={notificationRef} className="relative z-50">
                 <button
                   onClick={() => setShowNotifications(!showNotifications)}
                   className={cn(
                     "relative p-3 rounded-full transition-all duration-300 border",
                     showNotifications 
                       ? "bg-[#1a2238] text-white border-[#1a2238]" 
                       : "bg-white text-slate-500 border-slate-200 hover:border-[#af9164] hover:text-[#af9164]"
                   )}
                 >
                   <Bell className="w-5 h-5" />
                   {unreadCount > 0 && (
                     <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center border-2 border-[#efefec]">
                       {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                   )}
                 </button>
                 
                 <AnimatePresence>
                   {showNotifications && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                       transition={{ duration: 0.2 }}
                       className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5"
                     >
                       {/* Dropdown Header */}
                       <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
                         <div>
                           <h3 className="font-serif text-lg text-[#1a2238]">Notifications</h3>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                             {unreadCount} Unread Alerts
                           </p>
                         </div>
                         {unreadCount > 0 && (
                           <button 
                             onClick={handleMarkAllRead}
                             className="text-[10px] flex items-center gap-1.5 text-[#af9164] hover:text-[#92784e] font-bold uppercase tracking-wider transition-colors"
                           >
                             <CheckCheck className="w-3 h-3" /> Mark All Read
                           </button>
                         )}
                       </div>
                       
                       {/* Notification List */}
                       <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                         {notifications.length === 0 ? (
                           <div className="py-12 flex flex-col items-center text-center px-6">
                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                               <Bell className="w-5 h-5 text-slate-300" />
                             </div>
                             <p className="text-sm text-slate-500 font-medium">You're all caught up</p>
                             <p className="text-xs text-slate-400 mt-1">No new notifications at this time.</p>
                           </div>
                         ) : (
                           <ul className="divide-y divide-slate-50">
                             {notifications.map((notif) => (
                               <li 
                                 key={notif._id}
                                 className={cn(
                                   "group relative p-4 hover:bg-slate-50 transition-colors cursor-pointer",
                                   !notif.read ? "bg-blue-50/30" : "bg-white"
                                 )}
                                 onClick={() => {
                                   if (!notif.read) handleMarkAsRead(notif._id);
                                   // Optional: Add logic here if clicking the body should take them somewhere specific
                                 }}
                               >
                                 <div className="flex gap-4">
                                   {/* Status Indicator */}
                                   <div className="mt-1.5 flex-shrink-0">
                                     <div className={cn(
                                       "w-2 h-2 rounded-full ring-2 ring-white shadow-sm",
                                       !notif.read ? "bg-[#af9164]" : "bg-slate-200"
                                     )} />
                                   </div>

                                   {/* Content */}
                                   <div className="flex-1 min-w-0 space-y-1">
                                      <div className="flex justify-between items-start">
                                        <p className={cn(
                                          "text-sm text-[#1a2238] leading-tight pr-6",
                                          !notif.read ? "font-bold" : "font-medium"
                                        )}>
                                          {notif.title}
                                        </p>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                                          {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      </div>
                                      
                                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                      </p>
                                      
                                      <p className="text-[10px] text-slate-400 pt-1">
                                        {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </p>
                                   </div>
                                 </div>

                                 {/* Hover Actions (Absolute Positioned) */}
                                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-100">
                                   {!notif.read && (
                                     <button
                                       onClick={(e) => handleMarkAsRead(notif._id, e)}
                                       className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                       title="Mark as read"
                                     >
                                       <Check className="w-3.5 h-3.5" />
                                     </button>
                                   )}
                                   <button
                                     onClick={(e) => handleDeleteNotification(notif._id, e)}
                                     className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                     title="Delete"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               </li>
                             ))}
                           </ul>
                         )}
                       </div>
                       
                       {/* Dropdown Footer */}
                       <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                         <button 
                           onClick={() => {/* Navigate to full notifications page if you have one */}}
                           className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#1a2238] transition-colors"
                         >
                           View Notification History
                         </button>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               <div className="hidden lg:flex gap-8 mr-8">
                  <StatSummary label="Active Matters" value={cases.filter(c => c.status !== "Completed").length} />
                  <StatSummary label="Pending Action" value={cases.filter(c => c.status === "Document Required").length} />
               </div>

              <button
                onClick={() => onNavigate("apply-new")}
                className="group relative overflow-hidden bg-slate-900 px-6 py-3 text-white transition-all hover:bg-[#af9164] shadow-lg active:scale-95 rounded-sm"
              >
                <div className="relative z-10 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">New Filing</span>
                </div>
              </button>
              
              <button
                onClick={fetchCases}
                className="group relative overflow-hidden bg-white px-4 py-3 text-slate-700 transition-all hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md active:scale-95 rounded-sm"
                title="Refresh cases"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* --- Controls --- */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8 w-full md:w-auto border-b border-slate-200 pb-px overflow-x-auto">
               {["all", "active", "pending", "completed"].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setFilterStatus(tab)}
                   className={cn(
                     "pb-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap relative",
                     filterStatus === tab 
                      ? "text-[#1a2238]" 
                      : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {tab}
                   {filterStatus === tab && (
                     <motion.div 
                       layoutId="tab-underline" 
                       className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a2238]" 
                     />
                   )}
                 </button>
               ))}
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#af9164] transition-colors" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Case ID or Title..." 
                className="w-full bg-transparent border-b border-slate-300 pl-8 py-2 text-sm focus:outline-none focus:border-[#1a2238] transition-colors placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* --- The New "Dossier" Grid --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredCases.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleCaseClick(item.id)}
                className="group relative bg-white flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-2"
                style={{ 
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)"
                }}
              >
                {/* 1. The "Tab" visual - Muted Luxury Tones */}
                <div className={cn(
                    "h-1 w-full transition-colors duration-300",
                    item.status === "Completed" ? "bg-[#163020]" : // Forest
                    item.status === "Document Required" ? "bg-[#4a1d1d]" : // Bordeaux
                    item.status.includes("Pending") || item.status.includes("Review") ? "bg-[#92784e]" : // Antique Gold
                    item.status === "Analysis Completed" || item.status === "Analyzed" ? "bg-[#2d3648]" : // Steel
                    "bg-slate-400"
                )} />

                <div className="p-8 flex flex-col h-full relative overflow-hidden border border-t-0 border-slate-100 hover:border-slate-200 transition-colors">
                  
                  {/* Watermark Background Icon */}
                  <div className="absolute -right-6 -top-6 text-slate-100 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700 pointer-events-none rotate-12 scale-150">
                    {item.category?.includes("Corporate") ? <Briefcase size={120} /> : 
                    item.category?.includes("Property") ? <FileText size={120} /> :
                    item.category?.includes("Intellectual") ? <Scale size={120} /> :
                    <ShieldAlert size={120} />}
                  </div>

                  {/* Header Row: Status Stamp - Subtle "Ghost" Style */}
                  <div className="flex justify-between items-start mb-8 z-10">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "text-[8px] font-bold uppercase tracking-[0.2em] px-2.5 py-1.5 border transition-colors",
                            item.status === "Completed" ? "text-[#163020] border-[#163020]/20 bg-[#163020]/5" :
                            item.status === "Document Required" ? "text-[#4a1d1d] border-[#4a1d1d]/20 bg-[#4a1d1d]/5" :
                            item.status.includes("Pending") || item.status.includes("Review") ? "text-[#92784e] border-[#92784e]/20 bg-[#92784e]/5" :
                            item.status === "Analysis Completed" || item.status === "Analyzed" ? "text-[#2d3648] border-[#2d3648]/20 bg-[#2d3648]/5" :
                            "text-slate-500 border-slate-200 bg-slate-50"
                        )}>
                            {item.status}
                        </div>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>

                  {/* Case Title - Serif Typography */}
                  <div className="mb-10 z-10">
                    <h3 className="font-serif text-2xl text-slate-900 leading-tight group-hover:text-[#af9164] transition-colors mb-3 line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 tracking-wider">{item.id}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{item.category}</span>
                    </div>
                  </div>

                  {/* Footer Stats Grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-8 border-t border-slate-50 z-10 mt-auto">
                    {/* Lawyer */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.15em]">Counsel</span>
                        <div className="flex items-center gap-2">
                            {item.lawyer === "Assigning..." || item.lawyer.includes("Pending") ? (
                                <span className="text-xs text-slate-400 italic">
                                    {item.status === 'Lawyer Reviewing' ? 'Reviewing...' : 'Assigning...'}
                                </span>
                            ) : (
                                <div className="group/lawyer relative">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-[#1a2238] border border-[#1a2238] flex items-center justify-center text-[9px] font-bold text-[#af9164]">
                                            {item.lawyer?.charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-[#1a2238] border-b border-dashed border-[#af9164]/30 cursor-help">
                                            {item.lawyer}
                                        </span>
                                    </div>
                                    
                                    {/* Lawyer Details Hover Card */}
                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white p-3 rounded-lg shadow-xl border border-[#af9164]/20 opacity-0 invisible group-hover/lawyer:opacity-100 group-hover/lawyer:visible transition-all duration-200 z-50">
                                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-zinc-100">
                                            <div className="w-8 h-8 rounded-full bg-[#1a2238] text-[#af9164] flex items-center justify-center text-xs font-bold">
                                                 {item.lawyer?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#1a2238]">{item.lawyer}</p>
                                                <p className="text-[9px] text-[#af9164] uppercase tracking-wider">Lead Counsel</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <div className="w-4 h-4 rounded bg-slate-50 flex items-center justify-center text-slate-400">@</div>
                                                <span className="truncate">{item.lawyerDetails?.email || (item.lawyer.split(',')[0].toLowerCase().replace(/\s/g,'.') + '@legalsphere.com')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <div className="w-4 h-4 rounded bg-slate-50 flex items-center justify-center text-slate-400">#</div>
                                                <span>+1 (555) 012-3456</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-zinc-50 text-center">
                                            <span className="text-[9px] text-[#af9164] font-bold uppercase tracking-widest">Available</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Last Update */}
                    <div className="flex flex-col gap-1.5 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-[0.15em]">Last Activity</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Clock className="w-3 h-3 text-[#af9164] opacity-70" />
                            {new Date(item.lastUpdated).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                  </div>

                  {/* Action Reveal */}
                  <div className="absolute bottom-8 right-8 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out pointer-events-none">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#af9164]">
                          Open Dossier <ArrowRight className="w-4 h-4" />
                      </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- Loading State --- */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
              </div>
              <h3 className="font-serif text-xl text-slate-900 italic mb-2">Loading Cases</h3>
              <p className="text-slate-500 text-sm">Please wait while we fetch your case information...</p>
            </div>
          )}

          {/* --- Error State --- */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-red-200 bg-red-50/50 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-serif text-xl text-slate-900 italic mb-2">Error Loading Cases</h3>
              <p className="text-slate-500 text-sm mb-6">{error}</p>
              <button 
                onClick={fetchCases}
                className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-800 underline underline-offset-4"
              >
                Try Again
              </button>
            </div>
          )}

          {/* --- Empty State --- */}
          {!loading && !error && filteredCases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <Filter className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="font-serif text-xl text-slate-900 italic mb-2">
                {cases.length === 0 ? 'No Cases Found' : 'No Records Found'}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {cases.length === 0 
                  ? "You haven't submitted any cases yet. Start by submitting your first case."
                  : "There are no cases matching your current criteria."
                }
              </p>
              {cases.length === 0 ? (
                <button 
                  onClick={() => onNavigate("apply-new")}
                  className="text-xs font-bold uppercase tracking-widest text-[#af9164] hover:text-[#92784e] underline underline-offset-4"
                >
                  Submit Your First Case
                </button>
              ) : (
                <button 
                  onClick={() => {setFilterStatus("all"); setSearchTerm("")}}
                  className="text-xs font-bold uppercase tracking-widest text-[#af9164] hover:text-[#92784e] underline underline-offset-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* --- Footer --- */}
          <div className="text-center pt-12">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              LegalSphere Secure Client Portal • Encrypted E2EE
            </p>
          </div>

        </div>
    </div>
  );
}
