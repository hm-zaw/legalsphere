import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { InferenceClient } from "@huggingface/inference";

// Load lawyers from CSV (same parser assumptions as main route)
async function loadLawyers() {
  try {
    const envPath = process.env.LAWYERS_CSV_PATH;
    const csvPath = envPath && envPath.trim().length > 0
      ? envPath
      : path.join(process.cwd(), "app", "data", "lawyers.csv");
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
    // Graceful fallback: no lawyers data available (ranking disabled)
    if (e?.code === 'ENOENT') {
      console.warn("lawyers.csv not found; set LAWYERS_CSV_PATH or place CSV to enable lawyer ranking");
    } else {
      console.error("Failed to load lawyers.csv:", e);
    }
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

async function classifyCaseWithHF(text, allCategories) {
  const apiKey = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HF_MODEL_ID || "facebook/bart-large-mnli";
  
  if (!apiKey || !allCategories || allCategories.length === 0) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: text,
          parameters: { 
            candidate_labels: allCategories.slice(0, 20) // Increased to get more categories
          }
        }),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      }
    );
    
    if (!response.ok) {
      if (response.status === 504) {
        throw new Error(`HF API timeout - server took too long to respond`);
      } else if (response.status === 429) {
        throw new Error(`HF API rate limit exceeded`);
      } else {
        throw new Error(`HF API error ${response.status}: ${response.statusText}`);
      }
    }
    
    const result = await response.json();
    
    // Handle direct array format (what BART actually returns)
    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];
      
      // Check if it's the simple format: [{label, score}, ...]
      if (firstItem.label && typeof firstItem.score === 'number') {
        return result;
      }
      
      // Check if it's the complex format: [{labels: [...], scores: [...]}]
      if (firstItem.labels && firstItem.scores) {
        const mapped = firstItem.labels.map((label, index) => ({
          label: label,
          score: firstItem.scores[index] || 0
        }));
        return mapped;
      }
    }
    
    // Handle direct object format
    if (result.labels && result.scores) {
      const mapped = result.labels.map((label, index) => ({
        label: label,
        score: result.scores[index] || 0
      }));
      return mapped;
    }
    
    return null;
  } catch (e) {
    console.warn("HF classification failed:", e.message);
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
    // Get excluded lawyers from request
    const excludedLawyerIds = Array.isArray(body?.excludedLawyerIds) ? body.excludedLawyerIds : [];
    
    let lawyers = await loadLawyers();
    
    // Filter out excluded lawyers
    if (excludedLawyerIds.length > 0) {
      lawyers = lawyers.filter(l => !excludedLawyerIds.includes(l.lawyer_id));
    }
    
    const allCategories = [...new Set(lawyers.flatMap((l) => l.case_types))];

    let predictions = await classifyCaseWithHF(text, allCategories);
    if (!predictions || predictions.length === 0) {
      console.warn("HF classification failed, falling back to keyword-based classification");
      predictions = keywordCategories(text, allCategories);
    }
    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ error: "Classification failed - no results from HF API or keyword fallback" }, { status: 500 });
    }
    const topLabels = predictions.slice(0, 5).map((p) => p.label);

    const scored = lawyers.map((l) => {
      const matchCount = l.case_types.filter((c) => topLabels.includes(c)).length;
      const matchScore = matchCount > 0 ? 1 + 0.5 * (matchCount - 1) : 0;
      const perf = 0.5 * (l.success_rate || 0) + 0.2 * (1 - (l.complex_case_ratio || 0)) + 0.2 * (l.availability_score || 0) + 0.1 * Math.min(1, (l.years_experience || 0) / 30);
      const total = 0.6 * matchScore + 0.4 * perf;
      return { lawyer_id: l.lawyer_id, lawyer_name: l.lawyer_name, case_types: l.case_types, specializations: l.specializations, success_rate: l.success_rate, availability_score: l.availability_score, years_experience: l.years_experience, total };
    });
    scored.sort((a, b) => b.total - a.total);
    const topLawyers = scored.slice(0, 5);

    return NextResponse.json({ predictions, topLawyers }, { status: 200 });
  } catch (err) {
    console.error("/api/dev/test-classify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
