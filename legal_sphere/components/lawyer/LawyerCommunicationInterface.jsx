"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Paperclip, 
  Phone, 
  Video, 
  Calendar, 
  Clock, 
  CheckCircle2,
  MessageCircle,
  User,
  Mail,
  Star,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const LawyerCommunicationInterface = ({ caseData, currentUser }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [chatId, setChatId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const token = typeof window !== "undefined" ? (localStorage.getItem("userToken") || localStorage.getItem("token")) : "";
  // Check currentUser first, otherwise parse from localStorage in case it's mispassed
  let userObj = currentUser;
  if (!userObj || !userObj.id) {
     if (typeof window !== "undefined") {
       try {
         const parsed = JSON.parse(localStorage.getItem("userData") || "{}");
         userObj = Array.isArray(parsed) ? parsed[0] : parsed;
       } catch (e) {}
     }
  }
  const userId = userObj?.id || userObj?.userId || userObj?.clientId || userObj?._id;

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
        const lawyerId = caseData.assignedLawyerId || caseData.assignedLawyer?.id || caseData.assignedLawyer?.lawyerId;
        if (!lawyerId) return;

        const res = await fetch(`${API_BASE_URL}/api/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ lawyer_id: lawyerId })
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
    let socket = null;

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
          const formattedMessages = msgs.map(m => ({
            id: m._id || m.id,
            sender: String(m.sender_id) === String(userId) ? "client" : "lawyer",
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

      socket.on("new_message", (payload) => {
        if (!isSubscribed) return;
        
        let m = payload;
        if (typeof payload === 'string') {
          try { m = JSON.parse(payload); } catch(e) {}
        }
        if (Array.isArray(m) && m.length > 0) {
          m = m[0];
        }
        // Sometimes the payload is wrapped in a data property
        if (m && m.data) {
          m = m.data;
        }

        const formattedMessage = {
          id: m._id || m.id,
          sender: String(m.sender_id) === String(userId) ? "client" : "lawyer",
          content: m.text || m.message || m.content || "",
          timestamp: new Date(m.created_at || m.sent_at || Date.now()),
          read: m.read_by && m.read_by.length > 0
        };
        
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(msg => String(msg.id) === String(formattedMessage.id))) {
             return prev;
          }
          return [...prev, formattedMessage];
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

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      console.log("Uploading files:", files);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const now = new Date();
      const diff = now - timestamp;
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

  if (!caseData?.lawyer || caseData?.status?.toLowerCase() !== "active") {
    return null;
  }

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">



      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[300px]">
        {messages.map((msg) => (
          <motion.div
            key={msg.id || Math.random()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3",
              msg.sender === "client" ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender === "lawyer" && (
              <div className="w-8 h-8 rounded-full bg-[#1a2238] flex items-center justify-center text-xs font-bold text-[#af9164] flex-shrink-0 shadow-sm">
                {typeof caseData.lawyer === 'string' ? caseData.lawyer.charAt(0) : "L"}
              </div>
            )}
            
            <div className={cn(
              "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-sm",
              msg.sender === "client" 
                ? "bg-[#1a2238] text-white rounded-tr-sm" 
                : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
            )}>
              <p className="text-[13px] leading-relaxed">{msg.content}</p>
              <div className={cn(
                "flex items-center gap-1.5 mt-1.5 text-[10px]",
                msg.sender === "client" ? "text-slate-400" : "text-slate-400"
              )}>
                <span>{formatTimestamp(msg.timestamp)}</span>
                {msg.sender === "client" && msg.read && (
                  <CheckCircle2 className="w-3 h-3 text-green-400 ml-1" />
                )}
              </div>
            </div>
            
            {msg.sender === "client" && (
              <div className="w-8 h-8 rounded-full bg-[#af9164] flex items-center justify-center text-xs font-bold text-[#1a2238] flex-shrink-0 shadow-sm">
                {typeof userObj?.name === 'string' ? userObj.name.charAt(0) : "U"}
              </div>
            )}
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#1a2238] flex items-center justify-center text-xs font-bold text-[#af9164] flex-shrink-0 shadow-sm">
              {typeof caseData.lawyer === 'string' ? caseData.lawyer.charAt(0) : "L"}
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
            placeholder="Write a message..."
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

export default LawyerCommunicationInterface;
