import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import path from "path";
import fs from "fs/promises";

// Lightweight CSV parser tailored to lawyers.csv (no quoted commas inside fields)
async function loadLawyers() {
  try {
    const csvPath = path.join(process.cwd(), "..", "JURIX", "data", "lawyers.csv");
    const raw = await fs.readFile(csvPath, "utf8");
    const lines = raw.trim().split(/\r?\n/);
    const header = lines[0].split(",").map((h) => h.trim());
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length !== header.length) continue;
      const row = {};
      header.forEach((h, idx) => {
        row[h] = cols[idx];
      });
      // Normalize semicolon-separated fields
      row.specializations = (row.specializations || "").split(";").map((s) => s.trim()).filter(Boolean);
      row.case_types = (row.case_types || "").split(";").map((s) => s.trim()).filter(Boolean);
      row.years_experience = Number(row.years_experience || 0);
      row.past_case_count = Number(row.past_case_count || 0);
      row.average_case_duration_months = Number(row.average_case_duration_months || 0);
      row.success_rate = Number(row.success_rate || 0);
      row.complex_case_ratio = Number(row.complex_case_ratio || 0);
      row.availability_score = Number(row.availability_score || 0);
      out.push(row);
    }
    return out;
  } catch (e) {
    console.error("Failed to load lawyers.csv:", e);
    return [];
  }
}

const STOPWORDS = new Set([
  "and","or","the","a","an","to","of","in","on","for","with","by","at","from","as","is","are","was","were","be","been","being","case","law","legal","court","date","agreement","person"
]);

const SYNONYMS = [
  { pattern: /(grand\s+)?larceny|shoplift(ing)?/i, labels: ["Theft", "Shoplifting"] },
  { pattern: /assault|battery/i, labels: ["Assault"] },
  { pattern: /burglary|break\s*in|breaking\s*and\s*entering/i, labels: ["Burglary"] },
  { pattern: /robbery|mugging/i, labels: ["Robbery"] },
  { pattern: /fraud|scam|embezzlement/i, labels: ["Fraud"] },
  { pattern: /divorce|dissolution/i, labels: ["Divorce"] },
  { pattern: /custody/i, labels: ["Child Custody"] },
  { pattern: /alimony|maintenance/i, labels: ["Alimony", "Maintenance"] },
];

