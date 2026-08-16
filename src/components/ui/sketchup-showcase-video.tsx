"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import publicModels from "@/data/publicModelsImages.json";
import { MousePointer, Download, CheckCircle2 } from "lucide-react";

export function SketchUpShowcaseVideo() {
  const [step, setStep] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(7);

  const images = publicModels;

  // 24 high-quality renders across all categories
  const wallImages = useMemo(() => {
    return images.slice(0, 24);
  }, [images]);

  useEffect(() => {
    // 7.5s ultra-smooth loop
    const timer = setInterval(() => {
      setStep((prevStep) => {
        if (prevStep === 0) return 1;
        if (prevStep === 1) return 2;
        if (prevStep === 2) return 3;
        setSelectedIndex((prevIdx) => (prevIdx + 5) % wallImages.length);
        return 0;
      });
    }, 1875);

    return () => clearInterval(timer);
  }, [wallImages.length]);

  const selectedModel = wallImages[selectedIndex] || wallImages[0];

  // Format category titles nicely
  const displayTitle = useMemo(() => {
    const cat = selectedModel.category || "Living";
    return `Modern ${cat} Scene`;
  }, [selectedModel]);

  return (
    <div className="relative w-full rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xl select-none group">
      {/* Sleek Floating Header Badge */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-md">
        <div className="size-5 rounded-md bg-[#ea4335] text-white font-black text-[9px] flex items-center justify-center tracking-tighter shadow-2xs">
          SKP
        </div>
        <span className="text-xs font-bold text-slate-800">SketchUp Vault</span>
        <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
      </div>

      {/* Main Viewport Window */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
        {/* 24-Image Wall Grid */}
        <div className="absolute inset-0 p-2 sm:p-3 grid grid-cols-6 grid-rows-4 gap-1.5 sm:gap-2">
          {wallImages.map((img, idx) => {
            const isTarget = idx === selectedIndex;
            return (
              <motion.div
                key={idx}
                animate={{
                  scale: isTarget && step >= 1 ? 1.08 : 1,
                  borderColor: isTarget && step >= 1 ? "#10b981" : "#e2e8f0",
                  zIndex: isTarget && step >= 1 ? 30 : 1,
                }}
                className={`relative rounded-xl overflow-hidden border bg-white transition-all ${
                  isTarget ? "ring-2 ring-[#10b981] shadow-xl" : "border-slate-200 opacity-90"
                }`}
              >
                <img src={img.relPath} alt={img.name} className="w-full h-full object-cover" />

                {isTarget && step === 1 && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute inset-0 m-auto size-8 rounded-full border-2 border-[#10b981] bg-[#10b981]/30 pointer-events-none"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Subtle Ambient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-slate-900/10 pointer-events-none z-10" />

        {/* Cursor Motion */}
        <motion.div
          animate={{
            x: step === 0 ? -120 : step === 1 ? (selectedIndex % 6 - 2.5) * 55 : 0,
            y: step === 0 ? -60 : step === 1 ? (Math.floor(selectedIndex / 6) - 1.5) * 35 : 0,
            scale: step === 1 ? [1, 0.8, 1] : 1,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute z-40 pointer-events-none drop-shadow-lg"
        >
          <MousePointer className="size-6 text-slate-900 fill-white stroke-slate-900 stroke-2" />
        </motion.div>

        {/* Minimal Impactful Action Overlay */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute z-50 max-w-xs w-full mx-4 bg-white/95 backdrop-blur-xl border border-emerald-400 rounded-2xl p-4 shadow-2xl text-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-[#ea4335] text-white font-black text-[10px] flex items-center justify-center shadow-md">
                    SKP
                  </div>
                  <div className="text-xs font-black text-slate-900">{displayTitle}</div>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-500">{selectedModel.category}</span>
              </div>

              {step === 2 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Download className="size-3.5 text-emerald-600 animate-bounce" /> Downloading .SKP
                    </span>
                    <span className="text-emerald-600 font-mono">100%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.1, ease: "easeInOut" }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-2 px-3 rounded-xl bg-emerald-500 text-black font-extrabold flex items-center justify-center gap-2 text-xs shadow-sm"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-black" />
                  <span>Imported into SketchUp Pro</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
