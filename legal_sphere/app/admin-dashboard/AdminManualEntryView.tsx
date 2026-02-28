"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// Refined Professional Palette
const LEGAL_NAVY = "#1a2238";
const OFF_WHITE = "#f8f9fa";
const PAPER_WHITE = "#ffffff";
const ACCENT_GOLD = "#af9164";
const BORDER_SUBTLE = "#e2e8f0";

/**
 * 📄 Stylized "Paper" Wrapper
 */
function PaperSheet({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "relative w-full bg-white shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border-t-[6px]", 
      "before:absolute before:inset-0 before:pointer-events-none before:border-x before:border-b before:border-slate-200",
      className
    )}
    style={{ borderTopColor: LEGAL_NAVY }}
    >
      {children}
    </div>
  );
}

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-serif text-2xl tracking-tight text-slate-900 mb-1 italic">
    {children}
  </h2>
);

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-6">
    {children}
  </p>
);

export default function AdminManualEntryView() {
  const STEPS = ["Client Information", "Case Details", "Advocate Assignment"];
  const [stepIndex, setStepIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    client: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      dob: ""
    },
    case: {
      title: "",
      category: "",
      description: "",
      incidentDate: "",
      urgency: "Normal"
    },
    lawyerId: ""
  });

  useEffect(() => {
    // Fetch lawyers to populate dropdown
    const fetchLawyers = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res = await fetch("/api/lawyers", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLawyers(data.lawyers || []);
        }
      } catch (err) {
        console.error("Failed to fetch lawyers", err);
      }
    };
    fetchLawyers();
  }, []);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!form.client.fullName.trim()) e.fullName = "Full Name is required.";
      if (!form.client.phone.trim()) e.phone = "Phone Number is required.";
      // simple email validation if entered
    }
    if (stepIndex === 1) {
      if (!form.case.title.trim()) e.title = "Case Title is required.";
      if (!form.case.category) e.category = "Please select a case category.";
      if (!form.case.description.trim()) e.description = "Case Description is required.";
    }
    if (stepIndex === 2) {
      if (!form.lawyerId) e.lawyerId = "You must assign an attorney.";
    }
    return e;
  }, [form, stepIndex]);

  const next = () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      setAttempted(false);
    }
  };

  const back = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      setAttempted(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:5000/api/admin/manual-case-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to submit manual case");
      }

      alert("Case manually created and assigned successfully.");
      // reset form
      setForm({
        client: { fullName: "", email: "", phone: "", address: "", dob: "" },
        case: { title: "", category: "", description: "", incidentDate: "", urgency: "Normal" },
        lawyerId: ""
      });
      setStepIndex(0);
      setAttempted(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex-1 w-full min-w-0 bg-[#efefec] py-8 sm:py-12 px-4 sm:px-8 selection:bg-slate-200"
      style={{
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        color: "var(--foreground)",
      }}
    >
      <div className="w-full max-w-none min-w-0">
        
        {/* Modern Letterhead */}
        <header className="mb-12 border-b-2 border-slate-900 pb-6 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-4xl text-slate-900">LEGALSPHERE</h1>
            <p className="text-xs font-mono uppercase text-slate-500">Document No: ADM-INTAKE-{new Date().getFullYear()}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">Administrative Operations</p>
            <p className="text-xs text-slate-400">Direct Case Assignment Interface</p>
          </div>
        </header>

        <div className="w-full min-w-0 grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          
          {/* Vertical Navigation (The Index) */}
          <nav className="space-y-8 lg:pr-4 xl:pr-8">
            <div className="sticky top-12">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Intake Progress</p>
              <ul className="space-y-4">
                {STEPS.map((step, idx) => (
                  <li key={step} className="group flex items-center gap-3">
                    <span className={cn(
                      "h-[2px] w-4 transition-all",
                      idx === stepIndex ? "w-8 bg-amber-600" : "bg-slate-300 group-hover:bg-slate-400"
                    )} />
                    <button 
                      type="button"
                      onClick={() => idx <= stepIndex && setStepIndex(idx)}
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider transition-colors",
                        idx === stepIndex ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {step}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* The Form 'Sheet' */}
          <main className="min-w-0 lg:pl-4 xl:pl-8">
            <PaperSheet className="p-8 sm:p-12 lg:p-16">
              
              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* Step 0: Client Details */}
                {stepIndex === 0 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>I. Client Information</Heading>
                    <SubHeading>Primary Petitioner Identification</SubHeading>
                    
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Legal Full Name</label>
                        <input 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-medium"
                          placeholder="e.g. Johnathan Doe"
                          value={form.client.fullName}
                          onChange={(e) => setForm({...form, client: {...form.client, fullName: e.target.value}})}
                        />
                        {attempted && errors.fullName && (
                          <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                        )}
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Email Address</label>
                        <input 
                          type="email"
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          placeholder="e.g. john.doe@email.com"
                          value={form.client.email}
                          onChange={(e) => setForm({...form, client: {...form.client, email: e.target.value}})}
                        />
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Date of Birth</label>
                        <input 
                          type="date"
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          value={form.client.dob}
                          onChange={(e) => setForm({...form, client: {...form.client, dob: e.target.value}})}
                        />
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Phone Number</label>
                        <input 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          placeholder="e.g. 9xxxxxxxx"
                          value={form.client.phone}
                          onChange={(e) => setForm({...form, client: {...form.client, phone: e.target.value}})}
                        />
                        {attempted && errors.phone && (
                          <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                        )}
                      </div>
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Residential Address</label>
                        <textarea 
                          rows={3}
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent resize-none"
                          placeholder="Full residential address..."
                          value={form.client.address}
                          onChange={(e) => setForm({...form, client: {...form.client, address: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Case Details */}
                {stepIndex === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>II. Matter Designation</Heading>
                    <SubHeading>Legal Issue & Context</SubHeading>
                    
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Case Title</label>
                        <input 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-medium"
                          placeholder="Brief title of the legal matter (e.g. State v. Doe)"
                          value={form.case.title}
                          onChange={(e) => setForm({...form, case: {...form.case, title: e.target.value}})}
                        />
                        {attempted && errors.title && (
                          <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                        )}
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Case Category</label>
                        <select 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-medium appearance-none cursor-pointer"
                          value={form.case.category}
                          onChange={(e) => setForm({...form, case: {...form.case, category: e.target.value}})}
                        >
                          <option value="">Select category...</option>
                          <option>Criminal Law</option>
                          <option>Civil Law</option>
                          <option>Family Law</option>
                          <option>Business / Corporate Law</option>
                          <option>Property / Land Law</option>
                          <option>Labor / Employment Law</option>
                          <option>Other</option>
                        </select>
                        {attempted && errors.category && (
                          <p className="text-xs text-red-600 mt-1">{errors.category}</p>
                        )}
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Incident Date</label>
                        <input 
                          type="date"
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          value={form.case.incidentDate}
                          onChange={(e) => setForm({...form, case: {...form.case, incidentDate: e.target.value}})}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Case Description</label>
                        <textarea 
                          rows={4}
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent resize-none"
                          placeholder="Provide a detailed description of the legal issue..."
                          value={form.case.description}
                          onChange={(e) => setForm({...form, case: {...form.case, description: e.target.value}})}
                        />
                        {attempted && errors.description && (
                          <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                        )}
                      </div>
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Case Urgency</label>
                        <div className="flex items-center gap-6 mt-2">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input 
                              type="radio"
                              name="urgency"
                              checked={form.case.urgency === "Normal"}
                              onChange={() => setForm({...form, case: {...form.case, urgency: "Normal"}})}
                              className="text-amber-600 focus:ring-amber-500"
                            />
                            Normal
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input 
                              type="radio"
                              name="urgency"
                              checked={form.case.urgency === "Urgent"}
                              onChange={() => setForm({...form, case: {...form.case, urgency: "Urgent"}})}
                              className="text-amber-600 focus:ring-amber-500"
                            />
                            Urgent
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Attorney Assignment & Review */}
                {stepIndex === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>III. Advocate Assignment</Heading>
                    <SubHeading>Select & Confirm Counsel</SubHeading>
                    
                    <div className="space-y-12">
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Assign to Attorney</label>
                        <select 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-medium appearance-none cursor-pointer text-lg mt-2"
                          value={form.lawyerId}
                          onChange={(e) => setForm({...form, lawyerId: e.target.value})}
                        >
                          <option value="">Select an advocate from the directory...</option>
                          {lawyers.map(l => (
                            <option key={l.id} value={l.id}>{l.name} — {l.specialization?.join(', ') || 'General'}</option>
                          ))}
                        </select>
                        {attempted && errors.lawyerId && (
                          <p className="text-xs text-red-600 mt-1">{errors.lawyerId}</p>
                        )}
                      </div>

                      {/* Summary Display */}
                      <div className="border-l-4 border-amber-600 pl-6 space-y-6 mt-8">
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Selected Matter</h3>
                          <div className="text-sm">
                            <span className="text-slate-500">Title:</span> {form.case.title || "—"}<br/>
                            <span className="text-slate-500">Category:</span> {form.case.category || "—"}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Subject Client</h3>
                          <div className="text-sm">
                            <span className="text-slate-500">Name:</span> {form.client.fullName || "—"}<br/>
                            <span className="text-slate-500">Phone:</span> {form.client.phone || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Navigation Controls */}
                <div className="pt-12 mt-12 border-t border-slate-200 flex justify-between items-center sm:pl-0">
                  {stepIndex > 0 ? (
                    <button
                      type="button"
                      onClick={back}
                      className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      ← Previous
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  {stepIndex < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={next}
                      className="bg-[#1a2238] hover:bg-[#2a375a] text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Complete & Assign"}
                    </button>
                  )}
                </div>

              </form>
            </PaperSheet>
          </main>
        </div>
      </div>
    </div>
  );
}
