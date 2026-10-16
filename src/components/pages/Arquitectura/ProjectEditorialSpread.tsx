"use client";

import { cleanImageUrl } from "@/lib/utils/strings";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { getI18n } from "@/lib/i18n/utils";

export interface ProjectItem {
  id: string;
  title: any;
  title_es?: string;
  title_en?: string;
  slug: any;
  category: any;
  location?: any;
  short_description?: any;
  short_description_es?: string;
  short_description_en?: string;
  description?: any;
  description_es?: string;
  description_en?: string;
  cover_image?: string;
  gallery_images?: string[];
  material_skus?: any[];
}

interface ProjectEditorialSpreadProps {
  project: ProjectItem;
  index: number;
  lang: "es" | "en";
  cardActionText: string;
  materialLabel: string;
  categoriesDict: Record<string, string>;
  onOpenDossier: (proj: ProjectItem) => void;
}


export default function ProjectEditorialSpread({
  project,
  index,
  lang,
  cardActionText,
  materialLabel,
  categoriesDict,
  onOpenDossier,
}: ProjectEditorialSpreadProps) {
  const isEven = index % 2 === 1;

  const title = getI18n(project.title || project.title_es, lang);
  const description =
    getI18n(project.description || project.description_es, lang) ||
    getI18n(project.short_description || project.short_description_es, lang);

  const rawCategory = getI18n(project.category, lang);
  const translatedCategory = categoriesDict?.[rawCategory] || rawCategory;
  const location = getI18n(project.location, lang);

  const previewGallery = Array.isArray(project.gallery_images)
    ? project.gallery_images.slice(0, 2)
    : [];

  const elementId = getI18n(project.slug, lang) || String(project.id);
  const coverImageSrc = cleanImageUrl(project.cover_image);

  return (
    <article
      id={elementId}
      className="maya-block border-b border-border-light last:border-b-0 bg-background scroll-mt-20 font-sans"
    >
      <div className="editorial-container">
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-start ${
            isEven ? "lg:grid-flow-dense" : ""
          }`}
        >
          {/* FOTOGRAFÍA PRINCIPAL */}
          <div className={`lg:col-span-7 ${isEven ? "lg:col-start-6" : ""}`}>
            <div
              onClick={() => onOpenDossier(project)}
              className="relative aspect-16/10 w-full overflow-hidden bg-surface border border-border-light cursor-pointer group rounded-2xs shadow-xs"
            >
              {coverImageSrc && (
                <Image
                  src={coverImageSrc}
                  alt={title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover group-hover:scale-103 transition-transform duration-1000 ease-out"
                />
              )}
              <div className="absolute inset-0 bg-black-neutral/0 group-hover:bg-black-neutral/5 transition-colors duration-500" />
            </div>
          </div>

          {/* COLUMNA NARRATIVA */}
          <div
            className={`lg:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6 ${
              isEven ? "lg:col-start-1" : ""
            }`}
          >
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-light pb-2 font-mono text-maya-label uppercase tracking-data">
                  <span className="text-accent-ink font-semibold">
                    {translatedCategory}
                  </span>
                  {location && (
                    <span className="text-black-neutral/50">{location}</span>
                  )}
                </div>

                <h2 className="font-sans font-light tracking-editorial text-maya-h3 sm:text-maya-h2 uppercase text-black-neutral leading-tight">
                  {title}
                </h2>
              </div>

              {description && (
                <p className="font-sans font-light text-maya-small sm:text-maya-body text-black-neutral/75 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              )}

              {project.material_skus && project.material_skus.length > 0 && (
                <div className="border-t border-border-light pt-3 space-y-1">
                  <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/40 font-medium">
                    {materialLabel}
                  </span>
                  <p className="font-sans text-maya-small uppercase tracking-wide text-black-neutral font-medium leading-snug">
                    {project.material_skus
                      .map((sku: any) => getI18n(sku, lang))
                      .join(" · ")}
                  </p>
                </div>
              )}
            </div>

            {previewGallery.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                {previewGallery.map((imgUrl, i) => (
                  <div
                    key={i}
                    onClick={() => onOpenDossier(project)}
                    className="relative aspect-16/10 sm:aspect-4/3 bg-surface overflow-hidden border border-border-light cursor-pointer group rounded-3xs"
                  >
                    <Image
                      src={cleanImageUrl(imgUrl)}
                      alt={`${title} · ${i + 1}`}
                      fill
                      sizes="(max-width: 1024px) 50vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black-neutral/0 group-hover:bg-black-neutral/5 transition-colors duration-500" />
                  </div>
                ))}
              </div>
            )}

            <div className="pt-1">
              <Button
                variant="ghost"
                align="left"
                icon={<span>→</span>}
                iconPosition="right"
                onClick={() => onOpenDossier(project)}
                className="text-maya-label tracking-nav uppercase text-black-neutral hover:text-accent-ink"
              >
                {cardActionText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
