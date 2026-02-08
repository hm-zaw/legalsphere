import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { AnalyticsCharts } from '@/components/lawyer_dashboard/analytics-charts';

export default function AnalyticsPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Analytics" />
        <main className="p-4 lg:p-8">
          <AnalyticsCharts />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
