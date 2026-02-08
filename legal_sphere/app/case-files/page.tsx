import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { CaseFiles } from '@/components/lawyer_dashboard/case-files';

export default function CaseFilesPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Case  Files" />
        <main className="p-4 lg:p-8">
          <CaseFiles />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
