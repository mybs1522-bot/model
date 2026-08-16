'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, Sparkles, Timer, Check, Zap, CreditCard, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from './badge';
import { BorderTrail } from './border-trail';
import publicModels from '@/data/publicModelsImages.json';

export interface PricingProps {
  onSelectPlan?: (plan?: string) => void;
  onSkip?: () => void;
  isProcessing?: boolean;
}

// 2-Hour Evergreen Countdown Timer Hook
export function useEvergreenTimer() {
  const [formattedTime, setFormattedTime] = useState<string>('01:58:42');

  useEffect(() => {
    const STORAGE_KEY = 'avada_timer_end_timestamp';
    let endTimeStr = localStorage.getItem(STORAGE_KEY);
    let endTime: number;

    if (!endTimeStr || isNaN(Number(endTimeStr))) {
      endTime = Date.now() + 2 * 60 * 60 * 1000; // 2 Hours from now
      localStorage.setItem(STORAGE_KEY, endTime.toString());
    } else {
      endTime = Number(endTimeStr);
      if (endTime < Date.now()) {
        // Reset timer if expired for continuous evergreen urgency
        endTime = Date.now() + 2 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, endTime.toString());
      }
    }

    const updateTimer = () => {
      const remaining = Math.max(0, endTime - Date.now());
      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);
      const seconds = Math.floor((remaining / 1000) % 60);

      const pad = (n: number) => String(n).padStart(2, '0');
      setFormattedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);

      if (remaining <= 0) {
        const newEndTime = Date.now() + 2 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, newEndTime.toString());
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return formattedTime;
}

export function Pricing({ onSelectPlan, onSkip, isProcessing = false }: PricingProps) {
  const countdown = useEvergreenTimer();
  const savedLast4 = typeof window !== 'undefined' ? (localStorage.getItem('avada_user_last4') || '4242') : '4242';
  const savedEmail = typeof window !== 'undefined' ? (localStorage.getItem('avada_user_email') || '') : '';

  return (
    <section id="pricing" className="relative overflow-hidden py-16 sm:py-24 text-slate-900 border-t border-slate-200">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4">
        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl space-y-3 text-center"
        >
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 font-mono text-xs font-bold text-emerald-700 shadow-xs">
              <Sparkles className="size-3.5 text-emerald-600" /> Single One-Time Payment • No Subscription
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Get Full Lifetime Access Today
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
            Unlimited access to 3,000+ SketchUp (.SKP) scene files, furniture models & 8K PBR textures.
          </p>
        </motion.div>

        {/* SINGLE PRICING CARD WITH EVERGREEN TIMER */}
        <div className="relative pt-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mx-auto w-full max-w-lg"
          >
            {/* Card Shell */}
            <div className="relative bg-white border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <BorderTrail
                style={{
                  boxShadow:
                    '0px 0px 30px 10px rgba(16, 185, 129, 0.35)',
                }}
                size={90}
              />

              <PlusIcon className="absolute -top-3 -left-3 size-5 text-slate-400" />
              <PlusIcon className="absolute -top-3 -right-3 size-5 text-slate-400" />
              <PlusIcon className="absolute -bottom-3 -left-3 size-5 text-slate-400" />
              <PlusIcon className="absolute -right-3 -bottom-3 size-5 text-slate-400" />

              {/* EVERGREEN 2-HOUR DISCOUNT TIMER BADGE */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Timer className="size-4 text-emerald-600 animate-pulse" />
                  <span>Mega Discount Ends In:</span>
                </div>
                <div className="font-mono font-black text-sm text-emerald-700 tracking-wider bg-white px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                  {countdown}
                </div>
              </div>

              {/* 20+ OVERLAPPING CIRCULAR MODEL THUMBNAILS STRIP */}
              <div className="space-y-2 py-1 text-center">
                <div className="flex items-center justify-center -space-x-2.5 overflow-x-auto scrollbar-none py-1.5 px-2 max-w-full">
                  {publicModels.slice(0, 24).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.relPath}
                      alt="Model thumbnail"
                      className="size-7.5 sm:size-8 rounded-full border-2 border-white object-cover shrink-0 shadow-sm hover:scale-125 hover:z-30 transition-transform duration-300"
                    />
                  ))}
                </div>
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <Sparkles className="size-3.5 text-emerald-600" /> 3,000+ SketchUp (.SKP) scenes
                  </span>
                </div>
              </div>

              {/* Plan Title & Price */}
              <div className="space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Lifetime VIP Pass
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-base font-bold line-through">$99</span>
                    <Badge className="bg-[#10b981] text-black font-extrabold text-xs">70% OFF</Badge>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-slate-500 text-2xl font-bold">$</span>
                  <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">29</span>
                  <span className="text-slate-500 text-xs font-mono font-semibold">/ one-time pay</span>
                </div>
                <p className="text-slate-600 text-xs font-medium">Pay once, download forever. No recurring monthly fees.</p>
              </div>

              {/* Included Features List */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                {[
                  'Instant access to 3,000+ SketchUp (.SKP) scene models',
                  'Full commercial license — edit & sell to your clients',
                  'High quality models to get paid like top designers',
                  'Includes 8K PBR textures, furniture & archviz packs',
                  'Free lifetime updates with new weekly model drops',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-slate-700 font-medium">
                    <div className="size-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* 1-Click Upgrade CTA Action */}
              <div className="pt-3 space-y-3 text-center">
                <button
                  type="button"
                  onClick={() => onSelectPlan?.('lifetime')}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-black font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer border-2 border-emerald-400"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Charging Card on File...
                    </span>
                  ) : (
                    <>
                      <Zap className="size-5 fill-current" />
                      <span>⚡️ 1-Click Upgrade • Charge $29</span>
                    </>
                  )}
                </button>

                {/* Card on file indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
                  <CreditCard className="size-3.5 text-emerald-600" />
                  <span>Charge to card on file: <strong className="font-mono text-slate-900">•••• {savedLast4}</strong></span>
                  {savedEmail && (
                    <span className="hidden sm:inline text-slate-400">({savedEmail})</span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>Instant 1-Click Activation • 256-Bit Encrypted</span>
                </div>

                {/* Decline Link */}
                {onSkip && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onSkip}
                      className="text-xs text-slate-500 hover:text-slate-800 font-mono underline transition cursor-pointer"
                    >
                      No thanks, I'll keep my 20 models and continue to my download →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
