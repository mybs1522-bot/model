"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  FolderArchive,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  FileBox,
  HardDrive,
  Cloud,
} from "lucide-react";
import publicModels from "@/data/publicModelsImages.json";

interface SuccessPageProps {
  plan?: "starter" | "vip";
  onNavigateHome?: () => void;
  onNavigateUpsell?: () => void;
}

export function SuccessPage({
  plan = "starter",
  onNavigateHome,
  onNavigateUpsell,
}: SuccessPageProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const email = localStorage.getItem("avada_user_email") || "your-email@example.com";
  const isVip = plan === "vip";

  const starterModels = publicModels.slice(0, 20);

  // Cloud Mirror Links
  const starterDownloadUrl = import.meta.env.VITE_STARTER_DOWNLOAD_URL || "https://drive.google.com/drive/u/0/folders/1n8fSTVtySXMHbPd1nhlqA6yIijNqrqUK";
  const vipMasterDownloadUrl = import.meta.env.VITE_VIP_DOWNLOAD_URL || "https://drive.google.com/drive/u/0/folders/1n8fSTVtySXMHbPd1nhlqA6yIijNqrqUK";

  const handleCopyAccessKey = () => {
    navigator.clipboard.writeText(`AVADA-VIP-${email.split("@")[0].toUpperCase()}-2026`);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleDownloadFile = (filename: string, fallbackUrl?: string) => {
    // Triggers direct download
    const link = document.createElement("a");
    link.href = fallbackUrl || `/models/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-sans selection:bg-[#10b981] selection:text-black pb-20">
      {/* Top Brand Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateHome) onNavigateHome();
              else window.location.href = "/";
            }}
            className="flex items-center gap-2 text-lg font-black tracking-wider text-slate-900"
          >
            <div className="size-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-black font-black shadow-md">
              A
            </div>
            <span>AVADA <span className="text-[#10b981]">3D</span></span>
          </a>

          <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
            RECEIPT & DOWNLOAD READY
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-center">
        {/* Success Icon & Header */}
        <div className="space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-100/80 text-emerald-700 border-2 border-emerald-300 shadow-sm animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="size-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
              <Sparkles className="size-3.5 text-emerald-600" /> PAYMENT SUCCESSFUL
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              {isVip ? (
                <>🎉 Welcome to the <span className="text-[#10b981]">3,000+ Master Vault!</span></>
              ) : (
                <>🎉 Your <span className="text-[#10b981]">20 Models Starter Pack</span> is Ready!</>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              A confirmation receipt and cloud backup link have also been sent to{" "}
              <strong className="font-mono text-slate-900">{email}</strong>.
            </p>
          </div>
        </div>

        {/* ══════ MAIN DOWNLOAD ACTION CARD ══════ */}
        <div className="rounded-3xl bg-white border-2 border-emerald-500/60 p-6 sm:p-8 space-y-6 shadow-xl text-left max-w-2xl mx-auto relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-700">PACKAGE ACCESS</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {isVip ? "Complete Master Vault (.SKP)" : "20 Models Starter Bundle (.SKP)"}
              </h2>
              <p className="text-xs text-slate-500">Includes SketchUp scenes, 8K PBR textures & materials</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400">Total Paid</span>
              <div className="text-2xl font-black text-slate-900">{isVip ? "$29.00" : "$1.00"}</div>
            </div>
          </div>

          {/* Master Download Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={isVip ? vipMasterDownloadUrl : starterDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
            >
              <Download className="size-5" /> Download Full Archive (.ZIP - {isVip ? "18.5 GB" : "1.2 GB"}) <ExternalLink className="size-4 opacity-70" />
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={isVip ? vipMasterDownloadUrl : starterDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition shadow-2xs"
              >
                <Cloud className="size-4 text-emerald-600" /> Open Google Drive Folder
              </a>

              <button
                onClick={handleCopyAccessKey}
                className="py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer"
              >
                {copiedKey ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4 text-slate-500" />}
                <span>{copiedKey ? "Access Key Copied!" : "Copy VIP Access Key"}</span>
              </button>
            </div>
          </div>

          {/* License Badge */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Commercial License Included:</strong> You may edit, render, and sell client projects made with these models with zero royalties.
            </span>
          </div>
        </div>

        {/* ══════ IF VIP: FULL CATEGORY ARCHIVES ══════ */}
        {isVip && (
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-md text-left max-w-3xl mx-auto">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-black text-slate-900">Category Fast-Downloads (3,000+ Models)</h3>
              <p className="text-xs text-slate-500">Download specific room categories or grab the entire library</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "Apartments & Living", count: "450+ Scenes", size: "3.4 GB", path: "/models/Apartment" },
                { name: "Furniture & Decor", count: "1,200+ Models", size: "4.8 GB", path: "/models/Furniture" },
                { name: "Bedrooms & Suites", count: "500+ Scenes", size: "2.9 GB", path: "/models/Bedroom" },
                { name: "Washrooms & Bath", count: "380+ Scenes", size: "2.1 GB", path: "/models/Washroom" },
                { name: "Exteriors & Villas", count: "320+ Scenes", size: "3.1 GB", path: "/models/Exterior" },
                { name: "Kitchens & Dining", count: "250+ Scenes", size: "2.2 GB", path: "/models/Kitchen" },
              ].map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3 hover:border-emerald-500 transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs pb-1">
                      <span className="font-mono text-emerald-700 font-bold">{cat.count}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{cat.size}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                  </div>
                  <a
                    href={vipMasterDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl bg-white hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Download className="size-3.5" /> Download Folder
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ IF STARTER ($1): SHOW INDIVIDUAL 20 MODELS DOWNLOAD GRID ══════ */}
        {!isVip && (
          <div className="space-y-5 text-left max-w-4xl mx-auto pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Your 20 Included Models</h3>
                <p className="text-xs text-slate-500">Download files individually or use the master zip above</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                20 / 20 READY
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {starterModels.map((model, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <img src={model.relPath} alt={model.title || `Model ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-white/90 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-200 text-slate-800 shadow-2xs">
                      #{idx + 1}
                    </div>
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{model.title || model.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">SketchUp 2024 (.SKP)</p>
                    </div>
                    <a
                      href={model.relPath}
                      download={model.name}
                      className="w-full py-1.5 rounded-xl bg-slate-50 hover:bg-[#10b981] text-slate-800 hover:text-black font-bold text-[11px] border border-slate-200 hover:border-[#10b981] transition flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Download className="size-3" /> Download .SKP
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* UPGRADE TEASER BANNER */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl mt-8">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-wider">OPTIONAL UPGRADE</span>
                <h4 className="text-lg font-black">Want all 3,000+ models later?</h4>
                <p className="text-xs text-slate-300">Upgrade to the complete master library anytime for just $29.</p>
              </div>
              <button
                onClick={() => {
                  if (onNavigateUpsell) onNavigateUpsell();
                  else window.location.href = "/#more";
                }}
                className="px-6 py-3 rounded-full bg-[#10b981] hover:bg-[#059669] text-black font-black text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition active:scale-95"
              >
                View 3,000+ Models Pass ($29) <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
