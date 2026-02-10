"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Settings, 
  Sparkles, 
  Shield, 
  CreditCard,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type AppSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactMode: boolean;
  autoSave: boolean;
  twoFactor: boolean;
  darkMode: boolean;
};

const STORAGE_KEY = "lawyerSettings";

const defaultSettings: AppSettings = {
  emailNotifications: true,
  pushNotifications: true,
  compactMode: false,
  autoSave: true,
  twoFactor: false,
  darkMode: false,
};

export function SettingsView() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    } finally {
      setMounted(true);
    }
  }, []);

  const persist = (next: AppSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const update = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const next = { ...settings, [key]: value };
    persist(next);

    if (settings.autoSave) {
      toast({
        title: "Preference Updated",
        description: `${key} is now ${value ? 'enabled' : 'disabled'}.`,
        duration: 2000,
      });
    }
  };

  if (!mounted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
        
      {/* Settings Navigation Tabs */}
      <div className="flex space-x-1 border-b border-zinc-200 pb-1 mb-6 overflow-x-auto">
        {[
            { id: "general", label: "General", icon: <Settings size={14} /> },
            { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
            { id: "security", label: "Security", icon: <Shield size={14} /> },
            { id: "billing", label: "Billing", icon: <CreditCard size={14} /> },
        ].map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-md transition-colors border-b-2",
                    activeSection === tab.id
                        ? "text-[#1a2238] border-[#af9164] bg-white"
                        : "text-zinc-400 border-transparent hover:text-zinc-600 hover:bg-zinc-50"
                )}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      {activeSection === "notifications" && (
        <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-50 rounded-full text-amber-600"><Bell size={18} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900">Notification Preferences</h3>
                        <p className="text-xs text-zinc-500">Manage how you receive alerts and updates.</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <SettingRow
                        title="Email Alerts"
                        description="Receive daily summaries and critical case updates via email."
                        value={settings.emailNotifications}
                        onChange={(v) => update("emailNotifications", v)}
                    />
                    <div className="h-[1px] bg-zinc-100 w-full" />
                    <SettingRow
                        title="Push Notifications"
                        description="Real-time browser notifications for urgent tasks."
                        value={settings.pushNotifications}
                        onChange={(v) => update("pushNotifications", v)}
                    />
                </div>
            </div>
        </div>
      )}

      {activeSection === "general" && (
        <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-full text-blue-600"><Sparkles size={18} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900">Interface Customization</h3>
                        <p className="text-xs text-zinc-500">Tailor the dashboard to your workflow.</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <SettingRow
                        title="Compact Mode"
                        description="Increase data density for lists and tables."
                        value={settings.compactMode}
                        onChange={(v) => update("compactMode", v)}
                    />
                    <div className="h-[1px] bg-zinc-100 w-full" />
                    <SettingRow
                        title="Auto-Save Changes"
                        description="Automatically save forms as you type."
                        value={settings.autoSave}
                        onChange={(v) => update("autoSave", v)}
                    />
                    <div className="h-[1px] bg-zinc-100 w-full" />
                     <SettingRow
                        title="Dark Mode (Beta)"
                        description="Switch to a darker theme for low-light environments."
                        value={settings.darkMode}
                        onChange={(v) => update("darkMode", v)}
                    />
                </div>
            </div>
        </div>
      )}

      {activeSection === "security" && (
          <div className="space-y-6">
             <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 rounded-full text-green-600"><Lock size={18} /></div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900">Account Security</h3>
                        <p className="text-xs text-zinc-500">Protect your account and client data.</p>
                    </div>
                </div>
                 <div className="space-y-6">
                    <SettingRow
                        title="Two-Factor Authentication"
                        description="Require an extra verification step on login."
                        value={settings.twoFactor}
                        onChange={(v) => update("twoFactor", v)}
                    />
                    <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-600">
                        For password changes, please contact your firm administrator.
                    </div>
                 </div>
             </div>
          </div>
      )}

      {activeSection === "billing" && (
           <div className="flex flex-col items-center justify-center p-12 bg-white border border-zinc-200 rounded-lg border-dashed">
                <CreditCard className="w-10 h-10 text-zinc-300 mb-4" />
                <h3 className="text-sm font-bold text-zinc-900">Billing Information</h3>
                <p className="text-xs text-zinc-500 max-w-xs text-center mt-2">
                    Billing settings are managed by your firm's finance department.
                </p>
                <Button variant="outline" className="mt-6 text-xs" disabled>Request Access</Button>
           </div>
      )}

    </motion.div>
  );
}

function SettingRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1 flex-1">
        <label className="text-sm font-semibold text-zinc-800">{title}</label>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-md">
          {description}
        </p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-[#af9164]" />
    </div>
  );
}
