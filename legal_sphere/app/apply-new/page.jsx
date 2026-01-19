"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EtheralShadow } from "../../components/ui/shadcn-io/etheral-shadow";

// Simple, trusted palette
const PRIMARY = "#070504"; // indigo-600
const BORDER = "#e5e7eb"; // gray-200
const MUTED = "#6b7280"; // gray-500

const DEFAULT_STATE = {
  client: {
    fullName: "",
    idNumber: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
  },
  case: {
    title: "",
    category: "",
    description: "",
    incidentDate: "",
    urgency: "",
  },
  documents: [],
  consultation: {
    type: "",
    date: "",
    timeSlot: "",
    notes: "",
  },
  acknowledgements: {
    accurate: false,
    privacy: false,
  },
};

const STEPS = [
  "Client Details",
  "Case Details",
  "Documents",
  "Consultation",
  "Review & Submit",
];

const STORAGE_KEY = "legalsphere.apply-new.v1";

function useAutosave(value) {
  const [savedAt, setSavedAt] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        // Do not attempt to persist File objects directly; store metadata only for docs
        const toSave = { ...value };
        if (toSave.documents) {
          toSave.documents = toSave.documents.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          }));
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        setSavedAt(Date.now());
      } catch {}
    }, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  return savedAt;
}

function Label({ children, htmlFor, required = false }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium" style={{ color: PRIMARY }}>
      {children} {required && <span className="text-red-600">*</span>}
    </label>
  );
}

