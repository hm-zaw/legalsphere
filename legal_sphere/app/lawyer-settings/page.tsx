import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { SettingsForm } from '@/components/lawyer_dashboard/settings-form';

export default function SettingsPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Settings" />
        <main className="p-4 lg:p-8">
          <SettingsForm />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
