"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { preloadImage } from "@/lib/utils/preloadImage";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { getI18n } from "@/lib/i18n/utils";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface RenderDb {
  id: string;
  product_sku: string;
  render_url: string;
  application: string;
  sort_order?: number;
}

interface ProductDb {
  sku: string;
  product_name: string;
  aka?: string;
  category: string;
  stone_type?: string;
  origin?: string;
  description?: any;
  description_i18n?: any;
  description_en?: string;
  image_url?: string;
  formats?: string[] | string;
  finishes?: string[] | string;
  uses?: string[];
  uses_en?: string[];
  is_featured?: boolean;
  material_renders?: RenderDb[];
}

interface CollectionProps {
  lang?: string;
  initialHero?: ProductDb | null;
  dict: {
    meta: string;
    title: string;
    cta_explore: string;
    cta_availability: string;
    cta_all: string;
    a11y: {
      prev_render: string;
      next_render: string;
      go_to_render: string;
      no_visual: string;
    };
    terms?: Record<string, string>;
  };
}

export default function Collection({
  dict,
  lang = "es",
  initialHero = null,
}: CollectionProps) {
  const [activeView, setActiveView] = useState<"slab" | "render">("slab");
  const [activeRenderIdx, setActiveRenderIdx] = useState(0);

  const currentLocale: Locale = lang === "en" ? "en" : "es";
  // Solo el material destacado que se elige desde Admin
  const selectedMaterial = initialHero;

  const translateTerm = (term?: string | null): string => {
    if (!term) return "";
    const clean = term.trim();
    if (dict.terms?.[clean]) return dict.terms[clean];

    const lower = clean.toLowerCase();
    if (dict.terms) {
      for (const [key, val] of Object.entries(dict.terms)) {
        if (key.toLowerCase() === lower) return val;
      }
    }
    return clean;
  };

  const displayName =
    selectedMaterial?.aka?.trim() || selectedMaterial?.product_name || "";

  const translatedCategory = translateTerm(selectedMaterial?.category);
  const translatedOrigin = translateTerm(selectedMaterial?.origin);

  const descriptionText =
    getI18n(
      selectedMaterial?.description_i18n ||
        selectedMaterial?.description_en ||
        selectedMaterial?.description,
      lang,
    ) ||
    selectedMaterial?.description_en ||
    (selectedMaterial?.description as string) ||
    "";

  const rendersList = selectedMaterial?.material_renders || [];
  const totalRenders = rendersList.length;

  const currentDisplayImage =
    activeView === "render" && rendersList[activeRenderIdx]
      ? rendersList[activeRenderIdx].render_url
      : selectedMaterial?.image_url;

  const currentRenderApplication =
    activeView === "render" && rendersList[activeRenderIdx]?.application
      ? translateTerm(rendersList[activeRenderIdx].application)
      : null;

  // Estado del buffer de imágenes: retiene la previa hasta que la nueva termina de cargar
  const [imageBuffer, setImageBuffer] = useState<{
    current: string;
    previous: string | null;
    isLoaded: boolean;
  }>({
    current: currentDisplayImage || "",
    previous: null,
    isLoaded: true,
  });

  const lastImageRef = useRef(currentDisplayImage);

  useEffect(() => {
    if (!currentDisplayImage) return;
    if (currentDisplayImage !== lastImageRef.current) {
      const oldImg = lastImageRef.current;
      lastImageRef.current = currentDisplayImage;
      setImageBuffer({
        current: currentDisplayImage,
        previous: oldImg || null,
        isLoaded: false,
      });
    }
  }, [currentDisplayImage]);

  // Al terminar el fundido (550ms), se desmonta la imagen previa sin saltos
  useEffect(() => {
    if (imageBuffer.isLoaded && imageBuffer.previous) {
      const timer = setTimeout(() => {
        setImageBuffer((prev) => ({ ...prev, previous: null }));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imageBuffer.isLoaded, imageBuffer.previous]);

  // Precarga placa y renders (mismo `sizes` que <Image>) apenas carga la
  // sección: al cambiar de vista o de render la foto ya está lista.
  useEffect(() => {
    const sizes = "(max-width: 1024px) 100vw, 60vw";
    const run = () => {
      preloadImage(selectedMaterial?.image_url, sizes);
      for (const r of rendersList) preloadImage(r.render_url, sizes);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    if (w.requestIdleCallback) w.requestIdleCallback(run);
    else window.setTimeout(run, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMaterial?.image_url, rendersList.length]);

  const handleImageReady = () => {
    setImageBuffer((prev) => ({ ...prev, isLoaded: true }));
  };

  const handlePrevRender = () => {
    setActiveRenderIdx((prev) => (prev - 1 + totalRenders) % totalRenders);
  };

  const handleNextRender = () => {
    setActiveRenderIdx((prev) => (prev + 1) % totalRenders);
  };

  return (
    <section className="relative w-full bg-black-neutral text-gray-warm maya-section font-sans overflow-hidden border-t border-gray-warm/15 select-none">
      {/* ATMÓSFERA LUMÍNICA AMBIENTAL */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[700px] bg-accent/10 rounded-full blur-[160px] pointer-events-none transition-all duration-1000"
      />

      <div className="editorial-container relative z-10 space-y-8 sm:space-y-10">
        {/* CABECERA EDITORIAL */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-warm/15 pb-4 sm:pb-6">
          <div className="space-y-1.5 max-w-2xl">
            {dict.meta && (
              <SectionLabel variant="minimal" theme="accent">
                {dict.meta}
              </SectionLabel>
            )}
            <h2 className="font-sans font-light tracking-editorial text-maya-h2 text-gray-warm uppercase">
              {dict.title}
            </h2>
          </div>
          <Button
            href={`/${ROUTES.coleccion[currentLocale]}`}
            variant="ghost"
            align="right"
            icon={<span className="text-accent-ink">→</span>}
            iconPosition="right"
            className="text-maya-small tracking-nav uppercase text-gray-warm/70 hover:text-gray-warm self-start md:self-auto"
          >
            {dict.cta_all}
          </Button>
        </div>

        {/* ESCENARIO PROTAGONISTA: PLACA (7) + NARRATIVA (5)
            Celular/tablet: placa arriba y texto debajo. Desktop: lado a lado. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-12 items-center">
          {/* COLUMNA DE TEXTO: NARRATIVA Y ACCIÓN */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6 sm:space-y-8 order-2 max-w-2xl">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-2 font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
                <span>{translatedCategory}</span>
                {translatedOrigin && (
                  <>
                    <span className="opacity-40">/</span>
                    <span>{translatedOrigin}</span>
                  </>
                )}
              </div>

              <h3 className="font-sans font-light text-maya-h2 sm:text-maya-h1 uppercase tracking-editorial leading-[1.02] text-white break-words">
                {displayName}
              </h3>

              <span aria-hidden="true" className="block h-px w-12 bg-accent" />

              {descriptionText && (
                <p className="font-sans text-maya-small sm:text-maya-body font-light text-gray-warm/75 leading-relaxed line-clamp-5 sm:line-clamp-6 max-w-xl">
                  {descriptionText}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
              <Button
                href={`/${ROUTES.coleccion[currentLocale]}?material=${encodeURIComponent(selectedMaterial?.sku || "")}`}
                variant="primary"
                size="sm"
                icon={<span>→</span>}
                iconPosition="right"
              >
                {dict.cta_explore}
              </Button>

              <Button
                href={`/${ROUTES.contacto[currentLocale]}?reason=quote&material=${encodeURIComponent(displayName)}`}
                variant="ghost"
                size="sm"
                align="center"
                icon={<span className="text-accent-ink">→</span>}
                iconPosition="right"
                className="text-maya-small tracking-nav uppercase text-gray-warm/70 hover:text-gray-warm"
              >
                {dict.cta_availability}
              </Button>
            </div>
          </div>

          {/* COLUMNA DE IMAGEN: LA PLACA CON FUNDIDO CONTINUO (SIN PARPADEO) */}
          <div className="lg:col-span-7 flex flex-col items-center order-1">
            <div className="relative w-full aspect-[4/5] min-[480px]:aspect-square md:aspect-[16/11] lg:aspect-[4/3] max-w-[680px] lg:ml-auto overflow-hidden rounded-2xs border border-gray-warm/15 shadow-2xl bg-black-neutral group">
              {/* SELECTOR SUPERIOR: PLACA VS. RENDER */}
              {totalRenders > 0 && (
                <div className="absolute top-3.5 right-3.5 z-30 flex items-center gap-1 p-1 bg-black-pure/70 backdrop-blur-md border border-gray-warm/20 rounded-full">
                  <button
                    type="button"
                    onClick={() => setActiveView("slab")}
                    className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-data transition-all cursor-pointer ${
                      activeView === "slab"
                        ? "bg-gray-warm text-black-neutral font-semibold shadow-xs"
                        : "text-gray-warm/70 hover:text-white"
                    }`}
                  >
                    {translateTerm("Placa") || "Placa"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView("render")}
                    className={`px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-data transition-all cursor-pointer ${
                      activeView === "render"
                        ? "bg-accent text-white font-semibold shadow-xs"
                        : "text-gray-warm/70 hover:text-white"
                    }`}
                  >
                    {translateTerm("Render") || "Render"}
                  </button>
                </div>
              )}

              {/* ESCENARIO FOTOGRÁFICO DOBLE CAPA */}
              <div className="relative w-full h-full">
                {/* 1. CAPA INFERIOR: MANTIENE LA IMAGEN PREVIA 100% VISIBLE (CERO FONDO NEGRO) */}
                {imageBuffer.previous && (
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <Image
                      src={imageBuffer.previous}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                    />
                  </div>
                )}

                {/* 2. CAPA SUPERIOR: LA NUEVA IMAGEN SE DESVANECE SUAVEMENTE ENCIMA */}
                {imageBuffer.current ? (
                  <div
                    className={`absolute inset-0 z-10 will-change-[opacity] transition-opacity duration-150 ease-out ${
                      imageBuffer.isLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      key={imageBuffer.current}
                      src={imageBuffer.current}
                      alt={displayName}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      onLoad={handleImageReady}
                      onError={handleImageReady}
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-103"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-maya-label uppercase tracking-data text-gray-warm/30">
                    {dict.a11y.no_visual}
                  </div>
                )}
              </div>

              {/* NAVEGACIÓN INFERIOR PARA MÚLTIPLES RENDERS */}
              {activeView === "render" && totalRenders > 1 && (
                <div className="absolute inset-x-3 bottom-3 z-30 flex items-center justify-between p-2 bg-black-neutral/85 backdrop-blur-md border border-white/10 rounded-2xs">
                  <button
                    type="button"
                    onClick={handlePrevRender}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
                    aria-label={dict.a11y.prev_render}
                  >
                    ‹
                  </button>

                  <div className="flex flex-col items-center gap-1 min-w-0 px-2">
                    {currentRenderApplication && (
                      <span className="font-mono text-[10px] uppercase tracking-data text-gray-warm/90 truncate">
                        {currentRenderApplication}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      {rendersList.map((_, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => setActiveRenderIdx(rIdx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            rIdx === activeRenderIdx
                              ? "w-4 bg-accent"
                              : "w-1.5 bg-gray-warm/30 hover:bg-gray-warm/60"
                          }`}
                          aria-label={`${dict.a11y.go_to_render} ${rIdx + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextRender}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
                    aria-label={dict.a11y.next_render}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
