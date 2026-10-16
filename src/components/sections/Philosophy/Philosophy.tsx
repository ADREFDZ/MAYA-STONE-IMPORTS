"use client";

import { useEffect, useRef } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface PillarData {
  label?: string;
  title: string;
  desc: string;
  image?: string;
}

interface PhilosophyProps {
  lang?: string;
  dict: {
    section_label: string;
    title: string;
    description: string;
    cta_studio: string;
    pillars: PillarData[];
  };
}

const DEFAULT_PILLAR_IMAGES = [
  "/images/Cantera.jpg",
  "/images/Reunion.jpg",
  "/images/Showroom1.jpg",
  "/images/estudio-conviccion.jpg",
];

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy({ dict, lang = "es" }: PhilosophyProps) {
  const containerRef = useRef<HTMLElement>(null);
  const secondaryImagesRef = useRef<HTMLDivElement>(null);
  const { ref: sliderRef, handlers: dragScroll } = useDragScroll<HTMLDivElement>();

  const currentLocale: Locale = lang === "en" ? "en" : "es";

  /*
   * =========================================
   * PARALLAX
   * =========================================
   */
  useEffect(() => {
    if (!containerRef.current || !secondaryImagesRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      if (window.innerWidth >= 1024) {
        gsap.to(secondaryImagesRef.current, {
          y: -30,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);


  return (
    <section
      ref={containerRef}
      className="relative w-full bg-background text-text-primary overflow-hidden border-t border-border-light maya-section font-sans"
    >
      <div className="editorial-container relative z-20 space-y-10 sm:space-y-14 md:space-y-20">
        {/* =========================================
            BLOQUE 1: MANIFIESTO & MOSAICO
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center">
          <div className="lg:col-span-5 space-y-3.5 sm:space-y-5">
            <SectionLabel theme="accent">{dict.section_label}</SectionLabel>

            <h2 className="font-sans font-light tracking-editorial text-maya-h2 text-text-primary uppercase">
              {dict.title}
            </h2>

            <p className="font-sans font-normal text-maya-body text-text-secondary leading-relaxed">
              {dict.description}
            </p>

            <div className="pt-1 sm:pt-2">
              <Button
                href={`/${ROUTES.about[currentLocale]}`}
                variant="ghost"
                size="sm"
                icon={<span className="text-xs">→</span>}
                iconPosition="right"
              >
                {dict.cta_studio}
              </Button>
            </div>
          </div>

          {/* =========================================
              MOSAICO DE IMÁGENES
              ========================================= */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-y-8 sm:gap-5 lg:gap-6 w-full items-center">
            {/* IMAGEN PRINCIPAL */}
            <div className="sm:col-span-7 relative w-full  overflow-hidden group rounded-2xs aspect-square sm:aspect-4/5 shadow-2xs">
              <Image
                src="/images/Draw.jpg"
                alt={dict.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-103"
              />
            </div>

            {/* IMÁGENES SECUNDARIAS */}
            <div
              ref={secondaryImagesRef}
              className="sm:col-span-5 flex flex-row sm:flex-col gap-3.5 sm:gap-5 justify-between"
            >
              <div className="relative w-1/2 sm:w-full overflow-hidden group rounded-2xs aspect-square shadow-2xs">
                <Image
                  src="/images/MayaPlanos2.jpg"
                  alt={dict.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
              </div>

              <div className="relative w-1/2 sm:w-full overflow-hidden group rounded-2xs aspect-square shadow-2xs">
                <Image
                  src="/images/MacroRiva.jpg"
                  alt={dict.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            BLOQUE 2: PILARES (CARRUSEL MÓVIL / GRID DESKTOP)
            ========================================= */}
        <div className="pt-6 pb-2 sm:pb-6 border-t border-border-light overflow-hidden grayscale-90">
          {/* Contenedor del carrusel */}
          <div
            ref={sliderRef}
            {...dragScroll}
            className="
              flex
              md:grid
              md:grid-cols-4
              overflow-x-auto
              overflow-y-hidden
              md:overflow-visible
              snap-x
              snap-mandatory
              md:snap-none
              gap-4
              md:gap-0
              md:divide-x
              md:divide-border-light
              pb-4
              md:pb-0
              cursor-grab
              active:cursor-grabbing
              select-none
              no-scrollbar
            "
          >
            {dict.pillars?.map((pilar, index) => {
              const formattedIndex = String(index + 1).padStart(2, "0");
              const pillarImage =
                pilar.image ||
                DEFAULT_PILLAR_IMAGES[index % DEFAULT_PILLAR_IMAGES.length];

              return (
                <article
                  key={index}
                  className="
                    group
                    flex
                    flex-col
                    w-full
                    min-w-full
                    md:min-w-0
                    md:w-auto
                    shrink-0
                    md:shrink
                    snap-start
                    md:snap-none
                    py-1
                    md:py-0
                    md:px-4
                    lg:px-6
                    h-full
                  "
                >
                  {/* INDEX / LABEL */}
                  <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                    <span className="font-mono text-maya-label tracking-data text-accent-ink font-semibold">
                      {pilar.label || formattedIndex}
                    </span>

                    <span className="h-px flex-1 bg-border-light group-hover:bg-accent transition-colors duration-500" />
                  </div>

                  {/* IMAGEN 100% CUADRADA Y SIMÉTRICA */}
                  <div
                    className="
                      relative
                      w-full
                      aspect-square
                      overflow-hidden
                      bg-surface
                      mb-3
                      sm:mb-4
                      shrink-0
                      rounded-2xs
                      border
                      border-border-light
                      shadow-2xs
                    "
                  >
                    <Image
                      src={pillarImage}
                      alt={pilar.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 pointer-events-none"
                    />
                  </div>

                  {/* CONTENIDO ALINEADO */}
                  <div className="flex flex-col flex-1">
                    <h3
                      className="
                        font-sans
                        font-medium
                        tracking-wide
                        text-maya-h4
                        text-text-primary
                        uppercase
                        mb-1.5
                        md:min-h-11
                      "
                    >
                      {pilar.title}
                    </h3>

                    <p
                      className="
                        font-sans
                        font-normal
                        text-maya-small
                        text-text-secondary
                        leading-relaxed
                      "
                    >
                      {pilar.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
