"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionLabel from "@/components/ui/SectionLabel";

interface ArchitectureHeroProps {
  dict: {
    badge: string;
    title: string;
    subtitle: string;
  };
  heroImage?: string;
}

gsap.registerPlugin(ScrollTrigger);

export default function ArchitectureHero({
  dict,
  // Mayúscula exacta: en el servidor (Linux) "casa.jpg" ≠ "Casa.jpg"
  heroImage = "/images/Casa.jpg",
}: ArchitectureHeroProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !containerRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // =========================================================
      // 1. VERSIÓN DESKTOP (>= 1024px) — 100% IDÉNTICA A LA ORIGINAL
      // =========================================================
      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top top",
            end: "bottom bottom",
            pin: containerRef.current,
            pinSpacing: true,
            scrub: 1.1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Desplazamiento de la fotografía hacia la derecha
        tl.to(
          imageWrapperRef.current,
          {
            x: "105%",
            opacity: 0,
            duration: 3.2,
            ease: "power2.inOut",
          },
          0,
        );

        // Desvanecimiento del texto hacia arriba
        tl.to(
          textGroupRef.current,
          {
            opacity: 0,
            y: -36,
            duration: 1.8,
            ease: "power2.out",
          },
          1.2,
        );

        // Entrada sincronizada de la sección de proyectos
        const archiveGrid = document.getElementById("archive-grid");
        if (archiveGrid) {
          tl.fromTo(
            archiveGrid,
            { y: 80, opacity: 0.6 },
            {
              y: 0,
              opacity: 1,
              duration: 1.6,
              ease: "power2.out",
            },
            1.6,
          );
        }
      });

      // =========================================================
      // 2. VERSIÓN MÓVIL (< 1024px) — CERO RETARDOS, SUBIDA INMEDIATA
      // =========================================================
      mm.add("(max-width: 1023px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        // La tarjeta de texto se desvanece suavemente
        tl.to(
          textGroupRef.current,
          {
            opacity: 0,
            y: -30,
            duration: 0.5,
            ease: "power1.out",
          },
          0,
        );

        // La imagen sube en parallax mientras el scroll natural avanza
        tl.to(
          imageWrapperRef.current,
          {
            yPercent: -20,
            duration: 1.0,
            ease: "none",
          },
          0,
        );
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-svh min-h-[560px] lg:min-h-0 lg:h-[185lvh] bg-background text-black-neutral"
    >
      {/* Celular/tablet (sin pin): 1 pantalla visible (svh).
          Escritorio (con pin de GSAP): lvh, altura estable aunque el navegador
          muestre/oculte su barra (evita franjas al anclar). */}
      <header
        ref={containerRef}
        className="w-full h-svh lg:h-lvh min-h-[560px] bg-background text-black-neutral overflow-hidden select-none"
      >
        <div className="relative w-full h-full flex items-center">
          {/* HEMISFERIO IZQUIERDO: TEXTOS EDITORIALES */}
          <div className="relative z-10 w-full lg:w-[48%] xl:w-[46%] h-full flex flex-col justify-center pt-24 sm:pt-28 pb-12 sm:pb-16 px-6 sm:px-10 lg:pl-14 xl:pl-20 lg:pr-8 pointer-events-none">
            {/* Tarjeta con blur en móvil para garantizar lectura; 100% limpia en escritorio */}
            <div
              ref={textGroupRef}
              className="max-w-xl space-y-5 sm:space-y-6 pointer-events-auto transform-gpu will-change-transform rounded-2xs p-6 sm:p-8 bg-background/90 backdrop-blur-md border border-border-light/70 shadow-2xl lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:shadow-none"
            >
              {dict.badge && (
                <SectionLabel variant="minimal" theme="accent">
                  {dict.badge}
                </SectionLabel>
              )}

              {dict.title && (
                <h1 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 lg:text-maya-display uppercase text-black-neutral leading-[1.04] text-balance">
                  {dict.title}
                </h1>
              )}

              <span
                aria-hidden="true"
                className="block h-px w-10 sm:w-14 bg-accent/70"
              />

              {dict.subtitle && (
                <p className="font-sans font-light text-maya-small sm:text-maya-body text-black-neutral/75 leading-relaxed max-w-md pt-0.5">
                  {dict.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* HEMISFERIO DERECHO: FOTOGRAFÍA MONUMENTAL A SANGRE */}
          <div
            ref={imageWrapperRef}
            className="absolute top-0 right-0 h-[120%] lg:h-full w-full lg:w-[52%] xl:w-[54%] z-0 bg-background transform-gpu will-change-transform overflow-hidden"
          >
            <div className="relative w-full h-full">
              <Image
                src={heroImage}
                alt={dict.title}
                fill
                priority
                quality={95}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center"
              />

              {/* Velo ambiental sutil exclusivo para móvil */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent lg:hidden pointer-events-none"
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
