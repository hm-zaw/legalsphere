import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { Notifications } from '@/components/lawyer_dashboard/notifications';

export default function NotificationsPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      {/* SidebarInset handles the margin automatically */}
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Notifications" />
        <main className="p-4 lg:p-8">
          <Notifications />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
