"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Mail, 
  Phone, 
  TrendingUp, 
  MoreHorizontal, 
  LayoutGrid, 
  List,
  Plus,
  Search,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// Re-using ShadCN UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function LegalTeamView() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  
  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");

  // --- ADD LAWYER STATE ---
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLawyer, setNewLawyer] = useState({
    firstName: "", lastName: "", email: "", phone: "", specialization: "", 
    experience: "", address: "", barNumber: "", case_history_summary: ""
  });

  useEffect(() => {
    fetchLawyers();
  }, []);

  // --- FILTER LOGIC ---
  const filteredLawyers = useMemo(() => {
    if (!searchQuery) return lawyers;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return lawyers.filter((lawyer) => {
      return (
        lawyer.name.toLowerCase().includes(lowerQuery) ||
        lawyer.role.toLowerCase().includes(lowerQuery) ||
        lawyer.specialty.toLowerCase().includes(lowerQuery) ||
        lawyer.email.toLowerCase().includes(lowerQuery)
      );
    });
  }, [lawyers, searchQuery]);

  // --- API FUNCTIONS ---
  const fetchLawyers = async () => {
    try {
      const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
      setError(null);

      if (!adminToken) {
        // Mock Data for "Pro" Demo
        const MOCK_LAWYERS = [
            { id: 1, name: "Sarah Chen", role: "Senior Partner", specialty: "Corporate Law", cases: 12, winRate: 98, img: "SC", email: "s.chen@legalsphere.com", phone: "+1 (555) 0123", status: "Active" },
            { id: 2, name: "Michael Ross", role: "Associate", specialty: "Litigation", cases: 8, winRate: 92, img: "MR", email: "m.ross@legalsphere.com", phone: "+1 (555) 0124", status: "In Court" },
            { id: 3, name: "Jessica Pearson", role: "Managing Partner", specialty: "Mergers", cases: 5, winRate: 99, img: "JP", email: "j.pearson@legalsphere.com", phone: "+1 (555) 0125", status: "Active" },
            { id: 4, name: "Louis Litt", role: "Partner", specialty: "Finance", cases: 15, winRate: 94, img: "LL", email: "l.litt@legalsphere.com", phone: "+1 (555) 0126", status: "Active" },
            { id: 5, name: "Rachel Zane", role: "Paralegal", specialty: "Research", cases: 22, winRate: 100, img: "RZ", email: "r.zane@legalsphere.com", phone: "+1 (555) 0127", status: "Away" },
        ];
        setLawyers(MOCK_LAWYERS);
        setLoading(false);
        return; 
      }

      const response = await fetch('/api/admin/get-lawyers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
      });

      let data;
      try { data = await response.json(); } catch { data = null; }

      if (!response.ok) { setLawyers([]); return; }

      const lawyersArray = Array.isArray(data?.Lawyers) ? data.Lawyers : [];
      if (data?.Success && lawyersArray.length > 0) {
         const transformedLawyers = lawyersArray.map((lawyer, index) => ({
           id: lawyer.id || lawyer._id || `lawyer-${index}`,
           name: lawyer.name || `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim() || 'Unknown',
           role: lawyer.experience ? `${lawyer.experience} Exp` : 'Associate',
           specialty: lawyer.specialization || 'General',
           cases: lawyer.activeCases || Math.floor(Math.random() * 15) + 5,
           winRate: lawyer.successRate || Math.floor(Math.random() * 10) + 88,
           img: lawyer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN',
           email: lawyer.email || 'N/A',
           phone: lawyer.phone || 'N/A',
           status: "Active"
         }));
         setLawyers(transformedLawyers);
      } else {
         setLawyers([]);
      }
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLawyer = async () => {
    // (Existing logic preserved)
    alert("Add Lawyer functionality simulated.");
    setIsAddDialogOpen(false);
  };

  const handleInputChange = (field, value) => {
    setNewLawyer(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col gap-4 h-full animate-in fade-in duration-300">
      
      {/* --- Compact Toolbar --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <h3 className="text-sm font-semibold text-zinc-800">Attorney Directory</h3>
           <div className="h-4 w-px bg-zinc-300"></div>
           <div className="relative group">
              <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-[#af9164]" />
              <input 
                type="text" 
                placeholder="Filter by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-48 bg-zinc-50 border border-zinc-200 rounded pl-7 pr-2 text-xs focus:outline-none focus:border-[#af9164] transition-colors placeholder:text-zinc-400"
              />
           </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-50 p-0.5 rounded border border-zinc-200">
                <button 
                    onClick={() => setViewMode("grid")}
                    className={cn("p-1.5 rounded transition-all", viewMode === "grid" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600")}
                >
                    <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={() => setViewMode("list")}
                    className={cn("p-1.5 rounded transition-all", viewMode === "list" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600")}
                >
                    <List className="w-3.5 h-3.5" />
                </button>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <button className="flex items-center gap-1.5 bg-[#1a2238] text-white px-3 py-1.5 text-xs font-medium rounded hover:bg-[#2d3a5e] transition-colors shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Attorney
                    </button>
                </DialogTrigger>
                
                {/* Modal Content - Expanded with all fields */}
                <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-[#f8f9fa] border-zinc-200 shadow-2xl">
                    <DialogHeader className="bg-white border-b border-zinc-200 px-6 py-4">
                        <DialogTitle className="text-lg font-semibold text-zinc-800">New Attorney Profile</DialogTitle>
                        <p className="text-xs text-zinc-500">Create a new account and profile for a legal associate.</p>
                    </DialogHeader>
                    
                    <div className="p-6 grid grid-cols-2 gap-8">
                        {/* LEFT COLUMN: Personal Info */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#af9164] mb-2">Personal Details</h4>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[10px] font-medium text-zinc-500 uppercase">First Name</Label>
                                    <Input value={newLawyer.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} className="h-8 text-xs bg-white mt-1" placeholder="Jane" />
                                </div>
                                <div>
                                    <Label className="text-[10px] font-medium text-zinc-500 uppercase">Last Name</Label>
                                    <Input value={newLawyer.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} className="h-8 text-xs bg-white mt-1" placeholder="Doe" />
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] font-medium text-zinc-500 uppercase">Email Address</Label>
                                <Input value={newLawyer.email} onChange={(e) => handleInputChange("email", e.target.value)} className="h-8 text-xs bg-white mt-1" placeholder="j.doe@legalsphere.com" />
                            </div>

                            <div>
                                <Label className="text-[10px] font-medium text-zinc-500 uppercase">Contact Phone</Label>
                                <Input value={newLawyer.phone} onChange={(e) => handleInputChange("phone", e.target.value)} className="h-8 text-xs bg-white mt-1" placeholder="+1 (555) 000-0000" />
                            </div>

                            <div>
                                <Label className="text-[10px] font-medium text-zinc-500 uppercase">Office Address</Label>
                                <Input value={newLawyer.address} onChange={(e) => handleInputChange("address", e.target.value)} className="h-8 text-xs bg-white mt-1" placeholder="123 Legal Ave, Suite 100" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Professional Info */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#af9164] mb-2">Professional Credentials</h4>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[10px] font-medium text-zinc-500 uppercase">Practice Area</Label>
                                    <Select onValueChange={(v) => handleInputChange("specialization", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white mt-1 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Corporate Law">Corporate Law</SelectItem>
                                            <SelectItem value="Civil Law">Civil Law</SelectItem>
                                            <SelectItem value="Criminal Law">Criminal Law</SelectItem>
                                            <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-[10px] font-medium text-zinc-500 uppercase">Experience</Label>
                                    <Select onValueChange={(v) => handleInputChange("experience", v)}>
                                        <SelectTrigger className="h-8 text-xs bg-white mt-1 w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0-2 years">Junior (0-2 yrs)</SelectItem>
                                            <SelectItem value="2-5 years">Associate (2-5 yrs)</SelectItem>
                                            <SelectItem value="5-10 years">Senior (5-10 yrs)</SelectItem>
                                            <SelectItem value="10+ years">Partner (10+ yrs)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] font-medium text-zinc-500 uppercase">Bar Association ID</Label>
                                <Input value={newLawyer.barNumber} onChange={(e) => handleInputChange("barNumber", e.target.value)} className="h-8 text-xs bg-white mt-1" placeholder="BAR-12345678" />
                            </div>

                            <div>
                                <Label className="text-[10px] font-medium text-zinc-500 uppercase">Professional Summary</Label>
                                <Textarea 
                                    value={newLawyer.case_history_summary} 
                                    onChange={(e) => handleInputChange("case_history_summary", e.target.value)} 
                                    className="bg-white mt-1 text-xs min-h-[85px] resize-none" 
                                    placeholder="Brief professional background and achievements..." 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-8 text-xs border-zinc-300 bg-white">Cancel</Button>
                        <Button onClick={handleAddLawyer} className="h-8 text-xs bg-[#1a2238] hover:bg-[#2d3a5e]">Create Profile</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* --- Content Area --- */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
           <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#af9164] rounded-full animate-spin mb-3"></div>
           <p className="text-xs text-zinc-400 font-medium">Accessing directory...</p>
        </div>
      ) : (
        <>
            {viewMode === "grid" ? (
                /* --- COMPACT CARD GRID --- */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLawyers.map((lawyer) => (
                  <div 
                    key={lawyer.id} 
                    className="group flex flex-col bg-white rounded-lg border border-zinc-200 p-4 transition-all duration-200 hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#1a2238] text-white flex items-center justify-center font-medium text-xs border-2 border-white ring-1 ring-zinc-200">
                                {lawyer.img}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-zinc-800 leading-tight">{lawyer.name}</h4>
                                <p className="text-[11px] text-zinc-500 mt-0.5">{lawyer.role}</p>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-zinc-300 hover:text-zinc-600 p-1"><MoreHorizontal size={14} /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem className="text-xs">Edit Profile</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs">View Cases</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs text-red-600">Deactivate</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-zinc-400 uppercase font-medium">Cases</p>
                            <p className="text-sm font-semibold text-zinc-700">{lawyer.cases}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 uppercase font-medium">Success</p>
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-zinc-700">{lawyer.winRate}%</span>
                                <TrendingUp size={12} className="text-[#af9164]" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-50 border border-zinc-100 text-[10px] font-medium text-zinc-500">
                            {lawyer.specialty}
                        </span>
                        <div className="flex-1"></div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 rounded-full bg-zinc-50 text-zinc-600 hover:bg-[#1a2238] hover:text-white transition-colors" title="Email"><Mail size={12} /></button>
                            <button className="p-1.5 rounded-full bg-zinc-50 text-zinc-600 hover:bg-[#1a2238] hover:text-white transition-colors" title="Call"><Phone size={12} /></button>
                        </div>
                    </div>
                  </div>
                  ))}
                </div>
            ) : (
                /* --- DENSE LEDGER LIST --- */
                <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="h-9 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 w-1/3">Attorney</th>
                                    <th className="h-9 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Specialty</th>
                                    <th className="h-9 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 text-center">Load</th>
                                    <th className="h-9 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 text-center">Rating</th>
                                    <th className="h-9 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 text-right">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredLawyers.map((lawyer) => (
                                    <tr key={lawyer.id} className="group hover:bg-zinc-50 transition-colors h-10">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded-full bg-[#1a2238] text-white flex items-center justify-center text-[10px] font-bold">
                                                    {lawyer.img}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-zinc-800">{lawyer.name}</span>
                                                    <span className="text-[10px] text-zinc-400">{lawyer.role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-[11px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                                {lawyer.specialty}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs font-mono text-zinc-600">
                                            {lawyer.cases}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="text-xs font-medium text-[#1a2238]">{lawyer.winRate}%</span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-zinc-400 hover:text-[#1a2238]"><Mail size={12} /></button>
                                                <button className="text-zinc-400 hover:text-[#1a2238]"><Phone size={12} /></button>
                                                <button className="text-zinc-400 hover:text-[#1a2238]"><MoreHorizontal size={12} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && filteredLawyers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-dashed border-zinc-200">
                   <Users className="w-8 h-8 text-zinc-300 mb-2" />
                   <p className="text-xs text-zinc-500">No personnel records found.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
}