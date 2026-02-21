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

const LawyerCommunicationInterface = ({ caseData, currentUser }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock initial messages
  useEffect(() => {
    if (caseData?.lawyer && caseData?.status === "Active") {
      setMessages([
        {
          id: 1,
          sender: "lawyer",
          content: `Hello! I've been assigned to your case "${caseData?.title}". I've reviewed the initial documents and I'm ready to discuss the next steps.`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 2,
          sender: "client",
          content: "Thank you for taking on my case. When can we schedule our first consultation?",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          read: true
        },
        {
          id: 3,
          sender: "lawyer",
          content: "I'm available for a consultation tomorrow at 2 PM via video call. I'll also send you a summary of my initial assessment by end of day today.",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: true
        }
      ]);
    }
  }, [caseData]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "client",
        content: message,
        timestamp: new Date(),
        read: false
      };
      
      setMessages([...messages, newMessage]);
      setMessage("");
      setIsTyping(true);
      
      // Simulate lawyer response
      setTimeout(() => {
        const lawyerResponse = {
          id: messages.length + 2,
          sender: "lawyer",
          content: "I've received your message. I'll review it and get back to you shortly.",
          timestamp: new Date(),
          read: false
        };
        setMessages(prev => [...prev, lawyerResponse]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      // Handle file upload logic here
      console.log("Uploading files:", files);
    }
  };

  const formatTimestamp = (timestamp) => {
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
  };

  if (!caseData?.lawyer || caseData?.status !== "Active") {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2238] to-[#2d3648] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#af9164] flex items-center justify-center text-sm font-bold">
              {caseData.lawyer?.charAt(0)}
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">{caseData.lawyer}</h3>
              <div className="flex items-center gap-2 text-xs text-green-300">
                <CheckCircle2 className="w-3 h-3" />
                <span>Available</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Calendar className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3",
              msg.sender === "client" ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender === "lawyer" && (
              <div className="w-8 h-8 rounded-full bg-[#1a2238] flex items-center justify-center text-xs font-bold text-[#af9164] flex-shrink-0">
                {caseData.lawyer?.charAt(0)}
              </div>
            )}
            
            <div className={cn(
              "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
              msg.sender === "client" 
                ? "bg-[#1a2238] text-white" 
                : "bg-white border border-slate-200 text-slate-800"
            )}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <div className={cn(
                "flex items-center gap-2 mt-1 text-xs",
                msg.sender === "client" ? "text-slate-300" : "text-slate-500"
              )}>
                <span>{formatTimestamp(msg.timestamp)}</span>
                {msg.sender === "client" && msg.read && (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </div>
            </div>
            
            {msg.sender === "client" && (
              <div className="w-8 h-8 rounded-full bg-[#af9164] flex items-center justify-center text-xs font-bold text-[#1a2238] flex-shrink-0">
                {currentUser?.name?.charAt(0) || "Y"}
              </div>
            )}
          </motion.div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#1a2238] flex items-center justify-center text-xs font-bold text-[#af9164] flex-shrink-0">
              {caseData.lawyer?.charAt(0)}
            </div>
            <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
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
            className="border-t border-slate-200 p-3 bg-slate-50"
          >
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Calendar className="w-3 h-3" />
                Schedule Meeting
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Mail className="w-3 h-3" />
                Email Summary
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Star className="w-3 h-3" />
                Rate Service
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <User className="w-3 h-3" />
                View Profile
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-[#af9164] transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1a2238] text-sm"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={cn(
              "p-2 rounded-lg transition-colors",
              message.trim() 
                ? "bg-[#1a2238] text-white hover:bg-[#af9164]" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
