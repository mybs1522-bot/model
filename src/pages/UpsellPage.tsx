import { useState, useMemo, useEffect } from "react";
import { Pricing, useEvergreenTimer } from "@/components/ui/single-pricing-card-1";
import { SketchUpShowcaseVideo } from "@/components/ui/sketchup-showcase-video";
import { CategoryPostersSlider } from "@/components/ui/category-posters-slider";
import { CardPaymentForm } from "@/components/ui/card-payment-form";
import { RenderEngineTrustBanner } from "@/components/ui/render-engine-logos";
import {
  HeartIcon,
  CopiedIcon,
  DownloadDoneIcon,
} from "@/components/ui/animated-state-icons";
import manifestData from "@/data/modelsManifest.json";
import publicModels from "@/data/publicModelsImages.json";
import { chargeSavedCardUpsell } from "@/lib/stripe";
import {
  Building2,
  Bath,
  Bed,
  Home,
  Utensils,
  Droplets,
  Box,
  Sparkles,
  X,
  Zap,
  Timer,
  ShieldCheck,
  Eye,
  ArrowRight,
  Plus,
  Armchair,
  Check,
} from "lucide-react";

interface ModelItem {
  id: string;
  title: string;
  rawName: string;
  categoryKey: string;
  categoryName: string;
  subCategoryKey?: string;
  src: string;
  renderEngine: string;
  format: string;
  polyCount: string;
  fileSize: string;
  featured: boolean;
}

interface CategoryMeta {
  name: string;
  key: string;
  icon: string;
  countDisplay: string;
}

interface SubCategoryMeta {
  name: string;
  key: string;
  countDisplay: string;
}

const CATEGORIES: CategoryMeta[] = [
  { name: "Apartments", key: "apartment", icon: "Building2", countDisplay: "960+" },
  { name: "Furniture", key: "furniture", icon: "Armchair", countDisplay: "1,450+" },
  { name: "Washrooms", key: "washroom", icon: "Droplets", countDisplay: "1,180+" },
  { name: "Bedrooms", key: "bedroom", icon: "Bed", countDisplay: "350+" },
  { name: "Exteriors", key: "exterior", icon: "Home", countDisplay: "250+" },
  { name: "Kitchens", key: "kitchen", icon: "Utensils", countDisplay: "1,020+" },
];

const FURNITURE_SUBCATEGORIES: SubCategoryMeta[] = [
  { name: "All Furniture", key: "all-furniture", countDisplay: "1,450+" },
  { name: "Sofas & Lounges", key: "sofas", countDisplay: "340+" },
  { name: "Chairs & Armchairs", key: "chairs", countDisplay: "280+" },
  { name: "Tables & Desks", key: "tables", countDisplay: "310+" },
  { name: "Beds & Headboards", key: "beds", countDisplay: "190+" },
  { name: "Cabinets & Shelving", key: "cabinets", countDisplay: "180+" },
  { name: "Lighting Fixtures", key: "lighting", countDisplay: "150+" },
];

