import Image from "next/image";
import { MaterialItem } from "@/app/[lang]/coleccion/actions";

interface MaterialSpecDiagramProps {
  material: MaterialItem;
  collectionCover?: string | null;
  activeMediaUrl?: string | null;
  lang?: string;
  dict?: any;
}

export default function MaterialSpecDiagram({
  material,
  collectionCover,
  activeMediaUrl,
  dict,
}: MaterialSpecDiagramProps) {
  const d = dict?.collection_page?.spec_diagram;
  const displayImage = activeMediaUrl || material.image || collectionCover;
  const displayName = material.aka || material.name;
  const descriptionText = material.description || "";

  const translateTerm = (term?: string | null): string => {
    if (!term) return "";
    const clean = term.trim();
    return dict?.collection?.terms?.[clean] || dict?.terms?.[clean] || clean;
  };

  const hasUses = Array.isArray(material.uses) && material.uses.length > 0;
  const hasFinishes =
    Array.isArray(material.finishes) && material.finishes.length > 0;
  const hasFormats =
    Array.isArray(material.formats) && material.formats.length > 0;

  return (
    <div
      key={material.sku}
      className="w-full p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6 lg:space-y-8 font-sans my-2 sm:my-4 shadow-2xl transition-all duration-500 rounded-2xs border border-white/10 animate-in fade-in bg-[var(--col-spec-bg,#101820)] text-[var(--col-spec-text,#FFFFFF)]"
    >
      {/* 1. CABECERA COMPACTA (MÓVIL / TABLET) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3">
        <div>
          <h3 className="font-sans font-light text-maya-h3 sm:text-maya-h2 uppercase tracking-editorial text-accent-ink">
            {displayName}
          </h3>
        </div>

        {/* METADATOS RÁPIDOS EN CABECERA (ORIGEN / TIPO) */}
        {(material.stone_type || material.origin) && (
          <div className="flex items-center gap-2 font-mono text-maya-label uppercase tracking-data text-white/70">
            {material.stone_type && (
              <span className="text-white font-medium">
                {translateTerm(material.stone_type)}
              </span>
            )}
            {material.stone_type && material.origin && <span>·</span>}
            {material.origin && <span>{translateTerm(material.origin)}</span>}
          </div>
        )}
      </div>

      {/* 2. CUERPO: TARJETA SPLIT EN MÓVIL / 3 COLUMNAS EN DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 items-start">
        {/* BLOQUE MÓVIL SUPERIOR (MINIATURA + FORMATOS/APLICACIONES) */}
        <div className="lg:hidden flex gap-3.5 items-stretch bg-white/[0.03] p-3 rounded-2xs border border-white/10">
          <div className="relative w-24 sm:w-28 aspect-square shrink-0 overflow-hidden rounded-3xs border border-white/20 bg-white/5">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={displayName}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-white/40 uppercase text-center p-1">
                {d?.no_sample || "Muestra"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-2">
            <div>
              <span className="font-mono text-maya-label uppercase tracking-data font-semibold block text-accent-ink">
                {d?.formats_label || "Formatos"}
              </span>
              <p className="font-sans text-maya-small text-white/90 font-light truncate">
                {hasFormats
                  ? material.formats.map((f) => translateTerm(f)).join(" · ")
                  : d?.formats_fallback || "Placa / Especial"}
              </p>
            </div>

            <div>
              <span className="font-mono text-maya-label uppercase tracking-data font-semibold block text-accent-ink">
                {d?.finishes_label || "Acabados"}
              </span>
              <p className="font-sans text-maya-small text-white/90 font-light truncate">
                {hasFinishes
                  ? material.finishes.map((f) => translateTerm(f)).join(" · ")
                  : d?.finishes_fallback || "Estándar"}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA 1: ESPECIFICACIONES (DESKTOP) / APLICACIONES (MÓVIL) */}
        <div className="lg:col-span-4 space-y-3 text-left order-2 lg:order-1">
          <div className="hidden lg:block space-y-1 border-b border-white/15 pb-2.5">
            <span className="font-mono text-maya-label uppercase tracking-data font-semibold block text-accent-ink">
              {d?.spec_label || "Especificaciones"}
            </span>
            <div className="font-mono text-maya-small text-white/85 space-y-0.5">
              {material.stone_type && (
                <p className="truncate">
                  <span className="text-white/40 uppercase text-maya-label block">
                    {d?.material_label || "Material"}
                  </span>
                  <span className="font-medium text-white">
                    {translateTerm(material.stone_type)}
                  </span>
                </p>
              )}
              {material.origin && (
                <p className="truncate pt-1">
                  <span className="text-white/40 uppercase text-maya-label block">
                    {d?.origin_label || "Origen"}
                  </span>
                  <span className="font-medium text-white">
                    {translateTerm(material.origin)}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="hidden lg:block space-y-1 border-b border-white/15 pb-2.5">
            <span className="font-mono text-maya-label uppercase tracking-data font-semibold block text-accent-ink">
              {d?.formats_label || "Formatos"}
            </span>
            <p className="font-sans text-maya-small text-white/85 font-light leading-snug">
              {hasFormats
                ? material.formats.map((f) => translateTerm(f)).join(" · ")
                : d?.formats_fallback || "Placa / Formato Especial"}
            </p>
          </div>

          {/* Aplicaciones (visible en móvil y desktop) */}
          <div className="space-y-1 border-b border-white/15 pb-2.5">
            <span className="font-mono text-maya-label uppercase tracking-data font-semibold block text-accent-ink">
              {d?.uses_label || "Aplicaciones Sugeridas"}
            </span>
            <p className="font-sans text-maya-small text-white/80 font-light leading-relaxed">
              {hasUses
                ? material.uses.map((use) => translateTerm(use)).join(" · ")
                : d?.uses_fallback || "Uso arquitectónico general."}
            </p>
          </div>

          {/* Acabados (visible solo en desktop, móvil lo tiene en el card) */}
          <div className="hidden lg:block space-y-1">
            <span className="font-mono text-maya-label uppercase tracking-data font-semibold block text-accent-ink">
              {d?.finishes_label || "Acabados"}
            </span>
            <p className="font-sans text-maya-small text-white/80 font-light leading-relaxed">
              {hasFinishes
                ? material.finishes
                    .map((finish) => translateTerm(finish))
                    .join(" · ")
                : d?.finishes_fallback || "Consultar acabados disponibles."}
            </p>
          </div>
        </div>

        {/* COLUMNA 2: MUESTRA CENTRAL (DESKTOP) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col items-center justify-center order-2">
          <div className="w-[1px] h-3 bg-white/20 mb-2" />
          <div className="relative aspect-square w-full max-w-[240px] xl:max-w-[270px] overflow-hidden rounded-2xs shadow-2xl bg-white/5 border border-white/20">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={displayName}
                fill
                sizes="270px"
                className="object-cover animate-in fade-in duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-white/40 uppercase">
                {d?.no_sample || "Muestra en Curaduría"}
              </div>
            )}
          </div>
          <div className="w-[1px] h-3 bg-white/20 mt-2" />
        </div>

        {/* COLUMNA 3: LECTURA GEOLÓGICA (MÓVIL & DESKTOP) */}
        <div className="lg:col-span-4 space-y-2 text-left order-3">
          <div className="flex items-center gap-2 border-b border-white/15 pb-1.5">
            <div className="hidden lg:block h-[1px] w-3 bg-accent" />
            <span className="font-mono text-maya-label uppercase tracking-data font-semibold text-accent-ink">
              {d?.tech_desc_label || "Lectura Geológica"}
            </span>
          </div>

          {descriptionText ? (
            <p className="font-sans text-maya-small sm:text-maya-body text-white/85 font-light leading-relaxed whitespace-pre-line">
              {descriptionText}
            </p>
          ) : (
            <p className="font-sans text-maya-small text-white/40 italic leading-relaxed">
              {d?.default_desc ||
                "Superficie natural seleccionada por su permanencia y carácter táctil."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
