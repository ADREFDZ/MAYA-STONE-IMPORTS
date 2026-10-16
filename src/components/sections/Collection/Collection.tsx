"use client";

import { useState, useRef, useMemo } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";
import Image from "next/image";
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
  initialRelated?: ProductDb[];
  dict: {
    meta: string;
    title: string;
    cta_explore: string;
    cta_all: string;
    variations_label: string;
    portfolio_renders?: string;
    badge_cover?: string;
    origin_prefix?: string;
    labels: {
      format: string;
      finish: string;
      origin: string;
      use: string;
    };
    terms?: Record<string, string>;
  };
}

export default function Collection({
  dict,
  lang = "es",
  initialHero = null,
  initialRelated = [],
}: CollectionProps) {
  // - Al entrar: el destacado (initialHero) siempre va en el inspector.
  // - La barra muestra 4 variaciones aleatorias (elegidas en el servidor en
  //   cada visita) y NUNCA repite lo que está en el inspector.
  // - Al hacer clic en una variación, intercambia lugar con el material del
  //   inspector (el destacado pasa a la barra en esa misma posición).
  const featuredHero = initialHero;
  const [selectedMaterial, setSelectedMaterial] = useState<ProductDb | null>(
    initialHero,
  );
  const [variationsBar, setVariationsBar] =
    useState<ProductDb[]>(initialRelated);

  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: rendersSliderRef, handlers: dragScroll } = useDragScroll<HTMLDivElement>();
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  const translateTerm = (term?: string | null): string => {
    if (!term) return "";
    const clean = term.trim();

    if (dict.terms?.[clean]) {
      return dict.terms[clean];
    }

    const lower = clean.toLowerCase();
    if (dict.terms) {
      for (const [key, val] of Object.entries(dict.terms)) {
        if (key.toLowerCase() === lower) {
          return val;
        }
      }
    }

    return clean;
  };

  // Solo se desplaza suavemente cuando el usuario hace clic manual sobre una variación
  const handleSelectMaterial = (item: ProductDb) => {
    const previous = selectedMaterial;
    // Intercambio: el material que estaba en el inspector ocupa el lugar
    // del que se eligió en la barra.
    setVariationsBar((bar) =>
      bar.map((m) => (m.sku === item.sku && previous ? previous : m)),
    );
    setSelectedMaterial(item);

    if (containerRef.current) {
      const elementTop = containerRef.current.getBoundingClientRect().top;
      const offsetPosition = elementTop + window.scrollY - 84;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });
    }
  };

  const displayName =
    selectedMaterial?.aka?.trim() || selectedMaterial?.product_name || "";

  const rawFormats = Array.isArray(selectedMaterial?.formats)
    ? selectedMaterial?.formats
    : typeof selectedMaterial?.formats === "string"
      ? [selectedMaterial.formats]
      : [];
  const formatsText = rawFormats
    .filter(Boolean)
    .map((f) => translateTerm(f))
    .join(", ");

  const rawFinishes = Array.isArray(selectedMaterial?.finishes)
    ? selectedMaterial?.finishes
    : typeof selectedMaterial?.finishes === "string"
      ? [selectedMaterial.finishes]
      : [];
  const finishesText = rawFinishes
    .filter(Boolean)
    .map((f) => translateTerm(f))
    .join(", ");

  const rawUses = useMemo(() => {
    if (!selectedMaterial) return [];
    if (lang === "en") {
      return Array.isArray(selectedMaterial.uses_en)
        ? selectedMaterial.uses_en
        : [];
    }
    return Array.isArray(selectedMaterial.uses) ? selectedMaterial.uses : [];
  }, [selectedMaterial, lang]);

  const usesList = rawUses.filter(Boolean).map((u) => translateTerm(u));

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



  return (
    <section className="relative w-full bg-black-neutral text-gray-warm maya-section font-sans overflow-hidden">
      <div
        ref={containerRef}
        className="editorial-container space-y-6 sm:space-y-8 md:space-y-10"
      >
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-gray-warm/15 pb-4">
          <div className="space-y-1.5 max-w-2xl">
            <SectionLabel variant="minimal" theme="accent">
              {dict.meta}
            </SectionLabel>
            <h2 className="font-sans font-light tracking-editorial text-maya-h2 text-gray-warm uppercase">
              {dict.title}
            </h2>
          </div>
          <Button
            href={`/${ROUTES.coleccion[currentLocale]}`}
            variant="ghost"
            align="right"
            icon={<span>→</span>}
            iconPosition="right"
            className="text-maya-small tracking-nav uppercase text-gray-warm/70 hover:text-gray-warm self-start md:self-auto"
          >
            {dict.cta_all}
          </Button>
        </div>

        {/* ESQUELETO DE CARGA (Sólo en caso excepcional de que falle la carga inicial) */}
        {!selectedMaterial ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch border-b border-gray-warm/15 pb-6 sm:pb-8">
              <div className="lg:col-span-7 bg-gray-warm/5 rounded-2xs aspect-16/10 sm:aspect-16/9 min-h-[260px] sm:min-h-[340px] border border-gray-warm/10" />
              <div className="lg:col-span-5 space-y-4 py-2 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-warm/10 w-3/4 rounded-xs" />
                  <div className="h-3 bg-gray-warm/5 w-1/3 rounded-xs" />
                  <div className="h-16 bg-gray-warm/5 w-full rounded-xs mt-4" />
                </div>
                <div className="h-10 bg-gray-warm/10 w-full rounded-2xs" />
              </div>
            </div>
            <div className="space-y-3 pt-1">
              <div className="h-3 bg-gray-warm/10 w-28 rounded-xs" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-16/9 bg-gray-warm/5 border border-gray-warm/10 rounded-2xs"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* INSPECTOR PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch border-b border-gray-warm/15 pb-6 sm:pb-8">
              <div className="lg:col-span-7 flex flex-col">
                <div className="relative aspect-16/10 sm:aspect-16/9 w-full h-full min-h-[240px] sm:min-h-[320px] overflow-hidden bg-black-pure border border-gray-warm/10 group rounded-2xs shadow-md">
                  {selectedMaterial.image_url && (
                    <Image
                      src={selectedMaterial.image_url}
                      alt={displayName}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-103"
                    />
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between space-y-4 py-1">
                <div className="space-y-3">
                  <div className="border-b border-gray-warm/15 pb-2.5">
                    <h3 className="font-sans font-light text-maya-h3 text-accent-ink uppercase tracking-wide">
                      {displayName}
                    </h3>
                    <p className="font-mono text-maya-label text-gray-warm/60 mt-0.5 uppercase tracking-data">
                      {translatedCategory}
                      {translatedOrigin ? ` · ${translatedOrigin}` : ""}
                    </p>
                  </div>

                  {descriptionText && (
                    <p className="font-sans text-maya-body text-gray-warm/80 font-light line-clamp-3 sm:line-clamp-4 lg:line-clamp-5">
                      {descriptionText}
                    </p>
                  )}

                  {(formatsText || finishesText) && (
                    <div className="grid grid-cols-2 gap-3 border-t border-b border-gray-warm/15 py-2.5">
                      {formatsText && (
                        <div>
                          <span className="block text-maya-label text-gray-warm/50 uppercase tracking-data mb-0.5 font-mono">
                            {dict.labels.format}
                          </span>
                          <span className="text-gray-warm font-light text-maya-small">
                            {formatsText}
                          </span>
                        </div>
                      )}
                      {finishesText && (
                        <div>
                          <span className="block text-maya-label text-gray-warm/50 uppercase tracking-data mb-0.5 font-mono">
                            {dict.labels.finish}
                          </span>
                          <span className="text-gray-warm font-light text-maya-small">
                            {finishesText}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {usesList.length > 0 && (
                    <div>
                      <span className="block text-maya-label text-gray-warm/50 uppercase tracking-data mb-0.5 font-mono">
                        {dict.labels.use}
                      </span>
                      <p className="text-maya-small text-gray-warm/80 leading-relaxed font-light">
                        {usesList.join(" · ")}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className="hover:text-white/70"
                  href={`/${ROUTES.coleccion[currentLocale]}?material=${encodeURIComponent(selectedMaterial.sku)}`}
                  variant="primary"
                  fullWidth
                  icon={<span>→</span>}
                >
                  {dict.cta_explore}
                </Button>
              </div>
            </div>

            {/* SECCIÓN RENDERS */}
            {rendersList.length > 0 && (
              <div className="space-y-3.5 border-b border-gray-warm/15 pt-3 sm:pt-5 pb-6 sm:pb-8">
                <SectionLabel variant="minimal" theme="accent">
                  {dict.portfolio_renders}
                </SectionLabel>

                <div
                  ref={rendersSliderRef}
                  {...dragScroll}
                  className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none gap-0 sm:gap-4 pb-2 sm:pb-0 cursor-grab active:cursor-grabbing select-none no-scrollbar w-full"
                >
                  {rendersList.map((rnd) => (
                    <div
                      key={rnd.id}
                      className="group w-full sm:w-auto shrink-0 snap-start sm:shrink"
                    >
                      <div className="relative aspect-16/9 w-full overflow-hidden bg-black-pure border border-gray-warm/15 rounded-2xs">
                        <Image
                          src={rnd.render_url}
                          alt={displayName}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-104 pointer-events-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BARRA DE VARIACIONES */}
            {variationsBar.length > 0 && (
              <div className="space-y-3 pt-1">
                <SectionLabel variant="minimal" theme="dark">
                  {dict.variations_label}
                </SectionLabel>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                  {variationsBar.map((item) => {
                    const isCurrentInspector =
                      item.sku === selectedMaterial.sku;
                    const isHero = featuredHero?.sku === item.sku;
                    const itemDisplayName =
                      item.aka?.trim() || item.product_name;

                    return (
                      <button
                        key={item.sku}
                        type="button"
                        aria-label={`${dict.cta_explore} ${itemDisplayName}`}
                        onClick={() => handleSelectMaterial(item)}
                        className={`text-left group cursor-pointer transition-all duration-300 relative rounded-2xs overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                          isCurrentInspector
                            ? "opacity-100 ring-1 ring-accent p-1 bg-black-pure/50"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="relative aspect-16/9 w-full overflow-hidden bg-black-pure mb-1 border border-gray-warm/15 rounded-2xs">
                          {item.image_url && (
                            <Image
                              src={item.image_url}
                              alt={itemDisplayName}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          {isHero && (
                            <span className="absolute top-1 left-1 bg-accent text-white font-mono text-maya-label font-bold px-1 py-0.5 uppercase tracking-data shadow-xs">
                              {dict.badge_cover}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1 px-0.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-maya-small text-gray-warm uppercase tracking-wider truncate font-medium">
                              {itemDisplayName}
                            </p>
                            <span className="font-mono text-maya-label text-gray-warm/40 uppercase block truncate">
                              {translateTerm(item.category)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
