import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { Bookings } from '@/components/lawyer_dashboard/bookings';

export default function BookingsPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      
        <SidebarInset className="bg-slate-50/50">
          <LawyerDashboardHeader page="Bookings" />
          <main className="p-4 lg:p-8">
            <Bookings />
          </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
