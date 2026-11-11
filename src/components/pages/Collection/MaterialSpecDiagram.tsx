"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { MaterialItem } from "@/app/[lang]/coleccion/actions";

interface MaterialSpecDiagramProps {
  material: MaterialItem;
  collectionCover?: string | null;
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
  lang?: string;
  dict?: any;
  /** CTA dentro de la ficha (p. ej. "Consultar disponibilidad") */
  cta?: { href: string; label: string };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function MaterialSpecDiagram({
  material,
  collectionCover,
  index = 0,
  total = 1,
  onPrev,
  onNext,
  dict,
  cta,
}: MaterialSpecDiagramProps) {
  const d = dict?.collection_page?.spec_diagram;
  const targetImage =
    material.image || collectionCover || "/images/Cantera.jpg";
  const displayName = material.aka || material.name;
  const descriptionText = material.description || "";
  const counter = `${pad(index + 1)} / ${pad(total)}`;

  // Estado de despliegue
  const [isExpandedDesktop, setIsExpandedDesktop] = useState(false);
  const [isHoveredDesktop, setIsHoveredDesktop] = useState(false);
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  const desktopPlateRef = useRef<HTMLDivElement>(null);
  const mobilePlateRef = useRef<HTMLDivElement>(null);

  const translateTerm = (term?: string | null): string => {
    if (!term) return "";
    const clean = term.trim();
    return dict?.collection?.terms?.[clean] || dict?.terms?.[clean] || clean;
  };

  const specs = [
    translateTerm(material.stone_type || material.category),
    translateTerm(material.origin),
  ].filter(Boolean);

  // Acabados y formatos disponibles (traducidos; sin distinguir mayúsculas)
  const labelFrom = (map: Record<string, string> | undefined, raw: string) => {
    const clean = raw.trim();
    if (!map) return clean;
    const key = Object.keys(map).find(
      (k) => k.toLowerCase() === clean.toLowerCase(),
    );
    return key ? map[key] : clean;
  };
  const uniq = (list: string[]) =>
    list.filter(
      (v, i) =>
        v && list.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
    );
  const finishList = uniq(
    (material.finishes || []).map((f) => labelFrom(d?.finish_labels, f)),
  );
  const formatList = uniq(
    (material.formats || []).map((f) => labelFrom(d?.format_labels, f)),
  );
  const hasChips = finishList.length > 0 || formatList.length > 0;

  // Alturas de la ficha móvil (la placa asoma 57px por debajo en reposo)
  const mobileSheetH = (cta ? 300 : 255) + (hasChips ? 84 : 0);

  const renderChips = (
    label: string | undefined,
    items: string[],
    emphasis: boolean,
    mobile: boolean,
  ) =>
    items.length > 0 ? (
      <div className={mobile ? "space-y-1" : "space-y-2"}>
        <span
          className={`block font-mono uppercase tracking-data ${
            emphasis ? "text-spec-accent font-semibold" : "text-spec-muted"
          } ${mobile ? "text-[9px]" : "text-[10px]"}`}
        >
          {label}
          {items.length > 1 ? ` · ${pad(items.length)}` : ""}
        </span>
        <ul
          className={`flex gap-1.5 ${
            mobile
              ? "flex-nowrap overflow-x-auto no-scrollbar"
              : "flex-wrap"
          }`}
        >
          {items.map((item) => (
            <li
              key={item}
              className={`shrink-0 whitespace-nowrap px-2 py-1 border font-mono uppercase tracking-data leading-none ${
                mobile ? "text-[9px]" : "text-[10px]"
              } ${
                emphasis
                  ? "border-spec-accent/50 text-spec-text"
                  : "border-spec-border text-spec-text/70"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  // Buffer de imagen doble para transición fluida
  const [imageBuffer, setImageBuffer] = useState<{
    current: string;
    previous: string | null;
    isLoaded: boolean;
  }>({
    current: targetImage,
    previous: null,
    isLoaded: true,
  });

  const lastImageRef = useRef(targetImage);

  useEffect(() => {
    if (!targetImage) return;
    if (targetImage !== lastImageRef.current) {
      const oldImg = lastImageRef.current;
      lastImageRef.current = targetImage;
      setImageBuffer({
        current: targetImage,
        previous: oldImg || null,
        isLoaded: false,
      });
    }
  }, [targetImage]);

  useEffect(() => {
    if (imageBuffer.isLoaded && imageBuffer.previous) {
      const timer = setTimeout(() => {
        setImageBuffer((prev) => ({ ...prev, previous: null }));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [imageBuffer.isLoaded, imageBuffer.previous]);

  // =========================================================
  // 1. ANIMACIÓN DESKTOP (EXTRACCIÓN HORIZONTAL HACIA LA DERECHA)
  // =========================================================
  useEffect(() => {
    const el = desktopPlateRef.current;
    if (!el || typeof window === "undefined" || window.innerWidth < 768) return;

    // Placa más angosta (44%) → se desliza un poco más para asomar igual
    const targetX = isHoveredDesktop || isExpandedDesktop ? 105 : 50;

    gsap.to(el, {
      xPercent: targetX,
      duration: 0.5,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [isHoveredDesktop, isExpandedDesktop]);

  // =========================================================
  // 2. ANIMACIÓN MÓVIL (EXTRACCIÓN VERTICAL HACIA ABAJO)
  // En reposo asoma 42px para que sea evidente y táctil
  // =========================================================
  useEffect(() => {
    const el = mobilePlateRef.current;
    if (!el || typeof window === "undefined" || window.innerWidth >= 768)
      return;

    gsap.to(el, {
      y: isExpandedMobile ? mobileSheetH - 10 : mobileSheetH - 213,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [isExpandedMobile, mobileSheetH]);

  const navButton =
    "group/nav flex h-9 w-9 items-center justify-center border border-spec-border text-spec-text transition-colors duration-300 hover:border-spec-accent hover:text-spec-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-spec-accent cursor-pointer active:scale-95";

  return (
    <section
      aria-label={`${d?.sheet_label}: ${displayName}`}
      className="relative w-full flex items-center justify-center select-none py-2 sm:py-6"
    >
      {/* ====================================================================
          MODO MÓVIL (< MD): FICHA TÉCNICA CON EXTRACCIÓN VERTICAL VISIBLE
          ==================================================================== */}
      <div
        className="md:hidden relative w-full transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          height: isExpandedMobile ? mobileSheetH + 285 : mobileSheetH + 65,
        }}
      >
        {/* PLACA FOTOGRÁFICA EXTRAÍBLE (ASOMA 42PX EN REPOSO PARA INVITAR AL CLIC) */}
        <div
          ref={mobilePlateRef}
          onClick={() => setIsExpandedMobile((prev) => !prev)}
          className="absolute top-0 left-0 w-full h-[270px] z-10 rounded-2xs overflow-hidden shadow-2xl bg-black-neutral border border-spec-border hover:border-spec-accent cursor-pointer transform-gpu will-change-transform flex flex-col justify-between p-4"
        >
          <div className="absolute inset-0 pointer-events-none">
            {imageBuffer.previous && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <Image
                  src={imageBuffer.previous}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </div>
            )}

            {imageBuffer.current && (
              <div
                className={`absolute inset-0 z-10 will-change-[opacity] transition-opacity duration-150 ease-out ${
                  imageBuffer.isLoaded ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={imageBuffer.current}
                  alt={displayName}
                  fill
                  priority
                  sizes="100vw"
                  onLoad={() =>
                    setImageBuffer((prev) => ({ ...prev, isLoaded: true }))
                  }
                  onError={() =>
                    setImageBuffer((prev) => ({ ...prev, isLoaded: true }))
                  }
                  className="object-cover object-center"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black-pure/85 via-transparent to-black-pure/30 pointer-events-none" />
            <div className="absolute inset-2 border border-white/20 pointer-events-none" />
          </div>

          {/* ETIQUETA EN REPOSO: VISIBLE EN EL BORDE INFERIOR ASOMADO */}
          <div className="relative z-20 flex items-center justify-between"></div>

          <div className="relative z-20 space-y-0.5">
            <h4 className="font-sans text-maya-body uppercase tracking-editorial text-white font-medium drop-shadow-md truncate">
              {displayName}
            </h4>
            <p className="font-mono text-[9px] text-white/70 uppercase tracking-data truncate">
              {specs.join(" / ")}
            </p>
          </div>
        </div>

        {/* FICHA TÉCNICA FRONTAL CON MUESCA EN LA BASE INFERIOR */}
        <div
          onClick={() => setIsExpandedMobile((prev) => !prev)}
          style={{ height: mobileSheetH }}
          className={`relative z-20 w-full bg-spec-bg text-spec-text rounded-2xs shadow-xl border border-spec-border flex flex-col justify-between p-5 sm:p-6 cursor-pointer`}
        >
          {/* Muesca física orientada hacia abajo */}
          <svg
            className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[52px] h-[26px] pointer-events-none z-30"
            viewBox="0 0 52 26"
            fill="none"
          >
            <path
              d="M 0,0 A 26,26 0 0,0 52,0"
              stroke="currentColor"
              className="text-spec-border"
              strokeWidth="1"
            />
          </svg>

          {/* Bloque superior con nombre e identificación */}
          <div className="space-y-3 flex-1 overflow-hidden">
            <div className="space-y-1 border-b border-spec-border pb-2.5">
              <span className="font-mono text-[9px] uppercase tracking-data text-spec-muted block">
                {d?.sheet_label}
              </span>
              <h3 className="font-sans font-light text-maya-h2 uppercase tracking-editorial leading-tight text-spec-text truncate">
                {displayName}
              </h3>
              {specs.length > 0 && (
                <p className="font-mono text-maya-label uppercase tracking-data text-spec-accent font-semibold pt-0.5 truncate">
                  {specs.join("  /  ")}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="block font-mono text-[9px] uppercase tracking-data text-spec-muted">
                {d?.tech_desc_label}
              </span>
              <p
                className={`font-sans text-maya-small font-light leading-relaxed text-spec-text/80 ${hasChips ? "line-clamp-2" : "line-clamp-3"}`}
              >
                {descriptionText || d?.default_desc}
              </p>
            </div>

            {/* ACABADOS Y FORMATOS (MÓVIL: UNA FILA DESLIZABLE CADA UNO) */}
            {renderChips(d?.finishes_label, finishList, true, true)}
            {renderChips(d?.formats_label, formatList, false, true)}
          </div>

          {/* CTA DENTRO DE LA FICHA (MÓVIL) */}
          {cta && (
            <Link
              href={cta.href}
              data-track="availability_click"
              data-track-label={displayName}
              onClick={(e) => e.stopPropagation()}
              className="mb-2.5 flex w-full items-center justify-between gap-3 px-4 py-2.5 font-mono text-maya-label uppercase tracking-nav border border-spec-accent text-spec-accent transition-colors duration-300 active:bg-spec-accent active:text-spec-bg focus:outline-none focus-visible:ring-1 focus-visible:ring-spec-accent"
            >
              <span className="truncate">{cta.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          )}

          {/* Controles de navegación y botón de despliegue SOLO CON FLECHA */}
          <div className="pt-2.5 border-t border-spec-border flex items-center justify-between z-40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpandedMobile((prev) => !prev);
              }}
              aria-label={isExpandedMobile ? d?.collapse : d?.expand}
              className="h-8 w-8 rounded-full border border-spec-border bg-black-pure/40 flex items-center justify-center font-mono text-spec-accent text-sm hover:border-spec-accent active:scale-90 transition-all cursor-pointer"
            >
              <span>{isExpandedMobile ? "↑" : "↓"}</span>
            </button>

            {total > 1 && (onPrev || onNext) && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={onPrev}
                  className="w-8 h-8 flex items-center justify-center border border-spec-border text-spec-text text-xs active:scale-90"
                  aria-label={d?.prev_material}
                >
                  ←
                </button>
                <span className="font-mono text-[10px] text-spec-muted">
                  {counter}
                </span>
                <button
                  type="button"
                  onClick={onNext}
                  className="w-8 h-8 flex items-center justify-center border border-spec-border text-spec-text text-xs active:scale-90"
                  aria-label={d?.next_material}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          MODO ESCRITORIO (MD+): ATELIER SAMPLER CLÁSICO (100% INTACTO)
          ==================================================================== */}
      <div
        className={`hidden md:flex relative w-full max-w-5xl ${
          cta
            ? hasChips
              ? "h-[500px] lg:h-[520px]"
              : "h-[480px] lg:h-[510px]"
            : hasChips
              ? "h-[460px] lg:h-[480px]"
              : "h-[440px] lg:h-[470px]"
        } items-center justify-start overflow-visible`}
      >
        {/* PLACA DESLIZANTE TRASERA (HACIA LA DERECHA) */}
        <div
          ref={desktopPlateRef}
          aria-hidden="true"
          onMouseEnter={() => setIsHoveredDesktop(true)}
          onMouseLeave={() => setIsHoveredDesktop(false)}
          onClick={() => setIsExpandedDesktop((prev) => !prev)}
          className="absolute left-0 w-[44%] h-[94%] z-10 rounded-2xs overflow-hidden shadow-2xl bg-black-neutral transform-gpu will-change-transform cursor-pointer"
        >
          {imageBuffer.previous && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <Image
                src={imageBuffer.previous}
                alt=""
                fill
                sizes="(min-width: 768px) 480px, 100vw"
                quality={90}
                className="object-cover object-center"
              />
            </div>
          )}

          {imageBuffer.current ? (
            <div
              className={`absolute inset-0 z-10 will-change-[opacity] transition-opacity duration-150 ease-out ${
                imageBuffer.isLoaded ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={imageBuffer.current}
                alt={displayName}
                fill
                priority
                sizes="(min-width: 768px) 480px, 100vw"
                quality={90}
                onLoad={() =>
                  setImageBuffer((prev) => ({ ...prev, isLoaded: true }))
                }
                onError={() =>
                  setImageBuffer((prev) => ({ ...prev, isLoaded: true }))
                }
                className="object-cover object-center"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-maya-label uppercase tracking-data text-spec-muted">
              {d?.no_sample}
            </div>
          )}
        </div>

        {/* FICHA TÉCNICA FRONTAL CON MUESCA LATERAL DERECHA */}
        <div
          onMouseEnter={() => setIsHoveredDesktop(true)}
          onMouseLeave={() => setIsHoveredDesktop(false)}
          onClick={() => setIsExpandedDesktop((prev) => !prev)}
          style={{
            maskImage:
              "radial-gradient(circle 26px at 100% 50%, transparent 25px, black 26px)",
            WebkitMaskImage:
              "radial-gradient(circle 26px at 100% 50%, transparent 25px, black 26px)",
          }}
          className="relative z-20 w-[58%] h-full bg-spec-bg text-spec-text rounded-l-2xs shadow-2xl border border-spec-border flex flex-col justify-between p-8 lg:p-10 cursor-pointer"
        >
          <svg
            className="absolute -right-[1px] top-1/2 -translate-y-1/2 w-[26px] h-[52px] pointer-events-none z-30"
            viewBox="0 0 26 52"
            fill="none"
          >
            <path
              d="M 26,0 A 26,26 0 0,0 26,52"
              stroke="currentColor"
              className="text-spec-border"
              strokeWidth="1"
            />
          </svg>

          <div className="space-y-4 overflow-y-auto pr-1 no-scrollbar flex-1">
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-data text-spec-muted block">
                {d?.sheet_label}
              </span>
              <h3 className="font-sans font-light text-maya-h2 lg:text-maya-h1 uppercase tracking-editorial leading-[1.04] text-spec-text break-words">
                {displayName}
              </h3>
              <span
                aria-hidden="true"
                className="block h-px w-10 bg-spec-accent/80"
              />
            </div>

            {specs.length > 0 && (
              <p className="font-mono text-maya-label uppercase tracking-data text-spec-accent font-semibold pt-0.5">
                {specs.join("  /  ")}
              </p>
            )}

            <div className="space-y-1.5 pt-1">
              <span className="block font-mono text-[10px] uppercase tracking-data text-spec-muted">
                {d?.tech_desc_label}
              </span>
              <p
                className={`font-sans text-maya-small font-light leading-relaxed text-spec-text/80 max-w-prose ${hasChips ? "line-clamp-3" : "line-clamp-4"}`}
              >
                {descriptionText || d?.default_desc}
              </p>
            </div>

            {/* ACABADOS Y FORMATOS DISPONIBLES */}
            {hasChips && (
              <div className="space-y-4 pt-1">
                {renderChips(d?.finishes_label, finishList, true, false)}
                {renderChips(d?.formats_label, formatList, false, false)}
              </div>
            )}
          </div>

          {(cta || (total > 1 && (onPrev || onNext))) && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 pt-4 border-t border-spec-border space-y-4 shrink-0"
            >
              {/* CTA DENTRO DE LA FICHA (ESCRITORIO) */}
              {cta && (
                <Link
                  href={cta.href}
              data-track="availability_click"
              data-track-label={displayName}
                  className="group/btn flex w-full items-center justify-between gap-4 px-5 py-3 font-mono text-maya-label uppercase tracking-nav border border-spec-accent text-spec-accent transition-colors duration-500 hover:bg-spec-accent hover:text-spec-bg focus:outline-none focus-visible:ring-1 focus-visible:ring-spec-accent"
                >
                  <span className="truncate">{cta.label}</span>
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-500 group-hover/btn:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              )}

              {total > 1 && (onPrev || onNext) && (
              <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label={d?.prev_material}
                  className={navButton}
                >
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover/nav:-translate-x-0.5"
                  >
                    ←
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label={d?.next_material}
                  className={navButton}
                >
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover/nav:translate-x-0.5"
                  >
                    →
                  </span>
                </button>
              </div>

              <span className="font-mono text-maya-label uppercase tracking-data text-spec-muted">
                {counter}
              </span>
              </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
