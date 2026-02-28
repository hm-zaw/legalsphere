import React, { useState } from "react";
import { UserPlus, Briefcase, FileText } from "lucide-react";

export default function LawyerOfflineCaseView() {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    client: {
      fullName: "",
      phone: ""
    },
    case: {
      title: "",
      category: "",
      description: ""
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:5000/api/lawyer/offline-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to log offline case");
      }

      alert("Offline case and ghost client registered successfully!");
      setForm({
        client: { fullName: "", phone: "" },
        case: { title: "", category: "", description: "" }
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-[#1a2238] flex items-center gap-3">
          <UserPlus className="text-[#af9164]" /> Offline Intake (Ghost Client)
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xl">
          Log a case acquired outside of LegalSphere. This creates a local "ghost" client profile 
          assigned directly to you, bypassing the public matchmaking queues and notifications.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/60 space-y-8">
        
        {/* Basic Client Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[#1a2238] border-b border-zinc-100 pb-2">
            Client Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#af9164] mb-1">
                Full Legal Name
              </label>
              <input required value={form.client.fullName} onChange={e => setForm({...form, client: {...form.client, fullName: e.target.value}})} className="w-full px-4 py-2 bg-slate-50 border border-zinc-200 rounded-lg text-sm focus:border-[#1a2238] focus:ring-1 focus:ring-[#1a2238] outline-none transition-all" placeholder="e.g. Jane Doe" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#af9164] mb-1">
                Primary Contact (Phone)
              </label>
              <input value={form.client.phone} onChange={e => setForm({...form, client: {...form.client, phone: e.target.value}})} className="w-full px-4 py-2 bg-slate-50 border border-zinc-200 rounded-lg text-sm focus:border-[#1a2238] focus:ring-1 focus:ring-[#1a2238] outline-none transition-all" placeholder="+95 9xxxxxxxxx" />
            </div>
          </div>
        </div>

        {/* Basic Case Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[#1a2238] border-b border-zinc-100 pb-2">
            Matter Designation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#af9164] mb-1">
                Matter Title
              </label>
              <input required value={form.case.title} onChange={e => setForm({...form, case: {...form.case, title: e.target.value}})} className="w-full px-4 py-2 bg-slate-50 border border-zinc-200 rounded-lg text-sm focus:border-[#1a2238] focus:ring-1 focus:ring-[#1a2238] outline-none transition-all" placeholder="e.g. Doe Estate Planning" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#af9164] mb-1">
                Practice Area / Category
              </label>
              <select required value={form.case.category} onChange={e => setForm({...form, case: {...form.case, category: e.target.value}})} className="w-full px-4 py-2 bg-slate-50 border border-zinc-200 rounded-lg text-sm focus:border-[#1a2238] focus:ring-1 focus:ring-[#1a2238] outline-none transition-all appearance-none">
                <option value="">Select Category...</option>
                <option>Criminal Law</option>
                <option>Civil Litigation</option>
                <option>Corporate / Commercial</option>
                <option>Family Law</option>
                <option>Estate Planning</option>
                <option>Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#af9164] mb-1">
                Preliminary Notes
              </label>
              <textarea required value={form.case.description} onChange={e => setForm({...form, case: {...form.case, description: e.target.value}})} rows={4} className="w-full px-4 py-2 bg-slate-50 border border-zinc-200 rounded-lg text-sm focus:border-[#1a2238] focus:ring-1 focus:ring-[#1a2238] outline-none transition-all resize-none" placeholder="Brief factual background or strategy..." />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 flex justify-end">
          <button type="submit" disabled={loading} className="px-8 py-3 bg-[#1a2238] text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#111624] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
            {loading ? "Registering..." : <><FileText size={16} /> Register Matter</>}
          </button>
        </div>
      </form>
    </div>
  );
}
