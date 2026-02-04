"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, FileText, Clock, Star, CheckCircle, AlertCircle, Scale, Briefcase, Users, Shield, ChevronRight, Menu, X, Link, ArrowLeft, Download, MessageSquare, Calendar, UserCheck } from "lucide-react";
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function CaseDetailsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sample case details
  const caseDetails = {
    id: "CASE-2024-001",
    title: "Business Contract Review",
    status: "Lawyer Assigned",
    progress: 60,
    category: "Business Law",
    lawyer: {
      name: "Sarah Chen",
      email: "sarah.chen@legalsphere.com",
      phone: "+1 (555) 123-4567",
      experience: "12 years",
      rating: 4.9,
      avatar: "/api/placeholder/60/60"
    },
    description: "Review and analysis of a comprehensive business partnership agreement including terms of ownership, profit distribution, and exit strategies.",
    submittedDate: "January 15, 2024",
    lastUpdated: "2 hours ago",
    documents: [
      { name: "Partnership_Agreement.pdf", size: "2.4 MB", uploaded: "Jan 15, 2024" },
      { name: "Financial_Statements.xlsx", size: "1.1 MB", uploaded: "Jan 16, 2024" },
      { name: "Company_Bylaws.pdf", size: "856 KB", uploaded: "Jan 16, 2024" }
    ],
    timeline: [
      { title: "Case Submitted", completed: true, time: "Jan 15, 2024", description: "Initial case submission and document upload" },
      { title: "Documents Verified", completed: true, time: "Jan 16, 2024", description: "All required documents verified and processed" },
      { title: "AI Classification", completed: true, time: "Jan 17, 2024", description: "AI system classified case as Business Law" },
      { title: "Lawyer Matched", completed: true, time: "Jan 18, 2024", description: "Sarah Chen assigned as lead attorney" },
      { title: "Initial Review", completed: true, time: "Jan 20, 2024", description: "Lawyer completed initial document review" },
      { title: "Legal Analysis", completed: false, time: "Pending", description: "Comprehensive legal analysis in progress" },
      { title: "Recommendations", completed: false, time: "Pending", description: "Legal recommendations and next steps" }
    ]
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, [router]);

  const handleBackToCases = () => {
    router.push('/my-cases');
  };

  const handleDownloadDocument = (docName) => {
    console.log(`Downloading ${docName}`);
    // Implement download logic
  };

  const handleContactLawyer = () => {
    console.log('Opening lawyer contact');
    // Implement contact lawyer logic
  };

  return (
    <AceternitySidebarDemo>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Breadcrumbs />
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-yellow-600 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      <p className="text-sm text-gray-900">Sample notification</p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {userData?.name || 'User'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Back Button */}
          <button
            onClick={handleBackToCases}
            className="flex items-center text-gray-600 hover:text-yellow-600 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Cases
          </button>

          {/* Case Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{caseDetails.title}</h1>
                <p className="text-gray-600">{caseDetails.id} • {caseDetails.category}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-2">
                  {caseDetails.status}
                </span>
                <p className="text-sm text-gray-500">Updated {caseDetails.lastUpdated}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Case Progress</span>
                <span>{caseDetails.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${caseDetails.progress}%` }}
                ></div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">{caseDetails.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Case Timeline</h2>
                <div className="relative">
                  {caseDetails.timeline.map((step, index) => (
                    <div key={index} className="flex items-start mb-6 last:mb-0">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          step.completed 
                            ? 'bg-yellow-600 border-yellow-600' 
                            : 'bg-white border-gray-300'
                        }`}></div>
                        {index < caseDetails.timeline.length - 1 && (
                          <div className={`w-0.5 h-16 mt-2 ${
                            step.completed ? 'bg-yellow-600' : 'bg-gray-300'
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          step.completed ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-1">{step.time}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>
                <div className="space-y-3">
                  {caseDetails.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.size} • Uploaded {doc.uploaded}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument(doc.name)}
                        className="flex items-center text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assigned Lawyer */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assigned Lawyer</h2>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{caseDetails.lawyer.name}</h3>
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="ml-1 text-gray-600">{caseDetails.lawyer.rating}</span>
                      <span className="ml-2 text-gray-500">• {caseDetails.lawyer.experience}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {caseDetails.lawyer.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {caseDetails.lawyer.phone}
                  </p>
                </div>
                
                <button
                  onClick={handleContactLawyer}
                  className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Lawyer
                </button>
              </div>

              {/* Case Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Submitted:</span>
                    <span className="ml-auto text-gray-900">{caseDetails.submittedDate}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <UserCheck className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-auto text-gray-900">{caseDetails.category}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-auto text-gray-900">{caseDetails.lastUpdated}</span>
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
