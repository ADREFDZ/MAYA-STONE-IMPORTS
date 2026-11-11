"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { preloadImage } from "@/lib/utils/preloadImage";
import SectionLabel from "@/components/ui/SectionLabel";

interface CollectionHeroProps {
  dict: {
    collection_page?: {
      meta?: string;
      title?: string;
      subtitle?: string;
      hero_image_alt?: string;
      prev_photo?: string;
      next_photo?: string;
    };
    meta?: string;
    title?: string;
    subtitle?: string;
  };
  lang?: "es" | "en";
  images?: string[];
}

const DEFAULT_BACKGROUND_IMAGES = [
  "/images/ColeccionesCarrusel1.png",
  "/images/ColeccionesCarrusel2.png",
  "/images/ColeccionesCarrusel3.png",
  "/images/ColeccionesCarrusel4.png",
  "/images/ColeccionesCarrusel5.png",
];

const CYCLE_MS = 6500;

export default function CollectionHero({
  dict,
  lang = "es",
  images,
}: CollectionHeroProps) {
  const t = dict?.collection_page || dict;

  const backgroundList = useMemo(() => {
    return images && images.length > 0 ? images : DEFAULT_BACKGROUND_IMAGES;
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Doble buffer para transición continua sin destellos
  const [imageBuffer, setImageBuffer] = useState<{
    current: string;
    previous: string | null;
    isLoaded: boolean;
  }>({
    current: backgroundList[0],
    previous: null,
    isLoaded: true,
  });

  const lastImageRef = useRef(backgroundList[0]);
  const currentImage = backgroundList[activeIndex] || backgroundList[0];

  useEffect(() => {
    if (!currentImage) return;
    if (currentImage !== lastImageRef.current) {
      const oldImg = lastImageRef.current;
      lastImageRef.current = currentImage;
      setImageBuffer({
        current: currentImage,
        previous: oldImg,
        isLoaded: false,
      });
    }
  }, [currentImage]);

  useEffect(() => {
    if (imageBuffer.isLoaded && imageBuffer.previous) {
      const timer = setTimeout(() => {
        setImageBuffer((prev) => ({ ...prev, previous: null }));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [imageBuffer.isLoaded, imageBuffer.previous]);

  // Precarga el resto de portadas para que cada cambio sea inmediato
  useEffect(() => {
    if (backgroundList.length <= 1) return;
    const t = window.setTimeout(() => {
      for (const src of backgroundList.slice(1)) preloadImage(src, "100vw");
    }, 1200);
    return () => window.clearTimeout(t);
  }, [backgroundList]);

  // Rotación automática continua
  useEffect(() => {
    if (isPaused || backgroundList.length <= 1) return;

    const tick = 50;
    const step = (tick / CYCLE_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((curr) => (curr + 1) % backgroundList.length);
          return 0;
        }
        return prev + step;
      });
    }, tick);

    return () => clearInterval(timer);
  }, [isPaused, backgroundList.length]);

  const goTo = (index: number) => {
    setActiveIndex((index + backgroundList.length) % backgroundList.length);
    setProgress(0);
  };

  return (
    <section
      aria-label={t?.title}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[100svh] min-h-[560px] bg-black-neutral text-white overflow-hidden select-none"
    >
      {/* =========================================================
          1. LIENZO FOTOGRÁFICO DE ALTA DEFINICIÓN (PNG NATIVO)
          ========================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black-pure">
        {imageBuffer.previous && (
          <div className="absolute inset-0 pointer-events-none z-0">
            <Image
              src={imageBuffer.previous}
              alt=""
              fill
              priority
              unoptimized
              sizes="100vw"
              style={{
                objectFit: "cover",
                objectPosition: "center 42%",
              }}
              className="pointer-events-none"
            />
          </div>
        )}

        {imageBuffer.current && (
          <div
            className={`absolute inset-0 z-10 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              imageBuffer.isLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={imageBuffer.current}
              alt={dict.collection_page?.hero_image_alt || t?.title || ""}
              fill
              priority
              unoptimized
              sizes="100vw"
              style={{
                objectFit: "cover",
                objectPosition: "center 42%",
              }}
              onLoad={() =>
                setImageBuffer((prev) => ({ ...prev, isLoaded: true }))
              }
              className="pointer-events-none"
            />
          </div>
        )}

        {/* Gradientes arquitectónicos de alta legibilidad para móvil y desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black-pure/95 via-black-pure/40 to-black-pure/15 z-20 pointer-events-none" />
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-black-pure/75 via-black-pure/25 to-transparent z-20 pointer-events-none" />
      </div>

      {/* =========================================================
          2. CONTENIDO FIJO DEL DICCIONARIO (JUSTIFICADO ABAJO A LA IZQUIERDA)
          ========================================================= */}
      <div className="relative z-30 w-full h-full flex flex-col justify-end p-5 sm:p-10 lg:p-16 xl:p-20 pb-8 sm:pb-12 lg:pb-14 pointer-events-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-end">
          {/* Bloque tipográfico */}
          <div className="lg:col-span-8 space-y-2.5 sm:space-y-4 pointer-events-auto max-w-2xl text-left">
            {(t?.meta || dict?.meta) && (
              <div className="space-y-1 sm:space-y-1.5">
                <SectionLabel variant="minimal" theme="accent">
                  {t?.meta || dict?.meta}
                </SectionLabel>
                <div className="h-px w-8 sm:w-12 bg-white/20" />
              </div>
            )}

            {(t?.title || dict?.title) && (
              <h1 className="font-sans font-light tracking-editorial text-[clamp(1.85rem,6.5vw,3.75rem)] uppercase text-white leading-[1.02] text-balance">
                {t?.title || dict?.title}
              </h1>
            )}

            <div className="pt-0.5">
              <span
                aria-hidden="true"
                className="block h-px w-8 sm:w-12 bg-accent/80"
              />
            </div>

            {(t?.subtitle || dict?.subtitle) && (
              <p className="font-sans font-light text-[0.88rem] sm:text-maya-small lg:text-maya-body text-gray-warm/85 leading-relaxed max-w-xl">
                {t?.subtitle || dict?.subtitle}
              </p>
            )}
          </div>

          {/* =========================================================
              3. CONTROLES MINIMALISTAS DEL CARRUSEL (ABAJO A LA DERECHA)
              ========================================================= */}
          {backgroundList.length > 1 && (
            <div className="lg:col-span-4 flex items-center justify-between lg:justify-end gap-3.5 sm:gap-5 pointer-events-auto pt-2 lg:pt-0">
              {/* Barras de progreso de las 5 fotos */}
              <div className="flex items-center gap-1.5">
                {backgroundList.map((_, idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goTo(idx)}
                      aria-label={`Fotografía ${idx + 1}`}
                      className="group py-2 cursor-pointer flex items-center"
                    >
                      <span
                        className={`block h-1 rounded-full transition-all duration-500 overflow-hidden bg-white/25 ${
                          isActive
                            ? "w-7 sm:w-10 bg-white/45"
                            : "w-2.5 sm:w-3.5 group-hover:bg-white/40"
                        }`}
                      >
                        {isActive && (
                          <span
                            className="block h-full bg-accent transition-all duration-75"
                            style={{ width: `${progress}%` }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Botones de navegación directa */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  aria-label={dict.collection_page?.prev_photo}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black-pure/40 backdrop-blur-md flex items-center justify-center font-mono text-xs text-white hover:border-accent hover:text-accent-ink transition-colors cursor-pointer active:scale-90"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  aria-label={dict.collection_page?.next_photo}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black-pure/40 backdrop-blur-md flex items-center justify-center font-mono text-xs text-white hover:border-accent hover:text-accent-ink transition-colors cursor-pointer active:scale-90"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
