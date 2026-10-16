"use client";

import { slugify } from "@/lib/utils/strings";
import CollectionLogoTitle from "./CollectionLogoTitle";
import { isVideoUrl } from "@/lib/utils/media";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import CollectionMaterialCard from "./CollectionMaterialCard";
import MaterialSpecDiagram from "./MaterialSpecDiagram";
import {
  CollectionItem,
  MaterialItem,
  EditorialBlock,
} from "@/app/[lang]/coleccion/actions";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface CollectionSectionProps {
  collection: CollectionItem;
  index: number;
  lang: string;
  dict?: any;
}



export default function CollectionSection({
  collection,
  index,
  lang = "es",
  dict,
}: CollectionSectionProps) {
  // IMPORTANTE: todos los hooks van antes de cualquier `return` condicional
  // (reglas de hooks de React). Los early-returns están más abajo.
  const t = dict?.collection_page;
  const materials = useMemo(
    () => collection?.materials || [],
    [collection?.materials],
  );
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(
    materials[0] || null,
  );
  const [activeMediaIdx, setActiveMediaIdx] = useState<number>(0);

  const specRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const parentRoute = ROUTES.coleccion[currentLocale];
  const collectionSlug = slugify(
    collection?.slug || collection?.title || collection?.id || "",
  );

  const title = collection?.title;
  const tagline = collection?.tagline;
  const manifest = collection?.manifest;

  // Sincronización automática de material al abrir URL (?material=...)
  useEffect(() => {
    const targetQuery = searchParams.get("material") || searchParams.get("q");

    if (targetQuery && materials.length > 0) {
      const cleanQuery = targetQuery.toLowerCase().trim();

      const found = materials.find((m) => {
        const akaSlug = m.aka ? slugify(m.aka) : "";
        const nameSlug = slugify(m.name || "");
        const skuMatch = m.sku?.toLowerCase() === cleanQuery;

        return akaSlug === cleanQuery || nameSlug === cleanQuery || skuMatch;
      });

      if (found) {
        setSelectedMaterial(found);
        setActiveMediaIdx(0);

        setTimeout(() => {
          if (specRef.current) {
            const headerOffset = 90;
            const elementPosition = specRef.current.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 120);
      }
    }
  }, [searchParams, materials]);

  const romanIndex =
    ["I", "II", "III", "IV", "V", "VI", "VII"][index] || `0${index + 1}`;

  const uniqueGalleryImages = useMemo(() => {
    const coverClean = collection?.cover_image?.split("?")[0];
    return (collection?.gallery_images || []).filter((img) => {
      const imgClean = img?.split("?")[0];
      return imgClean !== coverClean;
    });
  }, [collection?.cover_image, collection?.gallery_images]);

  const editorialBlocks = useMemo(
    () => collection?.editorial_blocks || [],
    [collection?.editorial_blocks],
  );

  const { assignedEditorialBlocks, remainingMoodboardImages } = useMemo(() => {
    if (editorialBlocks.length === 0) {
      return {
        assignedEditorialBlocks: [],
        remainingMoodboardImages: uniqueGalleryImages,
      };
    }

    const assigned = editorialBlocks.map((block: EditorialBlock, idx) => {
      const assignedImg = block.imageUrl || uniqueGalleryImages[idx] || null;
      return {
        ...block,
        computedImage: assignedImg,
      };
    });

    const usedCount = editorialBlocks.length;
    const remaining = uniqueGalleryImages.slice(usedCount);

    return {
      assignedEditorialBlocks: assigned,
      remainingMoodboardImages:
        remaining.length > 0 ? remaining : uniqueGalleryImages,
    };
  }, [editorialBlocks, uniqueGalleryImages]);

  // Early-returns seguros: ya se ejecutaron todos los hooks.
  if (!collection || materials.length === 0) return null;

  const mainImageUrl =
    selectedMaterial?.image || collection?.cover_image || null;

  const mediaGallery = selectedMaterial
    ? [
        ...(mainImageUrl
          ? [
              {
                id: "main",
                url: mainImageUrl,
                label: selectedMaterial.image
                  ? t?.view_natural_slab || "Placa Natural"
                  : t?.view_sample || "Muestra",
                isRender: false,
              },
            ]
          : []),
        ...(selectedMaterial.renders || []).map((r) => ({
          id: r.id,
          url: r.render_url,
          label: r.application || t?.view_render_default || "Perspectiva",
          isRender: true,
        })),
      ]
    : [];

  const currentMedia = mediaGallery[activeMediaIdx] || mediaGallery[0];

  const handleSelectMaterial = (mat: MaterialItem) => {
    setSelectedMaterial(mat);
    setActiveMediaIdx(0);

    if (typeof window !== "undefined") {
      const aestheticName = mat.aka || mat.name || mat.sku;
      const materialSlug = slugify(aestheticName);
      const cleanUrl = `/${parentRoute}/${collectionSlug}?material=${materialSlug}`;
      window.history.replaceState({}, "", cleanUrl);
    }

    setTimeout(() => {
      if (specRef.current) {
        const headerOffset = 90;
        const elementPosition = specRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 40);
  };

  return (
    <article className="space-y-12 sm:space-y-16 lg:space-y-24 font-sans">
      {/* SECCIÓN 1: PORTADILLA EDITORIAL */}
      <div
        className="pb-12 sm:pb-16 border-b transition-colors duration-500"
        style={{ borderColor: "var(--col-border, rgba(255,255,255,0.15))" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <span
                className="font-mono text-maya-label uppercase tracking-data font-bold block"
                style={{ color: "var(--col-accent, #E5DFC8)" }}
              >
                {`${t?.chapter_prefix || "Colección"} ${romanIndex}`}
              </span>
              <CollectionLogoTitle
                title={title || ""}
                logoUrl={collection.logo_url}
                className="font-sans font-light text-maya-h1 sm:text-maya-display uppercase tracking-editorial leading-tight"
                imgClassName="h-12 sm:h-16 lg:h-20 [filter:var(--col-logo-filter,none)]"
                style={{ color: "var(--col-text, #FFFFFF)" }}
              />
              {tagline && (
                <p
                  className="font-serif italic text-maya-h4 sm:text-maya-h3 pt-0.5"
                  style={{
                    color: "var(--col-secondary, rgba(255,255,255,0.8))",
                  }}
                >
                  &ldquo;{tagline}&rdquo;
                </p>
              )}
            </div>

            {manifest && (
              <p
                className="font-sans text-maya-body font-light leading-relaxed whitespace-pre-line max-w-xl"
                style={{
                  color: "var(--col-text-muted, rgba(255,255,255,0.85))",
                }}
              >
                {manifest}
              </p>
            )}
          </div>

          {collection?.cover_image && (
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div
                className="relative w-full max-w-[420px] aspect-4/3 sm:aspect-4/5 overflow-hidden rounded-2xs shadow-2xl border"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <Image
                  src={collection.cover_image}
                  alt={title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover block"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: VIDEO CINEMÁTICO */}
      {collection?.video_url && (
        <div
          className="pb-12 sm:pb-16 flex justify-center border-b transition-colors duration-500"
          style={{ borderColor: "var(--col-border, rgba(255,255,255,0.15))" }}
        >
          <div className="relative w-full max-w-5xl aspect-video overflow-hidden rounded-2xs shadow-2xl bg-black border border-white/10">
            <video
              autoPlay
              loop
              muted
              playsInline
              key={collection.video_url}
              className="w-full h-full object-cover block border-0 outline-none"
            >
              <source src={collection.video_url} type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: ENSAYOS DINÁMICOS */}
      {assignedEditorialBlocks.length > 0 && (
        <div
          className="space-y-12 sm:space-y-16 lg:space-y-20 pb-12 sm:pb-16 border-b transition-colors duration-500"
          style={{ borderColor: "var(--col-border, rgba(255,255,255,0.15))" }}
        >
          {assignedEditorialBlocks.map((block: any, idx: number) => {
            const isEven = idx % 2 === 0;

            return (
              <div
                key={block.id || idx}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center"
              >
                <div
                  className={`space-y-3.5 ${
                    block.computedImage
                      ? "lg:col-span-6"
                      : "lg:col-span-12 max-w-3xl"
                  } ${isEven ? "lg:order-1" : "lg:order-2"}`}
                >
                  <div className="space-y-1">
                    {block.subtitle && (
                      <span
                        className="font-mono text-maya-label uppercase tracking-data font-semibold block"
                        style={{ color: "var(--col-accent, #E5DFC8)" }}
                      >
                        {block.subtitle}
                      </span>
                    )}
                    <h3
                      className="font-sans font-light text-maya-h3 sm:text-maya-h2 uppercase tracking-editorial"
                      style={{ color: "var(--col-text, #FFFFFF)" }}
                    >
                      {block.title}
                    </h3>
                  </div>

                  <p
                    className="font-sans text-maya-body font-light leading-relaxed whitespace-pre-line max-w-xl"
                    style={{
                      color: "var(--col-text-muted, rgba(255,255,255,0.85))",
                    }}
                  >
                    {block.content}
                  </p>

                  {block.bullets && block.bullets.length > 0 && (
                    <ul
                      className="space-y-1.5 pt-2 border-t"
                      style={{
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      {block.bullets
                        .filter(Boolean)
                        .map((bullet: string, bIdx: number) => (
                          <li
                            key={bIdx}
                            className="font-sans text-maya-small font-light leading-relaxed"
                            style={{
                              color:
                                "var(--col-text-muted, rgba(255,255,255,0.8))",
                            }}
                          >
                            • {bullet}
                          </li>
                        ))}
                    </ul>
                  )}

                  {block.curatorialNote && (
                    <div
                      className="border-l-2 pl-3.5 py-1.5 my-2 rounded-r-2xs space-y-1"
                      style={{
                        borderColor: "var(--col-accent, #E5DFC8)",
                        backgroundColor: "rgba(0,0,0,0.15)",
                      }}
                    >
                      <span
                        className="font-mono text-maya-label uppercase tracking-data font-semibold block"
                        style={{ color: "var(--col-accent, #E5DFC8)" }}
                      >
                        {t?.curatorial_note_label || "Nota Curatorial"}
                      </span>
                      <p
                        className="font-serif italic text-maya-small leading-relaxed"
                        style={{ color: "var(--col-text, #FFFFFF)" }}
                      >
                        &ldquo;{block.curatorialNote}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {block.computedImage && (
                  <div
                    className={`lg:col-span-6 flex justify-center ${
                      isEven ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div
                      className="relative w-full max-w-[460px] aspect-4/3 sm:aspect-16/10 overflow-hidden rounded-2xs shadow-xl border"
                      style={{
                        borderColor: "rgba(255,255,255,0.1)",
                        backgroundColor: "rgba(0,0,0,0.2)",
                      }}
                    >
                      <Image
                        src={block.computedImage}
                        alt={block.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover block transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SECCIÓN 4: FICHA DIAGRAMÁTICA */}
      {selectedMaterial && (
        <div ref={specRef} className="space-y-3.5">
          <MaterialSpecDiagram
            material={selectedMaterial}
            collectionCover={collection?.cover_image}
            activeMediaUrl={currentMedia?.url}
            lang={lang}
            dict={dict}
          />

          {mediaGallery.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 no-scrollbar font-mono text-maya-label pt-1">
              <span
                className="uppercase shrink-0 font-mono tracking-data"
                style={{
                  color: "var(--col-text-muted, rgba(255,255,255,0.6))",
                }}
              >
                {t?.views_available || "Vistas"}
              </span>
              {mediaGallery.map((med, idx) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => setActiveMediaIdx(idx)}
                  aria-label={med.label}
                  style={
                    activeMediaIdx === idx
                      ? {
                          backgroundColor: "var(--col-text, #FFFFFF)",
                          color: "var(--col-bg, #000000)",
                          borderColor: "var(--col-text, #FFFFFF)",
                        }
                      : {
                          borderColor:
                            "var(--col-border, rgba(255,255,255,0.2))",
                          color: "var(--col-text, #FFFFFF)",
                        }
                  }
                  className={`px-3 py-1 uppercase tracking-data transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer focus:outline-none rounded-3xs ${
                    activeMediaIdx === idx
                      ? "font-bold shadow-md"
                      : "bg-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{
                      backgroundColor:
                        activeMediaIdx === idx
                          ? "var(--col-bg, #000000)"
                          : "var(--col-text, #FFFFFF)",
                    }}
                  />
                  <span>{med.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 5: MUESTRARIO */}
      <div className="space-y-4 pt-2">
        <div
          className="flex justify-between items-center pb-2 border-b"
          style={{ borderColor: "var(--col-border, rgba(255,255,255,0.15))" }}
        >
          <span
            className="font-mono text-maya-label uppercase tracking-data font-semibold"
            style={{ color: "var(--col-accent, #E5DFC8)" }}
          >
            {t?.materials_catalogue_title || "Muestrario de Piedras Naturales"}
          </span>
          <span
            className="font-mono text-maya-label uppercase tracking-data hidden sm:block opacity-60"
            style={{
              color: "var(--col-text-muted, rgba(255,255,255,0.5))",
            }}
          >
            {t?.materials_catalogue_hint}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {materials.map((mat) => (
            <CollectionMaterialCard
              key={mat.sku}
              material={mat}
              collectionCover={collection?.cover_image}
              isSelected={selectedMaterial?.sku === mat.sku}
              onSelect={() => handleSelectMaterial(mat)}
              dict={dict}
            />
          ))}
        </div>
      </div>

      {/* SECCIÓN 6: MOODBOARD */}
      {remainingMoodboardImages.length > 0 && (
        <div
          className="space-y-4 pt-4 mt-8 sm:mt-12 border-t"
          style={{ borderColor: "var(--col-border, rgba(255,255,255,0.15))" }}
        >
          <div className="pb-1">
            <span
              className="font-mono text-maya-label uppercase tracking-data font-semibold"
              style={{ color: "var(--col-accent, #E5DFC8)" }}
            >
              {t?.moodboard_title || "Atmósferas & Texturas"}
            </span>
          </div>

          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3.5 sm:gap-5 space-y-3.5 sm:space-y-5">
            {remainingMoodboardImages.filter(Boolean).map((mediaUrl, idx) => {
              const isVid = isVideoUrl(mediaUrl);
              return (
                <div
                  key={idx}
                  className="break-inside-avoid relative overflow-hidden group transition-transform duration-500 hover:scale-[1.01] rounded-2xs border shadow-lg"
                  style={{
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                >
                  {isVid ? (
                    <video
                      src={mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto block border-0 outline-none bg-black"
                    />
                  ) : (
                    <Image
                      src={mediaUrl}
                      alt={`Moodboard ${idx + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-auto block group-hover:scale-103 transition-transform duration-700 ease-out"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
