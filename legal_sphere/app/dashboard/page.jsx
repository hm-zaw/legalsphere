"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Search,
  Instagram,
  Filter,
  Plus,
  Info,
  User,
  FileText,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Scale,
  Briefcase,
  Users,
  Shield,
  ChevronRight,
  Menu,
  X,
  Link,
  ArrowRight,
  Check,
  Twitter,
  Youtube,
} from "lucide-react";
import Image from "next/image";
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "AI analysis completed for case #1234",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      message: "Lawyer assigned to your case",
      time: "5 hours ago",
      type: "info",
    },
    {
      id: 3,
      message: "Document upload successful",
      time: "1 day ago",
      type: "success",
    },
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sample data
  const userCases = [
    {
      id: "CASE-2024-001",
      title: "Business Contract Review",
      status: "Lawyer Assigned",
      progress: 60,
      lastUpdated: "2 hours ago",
      statusColor: "bg-blue-100 text-blue-800",
    },
    {
      id: "CASE-2024-002",
      title: "Property Dispute Resolution",
      status: "AI Analysis",
      progress: 30,
      lastUpdated: "1 day ago",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "CASE-2024-003",
      title: "Employment Agreement",
      status: "Under Review",
      progress: 15,
      lastUpdated: "3 days ago",
      statusColor: "bg-gray-100 text-gray-800",
    },
  ];

  const topLawyers = [
    {
      id: 1,
      name: "Sarah Chen",
      expertise: ["Corporate Law", "M&A"],
      rating: 4.9,
      experience: "12 years",
      avatar: "/api/placeholder/60/60",
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      expertise: ["Real Estate", "Property Law"],
      rating: 4.8,
      experience: "8 years",
      avatar: "/api/placeholder/60/60",
    },
    {
      id: 3,
      name: "Emily Watson",
      expertise: ["Family Law", "Divorce"],
      rating: 4.9,
      experience: "15 years",
      avatar: "/api/placeholder/60/60",
    },
    {
      id: 4,
      name: "James Park",
      expertise: ["Criminal Defense", "Civil Rights"],
      rating: 4.7,
      experience: "10 years",
      avatar: "/api/placeholder/60/60",
    },
  ];

  const avatarGradients = [
    "bg-gradient-to-tr from-rose-500 via-orange-400 to-yellow-500",
    "bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500",
    "bg-gradient-to-tr from-green-400 via-teal-400 to-cyan-400",
    "bg-gradient-to-tr from-blue-500 via-sky-400 to-indigo-500",
    "bg-gradient-to-tr from-pink-500 via-red-400 to-yellow-400",
  ];

  const legalServices = [
    {
      icon: Briefcase,
      name: "Business Law",
      description: "Corporate formation, contracts, compliance",
    },
    {
      icon: Users,
      name: "Family Law",
      description: "Divorce, custody, adoption, mediation",
    },
    {
      icon: Shield,
      name: "Criminal Defense",
      description: "Defense representation, legal advocacy",
    },
    {
      icon: Scale,
      name: "Civil Litigation",
      description: "Disputes, lawsuits, settlement negotiations",
    },
    {
      icon: FileText,
      name: "Document Review",
      description: "Contract analysis, legal document preparation",
    },
    {
      icon: Users,
      name: "Immigration Law",
      description: "Visas, citizenship, deportation defense",
    },
  ];

  const timelineSteps = [
    { title: "Case Submitted", completed: true, time: "Jan 15, 2024" },
    { title: "Documents Verified", completed: true, time: "Jan 16, 2024" },
    { title: "AI Classification", completed: true, time: "Jan 17, 2024" },
    { title: "Lawyer Matched", completed: true, time: "Jan 18, 2024" },
    { title: "Court Processing", completed: false, time: "Pending" },
    { title: "Resolution", completed: false, time: "Pending" },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleStartNewCase = () => {
    router.push("/apply-new");
  };

  const handleViewCases = () => {
    router.push("/my-cases");
  };

  return (
    <AceternitySidebarDemo>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto rounded-tl-3xl bg-white">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-1.5">
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
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-sm text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
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
                    {userData?.name || "User"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Action Section */}
        <section className="mb-8 -mt-12 min-h-screen flex items-center p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side Hero */}
            <div className="mt-8">
              <div className="flex -space-x-2 mb-4">
                {["John", "Sarah", "Mike"].map((name, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-white ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {name[0]}
                  </div>
                ))}
                <span className="pl-4 text-xs self-center font-medium text-slate-500">
                  Join 6,000+ users
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Manage your legal cases with clarity and confidence.
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                AI-assisted case review, secure documents, real-time updates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartNewCase}
                  className="bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors flex items-center justify-center"
                >
                  Start a New Case
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <button
                  onClick={handleViewCases}
                  className="border-2 border-gray-900 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center"
                >
                  View My Cases
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">15,2K</p>
                    <p className="text-xs text-gray-600">Active students</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Briefcase size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">4,5K</p>
                    <p className="text-xs text-gray-600">Tutors</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Link size={16} className="text-gray-600" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm">Resources</p>
                </div>
              </div>
            </div>
            {/* Right side Hero */}
            <div className="hidden lg:block">
              <Image
                src="/hero-svg-dsh.png"
                alt="Legal Dashboard Hero"
                width={650}
                height={450}
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </section>

        {/* Mini Dashboard Section */}
        <section className="mb-12 p-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm min-h-[600px] flex flex-col">
            {/* 1. Top Navigation Tabs (Inspired by the 'Events' tab in your image) */}
            <div className="flex items-center px-8 border-b border-slate-100 bg-white">
              {[
                "Activity",
                "Active Matters",
                "Milestones",
                "Council",
                "Documents",
              ].map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                    tab === "Active Matters"
                      ? "border-yellow-600 text-yellow-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 2. Main Content Area (Two-column layout like the screenshot) */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Column: List/Search View (35% width) */}
              <div className="w-1/3 border-r border-slate-100 p-6 overflow-y-auto bg-slate-50/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900">Ongoing Matters</h3>
                  <div className="flex gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <Filter className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  {userCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        caseItem.id === userCases[0].id
                          ? "bg-white border-yellow-200 shadow-sm"
                          : "bg-transparent border-transparent hover:bg-white/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${caseItem.statusColor} bg-opacity-10`}
                        >
                          {caseItem.status}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {caseItem.id}
                        </p>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                        {caseItem.title}
                      </h4>
                      <div className="mt-3 h-1 w-full bg-slate-100 rounded-full">
                        <div
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${caseItem.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Detail View (65% width) */}
              <div className="flex-1 p-8 overflow-y-auto bg-white">
                <div className="max-w-3xl">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {userCases[0].title}
                      </h2>
                      <p className="text-slate-500 mt-1">
                        Verification of legal documents and photo ID
                      </p>
                    </div>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create Event
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Re-integrated Case Milestones */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                        Current Progress
                      </h4>
                      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-slate-100">
                        {timelineSteps.map((step, index) => (
                          <div
                            key={index}
                            className="relative flex items-center group"
                          >
                            <div
                              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${
                                step.completed
                                  ? "bg-yellow-500"
                                  : "bg-slate-200"
                              }`}
                            >
                              {step.completed ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                              )}
                            </div>
                            <div className="ml-4">
                              <h5
                                className={`text-xs font-bold ${step.completed ? "text-slate-900" : "text-slate-400"}`}
                              >
                                {step.title}
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                {step.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Re-integrated Recommended Council */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                        Assigned Council
                      </h4>
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                        {topLawyers.slice(0, 2).map((lawyer) => (
                          <div
                            key={lawyer.id}
                            className="flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden">
                              <img
                                src={lawyer.image || "/api/placeholder/40/40"}
                                alt=""
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">
                                {lawyer.name}
                              </h5>
                              <p className="text-[10px] text-slate-500">
                                {lawyer.experience} Experience
                              </p>
                            </div>
                          </div>
                        ))}
                        <button className="w-full py-2 text-[11px] font-bold text-yellow-600 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors">
                          Contact Lead Lawyer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-white border-t border-slate-200 mt-32 pt-8 overflow-hidden relative">
          <div className="max-w-screen px-6 md:px-10">
            {/* Top Grid: Tighter Gap and Margins */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              {/* Left Column: Compact Socials & Info */}
              <div className="md:col-span-4 flex flex-col justify-between h-full">
                {/* Smaller Icons (w-8 h-8) */}
                <div className="flex gap-2 mb-4">
                  {[Instagram, Twitter, Youtube].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="group w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-yellow-600 hover:text-white transition-all"
                    >
                      <Icon
                        size={14}
                        className="text-slate-600 group-hover:text-white"
                      />
                    </a>
                  ))}
                </div>

                {/* Compact Text Info */}
                <div className="space-y-1 text-slate-500 font-light text-xs">
                  <p>9 Pearse St. Kinsale, York</p>
                  <p>
                    <a
                      href="mailto:info@legalsphere.com"
                      className="hover:text-slate-900"
                    >
                      info@legalsphere.com
                    </a>
                  </p>
                  <p>(+12) 808 130 1190</p>
                </div>
              </div>

              {/* Spacer */}
              <div className="hidden md:block md:col-span-2"></div>

              {/* Right Columns: Very Tight Links */}
              <div className="md:col-span-6 grid grid-cols-3 gap-4">
                {/* MENU */}
                <div className="space-y-2">
                  <h3 className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    Menu
                  </h3>
                  <ul className="space-y-1">
                    {["About", "Industries", "Product", "Categories"].map(
                      (item) => (
                        <li key={item}>
                          <a
                            href="#"
                            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            {item}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* SERVICES */}
                <div className="space-y-2">
                  <h3 className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    Services
                  </h3>
                  <ul className="space-y-1">
                    {["Corporate", "Litigation", "Family", "Criminal"].map(
                      (item) => (
                        <li key={item}>
                          <a
                            href="#"
                            className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            {item}
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {/* RESOURCES */}
                <div className="space-y-2">
                  <h3 className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                    Resources
                  </h3>
                  <ul className="space-y-1">
                    {["Blog", "Contact", "Terms", "Tutorials"].map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Divider Line with Smaller Floating Button */}
            <div className="relative border-t border-slate-200 w-full mb-6">
              <div className="absolute right-0 top-0 -translate-y-1/2">
                <button className="bg-yellow-600 text-white px-5 py-1.5 rounded-full text-xs font-bold hover:bg-yellow-700 transition-colors">
                  Get Started
                </button>
              </div>
            </div>

            {/* Bottom Row: Minimal Height */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 relative z-10">
              <p className="text-slate-400 text-[10px] max-w-xs leading-tight">
                Expert legal team elevating your brand & connecting with
                audiences.
              </p>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-[10px] tracking-widest uppercase text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>

          {/* SCALED DOWN MARQUEE (8vw instead of 14vw) */}
          <div className="w-full overflow-hidden leading-none select-none pointer-events-none opacity-20">
            <h1 className="text-[8vw] font-bold text-slate-600 whitespace-nowrap -mb-[1.2vw] tracking-tighter">
              LegalSphere LegalSphere LegalSphere
            </h1>
          </div>
        </footer>
      </main>
    </AceternitySidebarDemo>
  );
}
