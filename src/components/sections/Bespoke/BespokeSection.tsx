"use client";

import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

export interface BespokeFinishItem {
  id: string;
  slug: string;
  title: any;
  title_es?: string;
  subtitle?: any;
  subtitle_es?: string;
  description?: any;
  description_es?: string;
  cover_image?: string;
  gallery_images?: string[];
  applications?: string[];
  compatible_materials_skus?: string[];
}

interface BespokeSectionProps {
  lang?: string;
  finishes?: BespokeFinishItem[];
  dict?: {
    meta?: string;
    title?: string;
    description?: string;
    cta_quote?: string;
    consultation_label?: string;
    consultation_question?: string;
    pillars?: { title: string; desc: string }[];
  };
}

const DEFAULT_CARD_IMAGES = [
  "/images/Cantera.jpg",
  "/images/MacroRiva.jpg",
  "/images/Draw.jpg",
];

export default function BespokeSection({
  lang = "es",
  finishes = [],
  dict,
}: BespokeSectionProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  const content = {
    meta: dict?.meta ?? "",
    title: dict?.title ?? "",
    description: dict?.description ?? "",
    cta: dict?.cta_quote ?? "",
    consultationLabel: dict?.consultation_label ?? "",
    consultationQuestion: dict?.consultation_question ?? "",
    pillars: dict?.pillars ?? [],
  };

  const resolveCardImage = (idx: number) => {
    return DEFAULT_CARD_IMAGES[idx] || DEFAULT_CARD_IMAGES[0];
  };

  return (
    <section className="relative w-full bg-background text-black-neutral maya-section font-sans border-t border-border-light selection:bg-accent selection:text-white overflow-hidden">
      <div className="editorial-container space-y-10 sm:space-y-12 lg:space-y-14">
        {/* CABECERA EDITORIAL COMPUESTA */}
        <div className="max-w-3xl space-y-3.5 border-b border-border-light pb-6 sm:pb-8">
          {content.meta && (
            <SectionLabel variant="minimal" theme="accent">
              {content.meta}
            </SectionLabel>
          )}

          <h2 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral leading-tight">
            {content.title}
          </h2>

          {content.description && (
            <p className="font-sans text-maya-body text-black-neutral/75 font-light leading-relaxed max-w-2xl pt-1">
              {content.description}
            </p>
          )}
        </div>

        {/* TRÍPTICO DE LIENZOS ARQUITECTÓNICOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-stretch pt-3">
          {content.pillars.map((pillar, idx) => {
            const imageSrc = resolveCardImage(idx);

            return (
              /* Envoltorio estático: absorbe el cursor para eliminar el parpadeo en los bordes */
              <div key={idx} className="group relative h-full flex flex-col">
                <article className="relative w-full h-full flex-1 rounded-2xs overflow-hidden bg-black-neutral text-gray-warm flex flex-col justify-end p-6 sm:p-7 lg:p-8 min-h-[360px] sm:min-h-[400px] lg:min-h-[420px] select-none cursor-pointer transform-gpu will-change-transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2.5 group-hover:shadow-2xl">
                  {/* FOTOGRAFÍA DE TEXTURA CON ZOOM GRADUAL SIN PARPADEO */}
                  <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
                    <Image
                      src={imageSrc}
                      alt={pillar.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-center scale-[1.01] transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black-pure/95 via-black-pure/60 to-black-pure/20 transition-opacity duration-700 group-hover:opacity-85" />
                  </div>

                  {/* CAPA DE BORDE AISLADA: elimina el glitch de subpíxel en el margen superior */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xs border border-white/15 pointer-events-none z-20 transition-colors duration-500 group-hover:border-accent"
                  />

                  {/* CONTENIDO EDITORIAL */}
                  <div className="relative z-10 space-y-3.5 pointer-events-none">
                    <div className="space-y-2">
                      <h3 className="font-sans font-light uppercase tracking-editorial text-maya-h3 text-white leading-tight">
                        {pillar.title}
                      </h3>
                      <span
                        aria-hidden="true"
                        className="block h-px w-8 bg-accent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16"
                      />
                    </div>

                    <p className="font-sans text-maya-small text-gray-warm/85 font-light leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* MONOLITO DE CONSULTA PRIVADA */}
        {(content.consultationQuestion || content.cta) && (
          <div className="relative w-full rounded-2xs overflow-hidden border border-gray-warm/15 bg-black-neutral text-gray-warm p-6 sm:p-10 lg:p-12 shadow-xl">
            <Image
              src="/images/Draw.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-15 mix-blend-multiply pointer-events-none select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black-neutral via-black-neutral/90 to-black-neutral/60 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
              <div className="space-y-2 max-w-2xl">
                {content.consultationLabel && (
                  <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                    {content.consultationLabel}
                  </span>
                )}
                {content.consultationQuestion && (
                  <p className="font-sans text-maya-h3 sm:text-maya-h2 uppercase tracking-editorial text-white font-light leading-snug">
                    {content.consultationQuestion}
                  </p>
                )}
              </div>

              {content.cta && (
                <div className="shrink-0">
                  <Button
                    href={`/${ROUTES.contacto[currentLocale]}?reason=quote&category=bespoke`}
                    variant="outline-light"
                    size="lg"
                    icon={<span>→</span>}
                    iconPosition="right"
                    className="hover:border-accent hover:text-white transition-all w-full sm:w-auto"
                  >
                    {content.cta}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
