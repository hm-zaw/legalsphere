"use client";

import { useState } from "react";
import { 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  FileText,
  Gavel,
  Clock,
  MapPin,
  Activity, 
  Radio, 
  Component,
  User,
  Users,
  Tag,
  Phone,
  Calendar as CalendarIcon
} from "lucide-react";
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const tasks = [
  {
    id: 1,
    title: "Initial Case Strategy",
    type: "Meeting",
    location: "Office / Zoom",
    date: "May 21, 2024 at 10:00 am",
    tags: ["Civil Litigation"],
    status: "Completed",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-l-blue-600",
    icon: <Users className="w-3 h-3" />,
    day: "TUE",
    colStart: 2, 
    rowStart: 2,
  },
  {
    id: 2,
    title: "Evidence Submission Deadline",
    type: "Document",
    location: "Client Portal",
    date: "May 22, 2024 at 5:00 pm",
    tags: ["Discovery"],
    status: "Action Required",
    statusColor: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-l-amber-500",
    icon: <FileText className="w-3 h-3" />,
    day: "WED",
    colStart: 3, 
    rowStart: 4,
  },
  {
    id: 3,
    title: "Review Settlement Offer",
    type: "Review",
    location: "Pending Review",
    date: "May 22, 2024 at 9:00 am",
    tags: ["Negotiation"],
    status: "Pending",
    statusColor: "bg-gray-100 text-gray-700 border-gray-200",
    border: "border-l-gray-500",
    icon: <FileText className="w-3 h-3" />,
    day: "WED",
    colStart: 3, 
    rowStart: 1,
  },
  {
    id: 4,
    title: "Prelim. Court Hearing",
    type: "Court",
    location: "Superior Court, Rm 304",
    date: "May 23, 2024 at 2:00 pm",
    tags: ["Appearance"],
    status: "Attendance Mandatory",
    statusColor: "bg-red-50 text-red-700 border-red-200",
    border: "border-l-red-700",
    icon: <Gavel className="w-3 h-3" />,
    day: "THU",
    colStart: 4, 
    rowStart: 3,
  },
  {
    id: 5,
    title: "Deposition Prep w/ Attorney",
    type: "Meeting",
    location: "Conference Room A",
    date: "May 24, 2024 at 11:15 am",
    tags: ["Discovery"],
    status: "Confirmed",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-l-blue-600",
    icon: <Users className="w-3 h-3" />,
    day: "FRI",
    colStart: 5, 
    rowStart: 2,
  },
];

