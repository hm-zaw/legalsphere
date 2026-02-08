"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Save, Sparkles, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AppSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactMode: boolean;
  autoSave: boolean;
};

const STORAGE_KEY = "lawyerSettings";

const defaultSettings: AppSettings = {
  emailNotifications: true,
  pushNotifications: true,
  compactMode: false,
  autoSave: true,
};

export function SettingsForm() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

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
        title: "Saved",
        description: "Your settings were updated.",
      });
    }
  };

  const handleSaveNow = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your preferences have been saved successfully.",
    });
  };

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Settings
          </CardTitle>
          <CardDescription>
            Control how your lawyer dashboard behaves.
          </CardDescription>
        </div>

        <Button onClick={handleSaveNow} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </CardHeader>

      <CardContent className="space-y-10">
        {/* Notifications */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>

          <div className="grid gap-6 rounded-md border p-6">
            <SettingRow
              title="Email notifications"
              description="Receive updates about cases and tasks via email."
              value={settings.emailNotifications}
              onChange={(v) => update("emailNotifications", v)}
            />
            <Separator />
            <SettingRow
              title="Push notifications"
              description="Receive real-time alerts inside the dashboard."
              value={settings.pushNotifications}
              onChange={(v) => update("pushNotifications", v)}
            />
          </div>
        </section>

        <Separator />

        {/* Experience */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Experience</h3>
          </div>

          <div className="grid gap-6 rounded-md border p-6">
            <SettingRow
              title="Compact mode"
              description="Reduce spacing for tables and lists."
              value={settings.compactMode}
              onChange={(v) => update("compactMode", v)}
            />
            <Separator />
            <SettingRow
              title="Auto-save"
              description="Save settings automatically when toggled."
              value={settings.autoSave}
              onChange={(v) => update("autoSave", v)}
            />
          </div>
        </section>
      </CardContent>
    </Card>
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
    <div className="flex items-center justify-between gap-6">
      <div className="space-y-1">
        <Label className="font-semibold">{title}</Label>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
