"use client";

import React from "react";

// Official D5 Render SVG Brand Logo
export function D5RenderLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 135 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="28" height="28" rx="7" fill="url(#d5_grad)" />
      <path d="M10 11H16.5C19.5355 11 22 13.4645 22 16.5C22 19.5355 19.5355 22 16.5 22H10V11Z" fill="white" />
      <path d="M13.5 14.5H16.5C17.6046 14.5 18.5 15.3954 18.5 16.5C18.5 17.6046 17.6046 18.5 16.5 18.5H13.5V14.5Z" fill="#0B0F19" />
      <text x="36" y="23" fill="#0f172a" fontSize="15" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.8">
        D5 Render
      </text>
      <defs>
        <linearGradient id="d5_grad" x1="2" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Official Chaos V-Ray SVG Brand Logo
export function VRayLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 115 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="18" r="14" fill="#E11D48" />
      <path d="M10 12L16 24L22 12H18.8L16 18L13.2 12H10Z" fill="white" />
      <text x="36" y="23" fill="#0f172a" fontSize="15" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.8">
        V-Ray®
      </text>
    </svg>
  );
}

// Official Lumion SVG Brand Logo
export function LumionLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="28" height="28" rx="7" fill="#F97316" />
      <path d="M11 11V23H21" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="36" y="23" fill="#0f172a" fontSize="15" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.8">
        Lumion
      </text>
    </svg>
  );
}

// Official Trimble SketchUp SVG Brand Logo
export function SketchUpLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="28" height="28" rx="6" fill="#005F9E" />
      <path d="M8 12L16 8L24 12L16 16L8 12Z" fill="#E2E8F0" />
      <path d="M8 12L16 16V24L8 20V12Z" fill="#94A3B8" />
      <path d="M16 16L24 12V20L16 24V16Z" fill="#FFFFFF" />
      <text x="36" y="23" fill="#0f172a" fontSize="15" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.8">
        SketchUp
      </text>
    </svg>
  );
}

/**
 * Official Render Engine Trust Banner
 */
export function RenderEngineTrustBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 py-3 ${className}`}>
      <span className="text-[11px] font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
        Official Compatibility & Support
      </span>

      <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3.5 px-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 backdrop-blur-xl shadow-sm">
        {/* D5 Render Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#3B82F6] hover:bg-white transition duration-300 shadow-xs">
          <D5RenderLogo className="h-5 w-auto" />
        </div>

        {/* Chaos V-Ray Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#E11D48] hover:bg-white transition duration-300 shadow-xs">
          <VRayLogo className="h-5 w-auto" />
        </div>

        {/* Lumion Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#F97316] hover:bg-white transition duration-300 shadow-xs">
          <LumionLogo className="h-5 w-auto" />
        </div>

        {/* SketchUp Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-[#005F9E] hover:bg-white transition duration-300 shadow-xs">
          <SketchUpLogo className="h-5 w-auto" />
        </div>
      </div>
    </div>
  );
}
