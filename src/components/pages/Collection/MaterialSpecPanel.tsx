"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MaterialItem } from "@/app/[lang]/coleccion/actions";

// =============================================================================
// FICHA TÉCNICA (ESCRITORIO / TABLET)
// -----------------------------------------------------------------------------
// Panel fijo junto al muestrario: al elegir un material la ficha cambia en su
// lugar, sin desplazar la página. Foto contenida (16:10, máx. ~480px de ancho)
// para que nunca se amplíe más allá de su resolución real.
// En celular se sigue usando MaterialSpecDiagram (placa deslizable).
// =============================================================================

interface MaterialSpecPanelProps {
  material: MaterialItem;
  collectionCover?: string | null;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  dict?: any;
  cta?: { href: string; label: string };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Mismo `sizes`/`quality` que la foto de la ficha (lo usa la precarga). */
export const PANEL_IMAGE_SIZES =
  "(min-width: 1200px) 470px, (min-width: 768px) 42vw, 100vw";
export const PANEL_IMAGE_QUALITY = 90;

function labelFrom(map: Record<string, string> | undefined, raw: string) {
  const clean = raw.trim();
  if (!map) return clean;
  const key = Object.keys(map).find(
    (k) => k.toLowerCase() === clean.toLowerCase(),
  );
  return key ? map[key] : clean;
}

function uniq(list: string[]) {
  return list.filter(
    (v, i) =>
      v && list.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
  );
}

export default function MaterialSpecPanel({
  material,
  collectionCover,
  index,
  total,
  onPrev,
  onNext,
  dict,
  cta,
}: MaterialSpecPanelProps) {
  const d = dict?.collection_page?.spec_diagram;
  const image = material.image || collectionCover || "/images/Cantera.jpg";
  const name = material.aka || material.name;

  // Cambio de foto sin parpadeo: la anterior se queda debajo hasta que la
  // nueva carga (si ya está precargada, el cambio es inmediato).
  const [shown, setShown] = useState({ cur: image, prev: "", ready: true });
  // Estado derivado durante el render (patrón recomendado por React)
  if (shown.cur !== image) {
    setShown({ cur: image, prev: shown.cur, ready: false });
  }

  const term = (t?: string | null) => {
    if (!t) return "";
    const c = t.trim();
    return dict?.collection?.terms?.[c] || dict?.terms?.[c] || c;
  };
  const specs = [
    term(material.stone_type || material.category),
    term(material.origin),
  ].filter(Boolean);

  const finishes = uniq(
    (material.finishes || []).map((f) => labelFrom(d?.finish_labels, f)),
  );
  const formats = uniq(
    (material.formats || []).map((f) => labelFrom(d?.format_labels, f)),
  );

  const navBtn =
    "h-8 w-8 flex items-center justify-center border border-spec-border text-spec-text transition-colors duration-300 hover:border-spec-accent hover:text-spec-accent cursor-pointer";

  return (
    <section
      aria-label={`${d?.sheet_label ?? "Ficha técnica"}: ${name}`}
      aria-live="polite"
      className="flex flex-col bg-spec-bg text-spec-text border border-spec-border shadow-xl md:max-h-[calc(100svh-7.5rem)]"
    >
      {/* MUESTRA (más panorámica en pantallas bajas para que todo quepa) */}
      <div className="relative shrink-0 aspect-[16/10] [@media(max-height:820px)]:aspect-[2/1] bg-black-neutral overflow-hidden">
        {shown.prev && !shown.ready && (
          <Image
            src={shown.prev}
            alt=""
            fill
            quality={PANEL_IMAGE_QUALITY}
            sizes={PANEL_IMAGE_SIZES}
            className="object-cover"
          />
        )}
        <Image
          key={shown.cur}
          src={shown.cur}
          alt={name}
          fill
          priority
          quality={PANEL_IMAGE_QUALITY}
          sizes={PANEL_IMAGE_SIZES}
          onLoad={() => setShown((s) => ({ ...s, ready: true, prev: "" }))}
          onError={() => setShown((s) => ({ ...s, ready: true, prev: "" }))}
          className={`object-cover transition-opacity duration-150 ease-out ${
            shown.ready ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* CONTENIDO (si no cabe, se desplaza aquí; el botón queda siempre visible) */}
      <div
        key={material.sku}
        className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-5 lg:p-6 space-y-5 animate-[sheet-fade_0.15s_ease-out]"
      >
        {/* NOMBRE + NAVEGACIÓN */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <h3 className="font-sans font-light text-maya-h2 uppercase tracking-editorial leading-[1.05] break-words">
              {name}
            </h3>
            {specs.length > 0 && (
              <p className="font-mono text-maya-label uppercase tracking-data text-spec-accent">
                {specs.join(" / ")}
              </p>
            )}
          </div>

          {total > 1 && (
            <div className="shrink-0 flex items-center gap-1.5 pt-1">
              <button type="button" onClick={onPrev} aria-label={d?.prev_material} className={navBtn}>
                <span aria-hidden="true">←</span>
              </button>
              <span className="font-mono text-[11px] tracking-data text-spec-muted w-12 text-center tabular-nums">
                {pad(index + 1)}/{pad(total)}
              </span>
              <button type="button" onClick={onNext} aria-label={d?.next_material} className={navBtn}>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </div>

        {/* DESCRIPCIÓN */}
        <p className="font-sans text-maya-small font-light leading-relaxed text-spec-text/80 line-clamp-4 [@media(max-height:820px)]:line-clamp-3">
          {material.description || d?.default_desc}
        </p>

        {/* ACABADOS Y FORMATOS */}
        {(finishes.length > 0 || formats.length > 0) && (
          <dl className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3.5 border-t border-spec-border pt-4">
            {finishes.length > 0 && (
              <>
                <dt className="font-mono text-[11px] uppercase tracking-data text-spec-muted pt-1">
                  {d?.finishes_short ?? d?.finishes_label}
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {finishes.map((f) => (
                      <li
                        key={f}
                        className="px-2 py-1 border border-spec-accent/45 font-mono text-[11px] uppercase tracking-data leading-none text-spec-text"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
            {formats.length > 0 && (
              <>
                <dt className="font-mono text-[11px] uppercase tracking-data text-spec-muted pt-1">
                  {d?.formats_label}
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {formats.map((f) => (
                      <li
                        key={f}
                        className="px-2 py-1 border border-spec-border font-mono text-[11px] uppercase tracking-data leading-none text-spec-text/70"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
          </dl>
        )}

      </div>

      {/* CTA FIJO AL PIE DE LA FICHA */}
      {cta && (
        <div className="shrink-0 px-5 pb-5 lg:px-6 lg:pb-6">
          <Link
            href={cta.href}
            data-track="availability_click"
            data-track-label={name}
            className="group/cta flex w-full items-center justify-between gap-4 px-5 py-3.5 bg-spec-accent text-spec-bg font-mono text-maya-label uppercase tracking-nav transition-opacity duration-300 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-spec-accent focus-visible:ring-offset-2 focus-visible:ring-offset-spec-bg"
          >
            <span>{cta.label}</span>
            <span aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-1">
              →
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
