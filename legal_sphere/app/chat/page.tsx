"use client";

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { ChatView } from '@shared/chat/chat-view';
import { Loader2 } from "lucide-react";

interface UserData {
  id?: string;
  _id?: string;
  user_id?: string;
  role?: string;
  email?: string;
  name?: string;
}

export default function ChatPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    const storedToken = localStorage.getItem("userToken");

    if (storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        setUserData(parsed);
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }

    if (storedToken) {
      setToken(storedToken);
    }

    setLoading(false);
  }, []);

  const userId = userData?.id || userData?._id || userData?.user_id || "";
  const userRole = (userData?.role || "") as "client" | "lawyer" | "admin";
  const clientId = userRole === "client" ? userId : "";
  const lawyerId = userRole === "lawyer" ? userId : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Chat" />
        <main className="p-4 lg:p-8">
          <ChatView
            userId={userId}
            userRole={userRole}
            token={token}
            clientId={clientId}
            lawyerId={lawyerId}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
