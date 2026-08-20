import { useState, useMemo, useEffect } from "react";
import { Pricing, useEvergreenTimer } from "@/components/ui/single-pricing-card-1";
import { SketchUpShowcaseVideo } from "@/components/ui/sketchup-showcase-video";
import { CategoryPostersSlider } from "@/components/ui/category-posters-slider";
import { CardPaymentForm } from "@/components/ui/card-payment-form";
import { StartPage } from "@/pages/StartPage";
import { UpsellPage } from "@/pages/UpsellPage";
import { SuccessPage } from "@/pages/SuccessPage";
import DemoOne from "@/demo";
import { RenderEngineTrustBanner } from "@/components/ui/render-engine-logos";
import {
  DownloadDoneIcon,
} from "@/components/ui/animated-state-icons";
import manifestData from "@/data/modelsManifest.json";
import publicModels from "@/data/publicModelsImages.json";
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
  Eye,
  ArrowRight,
  Armchair,
  Check,
  Clock,
  Shield,
  Trophy,
} from "lucide-react";

export interface ModelItem {
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

export interface CategoryMeta {
  name: string;
  key: string;
  icon: string;
  countDisplay: string;
}

export interface SubCategoryMeta {
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
  Building2: Building2,
  Bath: Bath,
  Bed: Bed,
  Home: Home,
  Utensils: Utensils,
  Droplets: Droplets,
  Box: Box,
  Armchair: Armchair,
};

export function App() {
  const computeRoute = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes("upsell") || hash.includes("upsell")) return "more";
    if (path.includes("more") || hash.includes("more")) return "more";
    if (path.includes("start") || hash.includes("start")) return "start";
    if (path.includes("vip") || hash.includes("vip")) return "success-vip";
    if (path.includes("success") || hash.includes("success")) return "success-starter";
    if (path.includes("demo") || hash.includes("demo")) return "demo";
    if (path.includes("checkout") || hash.includes("checkout")) return "checkout";
    return "main";
  };

  const [currentRoute, setCurrentRoute] = useState<string>(computeRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(computeRoute());
    };
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [currentRoute]);

  const timerString = useEvergreenTimer();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const pricingEl = document.getElementById("pricing");
      let pricingInView = false;
      if (pricingEl) {
        const rect = pricingEl.getBoundingClientRect();
        pricingInView = rect.top <= window.innerHeight && rect.bottom >= 0;
      }
      setShowFloatingCTA(window.scrollY > 400 && !pricingInView);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all-furniture");
  const [activeModel, setActiveModel] = useState<ModelItem | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [searchTermIdx, setSearchTermIdx] = useState(0);
  const [mobileBlinkIndex, setMobileBlinkIndex] = useState(0);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setMobileBlinkIndex((prev) => (prev + 1) % 200);
    }, 1000);
    const searchInterval = setInterval(() => {
      setSearchTermIdx((prev) => (prev + 1) % 6);
    }, 1500);
    return () => {
      clearInterval(blinkInterval);
      clearInterval(searchInterval);
    };
  }, []);

  const countdown = useEvergreenTimer();

  // Combine real scanned models + dedicated furniture + public JSON fallback
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

  // Filtered models based on category and sub-category
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

  // Group models by category for summary counts
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

  if (currentRoute === "start") {
    return <StartPage onNavigateMain={() => setCurrentRoute("main")} onNavigateMore={() => setCurrentRoute("more")} />;
  }

  if (currentRoute === "more") {
    return (
      <UpsellPage
        onSkipToStarter={() => setCurrentRoute("success-starter")}
        onSuccessVIP={() => setCurrentRoute("success-vip")}
        onSkip={() => setCurrentRoute("success-starter")}
      />
    );
  }

  if (currentRoute === "success-vip") {
    return <SuccessPage plan="vip" onNavigateHome={() => setCurrentRoute("main")} />;
  }

  if (currentRoute === "success-starter" || currentRoute === "success") {
    return (
      <SuccessPage
        plan="starter"
        onNavigateHome={() => setCurrentRoute("main")}
        onNavigateUpsell={() => setCurrentRoute("more")}
      />
    );
  }

  if (currentRoute === "demo" || currentRoute === "checkout") {
    return (
      <div className="relative min-h-screen">
        <button
          onClick={() => setCurrentRoute("main")}
          className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-md hover:bg-slate-50 transition cursor-pointer"
        >
          ← Back to Store
        </button>
        <DemoOne />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col font-sans selection:bg-[#10b981] selection:text-black">

      {/* Minimal Monochrome Top Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-[200]">
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
        </div>
      </header>

      {/* ULTRA MINIMAL HERO SECTION */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold shadow-2xs">
              <Zap className="size-3.5 fill-current text-emerald-600" /> 3,000+ Curated SketchUp (.SKP) Assets
            </div>

            {/* Narrative Hook */}
            <div className="space-y-4 pt-2">
              <div className="text-sm sm:text-base text-slate-600 font-medium space-y-2.5">
                <p>You start a new project. Then the search begins...</p>
                <div className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono border border-slate-200 shadow-inner">
                  <span className="animate-pulse">🔍</span>
                  <span>Searching for</span>
                  <strong className="text-emerald-700 w-[170px] text-left transition-all duration-300">
                    {["the right sofa.", "the perfect table.", "lighting.", "décor.", "materials.", "architectural elements."][searchTermIdx]}
                  </strong>
                </div>
                <p className="leading-relaxed text-slate-500 pt-1">
                  Before you know it, you've spent hours collecting resources instead of designing.
                </p>
              </div>
              <p className="text-base sm:text-lg text-slate-900 font-black pt-2">
                What if your entire design library was already in one place?
              </p>
            </div>

            <h1 className="text-[28px] sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              MEET YOUR NEW <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-slate-900 via-emerald-800 to-[#10b981] bg-clip-text text-transparent">
                SKETCHUP DESIGN LIBRARY
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              Unlock <strong className="text-slate-900 font-bold">3,000+ High-Quality SketchUp 3D Scenes</strong>. Complete production-ready .SKP files with 8K PBR textures and lighting. Ready for instant rendering.
            </p>

            {/* Mobile Video Placement (Under Description, Before Buttons) */}
            <div className="block lg:hidden w-full py-4">
              <SketchUpShowcaseVideo />
            </div>

            <div className="flex flex-row items-center gap-2 sm:gap-4 pt-2 flex-nowrap w-full max-w-md">
              <button
                onClick={() => {
                  const el = document.getElementById("pricing");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex-1 px-3 sm:px-6 py-3.5 rounded-full bg-[#10b981] text-black font-black text-xs sm:text-sm shadow-md hover:bg-[#059669] transition flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <Zap className="size-4 fill-current" /> Unlock All Models ($29)
              </button>

              <a
                href="#models-directory"
                className="flex-1 px-3 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white text-slate-800 border border-slate-200 font-bold text-[11px] sm:text-xs hover:bg-slate-50 transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-2xs"
              >
                Browse Collection <ArrowRight className="size-3.5 sm:size-4 text-slate-500" />
              </a>
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

          {/* Right Interactive SketchUp Video Workflow Showcase (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-6 relative">
            <SketchUpShowcaseVideo />
          </div>
        </div>

      {/* MINIMAL MODELS SHOWCASE DIRECTORY WITH FURNITURE SUBCATEGORIES */}
      <div id="models-directory" className="pt-16 pb-4 px-0 max-w-[100vw] mx-auto w-full space-y-6">
        {/* Filter Controls */}
        <div className="space-y-4 pb-4 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              {selectedCategory === "all"
                ? "All 3D Models Catalog"
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

        {/* Models Animated Showcase */}
        <div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideFast {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-slide-fast {
              animation: slideFast 150s linear infinite;
              display: flex;
              width: max-content;
            }
            .animate-slide-fast:hover {
              animation-play-state: paused;
            }
            @keyframes blinkIn {
              0% { opacity: 0.8; transform: scale(0.98); }
              100% { opacity: 1; transform: scale(1); }
            }
            .animate-blink-in {
              animation: blinkIn 0.3s ease-out forwards;
            }
          `}} />

          {/* MOBILE: Single Blinking Card */}
          <div className="sm:hidden w-full max-w-sm mx-auto py-4">
            {(() => {
              // Use up to 100 items from filtered models for the blink loop
              const showcaseModels = filteredModels.slice(0, 100);
              if (showcaseModels.length === 0) return null;
              const model = showcaseModels[mobileBlinkIndex % showcaseModels.length];
              if (!model) return null;
              
              return (
                <div
                  key={mobileBlinkIndex % showcaseModels.length}
                  onClick={() => setShowSubscriptionModal(true)}
                  className="animate-blink-in w-full group rounded-3xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xl cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={model.src}
                      alt={model.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-black shadow-md flex items-center gap-1.5">
                        <Eye className="size-3.5" /> Download SKP
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {model.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <span className="capitalize">{model.categoryName || "3D Scene"}</span>
                        <span>•</span>
                        <span>SketchUp (.SKP)</span>
                      </div>
                    </div>

                    <button className="w-full py-3 rounded-xl bg-[#10b981] text-black font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5">
                      <DownloadDoneIcon size={16} color="#000000" /> Unlock Model
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* DESKTOP: Fast Scrolling Marquee */}
          <div className="hidden sm:block w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden py-4">
            <div className="animate-slide-fast gap-3 sm:gap-4 px-4">
              {[...filteredModels.slice(0, 100), ...filteredModels.slice(0, 100)].map((model, idx) => (
                <div
                  key={`${model.id}-${idx}`}
                  onClick={() => setShowSubscriptionModal(true)}
                  className="w-[260px] sm:w-[280px] flex-none group rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/80 transition duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={model.src}
                      alt={model.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-full bg-white text-black text-xs font-black shadow-md flex items-center gap-1">
                        <Eye className="size-3.5" /> Download SKP
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#10b981] text-black font-extrabold text-[8px] px-1.5 py-0.5 rounded-full shadow-xs">
                      .SKP INCLUDED
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                        {model.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <span className="capitalize">{model.categoryName || "3D Scene"}</span>
                      </div>
                    </div>

                    <button className="w-full py-2 rounded-xl bg-slate-50 hover:bg-[#10b981] text-slate-800 hover:text-black font-bold text-[11px] border border-slate-200 hover:border-[#10b981] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                      <DownloadDoneIcon size={14} color="currentColor" /> Unlock Model
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      </section>

      {/* FEATURED CATEGORY POSTERS SLIDER (RIGHT BELOW HERO VIDEO) */}
      <CategoryPostersSlider
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);

          if (cat === "furniture") {
            setSelectedSubCategory("all-furniture");
          }
        }}
      />

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
                    {/* Stack of 3-4 Circular Model Image Avatars */}
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

      {/* --- NEW SALES SECTION 1: ROI & VALUE --- */}
      <section className="py-16 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
            Stop Burning Money on Single Models
          </h2>
          <p className="text-lg font-medium text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Other designers charge <span className="text-slate-400 line-through">$50-$200 per model</span>. With AVADA, you get an <strong className="text-slate-900">entire lifetime arsenal</strong> for the price of a cheap lunch.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-emerald-600 size-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Commercial License</h3>
              <p className="text-slate-600 text-xs">Use in client presentations, pitches, and final renders without restrictions.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Clock className="text-emerald-600 size-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Saves Years of Work</h3>
              <p className="text-slate-600 text-xs">Never model a sofa or bed from scratch again. Drag, drop, render.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="text-emerald-600 size-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Pays For Itself</h3>
              <p className="text-slate-600 text-xs">One approved client pitch pays for this entire package 100x over.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- NEW SALES SECTION 2: TESTIMONIALS SLIDER --- */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Trusted by 10,000+ Top Designers</h2>
          <p className="text-slate-500 font-medium">Swipe to read what our community thinks.</p>
        </div>
        
        {/* CSS to hide scrollbar but keep functionality */}
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        <div className="flex overflow-x-auto gap-4 px-4 sm:px-8 pb-8 snap-x snap-mandatory no-scrollbar">
          {[
            { name: "Sarah Jenkins", role: "Senior Interior Designer", quote: "I used to spend hours searching 3D Warehouse for decent models that didn't look like low-poly trash. The AVADA pack changed everything. V-Ray ready and instant download." },
            { name: "Michael R.", role: "Architectural Visualizer", quote: "The absolute best ROI of any asset I've bought this year. Dropped a bedroom set into my scene and the client approved the render immediately. Highly recommend." },
            { name: "Elena Popov", role: "Freelance 3D Artist", quote: "Worth 10x the price. If you value your time and want professional-grade assets, get this immediately before they realize how underpriced it is." },
            { name: "David Chen", role: "Studio Director", quote: "Our entire team uses these models now. The consistency in quality saves us at least 15 hours per project." },
            { name: "Jessica Alba", role: "Interior Architect", quote: "Finally, models that actually look like the preview renders. Textures are perfectly mapped out of the box." },
            { name: "Marcus Torres", role: "3D Modeler", quote: "I buy this just to study the topology. The meshes are incredibly clean and well-optimized for heavy scenes." },
            { name: "Olivia Smith", role: "Set Designer", quote: "A lifesaver for tight deadlines. I can populate an entire living room in 5 minutes and hit render." },
            { name: "Ryan Davies", role: "ArchViz Specialist", quote: "The categorization is brilliant. No more digging through messy folders. Everything is right where you expect it." },
            { name: "Nina K.", role: "Freelance Designer", quote: "I was skeptical at the price, but the quality blew me away. Best purchase I've made for my business." },
            { name: "James Wilson", role: "BIM Manager", quote: "Clean files, no bloatware, perfectly scaled. Exactly what professionals need." },
            { name: "Chloe M.", role: "Design Student", quote: "This pack gave my portfolio the massive boost it needed. My renders look so much more professional now." },
            { name: "Ahmed S.", role: "Lead Architect", quote: "We abandoned our internal model library for AVADA. It's just better maintained and higher quality." },
            { name: "Sophia Lee", role: "Visual Merchandiser", quote: "Perfect for retail mockups. The furniture pieces are trendy and realistic." },
            { name: "Thomas B.", role: "3D Generalist", quote: "Saves me from modeling mundane objects so I can focus on lighting and composition. Unbeatable value." },
            { name: "Maria Garcia", role: "Residential Designer", quote: "My clients always point out how realistic the fabrics and materials look. All thanks to these models." },
            { name: "Kevin Park", role: "Creative Director", quote: "The polygon count is perfectly balanced—detailed enough for close-ups, light enough for massive scenes." },
            { name: "Anna J.", role: "Freelance Architect", quote: "I literally cannot work without this library anymore. It's the first thing I load up." },
            { name: "Lucas M.", role: "Environment Artist", quote: "Great base meshes to work from, or just use them as-is. Incredibly versatile." },
            { name: "Emma White", role: "Interior Stylist", quote: "The sheer volume of high-quality items is staggering. You never run out of options." },
            { name: "Daniel K.", role: "Principal Designer", quote: "A masterclass in 3D asset creation. Every designer should have this in their toolkit." },
            { name: "Sophie Taylor", role: "Drafting Technician", quote: "Easy to import, easy to modify. It integrates seamlessly into my workflow." },
            { name: "Liam O.", role: "Junior Architect", quote: "Paid for itself on the first day. The time saved is worth its weight in gold." }
          ].map((t, i) => (
            <div key={i} className="flex-none w-[280px] md:w-[320px] snap-center bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-slate-600 font-medium leading-relaxed mb-6 italic text-sm">"{t.quote}"</p>
              <div>
                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SINGLE PRICING CARD COMPONENT */}
      <Pricing onSelectPlan={() => setShowSubscriptionModal(true)} />

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

      {/* MINIMAL MODEL LIGHTBOX MODAL */}
      {activeModel && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in text-slate-900">
            <div className="relative aspect-video bg-slate-100">
              <img src={activeModel.src} alt={activeModel.title} className="w-full h-full object-cover" />
              <button
                onClick={() => setActiveModel(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white hover:text-slate-900 shadow-md cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{activeModel.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">SketchUp (.SKP) • {activeModel.categoryName}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveModel(null);
                    setShowSubscriptionModal(true);
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#10b981] text-black text-xs font-black hover:bg-[#059669] cursor-pointer shadow-sm"
                >
                  Download .SKP
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">Software</div>
                  <div className="font-bold text-slate-900 mt-0.5">SketchUp (.SKP)</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Polycount</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeModel.polyCount}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Engine</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeModel.renderEngine}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                "Free SketchUp Course Lifetime Access (Free Addon)",
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
              sourceLocation="checkout_modal_lifetime_29"
              buttonText="Place Order ($29)"
              allowSavedCard={true}
              amountInCents={2900}
              itemTotal="$99.00"
              deliveryFee="$0.00"
              discountAmount="-$70.00"
              totalPrice="$29.00"
              deliveryAddressLine1="Lifetime VIP Access: 3,000+ SketchUp (.SKP) Models"
              deliveryAddressLine2="+ Free SketchUp Course Lifetime Access (Free Addon)"
              onSuccess={() => {
                setShowSubscriptionModal(false);
                setCurrentRoute("success-vip");
              }}
            />
          </div>
        </div>
      )}

      {/* FLOATING CTA AT BOTTOM */}
      <div 
        className={`fixed bottom-0 inset-x-0 p-4 z-[100] transition-transform duration-500 flex justify-center pointer-events-none ${
          showFloatingCTA ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-slate-900 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-4 w-full max-w-md border border-slate-700 pointer-events-auto">
          <div className="flex flex-col text-left pl-2">
            <span className="text-white font-bold text-sm">Get All Models</span>
            <span className="text-rose-400 font-mono text-xs font-bold flex items-center gap-1">
              <Timer className="size-3" /> Ends in {timerString}
            </span>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById("pricing");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-3 rounded-xl bg-[#10b981] text-black font-black text-sm hover:bg-[#059669] transition shadow-md cursor-pointer"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;