export default function AlexaAIPage() {
  const days = ["MON 20", "TUE 21", "WED 22", "THU 23", "FRI 24", "SAT 25", "SUN 26"];

  return (
    <AceternitySidebarDemo>
      <main className="flex-1 bg-white flex flex-col h-screen overflow-y-auto rounded-tl-3xl">
        {/* --- Header Section (Unchanged) --- */}
        <header className="p-6 pb-2">
          <div className="flex justify-between items-start mb-6">
            <Breadcrumbs />
          </div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-600 rounded-md flex items-center justify-center text-white">
                <Component className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">#57 - Contract Dispute Resolution</h2>
                <p className="text-sm text-gray-500 mt-1">Your legal case for breach of contract seeking damages and resolution.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50">
                <Activity className="w-3 h-3" /> Case Activity
              </button>
              <button className="flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50">
                <FileText className="w-3 h-3" /> Documents
              </button>
            </div>
          </div>

          {/* Project Meta */}
          <div className="flex flex-col gap-y-3 p-3 text-xs">
            <div className="flex items-center gap-x-16">
              <div className="flex items-center gap-1 w-20">
                <Gavel className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Status</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1 py-0.5">
                  <span className="text-gray-600">Active</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-16">
              <div className="flex items-center gap-1 w-20">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Attorney</span>
              </div>
              <div className="flex items-center gap-1 gap-x-3">
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                  <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random" className="w-4 h-4 rounded-full" alt="Sarah Jenkins" />
                  <span className="text-gray-600">Sarah Jenkins</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                  <img src="https://ui-avatars.com/api/?name=Michael+Chen&background=random" className="w-4 h-4 rounded-full" alt="Michael Chen" />
                  <span className="text-gray-600">Michael Chen</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-16">
              <div className="flex items-center gap-1 w-20">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">Category</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 px-1 py-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">Civil Litigation</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">Contract Law</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-16">
              <div className="flex items-center gap-1 w-20">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600 whitespace-nowrap">Legal Team</span>
              </div>
              <div className="flex items-center gap-1 gap-x-2">
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                  <img src="https://ui-avatars.com/api/?name=Robert+Williams&background=random" className="w-4 h-4 rounded-full" alt="Robert Williams" />
                  <span className="text-gray-600">Robert Williams</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                  <img src="https://ui-avatars.com/api/?name=Emily+Davis&background=random" className="w-4 h-4 rounded-full" alt="Emily Davis" />
                  <span className="text-gray-600">Emily Davis</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                  <img src="https://ui-avatars.com/api/?name=James+Wilson&background=random" className="w-4 h-4 rounded-full" alt="James Wilson" />
                  <span className="text-gray-600">James Wilson</span>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors">
                  <img src="https://ui-avatars.com/api/?name=Lisa+Anderson&background=random" className="w-4 h-4 rounded-full" alt="Lisa Anderson" />
                  <span className="text-gray-600">Lisa Anderson</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* --- Card Container for Toolbar and Timeline --- */}
        <div className="flex-1 bg-gray-50/50 px-6 py-4">
          <div className="bg-white rounded-md border border-gray-200 shadow-xs overflow-hidden h-full flex flex-col">
            
            {/* --- Toolbar --- */}
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <div className="flex bg-gray-100 p-1 rounded-md">
                {["Kanban", "List", "Timeline"].map((view) => (
                  <button 
                    key={view}
                    className={`px-4 py-0.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      view === "Timeline" 
                        ? "bg-white shadow-sm text-gray-900" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-md bg-white">
                  <button className="p-1 hover:bg-gray-50 text-gray-500"><ChevronLeft className="w-3 h-3" /></button>
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-2 px-2 border-l border-r border-gray-100 h-8">
                    <CalendarIcon className="w-3 h-3" /> 
                    8 May - 23 May
                  </span>
                  <button className="p-1 hover:bg-gray-50 text-gray-500"><ChevronRight className="w-3 h-3" /></button>
                </div>
                <button className="flex items-center gap-2 px-3 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50">
                  <Filter className="w-3 h-3" /> Filter
                </button>
              </div>
            </div>

            {/* --- Timeline Grid --- */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="min-w-[1000px] h-full flex flex-col relative">
                
                {/* Grid Header (Days) */}
                <div className="grid grid-cols-7 border-b border-gray-100 bg-white sticky top-0 z-30">
                  {days.map((day, idx) => {
                    const isToday = idx === 3; // THU 23
                    return (
                      <div 
                        key={day} 
                        className={`py-3 text-center text-xs font-bold relative ${
                          isToday ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {day}
                        {/* Orange top indicator for Today */}
                        {isToday && <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-400" />}
                      </div>
                    );
                  })}
                </div>

                {/* Grid Background Area */}
                <div className="relative flex-1 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30">
                  
                  {/* Subtle Background Pattern */}
                  <div className="absolute inset-0 opacity-[0.03]">
                    <div className="h-full w-full" style={{
                      backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%), 
                                     radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)`,
                    }} />
                  </div>
                  
                  {/* Horizontal Hour Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute w-full border-t border-gray-100/70"
                        style={{ top: `${(i / 24) * 100}%` }}
                      >
                        {i % 6 === 0 && (
                          <span className={`absolute left-2 text-[10px] text-gray-400 font-medium ${
                            i === 0 ? "top-1" : "-top-2"
                          }`}>
                            {i === 0 ? '12 AM' : i === 12 ? '12 PM' : i < 12 ? `${i} AM` : `${i - 12} PM`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Vertical Column Lines */}
                  <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`border-r border-gray-200/60 h-full relative ${
                           // Enhanced styling for Thursday (index 3) - Today
                           i === 3 ? "bg-gradient-to-b from-blue-50/30 to-transparent" : ""
                        }`}
                        style={i === 3 ? {
                          backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(59, 130, 246, 0.03) 8px, rgba(59, 130, 246, 0.03) 16px)"
                        } : {}}
                      >
                        {/* Enhanced Current Time Marker (Only in Thursday Column) */}
                        {i === 3 && (
                          <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-600 left-1/2 z-20 shadow-sm">
                            <div className="w-2.5 h-2.5 bg-blue-500 rotate-45 absolute -top-1.5 -left-[4.5px] shadow-sm" />
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium shadow-sm whitespace-nowrap">
                              NOW
                            </div>
                          </div>
                        )}
                        
                        {/* Weekend Subtle Background */}
                        {(i === 5 || i === 6) && (
                          <div className="absolute inset-0 bg-gradient-to-b from-gray-100/20 to-transparent" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Task Cards Container */}
                  <div className="grid grid-cols-7 grid-rows-6 gap-3 p-4 relative z-10 h-full">
                    {tasks.map((task) => (
                      <div 
                        key={task.id}
                        style={{ 
                          gridColumnStart: task.colStart, 
                          gridRowStart: task.rowStart 
                        }}
                        // Added group/wrapper to handle z-index elevation on hover
                        className="relative group/wrapper"
                      >
                        {/* UPDATED CARD DESIGN:
                          1. min-w-[240px]: This forces the card to be wider than the column, overlapping the next day.
                          2. z-index: Base z-20 to sit above grid lines. z-50 on hover to pop to front.
                        */}
                        <div className={`
                            bg-white border border-gray-200 border-l-[3px] ${task.border} 
                            rounded-md p-2.5 shadow-sm 
                            min-w-[240px] relative z-20 group-hover/wrapper:z-50
                            transition-all duration-200 cursor-pointer 
                            hover:shadow-md hover:ring-1 hover:ring-gray-200
                        `}>
                          
                          {/* ROW 1: Title (Left) & Status (Right) */}
                          <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="text-gray-500 flex-shrink-0">{task.icon}</span>
                                <h4 className="font-bold text-[12px] text-gray-900 leading-none">{task.title}</h4>
                              </div>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded border ${task.statusColor} font-medium whitespace-nowrap ml-2`}>
                                {task.status}
                              </span>
                          </div>
                          
                          {/* ROW 2: Metadata (Time & Location side-by-side) */}
                          <div className="flex items-center gap-3 mb-2 text-gray-500">
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <p className="text-[10px] font-medium whitespace-nowrap">{task.date.split('at')[1]}</p>
                            </div>
                            <div className="flex items-center gap-1 border-l border-gray-200 pl-3 overflow-hidden">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <p className="text-[10px] truncate">{task.location}</p>
                            </div>
                          </div>
                          
                          {/* ROW 3: Tags (Left) & Avatar (Right) */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1 overflow-hidden">
                              {task.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] text-gray-500 font-medium whitespace-nowrap">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-1 pl-2 flex-shrink-0">
                              <span className="text-[8px] text-gray-400 font-medium hidden group-hover/wrapper:block transition-all">Counsel:</span>
                              <img 
                                src={`https://ui-avatars.com/api/?name=${task.id === 4 ? "Harvey+Specter" : "Mike+Ross"}&background=0D1117&color=fff`} 
                                className="w-5 h-5 rounded-full border border-gray-100" 
                                alt="Attorney"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AceternitySidebarDemo>
  );
}