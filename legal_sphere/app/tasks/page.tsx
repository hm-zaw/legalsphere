import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { Tasks } from '@/components/lawyer_dashboard/tasks';

export default function TasksPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Tasks" />
        <main className="p-4 lg:p-8">
          <Tasks />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
