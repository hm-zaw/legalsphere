import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lawyer Dashboard",
  description: "Dashboard for lawyers on LegalSphere",
};

export default function LawyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className={cn("min-h-screen bg-background text-foreground")}>
        {children}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
