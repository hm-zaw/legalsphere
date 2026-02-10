"use client";
import React, { useState } from "react";
import { AceternitySidebar, AceternitySidebarBody, AceternitySidebarLink } from "@/components/ui/aceternity-sidebar";
import {
  IconArrowLeft,
  IconSettings,
  IconUserBolt,
  IconScale,
  IconUsers,
  IconFileText,
  IconHome,
  IconPlus,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Design Tokens
const LEGAL_NAVY = "#1a2238";
const ACCENT_GOLD = "#af9164";

export function AceternitySidebarDemo({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  
  // UPDATED: Icons are now dark gray (neutral-500) and turn Gold/Navy on hover
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard?view=overview",
      icon: (
        <IconHome className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "New Filing",
      href: "/dashboard?view=apply-new",
      icon: (
        <IconPlus className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "My Dossiers",
      href: "/dashboard?view=my-cases",
      icon: (
        <IconFileText className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "Counsel Directory",
      href: "/lawyers",
      icon: (
        <IconUsers className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "Legal Services",
      href: "/services",
      icon: (
        <IconScale className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "Profile",
      href: "/dashboard?view=profile",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard?view=profile&tab=settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-500 group-hover/sidebar:text-[#af9164] transition-colors" />
      ),
    },
  ];

  const handleLinkClick = (href: string) => {
    if (href === "#") {
      // Handle logout
      localStorage.removeItem('userData');
      localStorage.removeItem('token');
      router.push('/login');
    } else {
      router.push(href);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full flex-1 flex-col overflow-hidden md:flex-row",
        "h-screen bg-[#efefec]" // Keeps the paper background for the main content area
      )}>
      <AceternitySidebar open={open} setOpen={setOpen}>
        <AceternitySidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <AceternitySidebarLink 
                  key={idx} 
                  link={link}
                  onClick={() => handleLinkClick(link.href)}
                />
              ))}
            </div>
          </div>
          <div>
            <AceternitySidebarLink
              link={{
                label: "LegalSphere User",
                href: "/dashboard?view=profile",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#1a2238] flex items-center justify-center border border-neutral-200">
                    <IconUserBolt className="h-4 w-4 text-white" />
                  </div>
                ),
              }}
              onClick={() => handleLinkClick("/dashboard?view=profile")}
            />
          </div>
        </AceternitySidebarBody>
      </AceternitySidebar>
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-3 py-1 text-sm font-normal text-black">
      <div
        className="h-6 w-6 shrink-0 rounded bg-[#1a2238] flex items-center justify-center shadow-md"
      >
        <IconScale size={16} className="text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // UPDATED: Text is now Navy to pop against the white sidebar
        className="font-medium whitespace-pre text-[#1a2238] font-serif text-lg tracking-wide">
        LegalSphere
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black">
      <div
        className="h-6 w-6 shrink-0 rounded bg-[#1a2238] flex items-center justify-center shadow-md"
      >
        <IconScale size={16} className="text-white" />
      </div>
    </a>
  );
};