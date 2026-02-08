import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { Clients } from '@/components/lawyer_dashboard/clients';

export default function ClientsPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Clients" />
        <main className="p-4 lg:p-8">
          <Clients />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