function keywordCategories(text, allCategories) {
  const t = (text || "").toLowerCase();
  const scores = new Map();

  // 1) Exact phrase match for full label
  for (const cat of allCategories) {
    const phrase = cat.toLowerCase();
    if (t.includes(phrase)) {
      scores.set(cat, (scores.get(cat) || 0) + 2);
    }
  }

  // 2) Token-based match with filtering
  for (const cat of allCategories) {
    const tokens = cat.toLowerCase().split(/[^a-zA-Z]+/).filter((w) => w && !STOPWORDS.has(w) && w.length >= 5);
    if (tokens.length === 0) continue;
    let local = 0;
    for (const tk of tokens) {
      const re = new RegExp(`\\b${tk.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(t)) local += 1;
    }
    if (local > 0) scores.set(cat, (scores.get(cat) || 0) + Math.min(2, local));
  }

  // 3) Synonym/heuristic mapping
  for (const syn of SYNONYMS) {
    if (syn.pattern.test(t)) {
      for (const lbl of syn.labels) {
        const candidate = allCategories.find((c) => c.toLowerCase() === lbl.toLowerCase());
        if (candidate) scores.set(candidate, (scores.get(candidate) || 0) + 2);
      }
    }
  }

  const ranked = [...scores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, score]) => ({ label, score }));
  return ranked;
}

async function classifyCaseWithHF(text) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HF_MODEL_ID || "bachminion/vi-legal-bert-finetuned";
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text })
    });
    if (!res.ok) throw new Error(`HF API error ${res.status}`);
    const data = await res.json();
    // Expect either [{label, score}...] or [[{label, score}...]]
    const arr = Array.isArray(data) ? data : [];
    const preds = Array.isArray(arr[0]) ? arr[0] : arr;
    if (!Array.isArray(preds) || preds.length === 0 || !preds[0].label) return null;
    return preds.map((p) => ({ label: p.label, score: p.score }));
  } catch (e) {
    console.warn("HF classification failed, falling back to keywords:", e.message);
    return null;
  }
}

async function analyzeAndStoreRecommendations(db, caseRequestId) {
  try {
    const caseRequests = db.collection("case_requests");
    const recos = db.collection("case_recommendations");
    const doc = await caseRequests.findOne({ _id: new ObjectId(caseRequestId) });
    if (!doc) return;

    const lawyers = await loadLawyers();
    const allCategories = [...new Set(lawyers.flatMap((l) => l.case_types))];
    const text = [doc.case?.title, doc.case?.description].filter(Boolean).join(". ");

    let predictions = await classifyCaseWithHF(text);
    if (!predictions || predictions.length === 0) {
      const kw = keywordCategories(text, allCategories).slice(0, 5);
      predictions = kw;
    }

    const topLabels = predictions.slice(0, 5).map((p) => p.label);

    // Score lawyers: category match + performance/availability
    const scored = lawyers.map((l) => {
      const matchCount = l.case_types.filter((c) => topLabels.includes(c)).length;
      const matchScore = matchCount > 0 ? 1 + 0.5 * (matchCount - 1) : 0;
      const perf = 0.5 * (l.success_rate || 0) + 0.2 * (1 - (l.complex_case_ratio || 0)) + 0.2 * (l.availability_score || 0) + 0.1 * Math.min(1, (l.years_experience || 0) / 30);
      const total = 0.6 * matchScore + 0.4 * perf;
      return { lawyer_id: l.lawyer_id, case_types: l.case_types, specializations: l.specializations, success_rate: l.success_rate, availability_score: l.availability_score, years_experience: l.years_experience, total };
    });
    scored.sort((a, b) => b.total - a.total);
    const topLawyers = scored.slice(0, 5);

    await recos.insertOne({
      caseRequestId: new ObjectId(caseRequestId),
      predictions,
      topLawyers,
      createdAt: new Date(),
      status: "pending_admin_review",
    });
  } catch (e) {
    console.error("Failed to analyze case and store recommendations:", e);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || (!body.clientId && !body.client) || !body.case) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const now = new Date();

    const toDateOrNull = (v) => {
      if (!v) return null;
      if (v instanceof Date) return v;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    // Optional client reference from external (Flask) service
    const parseObjectId = (v) => {
      try {
        if (typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v)) return new ObjectId(v);
        if (v instanceof ObjectId) return v;
      } catch {}
      return null;
    };
    const clientId = parseObjectId(body.clientId);

    // Normalize client when no clientId provided (backward compatible)
    const client = !clientId
      ? {
          fullName: body.client?.fullName ?? "",
          idNumber: body.client?.idNumber ?? "",
          email: body.client?.email ?? "",
          phone: body.client?.phone ?? "",
          address: body.client?.address || null,
          dob: toDateOrNull(body.client?.dob),
        }
      : null;

    // Normalize case details
    const caseDetails = {
      title: body.case?.title ?? "",
      category: body.case?.category ?? "",
      description: body.case?.description ?? "",
      incidentDate: toDateOrNull(body.case?.incidentDate),
      urgency: body.case?.urgency || null,
    };

    // Normalize documents and stamp uploadedAt
    const documents = Array.isArray(body.documents)
      ? body.documents.map((d) => ({
          key: d.key,
          name: d.name,
          size: d.size,
          type: d.type,
          uploadedAt: now,
        }))
      : [];

    // Normalize consultation
    const consultation = body.consultation
      ? {
          type: body.consultation.type || null,
          date: toDateOrNull(body.consultation.date),
          timeSlot: body.consultation.timeSlot ?? "",
          notes: body.consultation.notes || null,
        }
      : null;

    // Normalize acknowledgements and stamp time
    const acknowledgements = body.acknowledgements
      ? {
          accurate: !!body.acknowledgements.accurate,
          privacy: !!body.acknowledgements.privacy,
          acknowledgedAt: now,
        }
      : null;

    const payload = {
      ...(clientId ? { clientId } : { client }),
      case: caseDetails,
      consultation,
      documents,
      acknowledgements,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      source: "apply-new",
    };

    const db = await getDb();
    const collection = db.collection("case_requests");
    const result = await collection.insertOne(payload);

    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
  } catch (err) {
    console.error("Error creating case request:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