const DEDICATED_FURNITURE: ModelItem[] = [
  {
    id: "furn_sofa_1",
    title: "Scandinavian Cloud Modular Sectional",
    rawName: "SOFA_CLOUD_SECTIONAL_001.SKP",
    categoryKey: "furniture",
    categoryName: "Furniture",
    subCategoryKey: "sofas",
    src: "/gallery-renders/render_1.jpg",
    renderEngine: "V-Ray 6",
    format: "SketchUp (.SKP)",
    polyCount: "145,000 Polys",
    fileSize: "68 MB",
    featured: true,
  },
  {
    id: "furn_table_1",
    title: "Minimalist Live-Edge Walnut Dining Table",
    rawName: "TABLE_WALNUT_DINING_001.SKP",
    categoryKey: "furniture",
    categoryName: "Furniture",
    subCategoryKey: "tables",
    src: "/gallery-renders/render_2.jpg",
    renderEngine: "D5 Render",
    format: "SketchUp (.SKP)",
    polyCount: "115,000 Polys",
    fileSize: "52 MB",
    featured: true,
  },
  {
    id: "furn_chair_2",
    title: "Ergonomic Bouclé Accent Armchair",
    rawName: "CHAIR_BOUCLE_ARM_002.SKP",
    categoryKey: "furniture",
    categoryName: "Furniture",
    subCategoryKey: "chairs",
    src: "/gallery-renders/render_3.jpg",
    renderEngine: "Enscape 3.5",
    format: "SketchUp (.SKP)",
    polyCount: "84,000 Polys",
    fileSize: "41 MB",
    featured: false,
  },
  {
    id: "furn_more_1",
    title: "Architectural Travertine Console & Mirror",
    rawName: "CONSOLE_TRAVERT_001.SKP",
    categoryKey: "furniture",
    categoryName: "Furniture",
    subCategoryKey: "cabinets",
    src: "/gallery-renders/render_4.jpg",
    renderEngine: "V-Ray 6",
    format: "SketchUp (.SKP)",
    polyCount: "92,000 Polys",
    fileSize: "47 MB",
    featured: true,
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Bath,
  Bed,
  Home,
  Utensils,
  Droplets,
  Box,
  Armchair,
};

interface UpsellPageProps {
  onSkipToStarter?: () => void;
  onSuccessVIP?: () => void;
  onSkip?: () => void;
}

export function UpsellPage({ onSkipToStarter, onSuccessVIP, onSkip }: UpsellPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all-furniture");
  const [visibleCount, setVisibleCount] = useState(6);
  const [likedModels, setLikedModels] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const countdown = useEvergreenTimer();

  const handleSkipAction = () => {
    localStorage.removeItem("avada_just_bought_1dollar");
    if (onSkipToStarter) onSkipToStarter();
    else if (onSkip) onSkip();
    else window.location.href = "/#success-starter";
  };

  const handleUpgradeAction = async () => {
    setIsUpgrading(true);
    try {
      await chargeSavedCardUpsell(2900);
      localStorage.removeItem("avada_just_bought_1dollar");
      if (onSuccessVIP) onSuccessVIP();
      else window.location.href = "/#success-vip";
    } catch (err: any) {
      console.error("Upsell charging error:", err);
      // Fallback: If 1-click fails (e.g. no card saved or testing fresh incognito), open modal
      setShowSubscriptionModal(true);
    } finally {
      setIsUpgrading(false);
    }
  };

  // Build ALL_MODELS from manifest + dedicated furniture (same as App)
  const ALL_MODELS: ModelItem[] = useMemo(() => {
    const rawManifestList = Array.isArray(manifestData)
      ? manifestData
      : ((manifestData as any)?.models || []);

    const scannedModels: ModelItem[] = rawManifestList.map((model: any) => {
      let categoryKey = (model.categoryKey || model.folder || "apartment").toLowerCase();
      if (categoryKey === "bathroom") categoryKey = "washroom";
      const categoryName = model.categoryName || (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1));
      const src = model.src || model.imagePath || model.relPath || "/placeholder.jpg";
      const rawName = model.rawName || model.fileName || `${categoryName}_MODEL.SKP`;
      const title = model.title || rawName.replace(/_/g, " ").replace(/\.\w+$/, "");

      return {
        id: model.id || `${categoryKey}_${rawName}`,
        title,
        rawName,
        categoryKey,
        categoryName,
        subCategoryKey: model.subCategoryKey,
        src,
        renderEngine: model.renderEngine || "V-Ray 6",
        format: model.format || "SketchUp (.SKP)",
        polyCount: model.polyCount || "~120K Polys",
        fileSize: model.fileSize || "~55 MB",
        featured: Boolean(model.featured),
      };
    });

    const extraPublicModels: ModelItem[] = (publicModels as any[]).map((m: any, idx: number) => {
      const catKey = (m.category || "apartment").toLowerCase();
      const categoryKey = catKey === "bathroom" ? "washroom" : catKey;
      const categoryName = categoryKey === "washroom" ? "Washrooms" : (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1));
      const src = m.relPath || `/models/${m.category}/${m.name}`;
      const title = `${categoryName} Model #${idx + 1}`;
      const rawName = m.name || `${categoryName}_${idx + 1}.SKP`;

      return {
        id: `public_${categoryKey}_${idx}`,
        title,
        rawName,
        categoryKey,
        categoryName,
        subCategoryKey: categoryKey === "bedroom" ? "beds" : undefined,
        src,
        renderEngine: "V-Ray 6",
        format: "SketchUp (.SKP)",
        polyCount: "~140K Tris",
        fileSize: "28 MB",
        featured: false,
      };
    });

    return [...scannedModels, ...DEDICATED_FURNITURE, ...extraPublicModels];
  }, []);

  const filteredModels = useMemo(() => {
    return ALL_MODELS.filter((model) => {
      const matchesCategory =
        selectedCategory === "all" || model.categoryKey === selectedCategory;

      const matchesSubCategory =
        selectedCategory !== "furniture" ||
        selectedSubCategory === "all-furniture" ||
        model.subCategoryKey === selectedSubCategory;

      return matchesCategory && matchesSubCategory;
    });
  }, [ALL_MODELS, selectedCategory, selectedSubCategory]);

  const visibleModels = filteredModels.slice(0, visibleCount);
  const hasMore = visibleCount < filteredModels.length;

  const modelsByCategory = useMemo(() => {
    const map: Record<string, ModelItem[]> = {
      apartment: [],
      furniture: [],
      washroom: [],
      bedroom: [],
      exterior: [],
      kitchen: [],
    };
    ALL_MODELS.forEach((m) => {
      if (map[m.categoryKey]) {
        map[m.categoryKey].push(m);
      }
    });
    return map;
  }, [ALL_MODELS]);

  const toggleLikeModel = (id: string) => {
    setLikedModels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyLink = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleUpgrade = async () => {
    try {
      await chargeSavedCardUpsell(2900);
      localStorage.removeItem("avada_just_bought_1dollar");
      alert("🎉 Success! Your $29 Lifetime VIP Pass has been charged & activated. Access granted to 3,000+ SketchUp models!");
      if (onSuccessVIP) onSuccessVIP();
      else if (onSkip) onSkip();
      else if (onSkipToStarter) onSkipToStarter();
      else window.location.href = "/#success-vip";
    } catch (err: any) {
      console.error("Upsell charging error:", err);
      // If 1-click off-session fails, open the checkout modal with the card form
      setShowSubscriptionModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col font-sans selection:bg-[#10b981] selection:text-black">
      {/* RED URGENCY TOP BAR */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white font-black text-[11px] sm:text-sm py-3 px-4 text-center flex items-center justify-center gap-2 shadow-sm sticky top-0 z-[250]">
        <span className="flex size-2 rounded-full bg-white animate-ping" />
        <span>⚠️ ONE-TIME EXCLUSIVE OFFER — YOU WILL NOT SEE THIS PAGE AGAIN</span>
        <span className="flex size-2 rounded-full bg-white animate-ping" />
      </div>

      {/* Minimal Monochrome Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-8 z-[200]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 text-lg sm:text-xl font-black tracking-tight text-slate-900">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            AVADA <span className="text-[#10b981] font-extrabold">3D</span>
          </a>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#models-directory" className="hover:text-slate-900 transition">3D Models</a>
            <a href="#categories" className="hover:text-slate-900 transition">Categories</a>
            <a href="#pricing" className="hover:text-slate-900 transition">Pricing Pass</a>
          </nav>

          {/* Action CTA */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleUpgradeAction}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#10b981] text-black text-xs font-black hover:bg-[#059669] transition flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Zap className="size-3.5 fill-current" /> YES! Upgrade to $29 Pass
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION — UPSELL VERSION */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-6 space-y-6">
            {/* Success Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-sm font-bold text-emerald-800 shadow-2xs">
              <Check className="size-4 stroke-[3] text-emerald-600" /> Your $1 Payment for 20 Models Was Successful!
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-bold shadow-2xs">
              <Zap className="size-3.5 fill-current text-red-600" /> ONE-TIME OFFER — YOU WILL NOT SEE THIS AGAIN
            </div>

            <h1 className="text-[24px] sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Your 20 Models Are Ready! <br className="hidden sm:inline" />
              <span className="text-[#10b981]">Get All 3,000+ Models for Just $29</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Don't stop at 20 models. Unlock our complete master vault of 3,000+ SketchUp (.SKP) scenes, 8K PBR materials, and weekly new model drops — all for a one-time $29 payment.
            </p>

            <div className="flex flex-row items-center gap-2 sm:gap-4 pt-2 flex-nowrap w-full max-w-md">
              <button
                onClick={handleUpgradeAction}
                className="flex-1 px-3 sm:px-6 py-3.5 rounded-full bg-[#10b981] text-black font-black text-xs sm:text-sm shadow-md hover:bg-[#059669] transition flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Zap className="size-4 fill-current" /> YES! Unlock All 3,000+ Models ($29)
              </button>

              <button
                onClick={handleSkipAction}
                className="flex-1 px-3 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white text-slate-700 border border-slate-200 font-bold text-[11px] sm:text-xs hover:bg-slate-50 transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shadow-2xs"
              >
                No, I'll Skip <ArrowRight className="size-3.5 sm:size-4 text-slate-500" />
              </button>
            </div>

            {/* Works With D5 Render, V-Ray, Lumion Trust Banner */}
            <RenderEngineTrustBanner className="pt-2" />

            {/* Clean Minimal Stat Strip */}
            <div className="flex items-center gap-8 pt-6 border-t border-slate-200 text-xs">
              <div>
                <div className="text-xl font-black text-slate-900">3,000+</div>
                <div className="text-slate-500 font-medium">3D Scenes</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-xl font-black text-slate-900">6</div>
                <div className="text-slate-500 font-medium">Categories</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-xl font-black text-slate-900">8K</div>
                <div className="text-slate-500 font-medium">PBR Maps</div>
              </div>
            </div>
          </div>

          {/* Right Interactive SketchUp Video Workflow Showcase */}
          <div className="lg:col-span-6 relative">
            <SketchUpShowcaseVideo />
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORY POSTERS SLIDER */}
      <CategoryPostersSlider
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setVisibleCount(6);
          if (cat === "furniture") {
            setSelectedSubCategory("all-furniture");
          }
        }}
      />

      {/* ══════ YES/NO CTA STRIP ══════ */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-emerald-50/60 border-y border-emerald-300">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xs font-mono font-black text-red-600">⚠️ THIS IS A ONE-TIME OFFER — YOU WILL NOT SEE IT AGAIN</p>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Ready to Unlock Everything?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleUpgrade}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <Zap className="size-4 fill-current" /> YES! I Want All 3,000+ Models for $29
            </button>
            <button
              onClick={onSkip}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white text-slate-700 border border-slate-300 font-mono text-xs hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              No thanks, I'll keep my 20 models →
            </button>
          </div>
          <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="size-3.5 text-emerald-600" /> 1-Click Charge • No Card Re-Entry • Instant .SKP Download
          </p>
        </div>
      </section>

      {/* CATEGORY TILES (6 MAIN TILES INCL. FURNITURE) */}
      <section id="categories" className="py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Categories
            </h2>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubCategory("all-furniture");
                setVisibleCount(6);
              }}
              className={`text-xs font-bold transition cursor-pointer ${
                selectedCategory === "all" ? "text-slate-900 underline" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All Categories ({ALL_MODELS.length})
            </button>
          </div>

          {/* 6 Clean Minimal Tiles with 3-4 Circular Image Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => {
              const IconComp = ICON_MAP[cat.icon] || Box;
              const isSelected = selectedCategory === cat.key;
              const catModels = modelsByCategory[cat.key] || [];
              const previewImages = catModels.slice(0, 4).map((m) => m.src);

              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    setVisibleCount(6);
                    if (cat.key === "furniture") {
                      setSelectedSubCategory("all-furniture");
                    }
                    const elem = document.getElementById("models-directory");
                    if (elem) elem.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-32 group cursor-pointer ${
                    isSelected
                      ? "bg-white border-2 border-emerald-500 shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center pl-1">
                      {previewImages.map((imgSrc, idx) => (
                        <img
                          key={idx}
                          src={imgSrc}
                          alt={cat.name}
                          className="size-6 sm:size-7.5 rounded-full border-2 border-white object-cover -ml-2 first:ml-0 shadow-sm group-hover:border-slate-100 transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full pt-2 border-t border-slate-100">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 transition-colors flex items-center gap-1.5 truncate">
                      <IconComp className="size-3.5 text-slate-500 group-hover:text-slate-900" />
                      {cat.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MINIMAL MODELS SHOWCASE DIRECTORY WITH FURNITURE SUBCATEGORIES */}
      <section id="models-directory" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter Controls */}
        <div className="space-y-4 pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              {selectedCategory === "all"
                ? "3,000+ Models Biggest Library"
                : `${CATEGORIES.find((c) => c.key === selectedCategory)?.name || "Models"} Collection`}
            </h2>
          </div>

          {/* FURNITURE SUB-CATEGORY PILL STRIP */}
          {selectedCategory === "furniture" && (
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 overflow-x-auto scrollbar-none animate-in fade-in">
              <span className="text-xs font-mono text-slate-500 font-semibold pr-2 flex items-center gap-1 shrink-0">
                <Armchair className="size-3.5 text-emerald-600" /> Sub-Categories:
              </span>
              {FURNITURE_SUBCATEGORIES.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => {
                    setSelectedSubCategory(sub.key);
                    setVisibleCount(6);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-extrabold transition whitespace-nowrap border cursor-pointer ${
                    selectedSubCategory === sub.key
                      ? "bg-[#10b981] text-black border-[#10b981]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Models Grid */}
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {visibleModels.map((model) => (
              <div
                key={model.id}
                onClick={() => setShowSubscriptionModal(true)}
                className="group cursor-pointer rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/80 transition-all overflow-hidden flex flex-col shadow-xs hover:shadow-md"
              >
                {/* Clean Image Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <img
                    src={model.src}
                    alt={model.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded-full bg-white text-black text-[10px] sm:text-xs font-black shadow-md flex items-center gap-1">
                      <Eye className="size-3" /> Download SKP
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeModel(model.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-slate-700 hover:bg-white transition shadow-sm"
                  >
                    <HeartIcon size={14} color={likedModels[model.id] ? "#10b981" : "#64748b"} duration={likedModels[model.id] ? 100 : 2000} />
                  </button>
                </div>

                {/* Minimal Info */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-mono text-slate-700 font-semibold truncate max-w-[120px]">{model.rawName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(model.id);
                        }}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <CopiedIcon size={12} color={copiedId === model.id ? "#10b981" : "#94a3b8"} duration={copiedId === model.id ? 100 : 2200} />
                      </button>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-0.5 truncate">
                      {model.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">SketchUp (.SKP)</span>
                    <span className="text-slate-700 font-bold flex items-center gap-0.5 group-hover:text-emerald-600 transition-colors">
                      <DownloadDoneIcon size={12} color="#059669" /> Download SKP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-10">
              <button
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="px-8 py-3 rounded-full bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition inline-flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="size-4" /> Load More Models
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SINGLE PRICING CARD COMPONENT — 1-CLICK UPGRADE */}
      <Pricing onSelectPlan={handleUpgradeAction} onSkip={handleSkipAction} isProcessing={isUpgrading} />

      {/* ══════ BOTTOM FINAL YES/NO CTA ══════ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border-2 border-red-400 text-center space-y-5 shadow-xl">
          <p className="text-xs font-mono font-black text-red-600">⭐ LAST CHANCE — ONE-TIME OFFER</p>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Still Thinking? This Offer Disappears When You Leave.
          </h3>

          <p className="text-xs text-slate-600">
            You will <strong className="text-red-600">never</strong> see this $29 deal again. The normal price is $99.
          </p>

          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-slate-400 text-sm line-through font-bold">$99</span>
            <span className="text-4xl font-black text-slate-900">$29</span>
            <span className="text-xs text-slate-500 font-mono">one-time</span>
          </div>

          <button
            onClick={handleUpgradeAction}
            className="w-full py-4 rounded-full bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
          >
            <Zap className="size-4 fill-current" /> YES! I Want All 3,000+ Models ($29)
          </button>

          <button
            onClick={handleSkipAction}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-mono underline transition cursor-pointer"
          >
            No, I'll pass on this one-time deal and keep only 20 models →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 text-slate-600 border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8 text-xs text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            AVADA SKETCHUP
          </div>
          <div>&copy; 2026 AVADA 3D. 3,000+ SketchUp (.SKP) Models Cataloged.</div>
        </div>
      </footer>

      {/* SUBSCRIPTION / VIP PASS MODAL */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-emerald-500/60 shadow-2xl p-6 sm:p-7 space-y-5 relative animate-in fade-in text-slate-900">
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* EVERGREEN TIMER BADGE */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <Timer className="size-4 text-emerald-600 animate-pulse" />
                <span>Mega Discount Ends In:</span>
              </div>
              <div className="font-mono font-black text-xs text-emerald-700 tracking-wider bg-white px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                {countdown}
              </div>
            </div>

            {/* 20+ OVERLAPPING CIRCULAR MODEL THUMBNAILS STRIP */}
            <div className="space-y-2 py-0.5 text-center">
              <div className="flex items-center justify-center -space-x-2.5 overflow-x-auto scrollbar-none py-1 px-1.5 max-w-full">
                {publicModels.slice(0, 24).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.relPath}
                    alt="Model thumbnail"
                    className="size-7 sm:size-7.5 rounded-full border-2 border-white object-cover shrink-0 shadow-sm hover:scale-125 hover:z-30 transition-transform duration-300"
                  />
                ))}
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <Sparkles className="size-3.5 text-emerald-600" /> 3,000+ SketchUp (.SKP) scenes
                </span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                <Zap className="size-6 fill-current" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Lifetime VIP Pass</h3>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-slate-400 text-sm line-through font-bold">$99</span>
                <span className="text-3xl font-black text-slate-900">$29</span>
                <span className="text-xs text-slate-500 font-mono">/ one-time pay</span>
              </div>
              <p className="text-xs text-slate-600">
                Instant access to 3,000+ SketchUp (.SKP) scenes. Pay once, use & edit forever!
              </p>
            </div>

            {/* 5 Feature Checkmark Points List */}
            <div className="space-y-2 py-2 border-y border-slate-200 text-xs text-left">
              {[
                "Instant access to 3,000+ SketchUp (.SKP) scene models",
                "Full commercial license — edit & sell to your clients",
                "High quality models to get paid like top designers",
                "Includes 8K PBR textures, furniture & archviz packs",
                "Free lifetime updates with new weekly model drops",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-slate-700 font-medium">
                  <div className="size-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                  <span className="text-[11px] leading-snug">{feature}</span>
                </div>
              ))}
            </div>

            {/* Card Payment Form */}
            <CardPaymentForm
              sourceLocation="upsell_checkout_modal_lifetime_29"
              buttonText="1-Click Charge $29 & Download 3,000+ Models"
              allowSavedCard={true}
              amountInCents={2900}
              itemTotal="$99.00"
              deliveryFee="$0.00"
              discountAmount="-$70.00"
              totalPrice="$29.00"
              deliveryAddressLine1="Lifetime VIP Access: 3,000+ SketchUp (.SKP) Models"
              deliveryAddressLine2="Instant Master Vault Download Access + Weekly Updates"
              onSuccess={() => {
                setShowSubscriptionModal(false);
                localStorage.removeItem("avada_just_bought_1dollar");
                if (onSuccessVIP) onSuccessVIP();
                else window.location.href = "/#success-vip";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
