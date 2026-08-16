"use client";

import { useState, useMemo } from "react";
import {
  Timer,
  Sparkles,
  Download,
  Star,
  ArrowRight,
  ShieldCheck,
  X,
  ChevronDown,
  Layers,
  FileCheck,
  Zap,
} from "lucide-react";
import { CardPaymentForm } from "@/components/ui/card-payment-form";
import { useEvergreenTimer } from "@/components/ui/single-pricing-card-1";
import { RenderEngineTrustBanner } from "@/components/ui/render-engine-logos";
import { Separator } from "@/components/ui/separator";
import publicModels from "@/data/publicModelsImages.json";

interface StartPageProps {
  onNavigateMain?: () => void;
  onNavigateMore?: () => void;
}

export function StartPage({ onNavigateMain, onNavigateMore }: StartPageProps) {
  const countdown = useEvergreenTimer();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedModelTitle, setSelectedModelTitle] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const scrollToCheckout = () => {
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const faqs = [
    {
      q: "Is this strictly a one-time $1 payment?",
      a: "Yes! There are absolutely zero recurring fees, no hidden subscriptions, and no surprise rebills. You pay $1 once and keep full access to all 20 models forever.",
    },
    {
      q: "Which SketchUp versions and render engines are supported?",
      a: "All scene files are compatible with SketchUp 2018 through SketchUp 2025+. They are pre-tuned for seamless use with V-Ray, Enscape, D5 Render, Lumion, and Blender.",
    },
    {
      q: "Can I use these models for commercial client work?",
      a: "Yes. Every download includes a royalty-free Commercial License. You can modify the assets, render them, and use them in unlimited client presentations and paid projects.",
    },
    {
      q: "How do I receive my download files?",
      a: "Immediately upon completing checkout, you will be redirected to your personal access page with a direct 1-click .ZIP archive download link and a permanent Google Drive backup link.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-[#10b981] selection:text-black pb-24">
      {/* TOP NAV BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" onClick={handleGoHome} className="flex items-center gap-2 text-lg font-black tracking-wider text-slate-900 whitespace-nowrap">
            <div className="size-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-black font-black shadow-md shrink-0">
              A
            </div>
            <span className="whitespace-nowrap">AVADA <span className="text-[#10b981]">3D</span></span>
          </a>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Verified 256-Bit SSL Checkout</span>
            </div>
            <button
              onClick={scrollToCheckout}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black hover:text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Get 20 Models for $1</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-10 sm:pt-14 pb-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        {/* Social Proof Star Pill */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-800 font-semibold shadow-xs">
          <div className="flex -space-x-1.5 items-center">
            <img className="size-5 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces" alt="user" />
            <img className="size-5 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces" alt="user" />
            <img className="size-5 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces" alt="user" />
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="text-slate-900 font-bold">4.9/5</span>
          </div>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 font-medium">1,480+ 3D Artists & Architects</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Get 20 High-Quality <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-slate-900 via-emerald-800 to-[#10b981] bg-clip-text text-transparent">
            SketchUp 3D Scenes for Just $1
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Complete production-ready .SKP scenes with 8K PBR textures and lighting. Ready for instant rendering in <strong className="text-slate-900 font-semibold">Enscape, V-Ray, D5 Render, Lumion & Blender</strong>.
        </p>

        {/* Works With Render Engines */}
        <RenderEngineTrustBanner className="pt-1" />

        {/* Urgency Timer + Quick CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="inline-flex items-center justify-between gap-3 p-2.5 px-4 rounded-2xl bg-white border border-slate-200 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Timer className="size-4 text-emerald-600 animate-pulse" />
              <span>Special $1 Pricing Ends In:</span>
            </div>
            <div className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 shadow-2xs">
              {countdown}
            </div>
          </div>

          <button
            onClick={scrollToCheckout}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Claim 20 Models for $1.00</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </section>

      {/* VALUE HIGHLIGHTS / OBJECTION BUSTERS GRID */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-left">
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="size-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Instant .ZIP Access</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Immediate direct download link + Google Drive backup.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-left">
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="size-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Commercial License</h4>
            <p className="text-[11px] text-slate-500 leading-normal">Full rights to use in commercial client work with zero royalties.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-left">
            <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">8K PBR Textures</h4>
            <p className="text-[11px] text-slate-500 leading-normal">High-res materials, proxies, and lighting configurations.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5 text-left">
            <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">100% Risk-Free</h4>
            <p className="text-[11px] text-slate-500 leading-normal">30-day money-back guarantee. No questions asked.</p>
          </div>
        </div>
      </section>

      {/* 20 FEATURED MODELS SHOWCASE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700">
            <Sparkles className="size-3 text-emerald-600" /> INCLUDED ASSETS
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            All 20 Models Included in Your $1 Package
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Every model below is an unlocked, editable .SKP scene with full geometry, proxy assets, and texture maps.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {starterModels.map((model, idx) => {
            const modelTitle = `${model.category || "3D"} Scene #${idx + 1}`;
            return (
              <div
                key={idx}
                className="group rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/80 transition duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={model.relPath}
                    alt={modelTitle}
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
                      {modelTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                      <span className="capitalize">{model.category || "3D Scene"}</span>
                      <span>•</span>
                      <span>SketchUp 2024</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openCheckoutForModel(modelTitle)}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-slate-50 hover:bg-[#10b981] text-slate-800 hover:text-black font-bold text-[11px] sm:text-xs border border-slate-200 hover:border-[#10b981] transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="size-3 sm:size-3.5" /> Download (.SKP)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SOCIAL PROOF / ARCHITECT REVIEWS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-2xl font-black text-slate-900">What Designers & Architects Are Saying</h3>
          <p className="text-xs sm:text-sm text-slate-600">Real feedback from verified 3D visualizers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-left space-y-3 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "The lighting setup and proxy foliage in Model #4 alone saved me 15+ hours on a luxury villa client pitch. Absolute steal for $1."
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <img className="size-7 rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces" alt="Marcus T." />
              <div>
                <div className="text-xs font-bold text-slate-900">Marcus Thorne</div>
                <div className="text-[10px] text-slate-500">Archviz Lead, London</div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-left space-y-3 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "Clean layer organization, 8K PBR textures, and works right out of the box with Enscape and V-Ray. Unbelievable value."
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <img className="size-7 rounded-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces" alt="Elena R." />
              <div>
                <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
                <div className="text-[10px] text-slate-500">Interior Designer, Milan</div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-left space-y-3 shadow-2xs">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "Purchased on my phone in 30 seconds. Downloaded the .zip right away and opened in SketchUp 2024. 10/10 recommendation."
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <img className="size-7 rounded-full object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces" alt="David K." />
              <div>
                <div className="text-xs font-bold text-slate-900">David K.</div>
                <div className="text-[10px] text-slate-500">Freelance 3D Artist, Sydney</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & EMBEDDED CHECKOUT SECTION */}
      <section id="pricing" className="max-w-md mx-auto px-4 py-10 space-y-5 text-center">
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

        {/* EMBEDDED STRIPE CARD PAYMENT FORM */}
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

      {/* FAQ ACCORDION SECTION */}
      <section className="max-w-2xl mx-auto px-4 py-8 space-y-4 text-left">
        <div className="text-center space-y-1 pb-2">
          <h3 className="text-xl font-black text-slate-900">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-500">Everything you need to know about the $1 Starter Pack.</p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-3 cursor-pointer hover:text-emerald-700"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-600" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* STICKY BOTTOM MOBILE QUICK ACTION BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-xl flex items-center justify-between gap-3">
        <div className="text-left">
          <div className="text-sm font-black text-slate-900">20 Models • $1.00</div>
          <div className="text-[10px] text-emerald-600 font-bold">One-time payment</div>
        </div>
        <button
          onClick={scrollToCheckout}
          className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>Claim for $1.00</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* CHECKOUT POPUP MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
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
