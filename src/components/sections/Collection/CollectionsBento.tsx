"use client";

import Link from "next/link";
import Image from "next/image";
import { cleanImageUrl } from "@/lib/utils/strings";
import CollectionLogoTitle from "@/components/pages/Collection/CollectionLogoTitle";
import { useDragScroll } from "@/hooks/useDragScroll";
import SectionLabel from "@/components/ui/SectionLabel";
import { getI18n, type LocalizedString } from "@/lib/i18n/utils";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface CollectionItemDb {
  id: string;
  title?: LocalizedString;
  title_es: string;
  title_en?: string | null;
  slug: string;
  cover_image?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  collection_products?: Array<{
    product_sku: string;
    products?: {
      image_url?: string | null;
    };
  }>;
}

interface CollectionsBentoProps {
  lang?: string;
  /** Colecciones activas, cargadas y cacheadas en el servidor (getHomeData). */
  collections?: CollectionItemDb[];
  dict: {
    meta: string;
    title: string;
    description: string;
    cta_explore_col?: string;
    default_title?: string;
  };
}

/** Columnas en escritorio según cuántas colecciones haya (máx. 4). */
const DESKTOP_COLS: Record<number, string> = {
  1: "lg:grid-cols-1 lg:max-w-md lg:mx-auto",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * COLECCIONES CURADAS (HOME)
 * Tarjetas editoriales verticales (3:4): portada, isotipo y CTA.
 * - Móvil: carrusel deslizable que deja ver la siguiente tarjeta.
 * - Tablet: 2 columnas · Escritorio: hasta 4 columnas.
 */
export default function CollectionsBento({
  dict,
  lang = "es",
  collections = [],
}: CollectionsBentoProps) {
  const { ref: sliderRef, handlers: dragScroll } =
    useDragScroll<HTMLDivElement>();
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  if (collections.length === 0) return null;

  const desktopCols = DESKTOP_COLS[Math.min(collections.length, 4)];

  return (
    <section className="relative w-full bg-background text-black-neutral maya-section overflow-hidden border-t border-border-light">
      <div className="editorial-container space-y-8 sm:space-y-10 md:space-y-14">
        {/* CABECERA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-end">
          <div className="md:col-span-7 space-y-2">
            <SectionLabel variant="minimal" theme="accent">
              {dict.meta}
            </SectionLabel>
            <h2 className="font-sans font-light tracking-editorial text-maya-h1 text-black-neutral uppercase">
              {dict.title}
            </h2>
          </div>
          <p className="md:col-span-5 font-sans text-maya-body text-black-neutral/70 font-light leading-relaxed md:text-right md:justify-self-end max-w-md">
            {dict.description}
          </p>
        </div>

        {/* TARJETAS */}
        <div
          ref={sliderRef}
          {...dragScroll}
          className={`flex sm:grid sm:grid-cols-2 ${desktopCols} gap-3 sm:gap-5 lg:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 no-scrollbar cursor-grab active:cursor-grabbing sm:cursor-auto select-none`}
        >
          {collections.map((col, index) => {
            const name =
              getI18n(col.title || col.title_es, lang) ||
              dict.default_title ||
              "";

            const targetKey = (col.slug || col.id || "")
              .trim()
              .replace(/^\/+/, "");

            const rawImage =
              col.cover_image ||
              col.collection_products?.[0]?.products?.image_url;
            const imageSrc = cleanImageUrl(rawImage, "/images/Showroom1.jpg");
            const href = `/${ROUTES.coleccion[currentLocale]}/${targetKey}`;

            return (
              <Link
                key={col.id}
                href={href}
                draggable={false}
                aria-label={`${dict.cta_explore_col ?? ""} ${name}`.trim()}
                className="group relative block shrink-0 w-[82%] sm:w-auto snap-start aspect-[3/4] overflow-hidden bg-black-neutral"
              >
                {/* PORTADA */}
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  quality={85}
                  priority={index < 2}
                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover pointer-events-none transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />

                {/* VELO FIJO: solo en la base, para que el isotipo se lea */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black-pure/75 via-black-pure/30 to-transparent pointer-events-none"
                />

                {/* MARCO INTERIOR FINO (aparece en hover) */}
                <div
                  aria-hidden="true"
                  className="absolute inset-3 sm:inset-4 border border-white/0 group-hover:border-white/25 transition-colors duration-700 pointer-events-none"
                />

                {/* CONTENIDO */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7 space-y-4 sm:space-y-5">
                  <CollectionLogoTitle
                    as="h3"
                    title={name}
                    logoUrl={col.logo_url}
                    className="max-w-[80%] font-sans font-light text-maya-h3 text-white uppercase tracking-[0.12em]"
                    imgClassName="h-9 sm:h-10 lg:h-11 brightness-0 invert"
                  />

                  {/* CTA: la línea crece y la flecha avanza en hover */}
                  <div className="flex items-center gap-3 font-sans text-maya-label uppercase tracking-nav text-white/85 group-hover:text-white transition-colors duration-500">
                    <span className="whitespace-nowrap">
                      {dict.cta_explore_col}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 max-w-6 group-hover:max-w-24 bg-white/50 group-hover:bg-white transition-all duration-700 ease-out"
                    />
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-500 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
