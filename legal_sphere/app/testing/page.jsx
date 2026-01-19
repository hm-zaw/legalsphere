"use client";

import { useState } from "react";

export default function DevTestClassifyPage() {
  const [form, setForm] = useState({
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
    consultation: {
      type: "",
      date: "",
      timeSlot: "",
      notes: "",
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [docText, setDocText] = useState("");
  const [docInfo, setDocInfo] = useState({ name: "", type: "", note: "" });

  function setField(path, value) {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      // Combine description with any extracted document text (trim and cap length)
      const parts = [form.case.description];
      if (docText) parts.push(`\n\n[Attached Document]\n${docText}`);
      const combinedDescription = parts.filter(Boolean).join(" ").slice(0, 20000);
      const res = await fetch("/api/dev/test-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case: { ...form.case, description: combinedDescription } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function onFileChange(e) {
    const f = e.target.files?.[0];
    setDocText("");
    setDocInfo({ name: "", type: "", note: "" });
    if (!f) return;
    const info = { name: f.name, type: f.type || "", note: "" };
    try {
      if (f.type.startsWith("text/") || /\.txt$/i.test(f.name)) {
        const text = await f.text();
        setDocText(text.slice(0, 50000));
        info.note = "Loaded plain text from .txt file.";
      } else if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
        info.note = "PDF text extraction not enabled in this dev page. We can add a parser next.";
      } else if (/\.docx?$/i.test(f.name)) {
        info.note = "DOC/DOCX extraction not enabled in this dev page.";
      } else {
        info.note = "Unsupported file type for inline text extraction here.";
      }
    } catch (err) {
      info.note = "Failed to read file.";
    }
    setDocInfo(info);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">AI Case Classifier (Dev)</h1>
      <p className="mb-6 text-sm text-gray-600">
        Temporary UI to test the model and lawyer ranking using the same input fields as apply-new. Files are not uploaded here.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-medium">Client Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Full Name</label>
              <input className="w-full rounded border p-2" value={form.client.fullName} onChange={(e) => setField("client.fullName", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">National ID / Passport</label>
              <input className="w-full rounded border p-2" value={form.client.idNumber} onChange={(e) => setField("client.idNumber", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <input type="email" className="w-full rounded border p-2" value={form.client.email} onChange={(e) => setField("client.email", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Phone</label>
              <input className="w-full rounded border p-2" value={form.client.phone} onChange={(e) => setField("client.phone", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm">Address</label>
              <input className="w-full rounded border p-2" value={form.client.address} onChange={(e) => setField("client.address", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Date of Birth</label>
              <input type="date" className="w-full rounded border p-2" value={form.client.dob} onChange={(e) => setField("client.dob", e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-medium">Case Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm">Title</label>
              <input className="w-full rounded border p-2" value={form.case.title} onChange={(e) => setField("case.title", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm">Category (optional)</label>
              <input className="w-full rounded border p-2" value={form.case.category} onChange={(e) => setField("case.category", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Urgency (optional)</label>
              <input className="w-full rounded border p-2" value={form.case.urgency} onChange={(e) => setField("case.urgency", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Incident Date (optional)</label>
              <input type="date" className="w-full rounded border p-2" value={form.case.incidentDate} onChange={(e) => setField("case.incidentDate", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm">Description</label>
              <textarea className="w-full rounded border p-2" rows={6} value={form.case.description} onChange={(e) => setField("case.description", e.target.value)} required />
            </div>
          </div>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-medium">Documents (Optional)</h2>
          <p className="mb-3 text-sm text-gray-600">Upload a document to include its text in classification. Currently, .txt is extracted client-side. PDF/DOCX parsing can be enabled in a later step.</p>
          <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={onFileChange} />
          {docInfo.name && (
            <div className="mt-2 text-sm text-gray-700">
              <div>Selected: <span className="font-medium">{docInfo.name}</span> <span className="text-gray-500">({docInfo.type || "unknown"})</span></div>
              {docInfo.note && <div className="text-gray-600">{docInfo.note}</div>}
              {docText && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-700">Preview extracted text</summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs">{docText}</pre>
                </details>
              )}
            </div>
          )}
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            {submitting ? "Submitting..." : "Test Classify"}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold">Result</h2>

          <div className="rounded border p-4">
            <h3 className="mb-3 font-medium">Predictions</h3>
            {Array.isArray(result.predictions) && result.predictions.length > 0 ? (
              <div className="space-y-3">
                {result.predictions.map((p, i) => {
                  const score = Number(p.score ?? 0);
                  const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.label}</span>
                        <span className="tabular-nums text-gray-600">{pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded bg-gray-200">
                        <div className="h-2 rounded bg-black" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No predictions.</p>
            )}
          </div>

          <div className="rounded border p-4">
            <h3 className="mb-3 font-medium">Top Lawyers</h3>
            {Array.isArray(result.topLawyers) && result.topLawyers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="border-b p-2">Lawyer ID</th>
                      <th className="border-b p-2">Case Types</th>
                      <th className="border-b p-2">Specializations</th>
                      <th className="border-b p-2">Success</th>
                      <th className="border-b p-2">Avail</th>
                      <th className="border-b p-2">Exp</th>
                      <th className="border-b p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.topLawyers.map((l, i) => (
                      <tr key={i} className="odd:bg-gray-50">
                        <td className="p-2">{l.lawyer_id}</td>
                        <td className="p-2">{(l.case_types || []).join(", ")}</td>
                        <td className="p-2">{(l.specializations || []).join(", ")}</td>
                        <td className="p-2">{(l.success_rate ?? 0).toFixed(2)}</td>
                        <td className="p-2">{(l.availability_score ?? 0).toFixed(2)}</td>
                        <td className="p-2">{l.years_experience ?? 0}</td>
                        <td className="p-2">{(l.total ?? 0).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No top lawyers.</p>
            )}
          </div>

          <div className="rounded border p-4">
            <h3 className="mb-3 font-medium">Raw JSON</h3>
            <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
