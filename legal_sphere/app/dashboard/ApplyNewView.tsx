"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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

export default function ApplyNewView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const router = useRouter();
  const STEPS = ["Client Details", "Case Information", "Documents", "Consultation", "Review & Submit"];
  const [stepIndex, setStepIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Load user data on mount to pre-fill form
  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserData(parsed);
        // Pre-fill client details if available
        setForm(prev => ({
            ...prev,
            client: {
                ...prev.client,
                fullName: parsed.name || "",
                email: parsed.email || "",
                // Add other fields if available in user object
            }
        }));
    }
  }, []);

  const [form, setForm] = useState({
    client: {
      fullName: "",
      idNumber: "",
      nrc: {
        state: "",
        township: "",
        citizen: "",
        number: ""
      },
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
  // NRC Township data
  const nrcTownships = {
    "1": ["AhGaYa", "BaMaNa", "DaPhaYa", "HaPaNa", "KhaPhaNa", "KaMaNa", "KaMaTa", "KaPaTa", "KhaLaPha", "LaGaNa", "MaKaTa", "MaKhaBa", "MaLaNa", "MaNyaNa", "MaSaNa", "PaNaDa", "PaWaNa", "SaDaNa", "YaBaYa"],
    "2": ["BaLaKha", "DaMaSa", "LaKaNa", "MaSaNa", "PhaSaNa", "PhaYaSa", "YaTaNa", "YaThaNa"],
    "3": ["BaAhNa", "BaGaLa", "BaThaSa", "KaDaNa", "KaKaYa", "KaMaMa", "KaSaKa", "LaBaNa", "LaThaNa", "MaWaTa", "PhaAhNa", "PhaPaNa", "SaKaLa", "ThaMaKa", "ThaTaNa", "ThaTaKa", "YaNaTha", "YaNaYa", "YaPaWa"],
    "4": ["BaMaNa", "HaKhaNa", "HtaTaLa", "KaPaLa", "MaTaNa", "MaTaPa", "PaLaWa", "PhaLaNa", "TaTaNa", "TaZaNa"],
    "5": ["AhTaNa", "AhYaTa", "BaMaNa", "BaTaLa", "DaMaYa", "DaPaYa", "HaMaLa", "HtaKhaNa", "KaBaLa", "KaLaHta", "KaLaNa", "KaLaTa", "KaLaWa", "KaNaNa", "KaSaNa", "KaThaNa", "KhaOuNa", "KhaOuTa", "KhaTaNa", "LaThaKa", "MaGaLa", "MaKaNa", "MaLaNa", "MaMaNa", "MaYaNa", "NaDaSa", "NaYaNa", "NgaZaNa", "PaLaNa", "PaLanBa", "PaThaKa", "PhaPaNa", "SaKaNa", "SaLaKa", "TaKaMa", "TaMaNa", "TaSaNa", "ThaSaNa", "WaLaNa", "WaThaNa", "YaBaNa", "YaMaKa", "YaMaPa", "YaOuNa", "YaSaKa", "YaThaKa"],
    "6": ["BaPaNa", "HtaWaNa", "KaThaNa", "KaSaNa", "LaLaNa", "MaMaNa", "MaAhYa", "NgaYaKa", "PaLaNa", "TaNaTha", "TaThaYa", "ThaYaKha", "YaPhaNa", "DaDaMa", "KaMaLa", "KaNaLa", "LaBaNa", "LaThaNa", "MaKaNa", "MaLaTha", "MaMaNa", "PaMaDa", "PaNaLa", "TaMaKa", "ThaNaKa", "KhaMaKa"],
    "7": ["AhPhaNa", "AhTaNa", "DaOuNa", "HtaTaPa", "KaTaTa", "KaPaKa", "KaKaNa", "KaTaKha", "MaDaNa", "MaLaNa", "MaNyaNa", "NaTaLa", "NyaLaPa", "PaNaKa", "PaKhaNa", "PaTaNa", "PaKhaTa", "PaTaTa", "PhaMaNa", "PaMaNa", "PaTaSa", "YaKaNa", "YaTaNa", "TaNgaNa", "ThaNaPa", "ThaKaNa", "ThaWaTa", "ThaSaNa", "WaMaNa", "YaTaYa", "ZaKaNa", "BaLaKa", "DaNaSa", "KaLaMa", "KaNaDa", "KaRaBa", "KaTaLa", "LaBaNa", "LaThaNa", "NaKaMa", "NaRaSa", "PaRaDa", "SaLaNa", "ThaNaMa", "YaKaLa"],
    "8": ["AhLaNa", "KhaMaNa", "GaGaNa", "SaPhaNa", "SaPaWa", "HtaLaNa", "KaMaNa", "MaKaNa", "MaBaNa", "MaLaNa", "MaTaNa", "MaMaNa", "MaHtaNa", "MaThaNa", "NaMaNa", "NgaPhaNa", "PaKhaKa", "PaMaNa", "PaPhaNa", "SaLaNa", "SaTaYa", "SaKaNa", "TaTaKa", "ThaYaNa", "SaMaNa", "YaNakha", "YaSaKa", "AyeYaKa", "BaNaMa", "KaDaNa", "KaLaNa", "KaRaBa", "LaBaNa", "LaYaKa", "MaMaLa", "NaKaMa", "NaRaSa", "PaRaDa", "SaKaLa", "TaLaMa", "YaKaLa", "YaMaTa"],
    "9": ["DaKhaTha", "LaWaNa", "OuTaTha", "PaBaTha", "PaMaNa", "TaKaNa", "ZaBaTha", "ZaYaTha", "AhMaYa", "AhMaZa", "KhaAhZa", "KhaMaSa", "KaPaTa", "KaSaNa", "MaLaNa", "MaHaMa", "MaNaMa", "MaNaTa", "MaYaMa", "MaYaTa", "MaTaYa", "MaMaNa", "MaHtaLa", "MaKaNa", "MaKhaNa", "MaThaNa", "NaHtaKa", "NgaTaYa", "NyaOuNa", "PaLaNa", "PaThaKa", "PaBaNa", "PaKaKha", "PaOuLa", "PaMaNa", "SaKaTa", "SaKaNa", "TaKaNa", "TaTaOu", "TaThaNa", "ThaPaKa", "ThaSaNa", "WaTaNa", "YaMaTha", "BaDaNa", "KaLaNa", "KaRaBa", "LaMaNa", "MaKaNa", "NaKaMa", "NaRaSa", "PaMaNa", "RaDaNa", "SaBaNa", "TaKaLa", "ThaKaLa", "YaKaTa"],
    "10": ["BaLaNa", "KhaSaNa", "KaMaYa", "KaHtaNa", "MaLaMa", "MaDaNa", "PaMaNa", "ThaPhaYa", "ThaHtaNa", "KhaZaNa", "LaMaNa", "YaMaNa", "BaRaDa", "KaLaNa", "KaRaBa", "LaMaNa", "MaKaNa", "NaKaMa", "NaRaSa", "PaMaNa", "RaDaNa", "SaBaNa", "TaKaLa", "ThaKaLa", "YaKaTa"],
    "11": ["AaMaNa", "BaThaTa", "GaMaNa", "KaPhaNa", "KaTaNa", "MaAhNa", "MaTaNa", "MaPaNa", "MaOuNa", "MaPaTa", "PaTaNa", "PaNaKa", "SaTaNa", "TaKaNa", "ThaTaNa", "YaBaNa", "YaThaTa", "BaLaNa", "DaNaMa", "KaBaNa", "KaRaBa", "LaBaNa", "LaYaKa", "MaMaNa", "NaKaMa", "NaRaSa", "PaBaNa", "SaKaNa", "TaLaMa", "YaKaLa"],
    "12": ["AaLaNa", "AhSaNa", "BaHaNa", "BaTaHta", "DaGaMa", "DaGaNa", "DaGaTa", "DaGaYa", "DaLaNa", "DaPaNa", "DaSaKa", "HtaTaPa", "KaKaKa", "KaKhaKa", "KaMaTa", "KaMaNa", "KaMaYa", "KaTaTa", "KaTaNa", "KhaYaNa", "LaKaNa", "LaMaNa", "LaMaTa", "LaThaNa", "LaThaYa", "MaBaNa", "MaGaDa", "MaGaTa", "MaYaKa", "OuKaMa", "OuKaTa", "PaBaTa", "PaZaDa", "SaKaKha", "SaKaNa", "SaKhaNa", "TaKaNa", "TaMaNa", "TaTaHta", "TaTaNa", "ThaKaTa", "ThaKhaNa", "ThaGaKa", "ThaLaNa", "YaKaNa", "YaPaKa", "YaPaTha"],
    "13": ["HaPaTa", "HaPaNa", "KaLaNa", "KaLaTa", "KaHaNa", "KaThaNa", "KaTaTa", "KaTaNa", "KaMaNa", "KaKhaNa", "LaYaNa", "LaKaNa", "LaKhaTa", "LaKhaNa", "LaLaNa", "MaBaNa", "MaKaNa", "MaKhaNa", "MaPHaNa", "MaPaTa", "MaSaNa", "MaYaNa", "MaYaTa", "MaTaTa", "MaMaTa", "MaNaNa", "MaKaNa", "MaSaTa", "NaMaTa", "NaKhaNa", "NaSaNa", "NaPaNa", "NaKhaTa", "NyaYaNa", "PhaKhaNa", "PaLaNa", "PaTaYa", "SaSaNa", "YaNyaNa", "TaYaNa", "TaMaNya", "TaKhaLa", "TaLaNa", "TaKaNa", "ThaNaNa", "ThaPaNa", "YaNgaNa", "YaSaNa", "AhPaNa", "AhTaNa", "AhTaYa", "HaHaNa", "HaMaNa", "KaLaHta", "KaLaNa", "MaHtaNa", "MaKhaTa", "MaNgaNa", "MaPhaHta", "NaTaYa", "PaPaKa", "PaWaNa", "TaTaNa"],
    "14": ["BaKaLa", "DaNaPha", "DaDaYa", "PaThaYa", "AhMaNa", "HaKaKa", "HaThaTa", "AhGaPa", "KaNaNa", "KaLaNa", "KaKhaNa", "KaKaNa", "KaPaNa", "LaPaTa", "LaMaNa", "MaAhPa", "MaMaKa", "MaAhaNa", "MaMaNa", "NgaPaTa", "NgaThaKha", "NyaTaNa", "PaTaNa", "PhaPaNa", "ThaPaNa", "WaKhaMa", "PaThaNa", "YaKaNa", "ZaLaNa", "KaKaHta", "AhMaTa", "NgaYaKa", "PaSaLa", "YaThaYa"]
  };

  const citizenTypes = [
    { value: "(နိုင်)", label: "နိုင်" },
    { value: "(ဧည့်)", label: "ဧည့်" },
    { value: "(ပြု)", label: "ပြု" },
    { value: "(သာသနာ)", label: "သာသနာ" },
    { value: "(ယာယီ)", label: "ယာယီ" }
  ];

  // NRC Assembly function
  const assembleNRC = () => {
    const { state, township, citizen, number } = form.client.nrc;
    if (state && township && citizen && number) {
      return `${state}/${township}${citizen}${number}`;
    }
    return "";
  };

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
      
      // NRC Validation
      if (!form.client.nrc.state) e.nrcState = "State/Region is required.";
      if (!form.client.nrc.township) e.nrcTownship = "Township is required.";
      if (!form.client.nrc.citizen) e.nrcCitizen = "Citizen type is required.";
      if (!form.client.nrc.number.trim()) {
        e.nrcNumber = "NRC number is required.";
      } else if (!/^[0-9]{6}$/.test(form.client.nrc.number)) {
        e.nrcNumber = "NRC number must be exactly 6 digits.";
      }
      
      if (!form.client.email.trim()) e.email = "Email is required.";
      if (!form.client.phone.trim()) {
        e.phone = "Phone Number is required.";
      } else {
        const phoneDigits = form.client.phone.replace(/\D/g, '');
        if (phoneDigits.length < 7) {
          e.phone = "Phone number must be at least 7 digits.";
        } else if (phoneDigits.length > 10) {
          e.phone = "Phone number cannot exceed 10 digits.";
        }
      }
      if (form.client.dob) {
        const dob = new Date(form.client.dob);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
        
        if (actualAge < 18) {
          e.dob = "Must be at least 18 years old to use our legal services.";
        } else if (actualAge > 100) {
          e.dob = "Please enter a valid date of birth.";
        }
      }
    }
    if (stepIndex === 1) {
      if (!form.case.title.trim()) e.title = "Case Title is required.";
      if (!form.case.category) e.category = "Please select a case category.";
      if (!form.case.description.trim()) e.description = "Case Description is required.";
      if (form.case.incidentDate) {
        const incidentDate = new Date(form.case.incidentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        incidentDate.setHours(0, 0, 0, 0);
        
        if (incidentDate > today) {
          e.incidentDate = "Incident date cannot be in the future.";
        }
      }
    }
    if (stepIndex === 3) {
      if (form.consultation.date) {
        const consultationDate = new Date(form.consultation.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        consultationDate.setHours(0, 0, 0, 0);
        
        if (consultationDate <= today) {
          e.consultationDate = "Consultation date must be in the future.";
        }
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setAttempted(true);
    if (Object.keys(errors).length > 0) return;

    // Execute submit logic if valid
    if (stepIndex !== STEPS.length - 1) {
        next();
        return;
    }

    try {
      setSubmitting(true);

      const uploadedDocs: { key: string; name: string; size: number; type: string }[] = [];
      for (const f of docFiles) {
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

        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
          },
          body: f,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed for ${f.name}`);
        }

        uploadedDocs.push({
          key,
          name: f.name,
          size: f.size,
          type: contentType,
        });
      }

      // Attach client ID if available
      const payload = {
          client: {
              ...form.client,
              id: userData?.id || userData?._id, // Add user ID to link case
              idNumber: assembleNRC(), // Use assembled NRC as idNumber
              // Keep individual NRC parts for backend storage
              nrcState: form.client.nrc.state,
              nrcTownship: form.client.nrc.township,
              nrcCitizen: form.client.nrc.citizen,
              nrcNumber: form.client.nrc.number
          },
          clientId: userData?.id || userData?._id || userData?.email, // Helper for direct lookup
          case: form.case,
          consultation: form.consultation,
          acknowledgements: form.acknowledgements,
          documents: uploadedDocs,
      };

      const res = await fetch("/api/case-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setDocFiles([]);
      // Reset form... (simplification)
      alert("Case request submitted successfully. Redirecting to dashboard...");
      
      // Navigate to My Cases view
      if (onNavigate) {
          onNavigate("my-cases");
      } else {
          router.push("/dashboard?view=my-cases");
      }
      
    } catch (err: any) {
      alert(
        err?.message ||
          "Sorry, there was a problem submitting your request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex-1 w-full min-w-0 min-h-screen bg-[#efefec] py-12 px-4 selection:bg-slate-200 overflow-y-scroll"
      style={{
        scrollbarGutter: "stable",
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
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Date of Birth</label>
                        <input 
                          type="date"
                          className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent"
                          value={form.client.dob}
                          onChange={(e) => setForm({...form, client: {...form.client, dob: e.target.value}})}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                          min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                        />
                        {attempted && errors.dob && (
                          <p className="text-xs text-red-600 mt-1">{errors.dob}</p>
                        )}
                      </div>
                      <div className="group relative">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">Phone Number</label>
                        <div className="relative">
                          <span className="absolute left-0 top-2 text-slate-600 text-sm">+95</span>
                          <input 
                            className="w-full border-b border-slate-300 py-2 pl-10 focus:border-slate-900 outline-none transition-colors bg-transparent text-sm"
                            placeholder="9xxxxxxxxx"
                            value={form.client.phone}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setForm({...form, client: {...form.client, phone: value}});
                            }}
                          />
                        </div>
                        {attempted && errors.phone && (
                          <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                        )}
                      </div>
                      <div className="group relative sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-slate-500 group-focus-within:text-amber-700 transition-colors">National Registration Card (NRC)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                          {/* State/Region Dropdown */}
                          <select 
                            className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent text-sm"
                            value={form.client.nrc.state}
                            onChange={(e) => setForm({
                              ...form, 
                              client: {
                                ...form.client, 
                                nrc: { ...form.client.nrc, state: e.target.value, township: "" }
                              }
                            })}
                          >
                            <option value="">State</option>
                            {[...Array(14)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          
                          {/* Township Dropdown (dynamically populated) */}
                          <select 
                            className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent text-sm"
                            value={form.client.nrc.township}
                            onChange={(e) => setForm({
                              ...form, 
                              client: {
                                ...form.client, 
                                nrc: { ...form.client.nrc, township: e.target.value }
                              }
                            })}
                            disabled={!form.client.nrc.state}
                          >
                            <option value="">Township</option>
                            {form.client.nrc.state && nrcTownships[form.client.nrc.state as keyof typeof nrcTownships]?.map((township) => (
                              <option key={township} value={township}>{township}</option>
                            ))}
                          </select>
                          
                          {/* Citizen Type Dropdown */}
                          <select 
                            className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent text-sm"
                            value={form.client.nrc.citizen}
                            onChange={(e) => setForm({
                              ...form, 
                              client: {
                                ...form.client, 
                                nrc: { ...form.client.nrc, citizen: e.target.value }
                              }
                            })}
                          >
                            <option value="">Citizen</option>
                            {citizenTypes.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          
                          {/* 6-digit Number Input */}
                          <input 
                            type="text"
                            placeholder="NRC No"
                            className="w-full border-b border-slate-300 py-2 focus:border-slate-900 outline-none transition-colors bg-transparent font-mono text-sm"
                            value={form.client.nrc.number}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setForm({
                                ...form, 
                                client: {
                                  ...form.client, 
                                  nrc: { ...form.client.nrc, number: value }
                                }
                              });
                            }}
                          />
                        </div>
                        
                        {/* NRC Error Display */}
                        <div className="mt-1 space-y-1">
                          {attempted && errors.nrcState && (
                            <p className="text-xs text-red-600">{errors.nrcState}</p>
                          )}
                          {attempted && errors.nrcTownship && (
                            <p className="text-xs text-red-600">{errors.nrcTownship}</p>
                          )}
                          {attempted && errors.nrcCitizen && (
                            <p className="text-xs text-red-600">{errors.nrcCitizen}</p>
                          )}
                          {attempted && errors.nrcNumber && (
                            <p className="text-xs text-red-600">{errors.nrcNumber}</p>
                          )}
                        </div>
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
                          max={new Date().toISOString().split('T')[0]}
                        />
                        {attempted && errors.incidentDate && (
                          <p className="text-xs text-red-600 mt-1">{errors.incidentDate}</p>
                        )}
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
                        <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
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
                          min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                        />
                        {attempted && errors.consultationDate && (
                          <p className="text-xs text-red-600 mt-1">{errors.consultationDate}</p>
                        )}
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
                          <div><span className="text-slate-500">NRC:</span> {assembleNRC() || "—"}</div>
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
                    type={stepIndex === STEPS.length - 1 ? "submit" : "button"}
                    onClick={stepIndex === STEPS.length - 1 ? undefined : next}
                    disabled={submitting}
                    className="bg-slate-900 px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-amber-700 transition-all shadow-lg active:scale-95"
                  >
                    {submitting
                      ? "Submitting..."
                      : stepIndex === STEPS.length - 1
                        ? "Execute Submission"
                        : "Continue to Next Section"}
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