function ErrorText({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function SectionCard({ title, helper, children }) {
  return (
    <section className="rounded-xl bg-transparent p-6" style={{ border: `1px solid ${BORDER}` }}>
      <h2 className="text-lg font-semibold" style={{ color: PRIMARY }}>{title}</h2>
      {helper && <p className="mt-2 text-sm" style={{ color: MUTED }}>{helper}</p>}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Stepper({ current }) {
  return (
    <div className="relative mb-6">
      {/* Background track (full width) */}
      <div className="absolute left-0 right-0 top-5 h-[3px] rounded-full" style={{ backgroundColor: BORDER }} />
      {/* Progress track */}
      <div
        className="absolute left-0 top-5 h-[3px] rounded-full"
        style={{ backgroundColor: PRIMARY, width: `${(current / (STEPS.length - 1)) * 100}%` }}
      />

      {/* Steps */}
      <ol className="relative z-10 flex w-full items-start justify-between">
        {STEPS.map((label, idx) => {
          const isActive = idx === current;
          const isCompleted = idx < current;
          const circleBg = isActive ? PRIMARY : isCompleted ? "#ffffff" : "#eef2f7";
          const circleText = isActive ? "#ffffff" : isCompleted ? PRIMARY : "#334155";
          const circleBorder = isActive || isCompleted ? PRIMARY : BORDER;
          return (
            <li key={label} className="flex min-w-0 flex-col items-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-sm"
                style={{ backgroundColor: circleBg, color: circleText, border: `1px solid ${circleBorder}` }}
                aria-current={isActive ? "step" : undefined}
              >
                {idx + 1}
              </div>
              <p
                className="mt-2 w-max max-w-[8rem] text-center text-[13px] font-medium sm:text-sm heading-font"
                style={{ color: isActive || isCompleted ? PRIMARY : "#334155" }}
              >
                {label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function ApplyNewPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...DEFAULT_STATE, ...parsed };
        }
      } catch {}
    }
    return DEFAULT_STATE;
  });

  const [docFiles, setDocFiles] = useState([]);
  const fileInputRef = useRef(null);
  const savedAt = useAutosave({ ...form, documents: docFiles });

  // Validation
  const errors = useMemo(() => {
    const e = {};
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

  function next() {
    setAttempted(true);
    if (Object.keys(errors).length > 0) return;
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
    setAttempted(false);
  }
  function back() {
    setStepIndex((s) => Math.max(s - 1, 0));
    setAttempted(false);
  }

  // Documents: drag & drop and list management
  function onFileDrop(files) {
    if (!files) return;
    const accepted = [];
    const allowed = ["application/pdf", "image/jpeg", "image/png", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    Array.from(files).forEach((f) => {
      if (allowed.includes(f.type) || /\.(pdf|jpg|jpeg|png|docx)$/i.test(f.name)) {
        accepted.push(f);
      }
    });
    setDocFiles((prev) => [...prev, ...accepted]);
  }

  function removeFile(idx) {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const finalErrors = {};
    if (!form.acknowledgements.accurate) finalErrors.accurate = "Please confirm accuracy.";
    if (!form.acknowledgements.privacy) finalErrors.privacy = "Please accept privacy & terms.";
    if (Object.keys(finalErrors).length) {
      setAttempted(true);
      return;
    }

    try {
      setSubmitting(true);
      // Upload selected documents to R2 first and collect uploaded keys
      // Upload selected documents to R2 first and collect uploaded keys
      const uploadedDocs = [];

      for (const f of docFiles) {
        // 1. Ask backend for presigned URL
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: f.name,
            contentType: f.type || "application/pdf",
          }),
        });

        if (!presignRes.ok) {
          throw new Error("Failed to prepare upload");
        }

        const { url, key, contentType } = await presignRes.json();

        // 2. Upload directly to R2
        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": contentType, // MUST match presign
          },
          body: f,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${f.name}`);
        }

        // 3. Collect metadata for MongoDB
        uploadedDocs.push({
          key,
          name: f.name,
          size: f.size,
          type: contentType,
        });
      }
      const res = await fetch("/api/case-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: form.client,
          case: form.case,
          consultation: form.consultation,
          acknowledgements: form.acknowledgements,
          documents: uploadedDocs,
        }),
      });
      if (!res.ok) {
        let msg = "Failed to submit";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      localStorage.removeItem(STORAGE_KEY);
      setDocFiles([]);
      setForm(DEFAULT_STATE);
      setStepIndex(0);
      alert("Case request submitted. Reference ID: " + (data.id || "N/A"));
    } catch (err) {
      alert(err?.message || "Sorry, there was a problem submitting your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const timeSlots = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
  ];

  return (
    <main>
      <div className="relative z-0 flex min-h-screen w-full flex-col items-stretch justify-start bg-zinc-50 text-slate-950">
        <EtheralShadow
          className="absolute inset-0 -z-10"
          color="rgba(128, 128, 128, 1)"
          animation={{ scale: 80, speed: 60 }}
          noise={{ opacity: 0.6, scale: 1.5 }}
          sizing="fill"
        />
        <div className="mx-auto w-full px-4 py-8 md:w-[60%]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold" style={{ color: PRIMARY }}>LegalSphere – New Case Request</h1>
          <Link href="/" className="text-sm" style={{ color: PRIMARY }}>
            Home
          </Link>
        </div>

        {/* Stepper */}
        <Stepper current={stepIndex} />

        {/* Autosave indicator */}
        {savedAt && (
          <p className="mb-3 text-xs" style={{ color: MUTED }}>
            Progress saved
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && stepIndex < STEPS.length - 1) {
              e.preventDefault();
              setAttempted(true);
              if (Object.keys(errors).length === 0) {
                setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
                setAttempted(false);
              }
            }
          }}
          className="rounded-xl bg-white p-6 shadow-sm"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {/* Step content */}
          {stepIndex === 0 && (
            <SectionCard title="Client Details" helper="Your personal information is kept confidential and secure.">
              <div>
                <Label htmlFor="fullName" required>Full Name</Label>
                <input
                  id="fullName"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.client.fullName}
                  onChange={(e) => setForm({ ...form, client: { ...form.client, fullName: e.target.value } })}
                />
                <ErrorText message={attempted ? errors.fullName : undefined} />
              </div>
              <div>
                <Label htmlFor="idNumber" required>National ID / Passport Number</Label>
                <input
                  id="idNumber"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.client.idNumber}
                  onChange={(e) => setForm({ ...form, client: { ...form.client, idNumber: e.target.value } })}
                />
                <ErrorText message={attempted ? errors.idNumber : undefined} />
              </div>
              <div>
                <Label htmlFor="email" required>Email Address</Label>
                <input
                  type="email"
                  id="email"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.client.email}
                  onChange={(e) => setForm({ ...form, client: { ...form.client, email: e.target.value } })}
                />
                <ErrorText message={attempted ? errors.email : undefined} />
              </div>
              <div>
                <Label htmlFor="phone" required>Phone Number</Label>
                <input
                  id="phone"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.client.phone}
                  onChange={(e) => setForm({ ...form, client: { ...form.client, phone: e.target.value } })}
                />
                <ErrorText message={attempted ? errors.phone : undefined} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.client.address}
                  onChange={(e) => setForm({ ...form, client: { ...form.client, address: e.target.value } })}
                />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <input
                  type="date"
                  id="dob"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.client.dob}
                  onChange={(e) => setForm({ ...form, client: { ...form.client, dob: e.target.value } })}
                />
              </div>
            </SectionCard>
          )}

          {stepIndex === 1 && (
            <SectionCard title="Case Details">
              <div>
                <Label htmlFor="title" required>Case Title</Label>
                <input
                  id="title"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.case.title}
                  onChange={(e) => setForm({ ...form, case: { ...form.case, title: e.target.value } })}
                />
                <ErrorText message={attempted ? errors.title : undefined} />
              </div>
              <div>
                <Label htmlFor="category" required>Case Category</Label>
                <select
                  id="category"
                  className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.case.category}
                  onChange={(e) => setForm({ ...form, case: { ...form.case, category: e.target.value } })}
                >
                  <option value="">Select...</option>
                  <option>Criminal Law</option>
                  <option>Civil Law</option>
                  <option>Family Law</option>
                  <option>Business / Corporate Law</option>
                  <option>Property / Land Law</option>
                  <option>Labor / Employment Law</option>
                  <option>Other</option>
                </select>
                <ErrorText message={attempted ? errors.category : undefined} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description" required>Case Description</Label>
                <textarea
                  id="description"
                  rows={5}
                  placeholder="Briefly explain your legal issue in simple terms..."
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.case.description}
                  onChange={(e) => setForm({ ...form, case: { ...form.case, description: e.target.value } })}
                />
                <ErrorText message={attempted ? errors.description : undefined} />
              </div>
              <div>
                <Label htmlFor="incidentDate">Incident Date</Label>
                <input
                  type="date"
                  id="incidentDate"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.case.incidentDate}
                  onChange={(e) => setForm({ ...form, case: { ...form.case, incidentDate: e.target.value } })}
                />
              </div>
              <div>
                <Label htmlFor="urgency">Case Urgency</Label>
                <div className="flex items-center gap-6 rounded-md border px-3 py-2" style={{ borderColor: BORDER }}>
                  <label className="flex items-center gap-2 text-sm" style={{ color: PRIMARY }}>
                    <input
                      type="radio"
                      name="urgency"
                      checked={form.case.urgency === "Normal"}
                      onChange={() => setForm({ ...form, case: { ...form.case, urgency: "Normal" } })}
                    />
                    Normal
                  </label>
                  <label className="flex items-center gap-2 text-sm" style={{ color: PRIMARY }}>
                    <input
                      type="radio"
                      name="urgency"
                      checked={form.case.urgency === "Urgent"}
                      onChange={() => setForm({ ...form, case: { ...form.case, urgency: "Urgent" } })}
                    />
                    Urgent
                  </label>
                </div>
              </div>
            </SectionCard>
          )}

          {stepIndex === 2 && (
            <div className="space-y-4">
              <SectionCard
                title="Supporting Documents"
                helper="All documents are encrypted and accessible only to authorized legal staff."
              >
                <div className="sm:col-span-2">
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center"
                    style={{ borderColor: BORDER }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      onFileDrop(e.dataTransfer.files);
                    }}
                  >
                    <div className="text-3xl" aria-hidden>🔒</div>
                    <p className="mt-2 text-sm" style={{ color: PRIMARY }}>
                      Drag & drop files here or click to browse
                    </p>
                    <p className="text-xs" style={{ color: MUTED }}>
                      Supported: PDF, JPG, PNG, DOCX. Max size depends on your plan.
                    </p>
                    <input
                      ref={fileInputRef}
                      id="docFiles"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => onFileDrop(e.target.files)}
                    />
                    <label
                      htmlFor="docFiles"
                      className="mt-3 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                      style={{ borderColor: BORDER, color: PRIMARY }}
                    >
                      Browse files
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  {docFiles.length === 0 ? (
                    <p className="text-sm" style={{ color: MUTED }}>No files uploaded yet.</p>
                  ) : (
                    <ul className="divide-y" style={{ borderColor: BORDER }}>
                      {docFiles.map((f, i) => (
                        <li key={i} className="flex items-center justify-between py-2">
                          <div className="text-sm">
                            <span className="font-medium" style={{ color: PRIMARY }}>{f.name}</span>
                            <span className="ml-2 text-xs" style={{ color: MUTED }}>
                              {(f.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <button
                            type="button"
                            className="text-sm underline"
                            style={{ color: PRIMARY }}
                            onClick={() => removeFile(i)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {stepIndex === 3 && (
            <SectionCard title="Consultation Preference">
              <div className="sm:col-span-2">
                <Label htmlFor="consultType">Preferred Consultation Type</Label>
                <div className="flex flex-wrap gap-4">
                  {["Online Meeting", "In-Person", "Phone Call"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, consultation: { ...form.consultation, type: t } })}
                      className={`rounded-md border px-4 py-2 text-sm ${form.consultation.type === t ? "text-white" : ""}`}
                      style={{ borderColor: BORDER, backgroundColor: form.consultation.type === t ? PRIMARY : "white", color: form.consultation.type === t ? "white" : PRIMARY }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="consultDate">Preferred Consultation Date</Label>
                <input
                  type="date"
                  id="consultDate"
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.consultation.date}
                  onChange={(e) => setForm({ ...form, consultation: { ...form.consultation, date: e.target.value } })}
                />
              </div>
              <div>
                <Label htmlFor="timeSlot">Preferred Time Slot</Label>
                <select
                  id="timeSlot"
                  className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.consultation.timeSlot}
                  onChange={(e) => setForm({ ...form, consultation: { ...form.consultation, timeSlot: e.target.value } })}
                >
                  <option value="">Select...</option>
                  {timeSlots.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                  style={{ borderColor: BORDER }}
                  value={form.consultation.notes}
                  onChange={(e) => setForm({ ...form, consultation: { ...form.consultation, notes: e.target.value } })}
                />
              </div>
            </SectionCard>
          )}

          {stepIndex === 4 && (
            <div className="space-y-6">
              <SectionCard title="Review & Submit">
                <div className="sm:col-span-2">
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: PRIMARY }}>Client Details</h3>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-gray-500">Full Name</dt><dd className="font-medium">{form.client.fullName || "—"}</dd></div>
                    <div><dt className="text-gray-500">ID/Passport</dt><dd className="font-medium">{form.client.idNumber || "—"}</dd></div>
                    <div><dt className="text-gray-500">Email</dt><dd className="font-medium">{form.client.email || "—"}</dd></div>
                    <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{form.client.phone || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-gray-500">Address</dt><dd className="font-medium">{form.client.address || "—"}</dd></div>
                    <div><dt className="text-gray-500">Date of Birth</dt><dd className="font-medium">{form.client.dob || "—"}</dd></div>
                  </dl>
                  <button type="button" className="mt-2 text-sm underline" style={{ color: PRIMARY }} onClick={() => setStepIndex(0)}>Edit</button>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: PRIMARY }}>Case Details</h3>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-gray-500">Title</dt><dd className="font-medium">{form.case.title || "—"}</dd></div>
                    <div><dt className="text-gray-500">Category</dt><dd className="font-medium">{form.case.category || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-gray-500">Description</dt><dd className="font-medium whitespace-pre-wrap">{form.case.description || "—"}</dd></div>
                    <div><dt className="text-gray-500">Incident Date</dt><dd className="font-medium">{form.case.incidentDate || "—"}</dd></div>
                    <div><dt className="text-gray-500">Urgency</dt><dd className="font-medium">{form.case.urgency || "—"}</dd></div>
                  </dl>
                  <button type="button" className="mt-2 text-sm underline" style={{ color: PRIMARY }} onClick={() => setStepIndex(1)}>Edit</button>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: PRIMARY }}>Documents</h3>
                  {docFiles.length === 0 ? (
                    <p className="text-sm" style={{ color: MUTED }}>No files uploaded.</p>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {docFiles.map((f, i) => (
                        <li key={i}>{f.name}</li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="mt-2 text-sm underline" style={{ color: PRIMARY }} onClick={() => setStepIndex(2)}>Edit</button>
                </div>

                <div className="sm:col-span-2">
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: PRIMARY }}>Consultation</h3>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-gray-500">Type</dt><dd className="font-medium">{form.consultation.type || "—"}</dd></div>
                    <div><dt className="text-gray-500">Date</dt><dd className="font-medium">{form.consultation.date || "—"}</dd></div>
                    <div><dt className="text-gray-500">Time Slot</dt><dd className="font-medium">{form.consultation.timeSlot || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-gray-500">Notes</dt><dd className="font-medium whitespace-pre-wrap">{form.consultation.notes || "—"}</dd></div>
                  </dl>
                  <button type="button" className="mt-2 text-sm underline" style={{ color: PRIMARY }} onClick={() => setStepIndex(3)}>Edit</button>
                </div>
              </SectionCard>

              <div className="rounded-xl bg-white p-6 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                <div className="space-y-3">
                  <label className="flex items-start gap-2 text-sm" style={{ color: PRIMARY }}>
                    <input
                      type="checkbox"
                      checked={form.acknowledgements.accurate}
                      onChange={(e) => setForm({ ...form, acknowledgements: { ...form.acknowledgements, accurate: e.target.checked } })}
                    />
                    <span>I confirm that the information provided is true and accurate.</span>
                  </label>
                  <ErrorText message={attempted ? errors.accurate : undefined} />
                  <label className="flex items-start gap-2 text-sm" style={{ color: PRIMARY }}>
                    <input
                      type="checkbox"
                      checked={form.acknowledgements.privacy}
                      onChange={(e) => setForm({ ...form, acknowledgements: { ...form.acknowledgements, privacy: e.target.checked } })}
                    />
                    <span>
                      I agree to the privacy policy and legal service terms.
                    </span>
                  </label>
                  <ErrorText message={attempted ? errors.privacy : undefined} />
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <p className="mt-6 text-xs" style={{ color: MUTED }}>
            Case requests are reviewed by legal administrators before lawyer assignment.
          </p>

          {/* Navigation */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={back}
                disabled={stepIndex === 0}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
                style={{ borderColor: BORDER, color: PRIMARY }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, documents: docFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })) }))}
                className="rounded-md border px-4 py-2 text-sm"
                style={{ borderColor: BORDER, color: PRIMARY }}
              >
                Save Draft
              </button>
            </div>
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="rounded-md px-5 py-2 text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: PRIMARY }}
              >
                Next
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-md px-5 py-2 text-sm text-white disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Case Request"}
                </button>
              </div>
            )}
          </div>
        </form>
        </div>
      </div>
    </main>
  );
}
