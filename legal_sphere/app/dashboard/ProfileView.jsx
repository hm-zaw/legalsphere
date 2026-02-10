"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Key, 
  CreditCard, 
  Bell, 
  FileText, 
  Edit3,
  Camera,
  LogOut,
  Briefcase,
  Award
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

// --- Design Tokens ---
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164"; 
const PAPER_SHADOW = "0 10px 40px -15px rgba(0,0,0,0.1)";

// --- Helper Components ---

const ProfileField = ({ label, value, icon: Icon, editable = true }) => (
  <div className="group relative py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors -mx-4 px-4 rounded-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-100 rounded-full text-slate-400 group-hover:text-[#1a2238] transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
          <p className="font-serif text-slate-900 text-sm font-medium">{value}</p>
        </div>
      </div>
      {editable && (
        <button className="opacity-0 group-hover:opacity-100 text-xs font-bold text-[#af9164] uppercase tracking-wider flex items-center gap-1 transition-opacity">
          Edit <Edit3 className="w-3 h-3" />
        </button>
      )}
    </div>
  </div>
);

const SectionHeader = ({ title, description }) => (
  <div className="mb-6 pb-4 border-b border-slate-200">
    <h3 className="font-serif text-xl text-[#1a2238] mb-1">{title}</h3>
    <p className="text-xs text-slate-500 max-w-lg">{description}</p>
  </div>
);

