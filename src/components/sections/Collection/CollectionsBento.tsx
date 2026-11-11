"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  type CSSProperties,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { cleanImageUrl, slugify } from "@/lib/utils/strings";
import CollectionLogoTitle from "@/components/pages/Collection/CollectionLogoTitle";
import { getI18n, type LocalizedString } from "@/lib/i18n/utils";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { useDeviceType } from "@/hooks/useDeviceType";
import { lockScroll } from "@/lib/utils/scrollLock";

interface CollectionItemDb {
  id: string;
  title?: LocalizedString;
  title_es: string;
  title_en?: string | null;
  tagline?: LocalizedString;
  tagline_es?: string | null;
  description?: LocalizedString;
  description_es?: string | null;
  slug: string;
  cover_image?: string | null;
  logo_url?: string | null;
  logo?: string | null;
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
  collections?: CollectionItemDb[];
  dict: {
    meta: string;
    title: string;
    cta_explore_col: string;
    cta_view_all: string;
    close: string;
    default_title: string;
  };
}

const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const OPEN_MS = 600;
const HEADER_INSIDE_MAX = 6;
const TARGET_ORDER = ["reserve", "essentials", "travertino", "dune"];
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

type Phase = "closed" | "opening" | "open" | "closing";

export default function CollectionsBento({
  dict,
  lang = "es",
  collections = [],
}: CollectionsBentoProps) {
  const { device, hasHover, isLandscape } = useDeviceType();

  const [hover, setHover] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const [origin, setOrigin] = useState("inset(0 0 0 0)");

  const sectionRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  // Orden estricto garantizado: Reserve -> Essentials -> Travertino -> Dune
  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      const slugA = slugify(a.slug || a.title_es || a.id).toLowerCase();
      const slugB = slugify(b.slug || b.title_es || b.id).toLowerCase();
      const idxA = TARGET_ORDER.findIndex((k) => slugA.includes(k));
      const idxB = TARGET_ORDER.findIndex((k) => slugB.includes(k));
      const orderA = idxA !== -1 ? idxA : 99;
      const orderB = idxB !== -1 ? idxB : 99;
      return orderA - orderB;
    });
  }, [collections]);

  const rectClip = useCallback((i: number) => {
    const sec = sectionRef.current?.getBoundingClientRect();
    const el = triggerRefs.current[i]?.getBoundingClientRect();
    if (!sec || !el) return "inset(0 0 0 0)";
    const top = Math.max(0, el.top - sec.top);
    const left = Math.max(0, el.left - sec.left);
    const right = Math.max(0, sec.right - el.right);
    const bottom = Math.max(0, sec.bottom - el.bottom);
    return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  }, []);

  const openAt = (i: number) => {
    if (hasHover) {
      setOrigin(rectClip(i));
    }
    setActive(i);
    setPhase("opening");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  };

  const close = useCallback(() => {
    if (active === null) return;
    if (hasHover) {
      setOrigin(rectClip(active));
    }
    setPhase("closing");
    const i = active;
    window.setTimeout(
      () => {
        setPhase("closed");
        setActive(null);
        requestAnimationFrame(() => {
          triggerRefs.current[i]?.focus({ preventScroll: true });
        });
      },
      hasHover ? OPEN_MS : 350,
    );
  }, [active, hasHover, rectClip]);

  useEffect(() => {
    if (phase !== "open") return;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, close]);

  // Bloquea el scroll de la página desde que empieza a abrirse el panel
  // hasta que termina de cerrarse (en celular el dedo seguía moviendo el fondo).
  useEffect(() => {
    if (active === null) return;
    return lockScroll();
  }, [active]);

  if (sortedCollections.length === 0) return null;

  const items = sortedCollections.map((col, i) => {
    const name =
      getI18n(col.title || col.title_es, lang) || dict.default_title || "";
    const tagline =
      getI18n(col.description || col.description_es || "", lang) ||
      getI18n(col.tagline || col.tagline_es || "", lang);
    const rawSlug = (col.slug || col.id || "").trim().replace(/^\/+/, "");
    const cleanSlug = slugify(rawSlug);
    return {
      id: col.id,
      i,
      romanIdx: ROMAN_NUMERALS[i] || `0${i + 1}`,
      name,
      tagline,
      slug: cleanSlug,
      logoUrl: col.logo_url || col.logo || null,
      image: cleanImageUrl(
        col.cover_image || col.collection_products?.[0]?.products?.image_url,
        "/images/og-main.jpg",
      ),
      themeClass: `theme-collection-${cleanSlug}`,
      href: `/${ROUTES.coleccion[currentLocale]}/${cleanSlug}`,
    };
  });

  const n = items.length;
  const headerInside = n <= HEADER_INSIDE_MAX && hasHover;
  const lastCol = n - 1;
  const current = active !== null ? items[active] : null;
  const panelVisible = phase !== "closed" && current;
  const panelClip = phase === "open" ? "inset(0 0 0 0)" : origin;
  const allHref = `/${ROUTES.coleccion[currentLocale]}`;
  const isHoveringLast = hover === lastCol;

  const titleBlock = (
    <>
      <h2 className="min-w-0 font-sans font-light text-maya-h3 sm:text-maya-h2 uppercase tracking-editorial leading-[1.1] max-w-[14ch] pointer-events-none select-none">
        {dict.title}
      </h2>
      <Link
        href={allHref}
        className="pointer-events-auto inline-flex items-center gap-2 sm:gap-3 min-h-11 sm:min-h-0 py-1.5 px-3 sm:px-4 max-w-[10.5rem] sm:max-w-none text-left leading-snug border border-current font-mono text-[11px] sm:text-maya-label uppercase tracking-data transition-[gap] duration-500 hover:gap-4 shrink-0"
      >
        <span>{dict.cta_view_all}</span>
        <span aria-hidden="true">→</span>
      </Link>
    </>
  );

  const reveal = (step: number): CSSProperties => {
    const on = phase === "open";
    return {
      opacity: on ? 1 : 0,
      transform: on ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 500ms ease, transform 700ms ${EASE}`,
      transitionDelay: on ? `${200 + step * 100}ms` : "0ms",
    };
  };

  // Un solo tap/clic abre la colección en cualquier dispositivo.
  // (Antes, en tablet el primer tap solo cambiaba un índice que no se veía
  // en pantalla, así que parecía que el botón no respondía.)
  const handleItemClick = (i: number) => openAt(i);

  return (
    <section
      ref={sectionRef}
      aria-label={dict.title}
      onMouseLeave={() => hasHover && setHover(null)}
      className="relative w-full h-[100svh] min-h-[580px] max-h-[100svh] flex flex-col bg-background text-black-neutral overflow-hidden border-t border-border-light select-none"
    >
      {/* KEYFRAMES DEL RESPLANDOR AMBIENTAL TÁCTIL */}
      {/* CABECERA (Visible siempre en móvil/tablet táctil y cuando headerInside es false) */}
      <div
        className={`w-full px-5 sm:px-8 flex items-center justify-between gap-4 pt-[calc(3.5rem+1.5rem)] sm:pt-[calc(3.625rem+2rem)] pb-6 sm:pb-8 shrink-0 ${
          headerInside ? "md:hidden" : "md:pt-24 lg:pt-28 md:pb-6"
        }`}
      >
        {titleBlock}
      </div>

      {/* ESCENARIO DE COLECCIONES */}
      <div className="relative flex-1 w-full min-h-0 flex flex-col border-t border-black-neutral/15 md:border-t-0">
        <ul
          className={`flex-1 w-full h-full flex ${
            device === "mobile" || (!hasHover && !isLandscape)
              ? "flex-col"
              : "flex-col md:flex-row"
          } overflow-hidden`}
        >
          {items.map((it) => {
            const isLit = hasHover && hover === it.i;

            return (
              <li
                key={it.id}
                className={`relative flex-1 w-full md:min-w-0 overflow-hidden ${it.themeClass} ${
                  hasHover
                    ? "bg-transparent text-black-neutral"
                    : "bg-col-bg text-col-text"
                } ${
                  it.i === 0
                    ? ""
                    : "border-t border-col-border md:border-t-0 md:border-l md:border-black-neutral/15"
                }`}
              >
                <button
                  ref={(el) => {
                    triggerRefs.current[it.i] = el;
                  }}
                  type="button"
                  onMouseEnter={() => hasHover && setHover(it.i)}
                  onFocus={() => hasHover && setHover(it.i)}
                  onBlur={() => hasHover && setHover(null)}
                  onClick={() => handleItemClick(it.i)}
                  aria-haspopup="dialog"
                  aria-label={`${dict.cta_explore_col} ${it.name}`.trim()}
                  className={`group absolute inset-0 w-full text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-current ${
                    isLit ? "md:text-col-text" : ""
                  }`}
                >
                  {/* RESPLANDOR EN DISPOSITIVOS TÁCTILES (MÓVIL Y TABLET SIN HOVER) */}
                  {!hasHover && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none overflow-hidden"
                    >
                      <span
                        className="bento-sheen absolute inset-y-0 -left-[100%] w-[110%] pointer-events-none"
                        style={{ animationDelay: `${it.i * 0.85}s` }}
                      />
                      <span
                        className="bento-glow absolute -top-1/2 -bottom-1/2 -left-[40%] w-[70%] rounded-full pointer-events-none"
                        style={{ animationDelay: `${it.i * 0.6}s` }}
                      />
                    </div>
                  )}

                  {/* FONDO QUE SE ELEVA EN HOVER (SÓLO EN DESKTOP CON CURSOR) */}
                  {hasHover && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-col-bg pointer-events-none"
                      style={{
                        clipPath: isLit
                          ? "inset(0 0 0 0)"
                          : "inset(100% 0 0 0)",
                        transition: `clip-path 450ms ${EASE}`,
                      }}
                    />
                  )}

                  {/* =========================================================
                      1. VISTA MÓVIL / TÁCTIL VERTICAL: FILA LIMPIA SIN DESCRIPCIÓN
                      ========================================================= */}
                  <div
                    className={`${
                      hasHover ? "md:hidden" : ""
                    } relative z-10 w-full h-full flex items-center justify-between px-5 sm:px-7`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-maya-small font-bold shrink-0 text-col-accent">
                        {it.romanIdx}
                      </span>

                      <div className="h-7 sm:h-8 flex items-center overflow-hidden">
                        <CollectionLogoTitle
                          as="p"
                          title={it.name}
                          logoUrl={it.logoUrl}
                          className="font-sans font-light uppercase tracking-[0.08em] leading-none text-maya-h3 transition-colors duration-300 truncate text-col-text"
                          imgClassName="h-6 sm:h-7 w-auto max-w-[170px] sm:max-w-[210px] object-contain object-left col-logo"
                        />
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className="font-mono text-base text-col-accent shrink-0 pl-3 transition-transform duration-300 group-active:translate-x-1"
                    >
                      →
                    </span>
                  </div>

                  {/* =========================================================
                      2. VISTA DESKTOP / CURSOR REAL: ISOTIPO ABAJO + FOTO AL CENTRO
                      ========================================================= */}
                  <div
                    className={`${
                      !hasHover ? "hidden" : "hidden md:flex"
                    } relative z-10 w-full h-full flex-col justify-between pointer-events-none pt-24 lg:pt-28 pb-24 lg:pb-28`}
                  >
                    <div className="h-32 lg:h-36 shrink-0" aria-hidden="true" />

                    {/* Portada centrada en hover */}
                    <div className="flex flex-1 min-h-0 items-center justify-center px-4 lg:px-6">
                      <div
                        className="relative w-full max-w-[230px] lg:max-w-[270px] aspect-[3/4] max-h-[44vh] overflow-hidden"
                        style={{
                          opacity: isLit ? 1 : 0,
                          transform: isLit
                            ? "translateY(0) scale(1)"
                            : "translateY(22px) scale(0.96)",
                          transition: isLit
                            ? `opacity 350ms ease 150ms, transform 500ms ${EASE} 150ms`
                            : "opacity 150ms ease 0ms, transform 200ms ease 0ms",
                        }}
                      >
                        <Image
                          src={it.image}
                          alt=""
                          fill
                          sizes="(max-width: 1280px) 25vw, 320px"
                          className="object-contain object-center scale-[1.02]"
                        />
                      </div>
                    </div>

                    {/* Isotipo en la base de la columna */}
                    <div className="h-16 lg:h-20 shrink-0 flex items-center justify-between gap-4 px-5 md:px-6 lg:px-8">
                      <span className="min-w-0 max-w-[90%] md:max-w-full">
                        <div className="h-7 md:h-8 lg:h-9 flex items-center">
                          <CollectionLogoTitle
                            as="p"
                            title={it.name}
                            logoUrl={it.logoUrl}
                            className="font-sans font-light uppercase tracking-[0.08em] leading-none text-maya-h4 lg:text-maya-h3 transition-colors duration-300"
                            imgClassName={`h-7 md:h-8 lg:h-9 w-auto max-w-[170px] sm:max-w-[200px] lg:max-w-[240px] object-contain object-left transition-[filter] duration-500 ${
                              isLit ? "col-logo" : "brightness-0"
                            }`}
                          />
                        </div>
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* CABECERA INTEGRADA EN DESKTOP CON CURSOR */}
        {headerInside && (
          <div
            className="hidden md:grid absolute inset-x-0 top-0 z-[2] pointer-events-none pt-24 lg:pt-28"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          >
            {n >= 3 && (
              <p
                className={`px-6 lg:px-8 font-mono text-maya-label uppercase tracking-data transition-colors duration-500 ${
                  hover === 0
                    ? `text-col-text ${items[0].themeClass}`
                    : "text-black-neutral"
                }`}
              >
                {dict.meta}
              </p>
            )}

            <div
              onMouseEnter={() => hasHover && setHover(lastCol)}
              style={{
                gridColumn: `${lastCol + 1} / span 1`,
                transform: isHoveringLast
                  ? "translateX(-100%)"
                  : "translateX(0)",
                transition:
                  "transform 700ms cubic-bezier(0.76, 0, 0.24, 1), color 400ms ease",
              }}
              className={`px-6 lg:px-8 flex flex-col items-start gap-4 ${
                "text-black-neutral"
              }`}
            >
              {titleBlock}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          PANTALLA COMPLETA AL EXPANDIRSE LA COLECCIÓN (Z-[100])
          ========================================================= */}
      {panelVisible && current && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={current.name}
          className={`fixed inset-0 z-[100] w-full overscroll-none touch-none overflow-hidden bg-col-bg text-col-text flex flex-col justify-between ${current.themeClass}`}
          style={
            !hasHover
              ? {
                  opacity: phase === "open" ? 1 : 0,
                  transition: "opacity 350ms ease",
                  pointerEvents: phase === "open" ? "auto" : "none",
                }
              : {
                  clipPath: panelClip,
                  transition: `clip-path ${OPEN_MS}ms ${EASE}`,
                }
          }
        >
          {/* FOTOGRAFÍA MONUMENTAL */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 md:p-16 pointer-events-none"
            style={{
              opacity: phase === "open" ? 1 : 0,
              transform: `scale(${phase === "open" ? 1 : 0.94})`,
              transition: `opacity 650ms ease ${phase === "open" ? 180 : 0}ms, transform 900ms ${EASE}`,
            }}
          >
            <div className="relative w-full max-w-lg md:max-w-2xl h-[56vh] sm:h-[62vh] max-h-[600px]">
              <Image
                src={current.image}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain object-center scale-[1.02]"
              />
            </div>
          </div>

          {/* CONTENIDO EDITORIAL DE PANTALLA COMPLETA */}
          <div className="relative h-full flex flex-col justify-between pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-24 lg:pb-28 px-6 sm:px-10 lg:px-16 z-10 pointer-events-none">
            {/* Cabecera superior con botón ✕ accesible */}
            <div className="flex items-start justify-between gap-6 pointer-events-auto">
              <div className="space-y-2 max-w-xl" style={reveal(0)}>
                <span className="font-mono text-maya-label uppercase tracking-data text-col-accent font-semibold block">
                  {dict.meta}
                </span>
                <div className="h-8 md:h-9 lg:h-10 flex items-center">
                  <CollectionLogoTitle
                    as="h3"
                    title={current.name}
                    logoUrl={current.logoUrl}
                    className="font-sans font-light uppercase tracking-[0.08em] leading-none text-maya-h4 lg:text-maya-h3 text-col-text"
                    imgClassName="h-8 md:h-9 lg:h-10 w-auto max-w-[220px] sm:max-w-[260px] lg:max-w-[300px] object-contain object-left col-logo"
                  />
                </div>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  close();
                }}
                style={reveal(0)}
                aria-label={dict.close || "Cerrar"}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 font-mono text-maya-label uppercase tracking-data text-col-muted hover:text-col-text border border-col-border hover:border-col-accent transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-current bg-col-bg/80 backdrop-blur-md"
              >
                <span>{dict.close || "Cerrar"}</span>
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            {/* Pie inferior con botón de navegación */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pointer-events-auto">
              <div className="md:col-span-7 lg:col-span-8" style={reveal(1)}>
                {current.tagline && (
                  <p className="font-sans text-maya-small sm:text-maya-body font-light leading-relaxed text-col-muted max-w-xl">
                    {current.tagline}
                  </p>
                )}
              </div>

              <div
                className="md:col-span-5 lg:col-span-4 flex justify-start md:justify-end"
                style={reveal(2)}
              >
                <Link
                  href={current.href}
                  className="group inline-flex items-center justify-between gap-6 min-h-12 px-7 font-mono text-maya-label uppercase tracking-nav bg-col-accent text-col-on-accent hover:opacity-90 transition-all duration-300 shadow-xl"
                >
                  <span>{dict.cta_explore_col}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
