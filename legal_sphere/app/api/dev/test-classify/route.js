import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Load lawyers from CSV (same parser assumptions as main route)
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
    // Whole phrase occurrence
    if (t.includes(phrase)) {
      scores.set(cat, (scores.get(cat) || 0) + 2);
    }
  }

  // 2) Token-based match with filtering
  for (const cat of allCategories) {
    const tokens = cat.toLowerCase().split(/[^a-zA-Z]+/).filter((w) => w && !STOPWORDS.has(w) && w.length >= 5);
    if (tokens.length === 0) continue;
    // Whole-word regex for each informative token
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
        // boost labels only if exist in the category set
        const candidate = allCategories.find((c) => c.toLowerCase() === lbl.toLowerCase());
        if (candidate) scores.set(candidate, (scores.get(candidate) || 0) + 2);
      }
    }
  }

  // Keep only positive scores and sort
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
    const arr = Array.isArray(data) ? data : [];
    const preds = Array.isArray(arr[0]) ? arr[0] : arr;
    if (!Array.isArray(preds) || preds.length === 0 || !preds[0].label) return null;
    return preds.map((p) => ({ label: p.label, score: p.score }));
  } catch (e) {
    console.warn("HF classification failed, falling back to keywords:", e.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const title = body?.case?.title ?? "";
    const description = body?.case?.description ?? "";

    if (!title && !description) {
      return NextResponse.json({ error: "Provide case.title or case.description" }, { status: 400 });
    }

    const text = [title, description].filter(Boolean).join(". ");
    const lawyers = await loadLawyers();
    const allCategories = [...new Set(lawyers.flatMap((l) => l.case_types))];

    let predictions = await classifyCaseWithHF(text);
    if (!predictions || predictions.length === 0) {
      predictions = keywordCategories(text, allCategories).slice(0, 5);
    }
    const topLabels = predictions.slice(0, 5).map((p) => p.label);

    const scored = lawyers.map((l) => {
      const matchCount = l.case_types.filter((c) => topLabels.includes(c)).length;
      const matchScore = matchCount > 0 ? 1 + 0.5 * (matchCount - 1) : 0;
      const perf = 0.5 * (l.success_rate || 0) + 0.2 * (1 - (l.complex_case_ratio || 0)) + 0.2 * (l.availability_score || 0) + 0.1 * Math.min(1, (l.years_experience || 0) / 30);
      const total = 0.6 * matchScore + 0.4 * perf;
      return { lawyer_id: l.lawyer_id, case_types: l.case_types, specializations: l.specializations, success_rate: l.success_rate, availability_score: l.availability_score, years_experience: l.years_experience, total };
    });
    scored.sort((a, b) => b.total - a.total);
    const topLawyers = scored.slice(0, 5);

    return NextResponse.json({ predictions, topLawyers }, { status: 200 });
  } catch (err) {
    console.error("/api/dev/test-classify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
