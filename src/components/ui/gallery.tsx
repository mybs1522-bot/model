import { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const PhotoGallery = ({
  animationDelay = 0.5,
  onExploreClick,
}: {
  animationDelay?: number;
  onExploreClick?: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // First make the container visible with a fade-in
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);

    // Then start the photo animations after a short delay
    const animationTimer = setTimeout(
      () => {
        setIsLoaded(true);
      },
      (animationDelay + 0.4) * 1000
    );

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [animationDelay]);

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  type Direction = "left" | "right";

  // Animation variants for each photo
  const photoVariants: any = {
    hidden: () => ({
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
    }),
    visible: (custom: { x: any; y: any; order: number }) => ({
      x: custom.x,
      y: custom.y,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 12,
        mass: 1,
        delay: custom.order * 0.15,
      },
    }),
  };

  // Photo positions - 5 High Quality 3D SketchUp Model Renders (Scaled to fit container)
  const photos = [
    {
      id: 1,
      order: 0,
      x: "-150px",
      y: "8px",
      zIndex: 50,
      direction: "left" as Direction,
      title: "Modern Dark Lounge",
      src: "/gallery-renders/render_1.jpg",
    },
    {
      id: 2,
      order: 1,
      x: "-75px",
      y: "22px",
      zIndex: 40,
      direction: "left" as Direction,
      title: "Warm Wood Salon",
      src: "/gallery-renders/render_2.jpg",
    },
    {
      id: 3,
      order: 2,
      x: "0px",
      y: "4px",
      zIndex: 30,
      direction: "right" as Direction,
      title: "Minimal Wabi-Sabi Living",
      src: "/gallery-renders/render_3.jpg",
    },
    {
      id: 4,
      order: 3,
      x: "75px",
      y: "16px",
      zIndex: 20,
      direction: "right" as Direction,
      title: "Modern Fireplace Suite",
      src: "/gallery-renders/render_4.jpg",
    },
    {
      id: 5,
      order: 4,
      x: "150px",
      y: "28px",
      zIndex: 10,
      direction: "left" as Direction,
      title: "Tropical Archviz Corner",
      src: "/gallery-renders/render_5.jpg",
    },
  ];

  return (
    <div className="relative py-2 sm:py-4 w-full">
      <div className="absolute inset-0 max-md:hidden top-[50px] -z-10 h-[220px] w-full bg-transparent bg-[linear-gradient(to_right,#1b202e_1px,transparent_1px),linear-gradient(to_bottom,#1b202e_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] opacity-25 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      <p className="my-1 text-center text-[11px] font-mono uppercase tracking-widest text-slate-400">
        Curated SketchUp (.SKP) Vault
      </p>
      <h3 className="z-20 mx-auto max-w-2xl justify-center text-center text-lg sm:text-2xl font-black text-white">
        Interactive 3D <span className="text-[#10b981]">Model Gallery</span>
      </h3>
      <div className="relative mb-4 h-[220px] sm:h-[240px] w-full items-center justify-center flex overflow-visible">
        <motion.div
          className="relative mx-auto flex w-full max-w-7xl justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
        >
          <motion.div
            className="relative flex w-full justify-center"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <div className="relative h-[140px] w-[140px] sm:h-[150px] sm:w-[150px]">
              {/* Render photos in reverse order so that higher z-index photos are rendered later in DOM */}
              {[...photos].reverse().map((photo) => (
                <motion.div
                  key={photo.id}
                  className="absolute left-0 top-0"
                  style={{ zIndex: photo.zIndex }}
                  variants={photoVariants}
                  custom={{
                    x: photo.x,
                    y: photo.y,
                    order: photo.order,
                  }}
                >
                  <Photo
                    width={140}
                    height={140}
                    src={photo.src}
                    alt={photo.title}
                    direction={photo.direction}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <div className="flex w-full justify-center">
        <Button onClick={onExploreClick} className="bg-white text-black font-bold hover:bg-slate-200 shadow-md text-xs py-1.5 h-9">
          Explore All 3,000+ Models
        </Button>
      </div>
    </div>
  );
};

function getRandomNumberInRange(min: number, max: number): number {
  if (min >= max) {
    throw new Error("Min value should be less than max value");
  }
  return Math.random() * (max - min) + min;
}

type Direction = "left" | "right";

export const Photo = ({
  src,
  alt,
  className,
  direction,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  direction?: Direction;
  width: number;
  height: number;
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  useEffect(() => {
    const randomRotation =
      getRandomNumberInRange(1, 4) * (direction === "left" ? -1 : 1);
    setRotation(randomRotation);
  }, [direction]);

  function handleMouse(event: {
    currentTarget: { getBoundingClientRect: () => any };
    clientX: number;
    clientY: number;
  }) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  const resetMouse = () => {
    x.set(200);
    y.set(200);
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      whileTap={{ scale: 1.2, zIndex: 9999 }}
      whileHover={{
        scale: 1.1,
        rotateZ: 2 * (direction === "left" ? -1 : 1),
        zIndex: 9999,
      }}
      whileDrag={{
        scale: 1.1,
        zIndex: 9999,
      }}
      initial={{ rotate: 0 }}
      animate={{ rotate: rotation }}
      style={{
        width,
        height,
        perspective: 400,
        transform: `rotate(0deg) rotateX(0deg) rotateY(0deg)`,
        zIndex: 1,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
      }}
      className={cn(
        className,
        "relative mx-auto shrink-0 cursor-grab active:cursor-grabbing"
      )}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      draggable={false}
      tabIndex={0}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-xl border-2 border-[#232838] bg-[#0c0e14] isolate">
        <img
          className="h-full w-full rounded-2xl object-cover"
          src={src}
          alt={alt}
          draggable={false}
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-center text-[10px] font-extrabold text-white truncate rounded-b-2xl">
          {alt}
        </div>
      </div>
    </motion.div>
  );
};
