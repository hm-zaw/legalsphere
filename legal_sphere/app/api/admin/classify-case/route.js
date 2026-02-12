import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// Comprehensive case types for classification
const CASE_TYPES = [
  "Contract Dispute",
  "Breach of Contract",
  "Fraud",
  "Theft",
  "Assault",
  "Battery",
  "Burglary",
  "Robbery",
  "Shoplifting",
  "Larceny",
  "White Collar Crime",
  "Embezzlement",
  "Money Laundering",
  "Tax Evasion",
  "Insider Trading",
  "Compliance",
  "Regulatory Violation",
  "Property Dispute",
  "Land Dispute",
  "Real Estate Dispute",
  "Eviction",
  "Tenant Rights",
  "Landlord Dispute",
  "Boundary Dispute",
  "Title Dispute",
  "Contract Drafting",
  "Lease Agreement",
  "Divorce",
  "Child Custody",
  "Child Support",
  "Alimony",
  "Spousal Support",
  "Marriage Registration",
  "Domestic Violence",
  "Domestic Dispute",
  "Adoption",
  "Guardianship",
  "Prenuptial Agreement",
  "Estate Planning",
  "Will Contest",
  "Probate",
  "Inheritance Dispute",
  "Trust Administration",
  "Personal Injury",
  "Medical Malpractice",
  "Wrongful Death",
  "Product Liability",
  "Car Accident",
  "Slip and Fall",
  "Workers Compensation",
  "Disability Claim",
  "Social Security",
  "Trademark Infringement",
  "Copyright Infringement",
  "Patent Dispute",
  "Trade Secret",
  "Intellectual Property",
  "Licensing Agreement",
  "Non-Compete",
  "Non-Disclosure",
  "Employment Dispute",
  "Wrongful Termination",
  "Workplace Discrimination",
  "Sexual Harassment",
  "Wage Dispute",
  "Overtime Pay",
  "Unpaid Wages",
  "Severance Negotiation",
  "Immigration",
  "Visa Application",
  "Citizenship",
  "Deportation Defense",
  "Asylum",
  "Corporate Law",
  "Business Formation",
  "Mergers and Acquisitions",
  "Shareholder Dispute",
  "Partnership Dispute",
  "Corporate Governance",
  "Securities Law",
  "Bankruptcy",
  "Debt Collection",
  "Consumer Protection",
  "Civil Rights",
  "Constitutional Law",
  "Environmental Law",
  "Construction Law",
  "Aviation Law",
  "Maritime Law",
  "Administrative Law",
  "Government Contracts",
  "Public Procurement",
  "FOIA Request",
];

