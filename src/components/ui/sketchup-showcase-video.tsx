"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import publicModels from "@/data/publicModelsImages.json";
import { MousePointer, Download, CheckCircle2, Sparkles } from "lucide-react";

export function SketchUpShowcaseVideo() {
  // Phase: 0 = smooth scrolling (3.5s), 1 = target hover & click (1s), 2 = download in progress (1.4s), 3 = downloaded success (1.6s)
  const [phase, setPhase] = useState<number>(0);
  const [targetIdx, setTargetIdx] = useState<number>(26); // Row 5, Col 3

  // Use 36 curated high-res models (6 cols x 6 rows) - lightweight & butter smooth
  const showcaseModels = useMemo(() => {
    return publicModels.slice(0, 36);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 0) {
      // Scroll smoothly for 3.2s then stop on target
      timer = setTimeout(() => setPhase(1), 3200);
    } else if (phase === 1) {
      // Hover & click for 1s then show download
      timer = setTimeout(() => setPhase(2), 1000);
    } else if (phase === 2) {
      // Downloading progress for 1.4s
      timer = setTimeout(() => setPhase(3), 1400);
    } else if (phase === 3) {
      // Success screen for 1.8s, then pick a new random target and restart scroll
      timer = setTimeout(() => {
        const randomTarget = Math.floor(Math.random() * 12) + 20; // pick from row 4 to 6
        setTargetIdx(randomTarget);
        setPhase(0);
      }, 1800);
    }

    return () => clearTimeout(timer);
  }, [phase]);

  const targetModel = showcaseModels[targetIdx] || showcaseModels[26];
  const targetCol = targetIdx % 6; // 0 to 5
  const targetRow = Math.floor(targetIdx / 6); // 0 to 5

  // Scroll distance: 6 rows total. Viewport shows ~3 rows.
  // When scrolling, scroll down by translating Y upwards to reveal lower rows.
  const scrollTranslateY = phase === 0 ? "0%" : `-${(targetRow - 1.2) * 16.66}%`;

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl bg-slate-900 border-2 border-slate-800/80 overflow-hidden shadow-2xl select-none group">
      {/* Top Window Bar (macOS / SketchUp Pro Style) */}
      <div className="h-9 bg-slate-950/95 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between z-30 relative backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-rose-500/80" />
          <div className="size-2.5 rounded-full bg-amber-500/80" />
          <div className="size-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-[10px] font-mono text-slate-400 font-semibold hidden sm:inline">
            SketchUp Pro • 3,000+ Asset Vault
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-black text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>3,000+ .SKP MODELS</span>
          </div>
        </div>
      </div>

      {/* Main Viewport Window */}
      <div className="relative aspect-[16/11] sm:aspect-[16/10] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* GPU-Accelerated Smooth Scrolling Grid Container */}
        <motion.div
          className="absolute inset-x-0 top-0 p-2 sm:p-3 grid grid-cols-6 gap-1.5 sm:gap-2.5 w-full will-change-transform"
          initial={{ y: "0%" }}
          animate={{ y: scrollTranslateY }}
          transition={{
            duration: phase === 0 ? 0 : 3.0,
            ease: [0.16, 1, 0.3, 1], // Super smooth cubic-bezier glide
          }}
        >
          {showcaseModels.map((model, idx) => {
            const isTarget = idx === targetIdx;
            const isClicked = isTarget && phase >= 1;

            return (
              <div
                key={model.relPath || idx}
                className={`relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-900 border transition-all duration-300 ${
                  isClicked
                    ? "ring-2 sm:ring-4 ring-emerald-400 scale-105 z-20 shadow-2xl border-emerald-400"
                    : "border-slate-800/80 opacity-80"
                }`}
              >
                <img
                  src={model.relPath}
                  alt={model.name || "SketchUp Model"}
                  loading="eager"
                  className="w-full h-full object-cover"
                />

                {/* SKP Tag Badge on Cards */}
                <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-xs px-1 py-0.5 rounded text-[7px] font-black text-emerald-400 border border-emerald-500/30">
                  .SKP
                </div>

                {/* Target Click Pulse Ring */}
                {isTarget && phase === 1 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    className="absolute inset-0 m-auto size-10 rounded-full border-2 border-emerald-400 bg-emerald-400/30 pointer-events-none"
                  />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Ambient Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 pointer-events-none z-10" />

        {/* Animated Mouse Cursor */}
        <motion.div
          animate={{
            x: phase === 0 ? 120 : (targetCol - 2.5) * 52,
            y: phase === 0 ? 140 : phase === 1 ? -10 : 0,
            scale: phase === 1 ? [1, 0.8, 1] : 1,
            opacity: phase === 0 ? 0 : 1,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute z-40 pointer-events-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
        >
          <MousePointer className="size-6 sm:size-7 text-white fill-emerald-400 stroke-slate-950 stroke-2" />
        </motion.div>

        {/* Download Action Popup Modal */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute bottom-3 sm:bottom-4 z-50 max-w-[340px] w-[92%] bg-slate-900/95 backdrop-blur-xl border border-emerald-500/60 rounded-2xl p-3.5 sm:p-4 shadow-2xl text-white space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                    SKP
                  </div>
                  <div>
                    <div className="text-xs font-black text-white truncate max-w-[160px] sm:max-w-[180px]">
                      {targetModel.name || "Modern Luxury Villa Scene"}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Sparkles className="size-2.5" /> 8K PBR Textures Included
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                  142 MB
                </span>
              </div>

              {/* Progress Bar during Phase 2 */}
              {phase === 2 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Download className="size-3 text-emerald-400 animate-bounce" /> Downloading .SKP Scene...
                    </span>
                    <span className="text-emerald-400 font-mono">100%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.1, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Instant Success State in Phase 3 */}
              {phase === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center gap-2 text-xs shadow-lg"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-slate-950" />
                  <span>Imported into SketchUp (V-Ray / D5 Ready)</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


