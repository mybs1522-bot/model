'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, Sparkles, Timer, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from './badge';
import { BorderTrail } from './border-trail';
import publicModels from '@/data/publicModelsImages.json';
import { CardPaymentForm } from './card-payment-form';

export interface PricingProps {
  onSuccess?: () => void;
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

export function Pricing({ onSuccess }: PricingProps) {
  const countdown = useEvergreenTimer();

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
              <Sparkles className="size-3.5 text-emerald-600" /> $0.00 Due Today • 7-Day All Access Trial
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl text-slate-900">
            Start Your 7-Day Free Trial
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
            Instant unrestricted access to 3,000+ SketchUp (.SKP) scene files, furniture models & 8K PBR textures. Cancel anytime with 1 click.
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
            <div className="relative bg-white border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 sm:space-y-5">
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
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Timer className="size-4 text-emerald-600 animate-pulse" />
                  <span>Free Trial Offer Reserved For:</span>
                </div>
                <div className="font-mono font-black text-xs text-emerald-700 tracking-wider bg-white px-2.5 py-0.5 rounded-xl border border-emerald-300 shadow-2xs">
                  {countdown}
                </div>
              </div>

              {/* 20+ OVERLAPPING CIRCULAR MODEL THUMBNAILS STRIP */}
              <div className="space-y-1 py-0.5 text-center">
                <div className="flex items-center justify-center -space-x-2 overflow-x-auto scrollbar-none py-1 px-1 max-w-full">
                  {publicModels.slice(0, 18).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.relPath}
                      alt="Model thumbnail"
                      className="size-6.5 sm:size-7.5 rounded-full border-2 border-white object-cover shrink-0 shadow-sm hover:scale-125 hover:z-30 transition-transform duration-300"
                    />
                  ))}
                </div>
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    <Sparkles className="size-3 text-emerald-600" /> 3,000+ SketchUp (.SKP) scenes unlocked
                  </span>
                </div>
              </div>

              {/* Plan Title & Price */}
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    7-Day VIP All-Access Trial
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm font-bold line-through">$29</span>
                    <Badge className="bg-[#10b981] text-black font-extrabold text-[10px] sm:text-xs">100% FREE TODAY</Badge>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-500 text-xl font-bold">$</span>
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">0</span>
                  <span className="text-emerald-700 text-xs font-mono font-bold">/ 7 days free ($29 after trial)</span>
                </div>
                <p className="text-slate-600 text-xs font-medium">Download everything immediately. Cancel anytime with 1 click before day 7.</p>
              </div>

              {/* Included Features List */}
              <div className="space-y-2 pt-1 border-t border-slate-200 text-xs text-left">
                {[
                  'Instant access to all 3,000+ SketchUp (.SKP) scene models',
                  'Full commercial license — edit & pitch directly to clients',
                  'Includes 8K PBR textures + Free SketchUp Course Included',
                  'Full access to Master Vault bulk downloads & category .ZIPs',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700 font-medium">
                    <div className="size-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                    <span className="text-[11px] sm:text-xs">{feature}</span>
                  </div>
                ))}
              </div>

              {/* DIRECT EMBEDDED COMPACT CARD PAYMENT FORM */}
              <div className="pt-1">
                <CardPaymentForm
                  sourceLocation="pricing_section_trial_0"
                  buttonText="Start 7-Day Free Trial ($0 Due Today)"
                  allowSavedCard={false}
                  amountInCents={0}
                  isTrial={true}
                  hideOrderDetails={true}
                  itemTotal="$29.00"
                  deliveryFee="$0.00"
                  discountAmount="-$29.00"
                  totalPrice="$0.00"
                  deliveryAddressLine1="7-Day VIP Access: All 3,000+ SketchUp (.SKP) Models"
                  deliveryAddressLine2="+ Free SketchUp Course & 8K Textures Included"
                  onSuccess={onSuccess}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
