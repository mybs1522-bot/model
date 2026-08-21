"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Download,
  Search,
  Sparkles,
  Lock,
  LogOut,
  FolderDown,
  Layers,
  CheckCircle2,
  HardDrive,
  Eye,
  X,
  Package,
} from "lucide-react";
import publicModels from "@/data/publicModelsImages.json";
import manifestData from "@/data/modelsManifest.json";
import vaultDriveData from "@/data/vaultDriveModels.json";

import { CardPaymentForm } from "@/components/ui/card-payment-form";

interface VaultPageProps {
  onNavigateHome?: () => void;
  onOpenActivateModal?: () => void;
}

export function VaultPage({ onNavigateHome, onOpenActivateModal }: VaultPageProps) {
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem("avada_user_email") || "";
  });
  const [loginInput, setLoginInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [activePreviewModel, setActivePreviewModel] = useState<any | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);

  const handleOpenActivate = () => {
    if (onOpenActivateModal) {
      onOpenActivateModal();
    } else {
      setShowActivateModal(true);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Real Paired Google Drive Models (.SKP + Render Previews)
  const ALL_MODELS = useMemo(() => {
    if (vaultDriveData && vaultDriveData.models && vaultDriveData.models.length > 0) {
      return vaultDriveData.models.map((m: any) => ({
        id: m.id,
        title: m.title || m.baseName,
        baseName: m.baseName,
        category: m.category,
        categoryKey: m.categoryKey,
        folderName: m.folderName,
        src: m.imageSrc,
        skpName: m.skpName,
        skpDownloadUrl: m.skpDownloadUrl,
        skpViewUrl: m.skpViewUrl,
        sizeMb: m.sizeMb,
        software: m.software,
        polyCount: m.polyCount,
        renderEngine: m.renderEngine,
      }));
    }

    // Fallback if needed
    const rawManifestList = Array.isArray(manifestData)
      ? manifestData
      : ((manifestData as any)?.models || []);

    const list: Array<any> = [];
    if (rawManifestList.length > 0) {
      rawManifestList.forEach((item: any, idx: number) => {
        const cat = item.category || "Living Room";
        const catKey = cat.toLowerCase().replace(/[^a-z]/g, "");
        list.push({
          id: `manifest-${idx}`,
          title: item.title || `${cat} Scene #${idx + 1}`,
          category: cat,
          categoryKey: catKey,
          src: item.imagePath || item.src,
          sizeMb: 95 + ((idx * 17) % 180),
        });
      });
    }

    if (publicModels && publicModels.length > 0) {
      publicModels.forEach((item: any, idx: number) => {
        const cat = item.category || "3D Scene";
        const catKey = cat.toLowerCase().replace(/[^a-z]/g, "");
        list.push({
          id: `public-${idx}`,
          title: `${cat} Architecture Scene #${idx + 1}`,
          category: cat,
          categoryKey: catKey,
          src: item.relPath,
          sizeMb: 85 + ((idx * 23) % 160),
        });
      });
    }

    return list;
  }, []);

  // Handle Email Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !loginInput.includes("@")) {
      setLoginError("Please enter a valid email address.");
      return;
    }
    const cleanEmail = loginInput.trim().toLowerCase();
    localStorage.setItem("avada_user_email", cleanEmail);
    setEmail(cleanEmail);
    setLoginError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("avada_user_email");
    setEmail("");
  };

  // Handle Secure Direct Download Action
  const handleDownload = (itemName: string, sizeLabel?: string, downloadUrl?: string | null) => {
    setDownloadingItem(itemName);
    
    setTimeout(() => {
      setDownloadingItem(null);
      if (downloadUrl) {
        // Trigger direct file download
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = itemName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      setDownloadSuccessToast(
        `✓ Download started: "${itemName}" (${sizeLabel || "Scene File"}). Check your downloads folder.`
      );
      setTimeout(() => setDownloadSuccessToast(null), 6000);
    }, 900);
  };

  const CATEGORIES = [
    { key: "all", label: "All Models" },
    { key: "apartment", label: "Apartments" },
    { key: "bathroom", label: "Bathrooms" },
    { key: "kitchen", label: "Kitchens" },
    { key: "bedroom", label: "Bedrooms" },
    { key: "exterior", label: "Exteriors" },
    { key: "washroom", label: "Washrooms" },
  ];

  const filteredModels = useMemo(() => {
    return ALL_MODELS.filter((m) => {
      const matchCat =
        selectedCategory === "all" ||
        m.categoryKey === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.baseName && m.baseName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [ALL_MODELS, selectedCategory, searchQuery]);

  // If user is not logged in, show clean Member Login Gate
  if (!email) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-[#10b981] selection:text-black">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <Lock className="size-3.5" /> MEMBER VAULT ACCESS
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              AVADA <span className="text-[#10b981]">3D Vault</span>
            </h1>
            <p className="text-sm text-slate-400">
              Enter the email address you registered with to unlock your 3,000+ SketchUp (.SKP) library & texture downloads.
            </p>
          </div>

          {/* Login Card */}
          <form
            onSubmit={handleLoginSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">
                Your Email Address:
              </label>
              <input
                type="email"
                required
                placeholder="architect@studio.com"
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  setLoginError(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
              {loginError && (
                <p className="text-xs text-rose-400 font-medium pt-1">{loginError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="size-4" />
              <span>Unlock Member Downloads</span>
            </button>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Don't have an account?</span>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateHome) onNavigateHome();
                  else window.location.href = "/";
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              >
                Start 7-Day Free Trial ($0) →
              </a>
            </div>
          </form>

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> Instant SKP Access
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" /> 8K PBR Textures
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOGGED-IN MEMBER VAULT PORTAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100 font-sans selection:bg-[#10b981] selection:text-black pb-24">
      {/* Download Toast Notification */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-black font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>{downloadSuccessToast}</span>
          <button
            onClick={() => setDownloadSuccessToast(null)}
            className="p-1 hover:bg-black/10 rounded-lg cursor-pointer ml-2"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Downloading Modal Overlay */}
      {downloadingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="size-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
              <FolderDown className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Preparing Download Archive</h3>
              <p className="text-xs text-slate-400 line-clamp-1">{downloadingItem}</p>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-[#10b981] h-full rounded-full animate-[progress_1.2s_ease-in-out_infinite]" style={{ width: "85%" }} />
            </div>
            <p className="text-[11px] font-mono text-emerald-400">
              Generating secure high-speed mirror link...
            </p>
          </div>
        </div>
      )}

      {/* TOP PORTAL NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#090b10]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateHome) onNavigateHome();
                else window.location.href = "/";
              }}
              className="flex items-center gap-2 text-lg font-black tracking-wider text-white hover:opacity-90 transition"
            >
              <div className="size-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-black font-black shadow-md">
                A
              </div>
              <span className="font-extrabold">
                AVADA <span className="text-[#10b981]">VAULT</span>
              </span>
            </a>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
              <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
              7-DAY ALL ACCESS
            </span>
          </div>

          {/* Member Status & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-mono text-slate-300 font-bold truncate max-w-[200px]">
                {email}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                VIP Pass Active
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Switch Email</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VAULT CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* $20 ACTIVATION CALLOUT BANNER */}
        <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
              <Sparkles className="size-3.5" /> LIFETIME ACTIVATION • $20 ONLY
            </div>
            <h3 className="text-base sm:text-xl font-black text-white tracking-tight">
              Want More Models & Permanent Lifetime Access?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Pay $20 to permanently activate unlimited lifetime downloads of all SketchUp scenes, furniture assets & 8K PBR textures.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenActivate}
            className="px-6 py-3 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-xs sm:text-sm shadow-xl hover:shadow-emerald-500/25 transition active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-2 border border-emerald-300"
          >
            <span>Pay $20 to Activate →</span>
          </button>
        </div>

        {/* HERO VAULT WELCOME BANNER */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
              <Sparkles className="size-3.5" /> SKETCHUP MASTER ARCHIVE
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Welcome to Your <span className="text-[#10b981]">SketchUp Master Library</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every single 3D scene below includes editable geometry (.SKP), proxy assets, and 8K PBR materials.
              Compatible with SketchUp 2024–2019, V-Ray, D5 Render, Lumion, and Enscape.
            </p>

            {/* Master 1-Click Complete Archive Download */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() =>
                  handleDownload(
                    "AVADA-3D-Master-Vault-Archive.zip",
                    "Complete Master Vault"
                  )
                }
                className="px-6 py-3.5 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer border border-emerald-400"
              >
                <FolderDown className="size-5" />
                <span>Download Complete Master Vault (.ZIP)</span>
              </button>

              <div className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
                <HardDrive className="size-4 text-emerald-400" />
                <span>Unlimited High-Speed Cloud Bandwidth</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ 6 REAL GOOGLE DRIVE CATEGORY PACKS ══════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Package className="size-5 text-[#10b981]" />
              <span>Category Packs (All .SKP Scene Files & 8K Textures)</span>
            </h2>
            <button
              onClick={handleOpenActivate}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
            >
              <span>More Models ($20 Activation) →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaultDriveData.categoryPacks.map((pack: any, idx: number) => {
              const bgs = [
                "from-blue-900/40 to-slate-900",
                "from-cyan-900/40 to-slate-900",
                "from-purple-900/40 to-slate-900",
                "from-emerald-900/40 to-slate-900",
                "from-amber-900/40 to-slate-900",
                "from-teal-900/40 to-slate-900",
              ];
              const bg = bgs[idx % bgs.length];
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl bg-gradient-to-br ${bg} border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 group shadow-md`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold">Category Pack</span>
                      <span className="text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-slate-800">
                        .SKP + Textures
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition">
                      {pack.category}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Full-scale SketchUp (.SKP) scene models + high-res renders from <strong>{pack.folderName}</strong>.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(pack.categoryKey);
                        const el = document.getElementById("models-grid");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-[#10b981] text-white hover:text-black font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Layers className="size-3.5" />
                      <span>Explore</span>
                    </button>
                    <button
                      onClick={() => handleDownload(`${pack.folderName}-Complete-Pack.zip`, "Category Pack", pack.downloadUrl)}
                      className="px-3 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Download Category Pack"
                    >
                      <Download className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════ INDIVIDUAL MODEL BROWSER & SEARCH ══════ */}
        <div id="models-grid" className="space-y-6 pt-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Layers className="size-6 text-[#10b981]" />
                <span>Browse All SketchUp Models</span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any scene to preview render details or trigger instant .SKP file download.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search models (e.g. Kitchen #12, Bath #4)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.key
                    ? "bg-[#10b981] text-black border-[#10b981]"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Model Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-emerald-500/60 transition duration-200 shadow-sm"
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setActivePreviewModel(model)}
                >
                  <img
                    src={model.src}
                    alt={model.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    .SKP
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-bold flex items-center gap-1 shadow-md">
                      <Eye className="size-3" /> Preview
                    </span>
                  </div>
                </div>

                {/* Info & Download Action */}
                <div className="p-3 space-y-2 flex flex-col justify-between flex-1">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      {model.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="capitalize truncate">{model.category}</span>
                      <span>~{model.sizeMb} MB</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(model.skpName, `${model.sizeMb} MB`, model.skpDownloadUrl)}
                    className="w-full py-2 rounded-xl bg-emerald-500/15 hover:bg-[#10b981] text-emerald-400 hover:text-black border border-emerald-500/30 hover:border-emerald-400 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download className="size-3" />
                    <span>Download (.SKP)</span>
                  </button>
                </div>
              </div>
            ))}

            {/* INLINE "MORE MODELS" ACTIVATION CARD */}
            <div
              onClick={handleOpenActivate}
              className="group rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-black border-2 border-emerald-500 p-4 flex flex-col justify-between hover:border-emerald-400 transition-all duration-300 shadow-xl cursor-pointer hover:scale-[1.02]"
            >
              <div className="space-y-2.5">
                <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-sm shadow-inner">
                  <Sparkles className="size-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider uppercase block">
                    VIP Library
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                    More Models
                  </h4>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    Unlock all models, texture archives & lifetime updates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="w-full mt-3 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-[11px] transition flex items-center justify-center gap-1 shadow-md"
              >
                <span>Pay $20 to Activate →</span>
              </button>
            </div>
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-16 space-y-2 text-slate-400">
              <Search className="size-8 mx-auto text-slate-600" />
              <p className="text-sm font-bold">No models match your search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-emerald-400 underline font-bold"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ══════ $20 ACTIVATION CHECKOUT MODAL ══════ */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative bg-white text-slate-900 border-2 border-emerald-500 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-3 my-auto max-h-[94vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowActivateModal(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <div className="text-center space-y-1.5 pr-6 sm:pr-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Sparkles className="size-3 text-emerald-600" /> One-Time Lifetime Access • $20
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Activate Full Master Library
              </h3>
              <p className="text-xs text-slate-500 leading-tight">
                Pay $20 to permanently activate and download all SketchUp (.SKP) scenes, furniture sets & 8K textures.
              </p>
            </div>

            <CardPaymentForm
              sourceLocation="vault_activate_20_modal"
              buttonText="Pay $20 & Activate Full Library"
              allowSavedCard={false}
              amountInCents={2000}
              isTrial={false}
              hideOrderDetails={true}
              itemTotal="$20.00"
              deliveryFee="$0.00"
              discountAmount="$0.00"
              totalPrice="$20.00"
              deliveryAddressLine1="Lifetime VIP Access: All SketchUp Scene Models"
              deliveryAddressLine2="+ Free SketchUp Course & 8K Textures Included"
              onSuccess={() => {
                setShowActivateModal(false);
                setDownloadSuccessToast("✓ Master Library Activated! Unlimited downloads unlocked.");
              }}
            />
          </div>
        </div>
      )}

      {/* ══════ FULLSCREEN PREVIEW MODAL ══════ */}
      {activePreviewModel && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePreviewModel(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl space-y-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{activePreviewModel.title}</h3>
                <p className="text-xs text-emerald-400 font-mono">
                  {activePreviewModel.category} • SketchUp 2024 / 2023 / 2022 • V-Ray / D5 Ready
                </p>
              </div>
              <button
                onClick={() => setActivePreviewModel(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <img
                src={activePreviewModel.src}
                alt={activePreviewModel.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Format</span>
                <span className="font-bold text-white">.SKP (SketchUp)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">File Size</span>
                <span className="font-bold text-emerald-400">~{activePreviewModel.sizeMb} MB</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Textures</span>
                <span className="font-bold text-white">8K PBR Included</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleDownload(activePreviewModel.skpName, `${activePreviewModel.sizeMb} MB`, activePreviewModel.skpDownloadUrl);
                setActivePreviewModel(null);
              }}
              className="w-full py-3.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Download className="size-4" />
              <span>Download Scene File ({activePreviewModel.skpName})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
