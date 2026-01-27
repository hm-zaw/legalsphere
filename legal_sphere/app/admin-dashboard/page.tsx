"use client";
import { Activity, BarChart3, Briefcase, FileText, LayoutDashboard, Search, Settings, Users, Command } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import CasesView from "./CasesView";
import LegalTeamView from "./LegalTeamView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [active, setActive] = useState<"overview" | "cases" | "legal-team">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Simple Sidebar Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 h-screen border-r border-slate-200 bg-white flex-col fixed left-0 top-0">
          <div className="p-6 border-b border-slate-200">
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              <SidebarButton 
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Overview"
                active={active === "overview"}
                onClick={() => setActive("overview")}
              />
              <SidebarButton 
                icon={<Briefcase className="h-4 w-4" />}
                label="Cases"
                active={active === "cases"}
                onClick={() => setActive("cases")}
              />
              <SidebarButton 
                icon={<Users className="h-4 w-4" />}
                label="Legal Team"
                active={active === "legal-team"}
                onClick={() => setActive("legal-team")}
              />
              <SidebarButton 
                icon={<Users className="h-4 w-4" />}
                label="Clients"
              />
              <SidebarButton 
                icon={<Activity className="h-4 w-4" />}
                label="Documents"
              />
              <SidebarButton 
                icon={<BarChart3 className="h-4 w-4" />}
                label="Billing"
              />
              <SidebarButton 
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
              />
            </div>

            <Separator className="my-4" />
            
            <div className="px-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Projects</p>
              <div className="space-y-2">
                <ProjectPill name="Website Redesign" />
                <ProjectPill name="Mobile App Development" />
                <ProjectPill name="Database Migration" />
              </div>
            </div>
          </nav>
          
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-slate-100 text-slate-700">N</AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <p className="font-medium text-sm">Next Solutions Inc</p>
                <p className="text-xs text-muted-foreground">admin@techsolutions.com</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Trigger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden fixed top-4 left-4 z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>

        {/* Main Content */}
        <div className="flex-1 md:ml-64">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Breadcrumb>
                  <BreadcrumbList className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BreadcrumbItem>Organization Dashboard</BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="text-foreground">
                      {active === "overview" ? "Overview" : active === "cases" ? "Cases" : "Legal Team"}
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {active === "overview" ? "Organization Overview" : active === "cases" ? "Cases" : "Legal Team"}
                </h2>
              </div>
              
              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                className="relative w-64 justify-start text-sm text-muted-foreground"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Search... (Ctrl+K)
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <main className="p-6">
            {active === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard title="Active Cases" value="42" badge="+12%" />
                  <StatCard title="New Clients" value="8" badge="+3" />
                  <StatCard title="Pending Reviews" value="15" badge="15" badgeColor="destructive" />
                  <StatCard title="Total Lawyers" value="12" badge="12" badgeColor="default" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Panel title="Case Activity Overview">
                    <div className="aspect-[16/9] rounded-md bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-dashed border-slate-300 flex items-center justify-center text-sm text-muted-foreground">
                      Case filing trends chart
                    </div>
                  </Panel>
                  <Panel title="Revenue Trends">
                    <div className="aspect-[16/9] rounded-md bg-gradient-to-t from-blue-500/10 to-transparent border border-dashed border-slate-300 flex items-center justify-center text-sm text-muted-foreground">
                      Monthly revenue chart
                    </div>
                  </Panel>
                </div>

                {/* Lists Row */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Panel title="Recent Cases" className="lg:col-span-2">
                    <div className="space-y-3">
                      <ListRow primary="Smith vs. Johnson" secondary="Corporate Law · High Priority" meta="Filed Jun 15, 2024" />
                      <ListRow primary="Estate Planning - Williams Family" secondary="Estate Law · Medium" meta="Filed Jun 10, 2024" />
                      <ListRow primary="IP Patent Application" secondary="Intellectual Property · Low" meta="Filed Jun 5, 2024" />
                    </div>
                  </Panel>
                  <Panel title="Practice Areas">
                    <div className="text-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Corporate Law</span>
                        <span className="font-semibold">18</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Family Law</span>
                        <span className="font-semibold text-blue-600">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Intellectual Property</span>
                        <span className="font-semibold text-emerald-600">8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Estate Planning</span>
                        <span className="font-semibold text-amber-600">4</span>
                      </div>
                    </div>
                  </Panel>
                </div>

                {/* Active Cases Table */}
                <Panel title="Active Cases">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-slate-50/50">
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm">Case Name</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm">Client</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm">Practice Area</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm">Status</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm">Next Hearing</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 1, name: "Smith vs. Johnson", client: "John Smith", area: "Corporate Law", status: "Active", hearing: "Jun 28, 2024" },
                          { id: 2, name: "Williams Estate", client: "Mary Williams", area: "Estate Law", status: "Review", hearing: "Jul 2, 2024" },
                          { id: 3, name: "TechCorp IP", client: "TechCorp Inc", area: "Intellectual Property", status: "Active", hearing: "Jun 25, 2024" },
                          { id: 4, name: "Johnson Divorce", client: "Sarah Johnson", area: "Family Law", status: "Mediation", hearing: "Jul 5, 2024" },
                          { id: 5, name: "Brown Partnership", client: "Brown & Co", area: "Corporate Law", status: "Active", hearing: "Jun 30, 2024" },
                        ].map((case_) => (
                          <tr key={case_.id} className="border-b transition-colors hover:bg-slate-50/50">
                            <td className="p-4 align-middle font-medium">{case_.name}</td>
                            <td className="p-4 align-middle">{case_.client}</td>
                            <td className="p-4 align-middle">{case_.area}</td>
                            <td className="p-4 align-middle">
                              <Badge variant={case_.status === "Active" ? "default" : "secondary"}>
                                {case_.status}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle">{case_.hearing}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Activity className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            )}
            
            {active === "cases" && <CasesView />}
            
            {active === "legal-team" && <LegalTeamView />}
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-4 w-4" />
              Search
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Type to search..." 
              className="w-full" 
              autoFocus
            />
            <div className="mt-4 text-sm text-muted-foreground">
              Search functionality coming soon... (Ctrl+K)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                <SidebarButton 
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  label="Overview"
                  active={active === "overview"}
                  onClick={() => {
                    setActive("overview");
                    setMobileMenuOpen(false);
                  }}
                />
                <SidebarButton 
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Cases"
                  active={active === "cases"}
                  onClick={() => {
                    setActive("cases");
                    setMobileMenuOpen(false);
                  }}
                />
                <SidebarButton 
                  icon={<Users className="h-4 w-4" />}
                  label="Legal Team"
                  active={active === "legal-team"}
                  onClick={() => {
                    setActive("legal-team");
                    setMobileMenuOpen(false);
                  }}
                />
                <SidebarButton 
                  icon={<Users className="h-4 w-4" />}
                  label="Clients"
                />
                <SidebarButton 
                  icon={<Activity className="h-4 w-4" />}
                  label="Documents"
                />
                <SidebarButton 
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Billing"
                />
                <SidebarButton 
                  icon={<Settings className="h-4 w-4" />}
                  label="Settings"
                />
              </div>

              <Separator className="my-4" />
              
              <div className="px-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Projects</p>
                <div className="space-y-2">
                  <ProjectPill name="Website Redesign" />
                  <ProjectPill name="Mobile App Development" />
                  <ProjectPill name="Database Migration" />
                </div>
              </div>
            </nav>
            
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-slate-100 text-slate-700">N</AvatarFallback>
                </Avatar>
                <div className="leading-tight">
                  <p className="font-medium text-sm">Next Solutions Inc</p>
                  <p className="text-xs text-muted-foreground">admin@techsolutions.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors w-full text-left ${
        active 
          ? "bg-slate-100 text-slate-900 font-medium" 
          : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ProjectPill({ name }: { name: string }) {
  return (
    <div className="rounded-md border border-slate-200 px-3 py-2 text-xs text-muted-foreground hover:bg-slate-50 cursor-default transition-colors">
      {name}
    </div>
  );
}

function StatCard({ title, value, badge, badgeColor }: { title: string; value: string; badge?: string; badgeColor?: string }) {
  return (
    <Card className="flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {badge && (
          <Badge variant={badgeColor === "destructive" ? "destructive" : "secondary"}>
            {badge}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

function ListRow({ primary, secondary, meta }: { primary: string; secondary: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors">
      <div>
        <p className="font-medium leading-tight">{primary}</p>
        <p className="text-xs text-muted-foreground">{secondary}</p>
      </div>
      <p className="text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}

const jobPosts = [
  { id: 1, title: "AI Prompt Engineer", level: "Mid-Level", type: "Full-time", salary: "2200000", due: "Sep 21, 2025" },
  { id: 2, title: "Computer Vision Engineer", level: "Senior", type: "Full-time", salary: "3000000", due: "Sep 26, 2025" },
  { id: 3, title: "AI Ethics & Fairness Analyst", level: "Mid-Senior", type: "Full-time", salary: "2800000", due: "Oct 1, 2025" },
  { id: 4, title: "AI Research Engineer", level: "Mid-Senior", type: "Full-time", salary: "3500000", due: "Oct 2, 2025" },
  { id: 5, title: "Backend Developer", level: "Mid-Senior", type: "Full-Time", salary: "1500000", due: "Sep 16, 2025" },
];
