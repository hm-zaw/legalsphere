"use client";

import { Menu, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type LawyerDashboardHeaderProps = {
    page?: string;
}

export function LawyerDashboardHeader({ page = 'Dashboard' }: LawyerDashboardHeaderProps) {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Lawyer  Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{page}</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="sr-only">Notifications</span>
            </Button>
        </Link>
         <Link href="/profile">
            <Avatar className="h-9 w-9">
                <AvatarImage src="https://picsum.photos/seed/lawyer-avatar/100/100" alt="User Avatar" data-ai-hint="person face" />
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </Link>
      </div>
    </header>
  );
}