// Map specific case types to general lawyer specializations
const SPECIALIZATION_MAP = {
  "Contract Dispute": ["Corporate Law", "Contract Law"],
  "Breach of Contract": ["Corporate Law", "Contract Law"],
  Fraud: ["Criminal Law", "Corporate Law"],
  Theft: ["Criminal Law"],
  Assault: ["Criminal Law"],
  Battery: ["Criminal Law"],
  Burglary: ["Criminal Law"],
  Robbery: ["Criminal Law"],
  Shoplifting: ["Criminal Law"],
  Larceny: ["Criminal Law"],
  "White Collar Crime": ["Criminal Law", "Corporate Law"],
  Embezzlement: ["Criminal Law", "Corporate Law"],
  "Money Laundering": ["Criminal Law", "Corporate Law"],
  "Tax Evasion": ["Criminal Law", "Tax Law"],
  "Insider Trading": ["Criminal Law", "Corporate Law"],
  Compliance: ["Corporate Law"],
  "Regulatory Violation": ["Corporate Law", "Administrative Law"],
  "Property Dispute": ["Property Law", "Real Estate Law"],
  "Land Dispute": ["Property Law", "Real Estate Law"],
  "Real Estate Dispute": ["Property Law", "Real Estate Law"],
  Eviction: ["Property Law", "Real Estate Law"],
  "Tenant Rights": ["Property Law", "Real Estate Law"],
  "Landlord Dispute": ["Property Law", "Real Estate Law"],
  "Boundary Dispute": ["Property Law"],
  "Title Dispute": ["Property Law", "Real Estate Law"],
  "Contract Drafting": ["Corporate Law", "Contract Law"],
  "Lease Agreement": ["Property Law", "Corporate Law"],
  Divorce: ["Family Law"],
  "Child Custody": ["Family Law"],
  "Child Support": ["Family Law"],
  Alimony: ["Family Law"],
  "Spousal Support": ["Family Law"],
  "Marriage Registration": ["Family Law"],
  "Domestic Violence": ["Family Law", "Criminal Law"],
  "Domestic Dispute": ["Family Law"],
  Adoption: ["Family Law"],
  Guardianship: ["Family Law"],
  "Prenuptial Agreement": ["Family Law"],
  "Estate Planning": ["Estate Planning", "Family Law"],
  "Will Contest": ["Estate Planning", "Family Law"],
  Probate: ["Estate Planning"],
  "Inheritance Dispute": ["Estate Planning", "Family Law"],
  "Trust Administration": ["Estate Planning"],
  "Personal Injury": ["Personal Injury"],
  "Medical Malpractice": ["Medical Malpractice", "Personal Injury"],
  "Wrongful Death": ["Personal Injury"],
  "Product Liability": ["Personal Injury"],
  "Car Accident": ["Personal Injury"],
  "Slip and Fall": ["Personal Injury"],
  "Workers Compensation": ["Workers Compensation", "Personal Injury"],
  "Disability Claim": ["Disability Law"],
  "Social Security": ["Disability Law"],
  "Trademark Infringement": ["Intellectual Property"],
  "Copyright Infringement": ["Intellectual Property"],
  "Patent Dispute": ["Intellectual Property"],
  "Trade Secret": ["Intellectual Property"],
  "Intellectual Property": ["Intellectual Property"],
  "Licensing Agreement": ["Intellectual Property", "Corporate Law"],
  "Non-Compete": ["Corporate Law", "Employment Law"],
  "Non-Disclosure": ["Corporate Law", "Intellectual Property"],
  "Employment Dispute": ["Employment Law"],
  "Wrongful Termination": ["Employment Law"],
  "Workplace Discrimination": ["Employment Law"],
  "Sexual Harassment": ["Employment Law"],
  "Wage Dispute": ["Employment Law"],
  "Overtime Pay": ["Employment Law"],
  "Unpaid Wages": ["Employment Law"],
  "Severance Negotiation": ["Employment Law"],
  Immigration: ["Immigration Law"],
  "Visa Application": ["Immigration Law"],
  Citizenship: ["Immigration Law"],
  "Deportation Defense": ["Immigration Law"],
  Asylum: ["Immigration Law"],
  "Corporate Law": ["Corporate Law"],
  "Business Formation": ["Corporate Law"],
  "Mergers and Acquisitions": ["Corporate Law"],
  "Shareholder Dispute": ["Corporate Law"],
  "Partnership Dispute": ["Corporate Law"],
  "Corporate Governance": ["Corporate Law"],
  "Securities Law": ["Corporate Law"],
  Bankruptcy: ["Bankruptcy Law"],
  "Debt Collection": ["Debt Collection"],
  "Consumer Protection": ["Consumer Protection"],
  "Civil Rights": ["Civil Rights"],
  "Constitutional Law": ["Constitutional Law"],
  "Environmental Law": ["Environmental Law"],
  "Construction Law": ["Construction Law"],
  "Aviation Law": ["Aviation Law"],
  "Maritime Law": ["Maritime Law"],
  "Administrative Law": ["Administrative Law"],
  "Government Contracts": ["Government Contracts"],
  "Public Procurement": ["Government Contracts"],
  "FOIA Request": ["Administrative Law"],
};

