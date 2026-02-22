"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  Search, 
  Calendar,
  Clock,
  User,
  Phone,
  Video,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Send,
  Paperclip,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// Client Card Component
const ClientCard = ({ caseItem, onSelect, isActive }: { caseItem: any; onSelect: (c: any) => void; isActive: boolean }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div
      onClick={() => onSelect(caseItem)}
      className={cn(
        "bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
        isActive ? "border-[#af9164] shadow-md" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#af9164] flex items-center justify-center text-sm font-bold text-[#1a2238]">
            {typeof caseItem.client?.name === 'string' ? caseItem.client.name.charAt(0) : (typeof caseItem.client === 'string' ? caseItem.client.charAt(0) : "C")}
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#1a2238]">
              {caseItem.client?.name || (typeof caseItem.client === 'string' ? caseItem.client : "Unknown Client")}
            </h3>
            <p className="text-xs text-slate-500">Client</p>
          </div>
        </div>
        <div className={cn(
          "text-[8px] font-bold uppercase tracking-[0.2em] px-2.5 py-1.5 border",
          caseItem.status?.toLowerCase() === "active" 
            ? "text-green-700 border-green-200 bg-green-50" 
            : "text-slate-500 border-slate-200 bg-slate-50"
        )}>
          {caseItem.status}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Case Title</p>
          <p className="text-sm text-slate-800 font-medium line-clamp-2">
            {caseItem.case?.title || caseItem.title || "Untitled Case"}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Category</p>
            <p className="text-xs text-slate-600">{caseItem.case?.category || caseItem.category || "Other"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Submitted</p>
            <p className="text-xs text-slate-600">
              {formatDate(caseItem.submittedDate || caseItem.createdAt || caseItem.assignedAt || Date.now())}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>Last updated: {formatDate(caseItem.updatedAt || Date.now())}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-[#1a2238] transition-colors">
            <Phone className="w-3 h-3" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-[#1a2238] transition-colors">
            <Video className="w-3 h-3" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-[#1a2238] transition-colors">
            <Mail className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Communication Interface Component (adapted for lawyer view)
const ClientCommunicationInterface = ({ caseData, currentUser }: { caseData: any; currentUser: any }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? (localStorage.getItem("userToken") || localStorage.getItem("token")) : "";
  let userObj = currentUser;
  if (!userObj || !userObj.id) {
     if (typeof window !== "undefined") {
       try {
         const parsed = JSON.parse(localStorage.getItem("userData") || "{}");
         userObj = Array.isArray(parsed) ? parsed[0] : parsed;
       } catch (e) {}
     }
  }
  const userId = userObj?.id || userObj?.userId || userObj?.lawyerId || userObj?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Init chat via API
  useEffect(() => {
    if (!caseData || caseData.status?.toLowerCase() !== "active") return;
    
    let isSubscribed = true;
    
    const initChat = async () => {
      try {
        // For lawyers, we need the client ID to start a chat
        const clientId = caseData.client?.id || caseData.clientId;
        if (!clientId) return;

        const res = await fetch(`${API_BASE_URL}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ client_id: clientId })
        });
        
        const data = await res.json();
        if (data.Success && data.Data?.id && isSubscribed) {
          setChatId(data.Data.id);
        }
      } catch (err) {
        console.error("Failed to init chat", err);
      }
    };
    
    initChat();
    
    return () => {
      isSubscribed = false;
    };
  }, [caseData, token]);

  // Connect via SocketIO for real-time messages
  useEffect(() => {
    if (!chatId || !token) return;
    let isSubscribed = true;
    let socket: any = null;

    // 1. Fetch initial historical messages
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
          headers: {
            "Authorization": `Bearer ${token}`
          },
        });
        const data = await res.json();
        
        let msgs = data;
        if (data && data.Data) {
          msgs = data.Data;
        }

        if (isSubscribed && msgs && Array.isArray(msgs)) {
          const formattedMessages = msgs.map((m: any) => ({
            id: m._id || m.id,
            sender: String(m.sender_id) === String(userId) ? "lawyer" : "client",
            content: m.text || m.message || m.content || "",
            timestamp: new Date(m.created_at || m.sent_at || Date.now()),
            read: m.read_by && m.read_by.length > 0
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();

    // 2. Initialize SocketIO
    import("socket.io-client").then(({ io }) => {
      if (!isSubscribed) return;
      
      socket = io(API_BASE_URL, {
        auth: { token }
      });

      socket.on("connect", () => {
        console.log("🟢 Connected to SocketIO!");
        socket.emit("join_chat", { chat_id: chatId });
      });

      socket.on("new_message", (payload: any) => {
        let m = payload;
        if (typeof payload === 'string') {
          try { m = JSON.parse(payload); } catch(e) {}
        }
        if (Array.isArray(m) && m.length > 0) {
          m = m[0];
        }
        if (m && m.data) {
          m = m.data;
        }

        console.log("📨 Received new_message:", m);
        if (!isSubscribed) return;
        const formattedMessage = {
          id: m._id || m.id,
          sender: String(m.sender_id) === String(userId) ? "lawyer" : "client",
          content: m.text || m.message || m.content || "",
          raw_text: m.text,
          raw_message: m.message,
          timestamp: new Date(m.created_at || m.sent_at || Date.now()),
          read: m.read_by && m.read_by.length > 0
        };
        console.log("📝 Formatted message:", formattedMessage);
        console.log("👤 Current userId:", userId, "type:", typeof userId);
        console.log("📤 Sender ID:", m.sender_id, "type:", typeof m.sender_id);
        console.log("🔍 Sender match?", String(m.sender_id) === String(userId));
        
        setMessages((prev: any[]) => {
          // Prevent duplicates
          if (prev.some((msg: any) => String(msg.id) === String(formattedMessage.id))) {
             return prev;
          }
          const newMessages = [...prev, formattedMessage];
          console.log("💬 Updated messages:", newMessages);
          return newMessages;
        });
      });
    });

    return () => {
      isSubscribed = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [chatId, token, userId]);

  const handleSendMessage = async () => {
    if (message.trim() && chatId) {
      const textToSend = message.trim();
      setMessage("");
      
      try {
         await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ text: textToSend })
        });
      } catch (err) {
        console.error("Failed to send message", err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Uploading files:", files);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    try {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (hours > 24) {
        return timestamp.toLocaleDateString();
      } else if (hours > 0) {
        return `${hours}h ago`;
      } else if (minutes > 0) {
        return `${minutes}m ago`;
      } else {
        return "Just now";
      }
    } catch {
      return "Recently";
    }
  };

  const clientName = typeof caseData?.client?.name === "string" ? caseData.client.name : (typeof caseData?.client === "string" ? caseData.client : "Client");

  if (!clientName || caseData?.status?.toLowerCase() !== "active") {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 mx-auto">
            <MessageCircle className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-serif text-xl text-slate-900 italic mb-2">Chat Unavailable</h3>
          <p className="text-slate-500 text-sm">
            Communication is only available for active cases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[300px]">
        {messages.map((msg: any) => (
          <motion.div
            key={msg.id || Math.random()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3",
              msg.sender === "lawyer" ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender === "client" && (
              <div className="w-8 h-8 rounded-full bg-[#af9164] flex items-center justify-center text-xs font-bold text-[#1a2238] flex-shrink-0 shadow-sm">
                {typeof clientName === 'string' ? clientName.charAt(0) : 'C'}
              </div>
            )}
            
            <div className={cn(
              "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm",
              msg.sender === "lawyer" 
                ? "bg-[#1a2238] text-white rounded-tr-sm" 
                : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
            )}>
              <p className="text-[13px] leading-relaxed">{msg.content}</p>
              <div className={cn(
                "flex items-center gap-1.5 mt-1.5 text-[10px]",
                msg.sender === "lawyer" ? "text-slate-400" : "text-slate-400"
              )}>
                <span>{formatTimestamp(msg.timestamp)}</span>
                {msg.sender === "lawyer" && msg.read && (
                  <CheckCircle2 className="w-3 h-3 text-green-400 ml-1" />
                )}
              </div>
            </div>
            
            {msg.sender === "lawyer" && (
              <div className="w-8 h-8 rounded-full bg-[#1a2238] flex items-center justify-center text-xs font-bold text-[#af9164] flex-shrink-0 shadow-sm">
                {typeof userObj?.name === 'string' ? userObj.name.charAt(0) : "L"}
              </div>
            )}
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#af9164] flex items-center justify-center text-xs font-bold text-[#1a2238] flex-shrink-0 shadow-sm">
              {typeof clientName === 'string' ? clientName.charAt(0) : 'C'}
            </div>
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm inline-flex">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Panel */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-200 p-3 bg-white"
          >
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">
                <Calendar className="w-3 h-3" /> Schedule Meeting
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition-colors">
                <Mail className="w-3 h-3" /> Email Summary
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="border-t border-slate-200 p-3 bg-white relative">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 pr-1.5 pb-1 focus-within:border-[#1a2238] focus-within:ring-1 focus-within:ring-[#1a2238] transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-[#1a2238] transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Write a message to your client..."
            className="flex-1 bg-transparent px-2 pb-2.5 pt-3 outline-none text-[13px] text-slate-800 placeholder:text-slate-400"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={cn(
              "p-2.5 rounded-lg mb-0.5 transition-all duration-200",
              message.trim() 
                ? "bg-[#1a2238] text-[#af9164] hover:bg-[#2d3648] shadow-sm transform hover:scale-105 active:scale-95" 
                : "bg-transparent text-slate-300 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main View Component
export default function ClientCommunicationView() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user data
    if (typeof window !== "undefined") {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const parsed = JSON.parse(userData);
          setCurrentUser(Array.isArray(parsed) ? parsed[0] : parsed);
        }
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token");
      
      // Fetch lawyer's assigned cases from the API
      const response = await fetch(`${API_BASE_URL}/api/case-requests?status=active&limit=50`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.error || data.Message) {
        setError(data.error || data.Message);
      } else if (data.data || data.cases) {
        const casesData = data.data?.cases || data.cases || [];
        
        // Filter only cases with clients assigned
        const casesWithClients = casesData.filter(
          (caseItem: any) => caseItem.client || caseItem.clientId
        );
        setCases(casesWithClients);
        
        // Auto-select first case if available
        if (casesWithClients.length > 0) {
          setSelectedCase(casesWithClients[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter((caseItem: any) => {
    const clientName = caseItem.client?.name || (typeof caseItem.client === 'string' ? caseItem.client : "");
    const matchesSearch = 
      caseItem.case?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || caseItem.status?.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-[#efefec] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 mx-auto">
            <MessageCircle className="w-6 h-6 text-slate-300 animate-pulse" />
          </div>
          <h3 className="font-serif text-xl text-slate-900 italic mb-2">Loading Client Communications</h3>
          <p className="text-slate-500 text-sm">Please wait while we fetch your active cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full bg-[#efefec] overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar - Cases List */}
        <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <h1 className="font-serif text-2xl text-[#1a2238] leading-tight mb-2">
              Client <span className="italic text-slate-500">Communications</span>
            </h1>
            <p className="text-sm text-slate-500">
              Chat with your assigned clients
            </p>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cases or clients..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#1a2238]"
              />
            </div>
            
            <div className="flex gap-2">
              {["all", "active", "completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors",
                    filterStatus === status
                      ? "bg-[#1a2238] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredCases.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 mx-auto">
                  <MessageCircle className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No assigned cases found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {cases.length === 0 
                    ? "You don't have any cases with assigned clients yet."
                    : "No cases match your current criteria."
                  }
                </p>
              </div>
            ) : (
              filteredCases.map((caseItem: any) => (
                <ClientCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onSelect={setSelectedCase}
                  isActive={selectedCase?.id === caseItem.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Content - Communication Interface */}
        {/* Right Content - Communication Interface */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedCase ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Selected Case Header */}
              <div className="bg-white border-b border-slate-200 p-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg text-[#1a2238]">
                      {selectedCase.client?.name || (typeof selectedCase.client === 'string' ? selectedCase.client : "Client")}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        Case: {selectedCase.case?.title || selectedCase.title}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs text-slate-500">
                        {selectedCase.case?.category || selectedCase.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-[#1a2238] transition-colors">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Communication Interface */}
              {/* ADDED min-h-0, flex, and flex-col here to prevent vertical layout collapse */}
              <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
                <ClientCommunicationInterface 
                  caseData={selectedCase} 
                  currentUser={currentUser} 
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 italic mb-2">Select a Case</h3>
                <p className="text-slate-500 text-sm">
                  Choose a case from the left to start communicating with your client
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
