import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import {Profile} from "@/components/lawyer_dashboard/profile";

export default function ProfilePage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Profile" />
        <main className="p-4 lg:p-8">
          <Profile />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
