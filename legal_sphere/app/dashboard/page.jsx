"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AceternitySidebarDemo } from "@/components/aceternity-sidebar-demo";
import OverviewView from "./OverviewView";
import MyCasesView from "./MyCasesView";
import CaseDetailsView from "./CaseDetailsView";
import ApplyNewView from "./ApplyNewView";
import ProfileView from "./ProfileView";
import { withRoleProtection } from "@/hooks/useAuth";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") || "overview";
  const caseId = searchParams.get("id"); // Get caseId from URL
  
  // State for active view
  const [activeView, setActiveView] = useState(initialView);

  // Sync state with URL
  useEffect(() => {
    const view = searchParams.get("view");
    if (view && ["overview", "my-cases", "profile", "case-details", "apply-new"].includes(view)) {
      setActiveView(view);
    }
  }, [searchParams]);

  const handleNavigate = (view) => {
    setActiveView(view);
    router.push(`/dashboard?view=${view}`, { scroll: false });
  };
  
  // Handle explicit "apply-new" navigation
  // If "apply-new" is requested, we now keep it in dashboard state.
  const customNavigate = (destination) => {
        handleNavigate(destination);
  }

  return (
    <AceternitySidebarDemo>
      {activeView === "overview" && <OverviewView onNavigate={customNavigate} />}
      {activeView === "my-cases" && <MyCasesView onNavigate={customNavigate} />}
      {activeView === "profile" && <ProfileView />}
      {activeView === "case-details" && <CaseDetailsView caseId={caseId} onNavigate={customNavigate} />}
      {activeView === "apply-new" && <ApplyNewView onNavigate={customNavigate} />}
    </AceternitySidebarDemo>
  );
}

function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#efefec] flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

// Export the protected component
export default withRoleProtection(DashboardPage, ['client', 'user']);