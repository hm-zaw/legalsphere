import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { LawyerDashboardSidebar } from '@/components/lawyer_dashboard/sidebar';
import { LawyerDashboardHeader } from '@/components/lawyer_dashboard/header';
import { ChatView } from '@shared/chat/chat-view';

export default function ChatPage() {
  return (
    <SidebarProvider>
      <LawyerDashboardSidebar />
      <SidebarInset className="bg-slate-50/50">
        <LawyerDashboardHeader page="Chat" />
        <main className="p-4 lg:p-8">
          <ChatView />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
