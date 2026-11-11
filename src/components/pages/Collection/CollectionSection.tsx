"use client";

import { slugify } from "@/lib/utils/strings";
import CollectionLogoTitle from "./CollectionLogoTitle";
import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import CollectionMaterialCard from "./CollectionMaterialCard";
import MaterialSpecDiagram from "./MaterialSpecDiagram";
import MaterialSpecPanel, {
  PANEL_IMAGE_QUALITY,
  PANEL_IMAGE_SIZES,
} from "./MaterialSpecPanel";
import { preloadImage } from "@/lib/utils/preloadImage";
import CollectionCatalogDownload from "./CollectionCatalogDownload";
import { CollectionItem, MaterialItem } from "@/app/[lang]/coleccion/actions";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import LazyVideo from "@/components/ui/LazyVideo";

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
  const t = dict?.collection_page;
  const materials = useMemo(
    () => collection?.materials || [],
    [collection?.materials],
  );
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(
    materials[0] || null,
  );

  const specRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  // Destino del scroll: la ficha en celular o el muestrario en escritorio
  // (el bloque que no se ve tiene offsetParent = null).
  const scrollTarget = () =>
    specRef.current?.offsetParent ? specRef.current : desktopRef.current;
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

        setTimeout(() => {
          const target = scrollTarget();
          if (target) {
            const headerOffset = 90;
            const elementPosition = target.getBoundingClientRect().top;
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

  // Proporción real del video (evita recortes/estirados al mostrarlo)
  const [videoRatio, setVideoRatio] = useState<number | null>(null);

  const romanIndex =
    ["I", "II", "III", "IV", "V", "VI", "VII"][index] || `0${index + 1}`;

  // Precarga las fotos del material anterior y siguiente: con las flechas de
  // la ficha el cambio es instantáneo.
  useEffect(() => {
    if (!selectedMaterial || materials.length < 2) return;
    const i = materials.findIndex((m) => m.sku === selectedMaterial.sku);
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    for (const k of [i - 1, i + 1]) {
      const m = materials[(k + materials.length) % materials.length];
      const src = m?.image || collection?.cover_image;
      if (desktop) preloadImage(src, PANEL_IMAGE_SIZES, PANEL_IMAGE_QUALITY);
      else preloadImage(src, "100vw");
    }
  }, [selectedMaterial, materials, collection?.cover_image]);

  if (!collection || materials.length === 0) return null;

  const handleSelectMaterial = (mat: MaterialItem, scroll = false) => {
    setSelectedMaterial(mat);

    if (typeof window !== "undefined") {
      const aestheticName = mat.aka || mat.name || mat.sku;
      const materialSlug = slugify(aestheticName);
      const cleanUrl = `/${parentRoute}/${collectionSlug}?material=${materialSlug}`;
      window.history.replaceState({}, "", cleanUrl);
    }

    if (!scroll) return;
    setTimeout(() => {
      const target = scrollTarget();
      if (target) {
        const headerOffset = 90;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 40);
  };

  const selectedIndex = Math.max(
    0,
    materials.findIndex((m) => m.sku === selectedMaterial?.sku),
  );

  // Muestras de tamaño fijo, centradas en su columna (pocos materiales =
  // muestras más grandes). Tamaños ~10% menores que la versión anterior.
  const gridCols =
    materials.length <= 4
      ? "grid-cols-[repeat(auto-fit,200px)] lg:grid-cols-[repeat(auto-fit,240px)]"
      : "grid-cols-[repeat(auto-fit,140px)] lg:grid-cols-[repeat(auto-fit,152px)] xl:grid-cols-[repeat(auto-fit,168px)]";

  // Precarga la foto de la ficha de un material (escritorio/tablet o celular)
  const preloadSpec = (m?: MaterialItem) => {
    if (!m || typeof window === "undefined") return;
    const src = m.image || collection?.cover_image;
    if (window.matchMedia("(min-width: 768px)").matches) {
      preloadImage(src, PANEL_IMAGE_SIZES, PANEL_IMAGE_QUALITY);
    } else {
      preloadImage(src, "100vw");
    }
  };

  const availabilityHref = selectedMaterial
    ? `/${ROUTES.contacto[currentLocale]}?reason=quote&category=${encodeURIComponent(collection.slug || collectionSlug)}&material=${encodeURIComponent(selectedMaterial.aka || selectedMaterial.name)}`
    : "";

  const goToMaterial = (step: number) => {
    const nextIdx =
      (selectedIndex + step + materials.length) % materials.length;
    const next = materials[nextIdx];
    if (next) handleSelectMaterial(next, false);
  };

  return (
    <article className="space-y-8 sm:space-y-12 lg:space-y-20 font-sans">
      {/* Portadilla y video: ancho editorial (centrado) */}
      <div className="editorial-container space-y-8 sm:space-y-12 lg:space-y-20">
      {/* SECCIÓN 1: PORTADILLA EDITORIAL */}
      <div className="border-col-border pb-8 sm:pb-12 lg:pb-16 border-b transition-colors duration-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 lg:gap-14 items-center">
          <div className="md:col-span-7 lg:col-span-6 space-y-4 sm:space-y-5 min-w-0">
            <div className="space-y-1.5">
              <span className="text-col-accent font-mono text-maya-label uppercase tracking-data font-bold block">
                {`${t?.chapter_prefix} ${romanIndex}`}
              </span>
              <CollectionLogoTitle
                title={title || ""}
                logoUrl={collection.logo_url}
                className="text-col-text font-sans font-light text-maya-h1 lg:text-maya-display uppercase tracking-editorial leading-tight break-words"
                imgClassName="h-9 sm:h-12 md:h-14 lg:h-16 xl:h-20 max-w-[85%] col-logo"
              />
              {tagline && (
                <p className="text-col-secondary font-serif italic text-maya-body sm:text-maya-h4 pt-0.5">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}
            </div>

            {manifest && (
              <p className="text-col-muted font-sans text-maya-body font-light leading-relaxed whitespace-pre-line max-w-xl">
                {manifest}
              </p>
            )}
          </div>

          {collection?.cover_image && (
            <div className="md:col-span-5 lg:col-span-6 flex justify-center md:justify-end">
              <div className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] xl:max-w-[440px] aspect-[77/100] overflow-hidden">
                <Image
                  src={collection.cover_image}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 300px, 440px"
                  className="object-cover scale-[1.015]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: VIDEO CINEMÁTICO */}
      {collection?.video_url && (
        <div className="border-col-border pb-10 sm:pb-16 flex justify-center border-b transition-colors duration-500">
          {/* 30% más compacto que antes (max-w-5xl → ~717px) y con la proporción
              real del video: no se estira, no se recorta y no se amplía de más. */}
          <div
            className="relative max-w-[717px] overflow-hidden rounded-2xs shadow-2xl bg-black-pure border border-col-media"
            style={{
              aspectRatio: videoRatio ?? 16 / 9,
              // Videos verticales: se limitan por alto para no salirse de pantalla
              width: `min(100%, calc(75vh * ${videoRatio ?? 16 / 9}))`,
            }}
          >
            <LazyVideo
              key={collection.video_url}
              src={collection.video_url}
              onDimensions={(w, h) => setVideoRatio(w / h)}
              className="absolute inset-0 w-full h-full object-contain block border-0 outline-none"
            />
          </div>
        </div>
      )}

      </div>

      {/* Muestrario y ficha: mismos márgenes laterales que el header */}
      <div className="w-full px-4 sm:px-7 md:px-10 lg:px-14">
      {/* =========================================================
          SECCIÓN 3 Y 4: MUESTRARIO + FICHA TÉCNICA
          ========================================================= */}

      {/* ---- CELULAR: mosaico + ficha con placa deslizable ---- */}
      <div className="md:hidden space-y-4">
        <div className="p-3 rounded-2xs bg-col-card/70 border border-col-card-border">
          <div className="grid grid-cols-4 min-[380px]:grid-cols-5 gap-1.5">
            {materials.map((mat) => {
              const displayImg = mat.image || collection?.cover_image || null;
              const displayName = mat.aka || mat.name;
              const isSelected = selectedMaterial?.sku === mat.sku;

              return (
                <button
                  key={mat.sku}
                  type="button"
                  onClick={() => handleSelectMaterial(mat, false)}
                  aria-label={displayName}
                  aria-pressed={isSelected}
                  className={`relative aspect-square rounded-3xs overflow-hidden border transition-all duration-300 bg-black-neutral cursor-pointer ${
                    isSelected
                      ? "border-col-accent ring-1 ring-col-accent shadow-sm"
                      : "border-col-media/70 opacity-80"
                  }`}
                >
                  {displayImg ? (
                    <Image
                      src={displayImg}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-mono text-[8px] text-col-muted">
                      —
                    </span>
                  )}
                  {isSelected && (
                    <span className="absolute inset-0 border-2 border-col-accent pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedMaterial && (
          <div ref={specRef} className="scroll-mt-24">
            <MaterialSpecDiagram
              material={selectedMaterial}
              collectionCover={collection?.cover_image}
              index={selectedIndex}
              total={materials.length}
              onPrev={() => goToMaterial(-1)}
              onNext={() => goToMaterial(1)}
              lang={lang}
              dict={dict}
              cta={
                t?.availability_cta
                  ? { href: availabilityHref, label: t.availability_cta }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* ---- TABLET Y ESCRITORIO: muestrario + ficha fija al lado ---- */}
      <div
        ref={desktopRef}
        className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] gap-8 lg:gap-12 items-start scroll-mt-24"
      >
        <div className={`grid ${gridCols} justify-center gap-x-3 gap-y-5 lg:gap-x-4 lg:gap-y-6`}>
          {materials.map((mat) => (
            <CollectionMaterialCard
              key={mat.sku}
              material={mat}
              collectionCover={collection?.cover_image}
              isSelected={selectedMaterial?.sku === mat.sku}
              onSelect={() => handleSelectMaterial(mat, false)}
              onPreview={() => preloadSpec(mat)}
              dict={dict}
            />
          ))}
        </div>

        {selectedMaterial && (
          <aside className="md:sticky md:top-24">
            <MaterialSpecPanel
              material={selectedMaterial}
              collectionCover={collection?.cover_image}
              index={selectedIndex}
              total={materials.length}
              onPrev={() => goToMaterial(-1)}
              onNext={() => goToMaterial(1)}
              dict={dict}
              cta={
                t?.availability_cta
                  ? { href: availabilityHref, label: t.availability_cta }
                  : undefined
              }
            />
          </aside>
        )}
      </div>

      </div>

      <div className="editorial-container">
      {/* SECCIÓN 5: CATÁLOGO DIGITAL DESCARGABLE */}
      <CollectionCatalogDownload
        url={collection.catalog_url}
        collectionTitle={title || ""}
        logoUrl={collection.logo_url}
        coverImage={collection.cover_image}
        lang={lang}
        dict={dict}
      />
      </div>
    </article>
  );
}
