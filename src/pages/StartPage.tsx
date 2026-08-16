"use client";

import { useState, useMemo } from "react";
import {
  Timer,
  Zap,
  Check,
  Sparkles,
  Download,
  Star,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Lock,
  X,
  FileBox,
  MapPin,
} from "lucide-react";
import { CardPaymentForm } from "@/components/ui/card-payment-form";
import { useEvergreenTimer } from "@/components/ui/single-pricing-card-1";
import { RenderEngineTrustBanner } from "@/components/ui/render-engine-logos";
import { Separator } from "@/components/ui/separator";
import publicModels from "@/data/publicModelsImages.json";
import { handleStripePayment } from "@/lib/stripe";

interface StartPageProps {
  onNavigateMain?: () => void;
  onNavigateMore?: () => void;
}

export function StartPage({ onNavigateMain, onNavigateMore }: StartPageProps) {
  const countdown = useEvergreenTimer();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedModelTitle, setSelectedModelTitle] = useState<string>("");

  // Select 20 high quality models for the $1 starter pack
  const starterModels = useMemo(() => {
    return publicModels.slice(0, 20);
  }, []);

  const openCheckoutForModel = (title: string) => {
    setSelectedModelTitle(title);
    setShowCheckoutModal(true);
  };

  const handleInitialPurchaseSuccess = () => {
    setShowCheckoutModal(false);
    // Set post-purchase upsell flag and redirect to upsell page
    localStorage.setItem("avada_just_bought_1dollar", "true");
    if (onNavigateMore) {
      onNavigateMore();
    } else if (onNavigateMain) {
      onNavigateMain();
    } else {
      window.location.href = "/#more";
    }
  };

  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigateMain) {
      onNavigateMain();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 font-sans selection:bg-[#10b981] selection:text-black pb-16">
      {/* TOP NAV BAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" onClick={handleGoHome} className="flex items-center gap-2 text-lg font-black tracking-wider text-slate-900 whitespace-nowrap">
            <div className="size-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-black font-black shadow-md shrink-0">
              A
            </div>
            <span className="whitespace-nowrap">AVADA <span className="text-[#10b981]">3D</span></span>
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        {/* Urgent Announcement Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs text-slate-700 font-medium shadow-sm">
          <span className="flex size-2 rounded-full bg-[#10b981] animate-ping" />
          <span>Special Trial Offer • 20 SketchUp (.SKP) Models for $1</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Get 20 High-Quality <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#10b981] bg-clip-text text-transparent">
            SketchUp 3D Models for Just $1
          </span>
        </h1>

        {/* Sales Copy Paragraph */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Download 20 complete 3D scene models instantly (.SKP format). Edit, customize, and sell to your clients. Get paid like top designers for just $1.
        </p>

        {/* Works With D5 Render, V-Ray, Lumion Trust Banner */}
        <RenderEngineTrustBanner className="pt-1" />

        {/* Evergreen Countdown Timer Badge */}
        <div className="inline-flex items-center justify-between gap-4 p-3.5 px-5 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Timer className="size-4 text-emerald-600 animate-pulse" />
            <span>$1 Mega Discount Ends In:</span>
          </div>
          <div className="font-mono font-black text-sm text-emerald-700 tracking-wider bg-slate-50 px-3.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
            {countdown}
          </div>
        </div>
      </section>

      {/* 20 FEATURED MODELS SHOWCASE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight italic whitespace-nowrap">
            What You Get in the $1 Starter Pack
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            All 20 high-resolution SketchUp (.SKP) scene models listed below are included in your $1 download package.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {starterModels.map((model, idx) => (
            <div
              key={idx}
              className="group rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/80 transition duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={model.relPath}
                  alt={model.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-slate-200 text-[9px] sm:text-[10px] font-mono font-bold text-slate-800 shadow-xs">
                  Model #{idx + 1}
                </div>
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#10b981] text-black font-extrabold text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-xs">
                  .SKP INCLUDED
                </div>
              </div>

              <div className="p-2.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-0.5 sm:space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                    {model.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                    <span className="capitalize">{model.category || "3D Scene"}</span>
                    <span>•</span>
                    <span>SketchUp 2024</span>
                  </div>
                </div>

                <button
                  onClick={() => openCheckoutForModel(model.title)}
                  className="w-full py-2 sm:py-2.5 rounded-xl bg-slate-50 hover:bg-[#10b981] text-slate-800 hover:text-black font-bold text-[11px] sm:text-xs border border-slate-200 hover:border-[#10b981] transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="size-3 sm:size-3.5" /> Download (.SKP)
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING & CHECKOUT SECTION */}
      <section id="pricing" className="max-w-md mx-auto px-4 py-12 space-y-5 text-center">
        {/* SLEEK TIMER BADGE */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Timer className="size-4 text-emerald-600 animate-pulse" />
            <span>Limited Trial Offer Ends In:</span>
          </div>
          <div className="font-mono font-black text-xs text-emerald-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
            {countdown}
          </div>
        </div>

        {/* 20 OVERLAPPING CIRCULAR MODEL THUMBNAILS STRIP */}
        <div className="space-y-2 py-0.5 text-center">
          <div className="flex items-center justify-center -space-x-2.5 overflow-x-auto scrollbar-none py-1 px-1.5 max-w-full">
            {starterModels.map((item, idx) => (
              <img
                key={idx}
                src={item.relPath}
                alt="Model thumbnail"
                className="size-7 sm:size-8 rounded-full border-2 border-white object-cover shrink-0 shadow-sm hover:scale-125 hover:z-30 transition-transform duration-300"
              />
            ))}
          </div>
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              <Sparkles className="size-3.5 text-emerald-600" /> 20 SketchUp (.SKP) Scene Models Included
            </span>
          </div>
        </div>

        {/* EMBEDDED STRIPE CARD PAYMENT FORM WITH EXACT TWO-BOX ORDER SUMMARY DESIGN */}
        <CardPaymentForm
          sourceLocation="start_page_1dollar_pack"
          buttonText="Place Order"
          allowSavedCard={false}
          deliveryAddressLine1="20 SketchUp (.SKP) Scenes + 8K Textures"
          deliveryAddressLine2="Instant Download Access • Single Zip Archive"
          itemTotal="$49.00"
          deliveryFee="$0.00"
          discountAmount="-$48.00"
          totalPrice="$1.00"
          onSuccess={handleInitialPurchaseSuccess}
        />
      </section>

      {/* CHECKOUT POPUP MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-slate-900">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="size-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pt-2 text-left">
              <span className="text-[11px] font-mono text-emerald-700 font-bold">ORDER SUMMARY</span>
              <h3 className="text-lg font-black text-slate-900">20 Models Starter Pack</h3>
              {selectedModelTitle && (
                <p className="text-xs text-slate-500">
                  Selected: <span className="font-semibold text-slate-800">"{selectedModelTitle}"</span> + 19 more models
                </p>
              )}
            </div>

            {/* SLEEK TIMER BADGE */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Timer className="size-3.5 text-emerald-600 animate-pulse" />
                <span>Limited Offer Ends In:</span>
              </div>
              <div className="font-mono font-bold text-xs text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                {countdown}
              </div>
            </div>

            <Separator className="bg-slate-200" />

            {/* EMBEDDED STRIPE PAYMENT FORM */}
            <CardPaymentForm
              sourceLocation="start_page_checkout_modal"
              buttonText="Place Order"
              allowSavedCard={false}
              deliveryAddressLine1={`Model: "${selectedModelTitle || "3D Scene"}" + 19 More`}
              deliveryAddressLine2="Instant .SKP Download Link"
              itemTotal="$49.00"
              deliveryFee="$0.00"
              discountAmount="-$48.00"
              totalPrice="$1.00"
              onSuccess={handleInitialPurchaseSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
