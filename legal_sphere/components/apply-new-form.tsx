"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Refined Professional Palette
const LEGAL_NAVY = "#1a2238"; // Deep, authoritative navy
const OFF_WHITE = "#f8f9fa"; // Very slight grey to make the 'paper' pop
const PAPER_WHITE = "#ffffff";
const ACCENT_GOLD = "#af9164"; // Muted, sophisticated gold
const BORDER_SUBTLE = "#e2e8f0";

/**
 * 📄 Stylized "Paper" Wrapper
 * Gives the impression of a physical document.
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

/**
 * 🖋️ Typography Components
 */
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

export function ApplyNewForm() {
  const STEPS = ["Client Details", "Case Information", "Documents", "Consultation", "Review & Submit"];
  const [stepIndex, setStepIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [docFiles, setDocFiles] = useState([]);
  const [form, setForm] = useState({
    client: {
      fullName: "",
      idNumber: "",
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
      urgency: ""
    },
    consultation: {
      type: "",
      date: "",
      timeSlot: "",
      notes: ""
    },
    acknowledgements: {
      accurate: false,
      privacy: false
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Validation
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!form.client.fullName.trim()) e.fullName = "Full Name is required.";
      if (!form.client.idNumber.trim()) e.idNumber = "National ID / Passport Number is required.";
      if (!form.client.email.trim()) e.email = "Email is required.";
      if (!form.client.phone.trim()) e.phone = "Phone Number is required.";
    }
    if (stepIndex === 1) {
      if (!form.case.title.trim()) e.title = "Case Title is required.";
      if (!form.case.category) e.category = "Please select a case category.";
      if (!form.case.description.trim()) e.description = "Case Description is required.";
    }
    if (stepIndex === 4) {
      if (!form.acknowledgements.accurate) e.accurate = "You must confirm the information is accurate.";
      if (!form.acknowledgements.privacy) e.privacy = "You must agree to privacy and terms.";
    }
    return e;
  }, [form, stepIndex]);

  // Documents: drag & drop and list management
  function onFileDrop(files: FileList | null) {
    if (!files) return;
    const accepted: File[] = [];
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    Array.from(files).forEach((f) => {
      if (
        allowed.includes(f.type) ||
        /\.(pdf|jpg|jpeg|png|docx)$/i.test(f.name)
      ) {
        accepted.push(f);
      }
    });
    setDocFiles((prev) => [...prev, ...accepted]);
  }

  function removeFile(idx: number) {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  const timeSlots = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form);
  };

  return (
    <div
      className="flex-1 w-full min-w-0 min-h-screen bg-[#efefec] py-12 px-4 selection:bg-slate-200 overflow-y-scroll"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="w-full max-w-none min-w-0">
        
        {/* Modern Letterhead */}
        <header className="mb-12 border-b-2 border-slate-900 pb-6 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-4xl text-slate-900">LEGALSPHERE</h1>
            <p className="text-xs font-mono uppercase text-slate-500">Document No: CASE-REQ-2026-{(stepIndex + 1).toString().padStart(3, '0')}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">Intake Department</p>
            <p className="text-xs text-slate-400">Electronic Filing System v1.4</p>
          </div>
        </header>

        <div className="w-full min-w-0 grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          
          {/* Vertical Navigation (The Index) */}
          <nav className="space-y-8 lg:pr-4 xl:pr-8">
            <div className="sticky top-12">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Case Progress</p>
              <ul className="space-y-4">
                {STEPS.map((step, idx) => (
                  <li key={step} className="group flex items-center gap-3">
                    <span className={cn(
                      "h-[2px] w-4 transition-all",
                      idx === stepIndex ? "w-8 bg-amber-600" : "bg-slate-300 group-hover:bg-slate-400"
                    )} />
                    <button 
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
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">ID / Passport Number</label>
                        <input 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-mono"
                          value={form.client.idNumber}
                          onChange={(e) => setForm({...form, client: {...form.client, idNumber: e.target.value}})}
                        />
                        {attempted && errors.idNumber && (
                          <p className="text-xs text-red-600 mt-1">{errors.idNumber}</p>
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
                        {attempted && errors.email && (
                          <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                        )}
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Phone Number</label>
                        <input 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          placeholder="e.g. +1-555-0123"
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
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Date of Birth</label>
                        <input 
                          type="date"
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          value={form.client.dob}
                          onChange={(e) => setForm({...form, client: {...form.client, dob: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Case Information */}
                {stepIndex === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>II. Case Details</Heading>
                    <SubHeading>Legal Matter Specification</SubHeading>
                    
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Case Title</label>
                        <input 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-medium"
                          placeholder="Brief title of your legal matter"
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
                        />
                      </div>
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Case Description</label>
                        <textarea 
                          rows={5}
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent resize-none"
                          placeholder="Please provide a detailed description of your legal issue..."
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

                {/* Step 2: Documents (Styled as an 'Exhibit' section) */}
                {stepIndex === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>III. Evidence & Exhibits</Heading>
                    <SubHeading>Supporting Documentation Annex</SubHeading>
                    
                    <div 
                      className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center hover:border-amber-600 hover:bg-slate-50 transition-all cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        onFileDrop(e.dataTransfer.files);
                      }}
                    >
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 group-hover:bg-amber-100 transition-colors">
                        <span className="text-xl">⚓</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">Secure File Depository</p>
                      <p className="text-xs text-slate-500 mt-1">Files are encrypted upon submission. PDF, DOCX, or Images accepted.</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => onFileDrop(e.target.files)}
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                      />
                    </div>
                    
                    {docFiles.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <h4 className="text-sm font-semibold text-slate-700">Uploaded Documents</h4>
                        <ul className="divide-y divide-slate-200">
                          {docFiles.map((f, i) => (
                            <li key={i} className="flex items-center justify-between py-2">
                              <div className="text-sm">
                                <span className="font-medium text-slate-900">{f.name}</span>
                                <span className="ml-2 text-xs text-slate-500">({(f.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:text-red-800 transition-colors"
                                onClick={() => removeFile(i)}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Consultation */}
                {stepIndex === 3 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>IV. Consultation Preferences</Heading>
                    <SubHeading>Scheduling & Communication Details</SubHeading>
                    
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Preferred Consultation Type</label>
                        <div className="flex flex-wrap gap-4 mt-2">
                          {["Online Meeting", "In-Person", "Phone Call"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setForm({...form, consultation: {...form.consultation, type: type}})}
                              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                                form.consultation.type === type
                                  ? "bg-amber-600 text-white border-amber-600"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-amber-600"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Preferred Date</label>
                        <input 
                          type="date"
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          value={form.consultation.date}
                          onChange={(e) => setForm({...form, consultation: {...form.consultation, date: e.target.value}})}
                        />
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Preferred Time Slot</label>
                        <select 
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-medium appearance-none cursor-pointer overflow-y-hidden"
                          value={form.consultation.timeSlot}
                          onChange={(e) => setForm({...form, consultation: {...form.consultation, timeSlot: e.target.value}})}
                        >
                          <option value="">Select time...</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Additional Notes</label>
                        <textarea 
                          rows={3}
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent resize-none"
                          placeholder="Any additional information or special requirements..."
                          value={form.consultation.notes}
                          onChange={(e) => setForm({...form, consultation: {...form.consultation, notes: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {stepIndex === 4 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Heading>V. Review & Submission</Heading>
                    <SubHeading>Final Verification</SubHeading>
                    
                    <div className="space-y-8">
                      {/* Client Details Review */}
                      <div className="border-l-4 border-amber-600 pl-6">
                        <h3 className="font-semibold text-slate-900 mb-3">Client Information</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <div><span className="text-slate-500">Name:</span> {form.client.fullName || "—"}</div>
                          <div><span className="text-slate-500">ID:</span> {form.client.idNumber || "—"}</div>
                          <div><span className="text-slate-500">Email:</span> {form.client.email || "—"}</div>
                          <div><span className="text-slate-500">Phone:</span> {form.client.phone || "—"}</div>
                          <div className="sm:col-span-2"><span className="text-slate-500">Address:</span> {form.client.address || "—"}</div>
                          <div><span className="text-slate-500">DOB:</span> {form.client.dob || "—"}</div>
                        </div>
                      </div>
                      
                      {/* Case Details Review */}
                      <div className="border-l-4 border-amber-600 pl-6">
                        <h3 className="font-semibold text-slate-900 mb-3">Case Details</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <div className="sm:col-span-2"><span className="text-slate-500">Title:</span> {form.case.title || "—"}</div>
                          <div><span className="text-slate-500">Category:</span> {form.case.category || "—"}</div>
                          <div><span className="text-slate-500">Incident Date:</span> {form.case.incidentDate || "—"}</div>
                          <div className="sm:col-span-2"><span className="text-slate-500">Description:</span> {form.case.description || "—"}</div>
                          <div><span className="text-slate-500">Urgency:</span> {form.case.urgency || "—"}</div>
                        </div>
                      </div>
                      
                      {/* Documents Review */}
                      <div className="border-l-4 border-amber-600 pl-6">
                        <h3 className="font-semibold text-slate-900 mb-3">Documents</h3>
                        {docFiles.length === 0 ? (
                          <p className="text-sm text-slate-500">No documents uploaded</p>
                        ) : (
                          <ul className="list-disc list-inside text-sm text-slate-700">
                            {docFiles.map((f, i) => (
                              <li key={i}>{f.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      {/* Consultation Review */}
                      <div className="border-l-4 border-amber-600 pl-6">
                        <h3 className="font-semibold text-slate-900 mb-3">Consultation Preferences</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <div><span className="text-slate-500">Type:</span> {form.consultation.type || "—"}</div>
                          <div><span className="text-slate-500">Date:</span> {form.consultation.date || "—"}</div>
                          <div><span className="text-slate-500">Time:</span> {form.consultation.timeSlot || "—"}</div>
                          <div className="sm:col-span-2"><span className="text-slate-500">Notes:</span> {form.consultation.notes || "—"}</div>
                        </div>
                      </div>
                      
                      {/* Acknowledgements */}
                      <div className="border-2 border-slate-200 rounded-lg p-6 bg-slate-50">
                        <h3 className="font-semibold text-slate-900 mb-4">Legal Acknowledgements</h3>
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 text-sm">
                            <input 
                              type="checkbox"
                              checked={form.acknowledgements.accurate}
                              onChange={(e) => setForm({...form, acknowledgements: {...form.acknowledgements, accurate: e.target.checked}})}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-slate-700">I confirm that the information provided is true and accurate.</span>
                          </label>
                          {attempted && errors.accurate && (
                            <p className="text-xs text-red-600 ml-6">{errors.accurate}</p>
                          )}
                          <label className="flex items-start gap-3 text-sm">
                            <input 
                              type="checkbox"
                              checked={form.acknowledgements.privacy}
                              onChange={(e) => setForm({...form, acknowledgements: {...form.acknowledgements, privacy: e.target.checked}})}
                              className="mt-1 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-slate-700">I agree to the privacy policy and legal service terms.</span>
                          </label>
                          {attempted && errors.privacy && (
                            <p className="text-xs text-red-600 ml-6">{errors.privacy}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-12 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={back}
                    disabled={stepIndex === 0}
                    className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all"
                  >
                    ← Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={stepIndex === STEPS.length - 1 ? undefined : next}
                    className="bg-slate-900 px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-amber-700 transition-all shadow-lg active:scale-95"
                  >
                    {stepIndex === STEPS.length - 1 ? "Execute Submission" : "Continue to Next Section"}
                  </button>
                </div>

              </form>
            </PaperSheet>
            
            {/* Subtle Footer Detail */}
            <div className="mt-6 flex justify-between items-center px-4">
               <div className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] uppercase font-bold text-slate-400">Secure Encryption Active</span>
               </div>
               <p className="text-[10px] text-slate-400 italic">LegalSphere Digital Affidavit System</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}