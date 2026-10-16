"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface HeroProps {
  lang?: string;
  dict: {
    line1: string;
    line2: string;
    line3: string;
    cta_explore: string;
    cta_visit: string;
  };
}

gsap.registerPlugin(ScrollTrigger);

export default function Hero({ dict, lang = "es" }: HeroProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLHeadingElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const centerLogoRef = useRef<HTMLDivElement>(null);

  const currentLocale: Locale = lang === "en" ? "en" : "es";

  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return;

    // Accesibilidad: sin scroll-pin ni animaciones si el usuario lo pidió en
    // su sistema. Se muestra el texto directamente y el video queda en pausa.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      wrapperRef.current.style.height = "auto";
      if (centerLogoRef.current) centerLogoRef.current.style.opacity = "0";
      videoRef.current?.pause();
      return;
    }

    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: containerRef.current,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Desvanecer Logotipo Central
      tl.to(centerLogoRef.current, {
        opacity: 0,
        scale: 0.92,
        y: -20,
        duration: 0.8,
        ease: "power2.inOut",
      });

      // 2. Aparición progresiva del texto
      if (linesRef.current) {
        tl.fromTo(
          linesRef.current.children,
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.35,
            duration: 1.1,
            ease: "power2.out",
          },
          "-=0.2",
        );
      }

      // 3. Aparición de CTAs
      if (ctasRef.current) {
        tl.fromTo(
          ctasRef.current,
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.2",
        );
      }

      // 4. Retención obligatoria de lectura antes del desenlace
      tl.to({}, { duration: 2.2 });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-[280vh] sm:h-[300vh] bg-black-neutral"
    >
      <section
        ref={containerRef}
        className="relative h-[100dvh] w-full bg-black-neutral overflow-hidden top-0 left-0 z-10 flex flex-col justify-end"
      >
        {/* VIDEO DE FONDO */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black-pure/90 via-black-pure/40 to-black-pure/60 z-10" />
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            poster="/videos/MAYA_Hero2-poster.webp"
            className="h-full w-full object-cover scale-100 bg-black-neutral"
          >
            {/* Versión ligera (720p) en móvil; 1080p en pantallas grandes */}
            <source
              src="/videos/MAYA_Hero2-720.mp4"
              type="video/mp4"
              media="(max-width: 768px)"
            />
            <source src="/videos/MAYA_Hero2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* LOGOTIPO CENTRAL INICIAL */}
        <div
          ref={centerLogoRef}
          className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
        >
          <div className="w-full max-w-[200px] sm:max-w-[360px] lg:max-w-[480px]">
            <Image
              src="/images/MAYA_LOGOTIPO_LIGHT.png"
              alt="MAYA"
              width={800}
              height={200}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* CONTENIDO EDITORIAL */}
        <div className="relative z-30 editorial-container w-full pb-10 sm:pb-16 md:pb-20 pointer-events-none">
          <div className="max-w-3xl pointer-events-auto space-y-4 sm:space-y-6">
            <h1 ref={linesRef} className="flex flex-col gap-2 sm:gap-2">
              <span className="block font-sans text-maya-h4 sm:text-maya-h3 font-light tracking-editorial uppercase text-gray-warm/80">
                {dict.line1}
              </span>
              <span className="block font-sans text-maya-h3 sm:text-maya-h2 font-light tracking-editorial uppercase text-gray-warm/90">
                {dict.line2}
              </span>
              <span className="block font-sans text-maya-h2 sm:text-maya-h1 font-normal tracking-editorial uppercase text-gray-warm pt-0.5">
                {dict.line3}
              </span>
            </h1>

            <div
              ref={ctasRef}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 w-full max-w-sm sm:max-w-none"
            >
              <Button
                href={`/${ROUTES.coleccion[currentLocale]}`}
                variant="primary"
                className="w-full sm:w-auto"
              >
                {dict.cta_explore}
              </Button>
              <Button
                href={`/${ROUTES.contacto[currentLocale]}?reason=showroom`}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {dict.cta_visit}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
