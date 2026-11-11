"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getI18n } from "@/lib/i18n/utils";
import { cleanImageUrl } from "@/lib/utils/strings";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface ProjectsSectionProps {
  lang: "es" | "en";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects?: any[];
  dict: {
    badge?: any;
    title?: any;
    view_all?: any;
    explore?: any;
    no_photo?: any;
    prev_project: string;
    next_project: string;
  };
}

// Curva de desaceleración sedosa y lenta
const EASE_SLOW = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function ProjectsSection({
  lang,
  dict,
  projects = [],
}: ProjectsSectionProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const [activeIndex, setActiveIndex] = useState(0);

  if (!projects || projects.length === 0) return null;

  const total = projects.length;
  const currentProject = projects[activeIndex] || projects[0];

  const badgeText = getI18n(dict?.badge, lang) || "";
  const titleText = getI18n(dict?.title, lang) || "";
  const viewAllText = getI18n(dict?.view_all, lang) || "";
  const exploreText = getI18n(dict?.explore, lang) || "";
  const noPhotoText = getI18n(dict?.no_photo, lang) || "";

  const currentTitle = getI18n(
    currentProject.title ?? currentProject.title_es,
    lang,
  );
  const currentDesc = getI18n(
    currentProject.short_description ??
      currentProject.short_description_es ??
      currentProject.description ??
      currentProject.description_es,
    lang,
  );
  const currentCategory = getI18n(currentProject.category, lang);
  const currentLocation = getI18n(currentProject.location, lang);
  const currentSlug =
    getI18n(currentProject.slug, lang) || String(currentProject.id);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  return (
    <section className="relative w-full bg-background text-black-neutral border-t border-border-light maya-section font-sans selection:bg-black-neutral selection:text-gray-warm overflow-hidden">
      <div className="editorial-container space-y-10 sm:space-y-14 lg:space-y-16">
        {/* CABECERA EDITORIAL */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border-light pb-6 sm:pb-8">
          <div className="space-y-2 max-w-2xl">
            {badgeText && (
              <SectionLabel variant="minimal" theme="accent">
                {badgeText}
              </SectionLabel>
            )}
            <h2 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral leading-tight">
              {titleText}
            </h2>
          </div>

          <div className="flex items-center justify-end">
            <Button
              href={`/${ROUTES.arquitectura[currentLocale]}`}
              variant="ghost"
              size="sm"
              icon={<span className="text-accent-ink text-sm">→</span>}
              iconPosition="right"
              className="text-maya-small tracking-nav uppercase text-black-neutral/70 hover:text-black-neutral"
            >
              {viewAllText}
            </Button>
          </div>
        </div>

        {/* ESCENARIO DE PLIEGOS EXPANDIBLES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch min-h-[460px] lg:min-h-[520px]">
          {/* FRISOS EXPANDIBLES (1100ms de apertura suave y gradual) */}
          <div className="lg:col-span-8 flex gap-2.5 sm:gap-3.5 h-[380px] sm:h-[460px] lg:h-[520px] w-full overflow-hidden">
            {projects.map((proj, idx) => {
              const isSelected = activeIndex === idx;
              const imgSrc = cleanImageUrl(proj.cover_image);
              const pTitle = getI18n(proj.title ?? proj.title_es, lang);
              const pCategory = getI18n(proj.category, lang);

              return (
                <article
                  key={proj.id || idx}
                  onClick={() => setActiveIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    transition: `flex 1150ms ${EASE_SLOW}, border-color 600ms ease, box-shadow 1150ms ${EASE_SLOW}`,
                  }}
                  className={`group relative rounded-2xs overflow-hidden border bg-black-neutral cursor-pointer select-none isolate transform-gpu will-change-transform ${
                    isSelected
                      ? "flex-[3.5] border-accent/80 shadow-2xl"
                      : "flex-[0.6] sm:flex-[0.7] border-border-light hover:border-black-neutral/40 hover:opacity-90"
                  }`}
                >
                  {/* FOTOGRAFÍA CON APERTURA Y FILTROS GRADUALES */}
                  <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={pTitle}
                        fill
                        sizes="(max-width: 1024px) 100vw, 65vw"
                        style={{
                          transition: `transform 1400ms ${EASE_SLOW}, filter 1100ms ease, scale 1400ms ${EASE_SLOW}`,
                        }}
                        className={`object-cover object-center transform-gpu will-change-transform ${
                          isSelected
                            ? "scale-105 brightness-95 grayscale-0"
                            : "scale-100 brightness-[0.45] grayscale-[0.25]"
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-white/30 uppercase">
                        {noPhotoText}
                      </div>
                    )}
                    <div
                      style={{ transition: `opacity 900ms ${EASE_SLOW}` }}
                      className={`absolute inset-0 ${
                        isSelected
                          ? "bg-gradient-to-t from-black-pure/90 via-black-pure/30 to-transparent"
                          : "bg-black-pure/50"
                      }`}
                    />
                  </div>

                  {/* IDENTIFICADOR NUMÉRICO */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 font-mono text-maya-label text-white/70">
                    <span
                      className={`transition-colors duration-500 ${
                        isSelected ? "text-accent-ink font-semibold" : ""
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* ETIQUETA INFERIOR */}
                  <div
                    style={{ transition: `all 850ms ${EASE_SLOW}` }}
                    className={`absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-20 space-y-1 ${
                      isSelected
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4 pointer-events-none"
                    }`}
                  >
                    <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink block font-semibold">
                      {pCategory}
                    </span>
                    <h4 className="font-sans text-maya-h3 font-light uppercase tracking-editorial text-white truncate">
                      {pTitle}
                    </h4>
                  </div>
                </article>
              );
            })}
          </div>

          {/* DOSSIER LATERAL */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6 lg:h-[520px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold border-b border-border-light pb-2">
                <span>{currentCategory}</span>
                {currentLocation && (
                  <>
                    <span className="text-black-neutral/30">/</span>
                    <span className="text-black-neutral/60 font-normal">
                      {currentLocation}
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-sans font-light uppercase tracking-editorial text-maya-h2 text-black-neutral leading-tight">
                {currentTitle}
              </h3>
              {currentDesc && (
                <p className="font-sans font-light text-maya-body text-black-neutral/75 leading-relaxed line-clamp-4">
                  {currentDesc}
                </p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border-light">
              <div className="flex items-center justify-between">
                <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50">
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label={dict.prev_project}
                    className="w-10 h-10 border border-border-light bg-surface hover:border-black-neutral hover:text-black-neutral font-mono text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label={dict.next_project}
                    className="w-10 h-10 border border-border-light bg-surface hover:border-black-neutral hover:text-black-neutral font-mono text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    →
                  </button>
                </div>
              </div>

              <Link
                href={`/${ROUTES.arquitectura[currentLocale]}/${encodeURIComponent(currentSlug)}`}
                className="group relative flex items-center justify-between w-full min-h-13 px-6 py-4 bg-black-neutral text-white font-mono text-maya-label uppercase tracking-nav rounded-3xs overflow-hidden transition-all duration-300 hover:bg-black-pure shadow-lg hover:shadow-2xl active:scale-[0.99]"
              >
                <span className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-25deg] -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
                <span className="relative z-10 font-semibold">
                  {exploreText}
                </span>
                <span className="relative z-10 text-accent-ink text-base transition-transform duration-300 group-hover:translate-x-1.5">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
