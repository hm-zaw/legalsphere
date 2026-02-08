import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { OverviewCards } from '@/components/lawyer_dashboard/overview-cards';
import { RecentActivities } from '@/components/lawyer_dashboard/recent-activity';
import { UpcomingAppointments } from '@/components/lawyer_dashboard/upcoming-appointments';
import { Tasks } from '@/components/lawyer_dashboard/tasks';
import { Bookings } from '@/components/lawyer_dashboard/bookings';


export default function DashboardPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <div className="md:ml-[--sidebar-width-icon] lg:ml-0">
        <SidebarInset>
          <LawyerDashboardHeader page="Dashboard "/>
          <div className="p-4 lg:p-8 space-y-8">
            <OverviewCards />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <UpcomingAppointments />
                <Tasks />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <RecentActivities />
              <Bookings />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
