"use client";

import { cleanImageUrl } from "@/lib/utils/strings";
import Image from "next/image";
import { useEffect } from "react";
import { ProjectItem } from "./ProjectEditorialSpread";
import { getI18n } from "@/lib/i18n/utils";

interface ProjectGalleryModalProps {
  project: ProjectItem | null;
  lang: "es" | "en";
  onClose: () => void;
  dict: {
    close?: any;
    statement_title?: any;
    materials_title?: any;
    gallery_title?: any;
    no_photo?: any;
    default_location?: any;
  };
  categoriesDict: Record<string, string>;
}


export default function ProjectGalleryModal({
  project,
  lang,
  onClose,
  dict,
  categoriesDict,
}: ProjectGalleryModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (project) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  const title = getI18n(project.title || project.title_es, lang);
  const description =
    getI18n(project.description || project.description_es, lang) ||
    getI18n(project.short_description || project.short_description_es, lang);

  const rawCategory = getI18n(project.category, lang);
  const translatedCategory = categoriesDict?.[rawCategory] || rawCategory;
  const location = getI18n(project.location, lang);
  const coverImageSrc = cleanImageUrl(project.cover_image);

  const closeText = getI18n(dict?.close, lang) || "Cerrar";
  const noPhotoText = getI18n(dict?.no_photo, lang) || "Sin Foto";
  const statementTitle =
    getI18n(dict?.statement_title, lang) || "Memoria Descriptiva";
  const materialsTitle =
    getI18n(dict?.materials_title, lang) || "Materia Natural en Obra";
  const galleryTitle =
    getI18n(dict?.gallery_title, lang) || "Galería Fotográfica";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black-neutral/98 backdrop-blur-xl flex flex-col justify-between font-sans text-gray-warm animate-in fade-in duration-300 select-none"
    >
      {/* CABECERA MODAL */}
      <header className="w-full border-b border-gray-warm/15 px-4 sm:px-8 lg:px-12 py-3 sm:py-3.5 flex items-center justify-between shrink-0 bg-black-neutral">
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-maya-label uppercase tracking-data">
          <span className="text-accent-ink font-semibold">
            {translatedCategory}
          </span>
          {location && (
            <>
              <span className="text-gray-warm/30">/</span>
              <span className="text-gray-warm/60">{location}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="font-mono text-maya-label uppercase tracking-data text-gray-warm/70 hover:text-white transition-colors cursor-pointer px-2 py-1"
        >
          {closeText} [ESC]
        </button>
      </header>

      {/* CONTENIDO DESPLAZABLE */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-10">
        <div className="max-w-4xl">
          <h2 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 uppercase text-white leading-tight">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-7 relative aspect-16/10 w-full overflow-hidden rounded-2xs bg-black-pure border border-gray-warm/15 shadow-2xl">
            {coverImageSrc ? (
              <Image
                src={coverImageSrc}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-gray-warm/30 uppercase tracking-widest">
                {noPhotoText}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <span className="block font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
                {statementTitle}
              </span>
              <p className="font-sans font-light text-maya-small sm:text-maya-body text-gray-warm/85 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>

            {project.material_skus && project.material_skus.length > 0 && (
              <div className="border-t border-gray-warm/15 pt-3.5 space-y-2">
                <span className="block font-mono text-maya-label uppercase tracking-data text-gray-warm/40 font-medium">
                  {materialsTitle}
                </span>
                <div className="flex flex-wrap gap-2">
                  {project.material_skus.map((sku, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-maya-label uppercase tracking-data text-gray-warm bg-black-pure/60 border border-gray-warm/20 px-2.5 py-1 rounded-3xs"
                    >
                      {getI18n(sku, lang)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {project.gallery_images && project.gallery_images.length > 0 && (
          <div className="space-y-4 sm:space-y-6 border-t border-gray-warm/15 pt-6 sm:pt-8">
            <span className="font-mono text-maya-label uppercase tracking-data text-gray-warm/50 block font-semibold">
              {galleryTitle}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {project.gallery_images.map((imgUrl, i) => (
                <div
                  key={i}
                  className="relative aspect-16/10 w-full overflow-hidden rounded-2xs bg-black-pure border border-gray-warm/15 shadow-xl"
                >
                  <Image
                    src={cleanImageUrl(imgUrl)}
                    alt={`${title} · ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
