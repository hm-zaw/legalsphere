import { Activity, BarChart3, Briefcase, LayoutDashboard, Settings, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-[calc(100vh-0px)] bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 border-r bg-card/50">
          <div className="flex h-screen flex-col">
            <div className="px-6 py-5 border-b">
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <SidebarLink icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" active />
              <SidebarLink icon={<Briefcase className="h-4 w-4" />} label="Cases" />
              <SidebarLink icon={<Users className="h-4 w-4" />} label="Users" />
              <SidebarLink icon={<Activity className="h-4 w-4" />} label="Applications" />
              <SidebarLink icon={<BarChart3 className="h-4 w-4" />} label="Analytics & Reports" />
              <SidebarLink icon={<Settings className="h-4 w-4" />} label="Settings" />

              <div className="pt-4">
                <p className="px-3 mb-2 text-xs font-medium text-muted-foreground">Projects</p>
                <ProjectPill name="Website Redesign" />
                <ProjectPill name="Mobile App Development" />
                <ProjectPill name="Database Migration" />
              </div>
            </nav>

            <div className="mt-auto border-t p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">N</span>
                <div className="leading-tight">
                  <p className="font-medium text-foreground">Next Solutions Inc</p>
                  <p className="text-muted-foreground">admin@techsolutions.com</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Top bar / breadcrumb */}
          <div className="border-b bg-card/50">
            <div className="mx-auto max-w-7xl px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Organization Dashboard</span>
                <span>/</span>
                <span className="text-foreground">Overview</span>
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Organization Overview</h2>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Job Posts" value="23" badge="23" />
              <StatCard title="Active Job Posts" value="8" badge="8" />
              <StatCard title="Pending Applications" value="15" badge="15" badgeColor="bg-red-500" />
              <StatCard title="Organization Members" value="12" badge="12" badgeColor="bg-indigo-500" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="Organization Activity Overview">
                <div className="aspect-[16/9] rounded-md bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-dashed border flex items-center justify-center text-sm text-muted-foreground">
                  Chart placeholder
                </div>
              </Panel>
              <Panel title="Job Posting Trends">
                <div className="aspect-[16/9] rounded-md bg-gradient-to-t from-indigo-500/10 to-transparent border-dashed border flex items-center justify-center text-sm text-muted-foreground">
                  Area chart placeholder
                </div>
              </Panel>
            </div>

            {/* Lists row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Panel title="Recent Job Posts" className="lg:col-span-2">
                <div className="space-y-3">
                  <ListRow primary="Senior Software Engineer" secondary="Senior · Full-time" meta="Posted Jun 15, 2024" />
                  <ListRow primary="Product Manager" secondary="Mid-level · Full-time" meta="Posted Jun 10, 2024" />
                  <ListRow primary="UI/UX Designer" secondary="Junior · Part-time" meta="Posted Jun 5, 2024" />
                </div>
              </Panel>
              <Panel title="Application Statistics">
                <div className="text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span>Total Applications</span>
                    <span className="font-semibold">45</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Pending Review</span>
                    <span className="font-semibold text-amber-600">15</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Reviewed</span>
                    <span className="font-semibold text-blue-600">20</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Hired</span>
                    <span className="font-semibold text-emerald-600">10</span>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Table like list */}
            <Panel title="Job Posts">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr className="text-left">
                      <Th>Job Title</Th>
                      <Th>Level</Th>
                      <Th>Type</Th>
                      <Th>Salary</Th>
                      <Th>Due Date</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <Td className="font-medium">{r.title}</Td>
                        <Td>{r.level}</Td>
                        <Td>{r.type}</Td>
                        <Td>{r.salary}</Td>
                        <Td>{r.due}</Td>
                        <Td>
                          <span className="inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-600 px-2 py-0.5 text-xs font-medium">
                            Active
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <button className="hover:text-foreground" aria-label="edit">✎</button>
                            <button className="hover:text-foreground" aria-label="duplicate">⧉</button>
                            <button className="hover:text-red-600" aria-label="delete">🗑</button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function ProjectPill({ name }: { name: string }) {
  return (
    <div className="mx-3 mb-2 rounded-md border px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40 cursor-default">
      {name}
    </div>
  );
}

function StatCard({ title, value, badge, badgeColor }: { title: string; value: string; badge?: string; badgeColor?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        {badge && (
          <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${badgeColor ?? "bg-gray-400"}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold leading-none tracking-tight">{value}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ListRow({ primary, secondary, meta }: { primary: string; secondary: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div>
        <p className="font-medium leading-tight">{primary}</p>
        <p className="text-xs text-muted-foreground">{secondary}</p>
      </div>
      <p className="text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>;
}

const rows = [
  { id: 1, title: "AI Prompt Engineer", level: "Mid-Level", type: "Full-time", salary: "2200000", due: "Sep 21, 2025" },
  { id: 2, title: "Computer Vision Engineer", level: "Senior", type: "Full-time", salary: "3000000", due: "Sep 26, 2025" },
  { id: 3, title: "AI Ethics & Fairness Analyst", level: "Mid-Senior", type: "Full-time", salary: "2800000", due: "Oct 1, 2025" },
  { id: 4, title: "AI Research Engineer", level: "Mid-Senior", type: "Full-time", salary: "3500000", due: "Oct 2, 2025" },
  { id: 5, title: "Backend Developer", level: "Mid-Senior", type: "Full-Time", salary: "1500000", due: "Sep 16, 2025" },
];
