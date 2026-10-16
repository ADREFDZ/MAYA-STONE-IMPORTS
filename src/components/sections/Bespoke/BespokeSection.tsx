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
    cta_consultation?: string;
    badge_atelier?: string;
    applications_label?: string;
    banner_title?: string;
    image_alt?: string;
    image_headline?: string;
    pillar_tag?: string;
    consultation_label?: string;
    consultation_question?: string;
    pillars?: { num: string; title: string; desc: string }[];
  };
}

export default function BespokeSection({
  lang = "es",
  finishes = [],
  dict,
}: BespokeSectionProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  // Todos los textos vienen del diccionario (src/dictionaries/{es,en}.json → bespoke)
  const content = {
    meta: dict?.meta ?? "",
    title: dict?.title ?? "",
    description: dict?.description ?? "",
    badge: dict?.badge_atelier ?? "",
    cta: dict?.cta_consultation ?? "",
    pillars: dict?.pillars ?? [],
  };

  // Prioriza la imagen del primer finish si existe en BD; de lo contrario usa una textura arquitectónica curada
  const coverImage =
    finishes[0]?.cover_image?.split("?")[0] || "/images/Textura1.jpg";

  return (
    <section className="relative w-full bg-background text-black-neutral maya-section font-sans border-t border-border-light selection:bg-accent selection:text-white overflow-hidden">
      <div className="editorial-container space-y-8 sm:space-y-12">
        {/* CABECERA EDITORIAL */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-8 border-b border-border-light pb-6 sm:pb-8">
          <div className="space-y-2 max-w-3xl">
            <SectionLabel variant="minimal" theme="accent">
              {content.meta}
            </SectionLabel>

            <h2 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral leading-tight">
              {content.title}
            </h2>
          </div>

          <p className="font-sans text-maya-body text-black-neutral/75 font-light max-w-md leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* BENTO EDITORIAL: MANIFIESTO + FOTOGRAFÍA + PILARES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* FOTOGRAFÍA EDITORIAL DE IMPACTO */}
          <div className="lg:col-span-7 xl:col-span-7 relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-auto lg:min-h-[500px] bg-surface rounded-2xs overflow-hidden border border-border-light shadow-2xs">
            <Image
              src={coverImage}
              alt={dict?.image_alt ?? ""}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover w-full h-full pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black-pure/95 via-black-pure/40 to-transparent pointer-events-none" />

            <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 z-10 space-y-2">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                {content.badge}
              </span>
              <h3 className="font-sans text-maya-h3 sm:text-maya-h2 font-light uppercase tracking-editorial text-white leading-snug">
                {dict?.image_headline}
              </h3>
            </div>
          </div>

          {/* PILARES DEL SERVICIO & CTA */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between space-y-4 sm:space-y-5">
            {/* LISTADO DE PILARES */}
            <div className="space-y-2.5 sm:space-y-3">
              {content.pillars.map((pillar) => (
                <div
                  key={pillar.num}
                  className="p-4 sm:p-5 bg-surface border border-border-light rounded-2xs hover:border-accent/40 transition-colors shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
                    <span>{pillar.num}</span>
                    <span className="text-black-neutral/30">{dict?.pillar_tag}</span>
                  </div>
                  <h4 className="font-sans text-maya-h4 font-medium uppercase text-black-neutral tracking-wide">
                    {pillar.title}
                  </h4>
                  <p className="font-sans text-maya-small text-black-neutral/70 font-light leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* BANNER CTA DIRECTO A CONTACTO CON OBJ BESPOKE */}
            <div className="p-5 sm:p-6 bg-black-neutral text-gray-warm rounded-2xs border border-gray-warm/15 shadow-sm space-y-3">
              <div className="space-y-1">
                <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                  {dict?.consultation_label}
                </span>
                <p className="font-sans text-maya-body uppercase tracking-editorial text-gray-warm font-light leading-snug">
                  {dict?.consultation_question}
                </p>
              </div>

              <div className="pt-1">
                <Button
                  href={`/${ROUTES.contacto[currentLocale]}?reason=bespoke`}
                  variant="outline-light"
                  size="md"
                  icon={<span>→</span>}
                  iconPosition="right"
                  fullWidth
                >
                  {content.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