// Load lawyers from Supabase database
async function loadLawyersFromSupabase() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("lawyers").select("*");

    if (error) {
      console.error("Supabase lawyers fetch error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn("No lawyers found in Supabase database");
      return [];
    }

    // Transform Supabase data to match expected format
    return data.map((l) => ({
      lawyer_id: l.id,
      lawyer_name: l.name,
      specializations: (l.specialization || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
      case_types: (l.specialization || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean), // Use specialization as case_types
      years_experience:
        l.experience === "0-2 years"
          ? 1
          : l.experience === "2-5 years"
            ? 3.5
            : l.experience === "5-10 years"
              ? 7.5
              : l.experience === "10+ years"
                ? 15
                : 0,
      past_case_count: 0, // Not available in current schema
      average_case_duration_months: 0, // Not available in current schema
      success_rate: 0.85, // Default assumption
      complex_case_ratio: 0.2, // Default assumption
      availability_score:
        l.availability === "Available"
          ? 0.9
          : l.availability === "Busy"
            ? 0.5
            : 0.1,
      case_history_summary: l.case_history_summary || "",
      email: l.email || "",
      phone: l.phone || "",
      barNumber: l.barNumber || "",
    }));
  } catch (e) {
    console.error("Failed to load lawyers from Supabase:", e);
    return [];
  }
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
            candidate_labels: allCategories.slice(0, 20), // Increased to get more categories
          },
        }),
        signal: AbortSignal.timeout(60000), // 60 second timeout
      },
    );

    if (!response.ok) {
      if (response.status === 504) {
        throw new Error(`HF API timeout - server took too long to respond`);
      } else if (response.status === 429) {
        throw new Error(`HF API rate limit exceeded`);
      } else {
        throw new Error(
          `HF API error ${response.status}: ${response.statusText}`,
        );
      }
    }

    const result = await response.json();

    // Handle direct array format (what BART actually returns)
    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      // Check if it's the simple format: [{label, score}, ...]
      if (firstItem.label && typeof firstItem.score === "number") {
        return result;
      }

      // Check if it's the complex format: [{labels: [...], scores: [...]}]
      if (firstItem.labels && firstItem.scores) {
        const mapped = firstItem.labels.map((label, index) => ({
          label: label,
          score: firstItem.scores[index] || 0,
        }));
        return mapped;
      }
    }

    // Handle direct object format
    if (result.labels && result.scores) {
      const mapped = result.labels.map((label, index) => ({
        label: label,
        score: result.scores[index] || 0,
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
      return NextResponse.json(
        { error: "Provide case.title or case.description" },
        { status: 400 },
      );
    }

    const text = [title, description].filter(Boolean).join(". ");
    const excludedLawyerIds = Array.isArray(body?.excludedLawyerIds)
      ? body.excludedLawyerIds
      : [];

    // Use comprehensive case types for HF classification
    let predictions = await classifyCaseWithHF(text, CASE_TYPES);
    console.log(
      "DEBUG - HF predictions:",
      predictions ? predictions.length : "null",
    );

    if (!predictions || predictions.length === 0) {
      return NextResponse.json(
        { error: "HF API classification failed - no results returned" },
        { status: 502 },
      );
    }

    // Load lawyers from Supabase
    let lawyers = await loadLawyersFromSupabase();
    console.log("DEBUG - Lawyers loaded:", lawyers.length);

    if (excludedLawyerIds.length > 0) {
      lawyers = lawyers.filter((l) => !excludedLawyerIds.includes(l.lawyer_id));
    }

    // Map predicted case types to lawyer specializations
    const topPredictions = predictions.slice(0, 5);
    const mappedSpecializations = topPredictions.flatMap(
      (p) => SPECIALIZATION_MAP[p.label] || [],
    );
    const uniqueSpecializations = [...new Set(mappedSpecializations)];

    console.log(
      "DEBUG - Top predictions:",
      topPredictions.map((p) => ({ label: p.label, score: p.score })),
    );
    console.log("DEBUG - Mapped specializations:", uniqueSpecializations);

    // Score lawyers: prefer matches to predicted specializations weighted by prediction confidence
    const scored = lawyers.map((l) => {
      const lawyerSpecializations = l.specializations || [];

      // Build a match score by summing the prediction confidence for any prediction
      // whose mapped specializations intersect the lawyer's specializations.
      // If a lawyer matches multiple mapped specializations for a single prediction,
      // give a small bonus for breadth.
      let matchScore = 0;
      topPredictions.forEach((p) => {
        const mappedSpecs = SPECIALIZATION_MAP[p.label] || [];
        const intersect = mappedSpecs.filter((s) =>
          lawyerSpecializations.includes(s),
        );
        if (intersect.length > 0) {
          // base contribution is the prediction confidence
          // more matched specializations -> small multiplier
          const multiBoost = 1 + 0.25 * (intersect.length - 1);
          matchScore += p.score * multiBoost;
        }
      });

      // Normalize matchScore to be in a reasonable range (cap to 1.5 to avoid domination)
      matchScore = Math.min(matchScore, 1.5);

      // Performance heuristic (kept similar to previous logic)
      const perf =
        0.5 * (l.success_rate || 0) +
        0.2 * (1 - (l.complex_case_ratio || 0)) +
        0.2 * (l.availability_score || 0) +
        0.1 * Math.min(1, (l.years_experience || 0) / 30);

      // Increase weight on matchScore so specializations dominate ranking
      const total = 0.75 * (matchScore / 1.5) + 0.25 * perf;

      return {
        lawyer_id: l.lawyer_id,
        lawyer_name: l.lawyer_name,
        case_types: l.case_types,
        specializations: l.specializations,
        success_rate: l.success_rate,
        availability_score: l.availability_score,
        years_experience: l.years_experience,
        case_history_summary: l.case_history_summary,
        email: l.email,
        phone: l.phone,
        barNumber: l.barNumber,
        matchScore,
        total,
      };
    });
    scored.sort((a, b) => b.total - a.total);
    const topLawyers = scored.slice(0, 5);

    return NextResponse.json({ predictions, topLawyers }, { status: 200 });
  } catch (err) {
    console.error("/api/dev/test-classify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
