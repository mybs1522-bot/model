"use client";

import { motion } from "framer-motion";

export interface PosterItem {
  id: string;
  categoryKey: string;
  src: string;
}

const POSTERS: PosterItem[] = [
  {
    id: "poster_apartment",
    categoryKey: "apartment",
    src: "/category-posters/poster_apartment.jpg",
  },
  {
    id: "poster_living",
    categoryKey: "apartment",
    src: "/category-posters/poster_living.jpg",
  },
  {
    id: "poster_exteriors",
    categoryKey: "exterior",
    src: "/category-posters/poster_exteriors.jpg",
  },
  {
    id: "poster_kitchen",
    categoryKey: "kitchen",
    src: "/category-posters/poster_kitchen.jpg",
  },
  {
    id: "poster_bedroom",
    categoryKey: "bedroom",
    src: "/category-posters/poster_bedroom.jpg",
  },
];

interface CategoryPostersSliderProps {
  onSelectCategory: (categoryKey: string) => void;
}

export function CategoryPostersSlider({ onSelectCategory }: CategoryPostersSliderProps) {
  // Duplicate array twice for seamless infinite looping animation
  const infinitePosters = [...POSTERS, ...POSTERS, ...POSTERS];

  return (
    <section className="py-8 bg-slate-50/60 border-b border-slate-200 overflow-hidden select-none">
      <div className="relative w-full flex items-center overflow-hidden">
        {/* Ambient Edge Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

        {/* Smooth Automatic Infinite Marquee Track */}
        <motion.div
          className="flex items-center gap-4 sm:gap-6 shrink-0"
          animate={{
            x: ["0%", "-33.333%"],
          }}
          transition={{
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {infinitePosters.map((poster, index) => (
            <motion.div
              key={`${poster.id}_${index}`}
              whileHover={{ scale: 1.03, y: -4 }}
              onClick={() => {
                onSelectCategory(poster.categoryKey);
                const elem = document.getElementById("models-directory");
                if (elem) elem.scrollIntoView({ behavior: "smooth" });
              }}
              className="relative shrink-0 w-[200px] sm:w-[240px] aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 hover:border-emerald-500 bg-white shadow-md hover:shadow-xl transition-all cursor-pointer group"
            >
              <img
                src={poster.src}
                alt="Category Poster"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