export default function ProfileView() {
  const [userData, setUserData] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("Personal");

  useEffect(() => {
    setIsClient(true);
    // Mock user data if none exists
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    } else {
        setUserData({
            name: "Alexander Hamilton",
            email: "a.hamilton@legalsphere.com",
            role: "Client",
            id: "USR-2024-8921"
        })
    }
  }, []);

  if (!isClient) return null;

  return (
    <div
    className="flex-1 w-full min-h-screen bg-[#efefec] selection:bg-slate-200 overflow-y-auto"
    style={{
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    }}
    >
        <div className="w-full max-w-5xl mx-auto p-6 lg:p-12 space-y-8">
          
          {/* --- Header Section --- */}
          <header className="flex flex-col gap-6">
             <Breadcrumbs className="text-xs font-mono uppercase text-slate-500 tracking-tighter" />
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="font-serif text-4xl text-[#1a2238] leading-tight mb-2">User Profile</h1>
                    <p className="text-sm text-slate-500">Manage your personal information, security settings, and preferences.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-[#1a2238] text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                        {userData?.role || "Premium Client"}
                    </span>
                    <span className="bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded text-[10px] font-mono">
                        ID: {userData?.id || "USR-2024-8921"}
                    </span>
                </div>
             </div>
          </header>

          {/* --- Main Content Grid --- */}
          <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* Left Column: ID Card / Navigation */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Profile Card */}
                <div 
                    className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative"
                    style={{ boxShadow: PAPER_SHADOW }}
                >
                    <div className="h-24 bg-[#1a2238] relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="absolute top-4 right-4">
                            <span className="bg-[#af9164] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Verified</span>
                        </div>
                    </div>
                    
                    <div className="px-6 pb-6 text-center -mt-10 relative z-10">
                        <div className="relative inline-block mb-3 group">
                            <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-slate-200 flex items-center justify-center text-xl font-serif text-slate-600 relative overflow-hidden">
                                {userData?.name ? userData.name.charAt(0) : "U"}
                            </div>
                            <button className="absolute bottom-0 right-0 p-1.5 bg-[#af9164] text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-3 h-3" />
                            </button>
                        </div>
                        
                        <h2 className="font-serif text-xl text-[#1a2238]">{userData?.name}</h2>
                        <p className="text-xs text-slate-500 mb-6">{userData?.email}</p>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Active Cases</p>
                                <p className="font-serif text-lg text-[#1a2238]">3</p>
                            </div>
                            <div className="border-l border-slate-100">
                                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Documents</p>
                                <p className="font-serif text-lg text-[#1a2238]">12</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {[
                        { id: "Personal", icon: User, label: "Personal Information" },
                        { id: "Security", icon: Shield, label: "Login & Security" },
                        { id: "Billing", icon: CreditCard, label: "Billing & Plans" },
                        { id: "Notifications", icon: Bell, label: "Notifications" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-6 py-4 text-sm font-medium border-b border-slate-50 transition-all hover:bg-slate-50",
                                activeTab === item.id 
                                    ? "bg-slate-50 text-[#1a2238] border-l-4 border-l-[#af9164]" 
                                    : "text-slate-500 border-l-4 border-l-transparent"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-[#af9164]" : "text-slate-400")} />
                            {item.label}
                        </button>
                    ))}
                    <button className="w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l-4 border-l-transparent">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </nav>
            </div>

            {/* Right Column: Settings Form */}
            <div className="col-span-12 lg:col-span-8">
                <div 
                    className="bg-white rounded-xl shadow-xl border border-slate-200 min-h-[500px] p-8"
                    style={{ boxShadow: PAPER_SHADOW }}
                >
                    {activeTab === "Personal" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SectionHeader 
                                title="Personal Information" 
                                description="Update your personal details and contact information. This information will be used for your legal documents."
                            />
                            
                            <div className="space-y-2">
                                <ProfileField icon={User} label="Full Legal Name" value={userData?.name || "Alexander Hamilton"} />
                                <ProfileField icon={Briefcase} label="Occupation" value="Financial Analyst" />
                                <ProfileField icon={Mail} label="Email Address" value={userData?.email || "alex.h@example.com"} />
                                <ProfileField icon={Phone} label="Phone Number" value="+1 (555) 019-2834" />
                                <ProfileField icon={MapPin} label="Residential Address" value="120 Broadway, New York, NY 10271" />
                                <ProfileField icon={FileText} label="Bio / Notes" value="Client prefers digital correspondence over physical mail." />
                            </div>
                        </div>
                    )}

                    {activeTab === "Security" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SectionHeader 
                                title="Login & Security" 
                                description="Manage your password and security preferences to keep your account safe."
                            />
                            
                            <div className="space-y-6">
                                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-slate-100 rounded-full text-slate-500"><Key className="w-4 h-4" /></div>
                                        <div>
                                            <p className="font-bold text-sm text-[#1a2238]">Password</p>
                                            <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded hover:border-[#af9164] hover:text-[#af9164] transition-colors">Update</button>
                                </div>

                                <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                    <div className="flex gap-4">
                                        <div className="p-2 bg-slate-100 rounded-full text-slate-500"><Shield className="w-4 h-4" /></div>
                                        <div>
                                            <p className="font-bold text-sm text-[#1a2238]">Two-Factor Authentication</p>
                                            <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#af9164]"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "Billing" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SectionHeader 
                                title="Billing & Plans" 
                                description="Manage your billing information and view your invoice history."
                            />
                            
                            <div className="bg-[#1a2238] rounded-lg p-6 text-white mb-8 relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Current Plan</p>
                                        <h3 className="font-serif text-2xl mb-1">Premium Legal Retainer</h3>
                                        <p className="text-xs text-[#af9164]">$500.00 / month • Renews on Feb 15, 2026</p>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-full">
                                        <Award className="w-6 h-6 text-[#af9164]" />
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button className="text-xs font-bold bg-[#af9164] text-white px-4 py-2 rounded hover:bg-[#9c7f56] transition-colors">Upgrade Plan</button>
                                    <button className="text-xs font-bold border border-white/20 text-white px-4 py-2 rounded hover:bg-white/10 transition-colors">Cancel Subscription</button>
                                </div>
                                {/* Watermark */}
                                <div className="absolute -right-6 -bottom-12 opacity-10">
                                    <CreditCard size={140} />
                                </div>
                            </div>

                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Payment Methods</h4>
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-[8px] font-bold">VISA</div>
                                    <div>
                                        <p className="text-sm font-bold text-[#1a2238]">Visa ending in 4242</p>
                                        <p className="text-xs text-slate-500">Expiry 12/28</p>
                                    </div>
                                </div>
                                <button className="text-xs font-bold text-slate-400 hover:text-[#1a2238]">Edit</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "Notifications" && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SectionHeader 
                                title="Notification Preferences" 
                                description="Choose how and when you want to be contacted by your legal team."
                            />
                            <div className="space-y-4">
                                {[
                                    "Case Updates & Milestones", 
                                    "Document Upload Requests", 
                                    "Message Alerts", 
                                    "Billing Reminders",
                                    "Marketing & Newsletters"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                                        <span className="text-sm font-medium text-[#1a2238]">{item}</span>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" defaultChecked className="accent-[#1a2238] w-4 h-4" />
                                                <span className="text-xs text-slate-500">Email</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" defaultChecked={i < 3} className="accent-[#1a2238] w-4 h-4" />
                                                <span className="text-xs text-slate-500">Push</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

          </div>
        </div>
    </div>
  );
}
