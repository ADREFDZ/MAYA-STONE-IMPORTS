"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { useDeviceType } from "@/hooks/useDeviceType";

interface FinalCTADict {
  title: string;
  description: string;
  cta_primary: string;
  cta_secondary: string;
  availability?: string;
  locations: string;
  alt_travertine: string;
  alt_wood: string;
  alt_samples: string;
}

interface FinalCTAProps {
  lang?: string;
  dict: FinalCTADict;
}

export default function FinalCTA({ lang = "es", dict }: FinalCTAProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const { hasHover, isLandscape, device } = useDeviceType();

  const stageRef = useRef<HTMLDivElement>(null);
  const card3dRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const stage = stageRef.current;
    const card = card3dRef.current;
    if (!stage || !card) return;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let animId: number;

    // Solo escucha el mouse si el dispositivo tiene cursor físico
    if (hasHover) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = stage.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        targetRotY = x * 14;
        targetRotX = -y * 12;
        setMousePos({ x, y });
      };

      const handleMouseLeave = () => {
        targetRotX = 0;
        targetRotY = 0;
        setMousePos({ x: 0, y: 0 });
      };

      stage.addEventListener("mousemove", handleMouseMove);
      stage.addEventListener("mouseleave", handleMouseLeave);

      const render = () => {
        currentRotX += (targetRotX - currentRotX) * 0.07;
        currentRotY += (targetRotY - currentRotY) * 0.07;

        card.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg)`;
        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);

      return () => {
        stage.removeEventListener("mousemove", handleMouseMove);
        stage.removeEventListener("mouseleave", handleMouseLeave);
        cancelAnimationFrame(animId);
      };
    } else {
      // En móvil y tablets táctiles: oscilación ambiental suave continua (sin interacción de mouse)
      let time = 0;
      const ambientRender = () => {
        time += 0.02;
        const ambientRotX = Math.sin(time) * 4;
        const ambientRotY = Math.cos(time * 0.8) * 6;

        card.style.transform = `rotateX(${ambientRotX.toFixed(2)}deg) rotateY(${ambientRotY.toFixed(2)}deg)`;
        animId = requestAnimationFrame(ambientRender);
      };

      animId = requestAnimationFrame(ambientRender);

      return () => {
        cancelAnimationFrame(animId);
      };
    }
  }, [hasHover]);

  if (!dict) return null;

  return (
    <section className="relative w-full bg-background text-black-neutral border-t border-border-light maya-section py-16 sm:py-20 lg:py-0 lg:min-h-screen lg:h-screen flex flex-col justify-center items-center overflow-hidden font-sans select-none">
      {/* ATMÓSFERA LUMÍNICA DE FONDO */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 right-1/4 w-[350px] sm:w-[500px] lg:w-[600px] h-[350px] sm:h-[500px] lg:h-[600px] bg-accent/8 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-black-neutral/5 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"
      />

      <div className="editorial-container relative z-10 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 lg:gap-16 xl:gap-20 items-center">
          {/* =========================================================
              COLUMNA 1: MANIFIESTO Y ACCIONES (IZQUIERDA)
              ========================================================= */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 lg:text-maya-display uppercase text-black-neutral leading-[1.04] text-balance">
                {dict.title}
              </h2>
            </div>

            <p className="font-sans font-light text-maya-small sm:text-maya-body lg:text-maya-body-lg text-black-neutral/75 leading-relaxed max-w-xl">
              {dict.description}
            </p>

            {/* BOTONERA EJECUTIVA */}
            <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                href={`/${ROUTES.contacto[currentLocale]}?reason=quote`}
                variant="dark"
                size="md"
                icon={<span className="text-xs text-accent-ink">→</span>}
                iconPosition="right"
                className="w-full sm:w-auto shadow-xl hover:shadow-2xl justify-center"
              >
                {dict.cta_primary}
              </Button>

              <Button
                href={`/${ROUTES.contacto[currentLocale]}?reason=samples`}
                variant="outline-dark"
                size="md"
                className="w-full sm:w-auto justify-center"
              >
                {dict.cta_secondary}
              </Button>
            </div>

            {/* DISPONIBILIDAD */}
            {dict.availability && (
              <div className="pt-4 sm:pt-6 border-t border-border-light max-w-md">
                <span className="font-mono text-[9px] sm:text-[10px] md:text-maya-label uppercase tracking-data text-black-neutral/50 block">
                  {dict.availability}
                </span>
              </div>
            )}
          </div>

          {/* =========================================================
              COLUMNA 2: BODEGÓN 3D RESPONSIVE (DERECHA)
              ========================================================= */}
          <div
            ref={stageRef}
            className="lg:col-span-6 relative w-full h-[380px] min-[400px]:h-[420px] sm:h-[480px] lg:h-[540px] xl:h-[580px] flex items-center justify-center [perspective:1000px] sm:[perspective:1200px] overflow-visible"
          >
            {/* ESCENARIO TRIDIMENSIONAL AJUSTADO AL VIEWPORT */}
            <div
              ref={card3dRef}
              style={{
                transformStyle: "preserve-3d",
              }}
              className="relative w-[230px] min-[380px]:w-[260px] min-[440px]:w-[290px] sm:w-[340px] md:w-[380px] lg:w-[390px] xl:w-[420px] aspect-[4/5] transform-gpu will-change-transform"
            >
              {/* CAPA 1: PLACA BASE DE TRAVERTINO (Z: 0px) */}
              <div
                style={{
                  transform: "translateZ(0px)",
                }}
                className="absolute inset-0 bg-[#e6e2da] rounded-2xs shadow-2xl border border-black-neutral/15 overflow-hidden"
              >
                <Image
                  src="/images/Travertinos.jpg"
                  alt={dict.alt_travertine}
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 400px, 450px"
                  className="object-cover opacity-85 contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black-pure/35 via-transparent to-white/20 pointer-events-none" />
                <div className="absolute inset-2 sm:inset-3 border border-black-neutral/10 pointer-events-none" />
              </div>

              {/* CAPA 2: MUESTRA SUPERIOR (MADERA / JARRÓN - Z: 25px a 30px) */}
              <div
                style={{
                  transform:
                    device === "mobile"
                      ? "translate3d(12%, -8%, 24px)"
                      : "translate3d(18%, -10%, 30px)",
                  transition: "transform 400ms ease-out",
                }}
                className="absolute right-0 top-3 sm:top-5 lg:top-6 w-[56%] h-[66%] sm:h-[68%] rounded-3xs overflow-hidden shadow-2xl border border-black-neutral/20 bg-[#2b2621]"
              >
                <Image
                  src="/images/Jarron.jpg"
                  alt={dict.alt_wood}
                  fill
                  sizes="(max-width: 640px) 160px, 260px"
                  className="object-cover contrast-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black-pure/50 via-transparent to-transparent" />
              </div>

              {/* CAPA 3: FRAGMENTO DE CANTERA / MUESTRAS (Z: 40px a 55px) */}
              <div
                style={{
                  transform:
                    device === "mobile"
                      ? "translate3d(-10%, 20%, 42px)"
                      : "translate3d(-14%, 26%, 55px)",
                  transition: "transform 400ms ease-out",
                }}
                className="absolute left-2 sm:left-4 bottom-2 sm:bottom-4 w-[50%] sm:w-[52%] aspect-square rounded-3xs overflow-hidden shadow-2xl border border-white/25 bg-black-neutral"
              >
                <Image
                  src="/images/Muestras.jpg"
                  alt={dict.alt_samples}
                  fill
                  sizes="(max-width: 640px) 150px, 240px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black-pure/15 pointer-events-none" />
              </div>

              {/* CAPA 4: TARJETA DE UBICACIONES EDITORIAL (Z: 60px a 80px) */}
              <div
                style={{
                  transform:
                    device === "mobile"
                      ? "translate3d(14%, 22%, 60px)"
                      : "translate3d(20%, 28%, 80px)",
                  transition: "transform 400ms ease-out",
                }}
                className="absolute right-2 sm:right-4 bottom-3 sm:bottom-6 w-[58%] sm:w-[56%] p-3 sm:p-4 bg-white/95 backdrop-blur-md text-black-neutral rounded-3xs shadow-2xl border border-black-neutral/15 space-y-1"
              >
                <p className="font-sans text-[10px] sm:text-maya-small uppercase tracking-editorial font-medium leading-none text-black-neutral">
                  MAYA
                </p>
                <p className="font-mono text-[8px] min-[380px]:text-[9px] sm:text-[10px] text-accent-ink uppercase tracking-data font-semibold whitespace-nowrap">
                  {dict.locations}
                </p>
              </div>

              {/* HAZ DE LUZ EN PARALLAX (SOLO CON CURSOR ACTIVO) */}
              {hasHover && (
                <div
                  style={{
                    transform: `translate3d(${mousePos.x * -25}px, ${mousePos.y * -25}px, 95px)`,
                    transition: "transform 300ms ease-out",
                  }}
                  className="absolute -top-12 -left-12 w-48 h-96 bg-gradient-to-r from-white/20 via-white/5 to-transparent -rotate-45 pointer-events-none filter blur-md"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
