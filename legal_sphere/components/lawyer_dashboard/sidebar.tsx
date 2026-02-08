"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Scale, LayoutGrid, BarChart2, Settings, Users, FolderKanban, MessageSquare, Calendar, ClipboardCheck, Bell, User } from "lucide-react";
import { usePathname } from "next/navigation";


export function LawyerDashboardSidebar() {
    const pathname = usePathname();
  return (
    <Sidebar collapsible="icon" className="group-data-[variant=floating]:bg-sidebar/80 group-data-[variant=floating]:backdrop-blur-lg border-r">
      <SidebarHeader className="h-auto p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:h-auto">
        <div className="flex items-center gap-3">
            <Scale className="group-data-[collapsible=icon]:mx-auto text-primary" />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-xs text-muted-foreground">LegalSphere</span>
                <span className="font-semibold text-sidebar-foreground">J. Doe & Associates</span>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
        <SidebarMenuItem>
            <Link href="/lawyer-dashboard" passHref>
                <SidebarMenuButton isActive={pathname === '/lawyer-dashboard'} tooltip="Dashboard">
                    <LayoutGrid />
                    <span>Dashboard</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
                <Link href="/case-files" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/case-files')} tooltip="Case Files">
                    <FolderKanban />
                    <span>Case Files</span>
                </SidebarMenuButton>
                </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
                <Link href="/applications" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/applications')} tooltip="Clients">
                    <Users />
                    <span>Clients</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarSeparator />
        <SidebarMenuItem>
                <Link href="/chat" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/chat')} tooltip="Chat">
                    <MessageSquare />
                    <span>Chat</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
                <Link href="/bookings" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/bookings')} tooltip="Bookings">
                    <Calendar />
                    <span>Bookings</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
                <Link href="/tasks" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/tasks')} tooltip="Tasks">
                    <ClipboardCheck />
                    <span>Tasks</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarSeparator />
        <SidebarMenuItem>
                <Link href="/analytics" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/analytics')} tooltip="Analytics">
                    <BarChart2/>
                    <span>Analytics </span>
                </SidebarMenuButton>
            </Link >
        </SidebarMenuItem>
        <SidebarMenuItem>
                <Link href="/notifications" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/notifications')} tooltip="Notifications">
                    <Bell />
                    <span>Notifications</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/lawyer-settings" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/lawyer-settings')} tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <Link href="/lawyer_profile" passHref>
                <SidebarMenuButton isActive={pathname.startsWith('/lawyer-profile')} tooltip="Profile">
                    <User />
                    <span>Profile</span>
                </SidebarMenuButton>
            </Link>
        </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:hidden">
          <p className="font-semibold text-sidebar-foreground">John Doe</p>
          <p className="text-xs text-muted-foreground">john.doe@example.com</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
