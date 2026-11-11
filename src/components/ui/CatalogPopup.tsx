"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { subscribeCatalogAction } from "@/app/[lang]/coleccion/subscribe";
import { track } from "@/lib/analytics/track";

// =============================================================================
// AVISO DE CATÁLOGO (todo el sitio)
// -----------------------------------------------------------------------------
// Tarjeta pequeña, sin imágenes, que invita a recibir los catálogos:
//   · por correo (se guarda con consentimiento → email marketing)
//   · por WhatsApp (abre el chat con un mensaje listo)
// Cuándo aparece (una sola vez):
//   · tras 45 s de navegación en el sitio, o
//   · al pasar el 60% de una página después de 12 s de visita.
// No aparece en contacto, legales, login/admin, ni antes de responder cookies.
// Cerrar = no vuelve en 14 días · Registrarse = 1 año.
// =============================================================================

const STORAGE_KEY = "maya_catalog_popup";
const VISIT_KEY = "maya_visit_started";
const DELAY_MS = 45_000;
const MIN_BEFORE_SCROLL_MS = 12_000;
const SCROLL_RATIO = 0.6;
const SNOOZE_CLOSED_DAYS = 14;
const SNOOZE_SUBSCRIBED_DAYS = 365;

export interface CatalogPopupDict {
  title: string;
  description: string;
  email_label: string;
  email_placeholder: string;
  consent: string;
  privacy_link: string;
  submit: string;
  submitting: string;
  or: string;
  whatsapp: string;
  whatsapp_message: string;
  success_title: string;
  success_description: string;
  close: string;
  errors: { email: string; consent: string; rate: string; generic: string };
}

export interface CatalogLink {
  slug: string;
  title_es: string | null;
  title_en: string | null;
  catalog_url: string | null;
}

interface CatalogPopupProps {
  lang: Locale;
  dict?: CatalogPopupDict;
  catalogs: CatalogLink[];
  whatsappNumber: string;
}

const EXCLUDED = [
  ROUTES.contacto.es,
  ROUTES.contacto.en,
  ROUTES.privacidad.es,
  ROUTES.privacidad.en,
  ROUTES.terminos.es,
  ROUTES.terminos.en,
  ROUTES.cookies.es,
  ROUTES.cookies.en,
  "login",
  "admin",
  "auth",
];

function readSnooze(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(JSON.parse(raw)?.until || 0) > Date.now() : false;
  } catch {
    return false;
  }
}

function snooze(days: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ until: Date.now() + days * 86_400_000 }),
    );
  } catch {
    /* sin almacenamiento: solo se oculta en esta visita */
  }
}

function cookieDecisionMade(): boolean {
  try {
    return Boolean(localStorage.getItem("maya_cookie_consent"));
  } catch {
    return true;
  }
}

/** Inicio de la visita (se conserva entre páginas durante la sesión). */
function visitStart(): number {
  try {
    const saved = Number(sessionStorage.getItem(VISIT_KEY) || 0);
    if (saved) return saved;
    const now = Date.now();
    sessionStorage.setItem(VISIT_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

function downloadUrl(url: string, name: string) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".supabase.co")) u.searchParams.set("download", name);
    return u.toString();
  } catch {
    return url;
  }
}

export default function CatalogPopup({
  lang,
  dict,
  catalogs,
  whatsappNumber,
}: CatalogPopupProps) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedAt = useRef(0);
  const shown = useRef(false);

  const segments = pathname.split("/").filter(Boolean);
  const excluded = segments.some((s) => EXCLUDED.includes(s));
  // Colección actual (para registrar el interés y abrir su catálogo primero)
  const collectionIdx = segments.findIndex(
    (s) => s === ROUTES.coleccion.es || s === ROUTES.coleccion.en,
  );
  const currentCollection =
    collectionIdx >= 0 ? segments[collectionIdx + 1] || null : null;

  const enabled = Boolean(dict) && !excluded;

  useEffect(() => {
    if (!enabled || shown.current || readSnooze()) return;
    const start = visitStart();

    const show = () => {
      if (shown.current || readSnooze() || !cookieDecisionMade()) return;
      shown.current = true;
      openedAt.current = Date.now();
      setOpen(true);
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (
        max > 0 &&
        window.scrollY / max >= SCROLL_RATIO &&
        Date.now() - start >= MIN_BEFORE_SCROLL_MS
      ) {
        show();
      }
    };

    const remaining = Math.max(0, DELAY_MS - (Date.now() - start));
    const timer = window.setTimeout(show, remaining);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, pathname]);

  // Si la persona navega a una página excluida, se oculta
  useEffect(() => {
    if (excluded && open) setOpen(false);
  }, [excluded, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done]);

  function close() {
    if (!done) snooze(SNOOZE_CLOSED_DAYS);
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dict) return;
    setError(null);
    setSending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("started_at", String(openedAt.current));
    fd.set("lang", lang);
    if (currentCollection) fd.set("collection", currentCollection);
    const res = await subscribeCatalogAction(fd);
    setSending(false);
    if (res.ok) {
      track("newsletter_signup", { collection: currentCollection || "" });
      snooze(SNOOZE_SUBSCRIBED_DAYS);
      setDone(true);
    } else {
      setError(dict.errors[res.error]);
    }
  }

  if (!enabled || !open || !dict) return null;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(dict.whatsapp_message)}`;
  const sorted = [...catalogs].sort((a, b) =>
    a.slug === currentCollection ? -1 : b.slug === currentCollection ? 1 : 0,
  );
  const title = (c: CatalogLink) =>
    (lang === "en" ? c.title_en : c.title_es) || c.title_es || c.slug;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="catalog-popup-title"
      className="fixed z-40 left-3 right-3 bottom-3 sm:left-6 sm:right-auto sm:bottom-6 sm:w-[340px] bg-background text-text-primary border border-border-light shadow-2xl font-sans animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <button
        type="button"
        onClick={close}
        aria-label={dict.close}
        className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current stroke-[1.5]" fill="none" aria-hidden="true">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-5 space-y-3.5">
        {!done ? (
          <>
            <div className="space-y-1.5 pr-6">
              <h2 id="catalog-popup-title" className="font-sans font-light text-maya-h4 uppercase tracking-editorial leading-tight">
                {dict.title}
              </h2>
              <p className="text-maya-small text-text-secondary leading-relaxed">
                {dict.description}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-2.5" noValidate>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              <label htmlFor="catalog-popup-email" className="sr-only">
                {dict.email_label}
              </label>
              <div className="flex">
                <input
                  id="catalog-popup-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder={dict.email_placeholder}
                  className="min-w-0 flex-1 bg-surface-secondary/60 border border-border-light border-r-0 px-3 py-2.5 text-maya-small text-text-primary placeholder:text-text-primary/40 focus:border-black-neutral transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="shrink-0 px-3.5 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-nav hover:bg-black-pure transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {sending ? dict.submitting : dict.submit}
                </button>
              </div>

              <label className="flex items-start gap-2 text-[11px] leading-snug text-text-secondary cursor-pointer">
                <input type="checkbox" name="consent" required className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-accent)]" />
                <span>
                  {dict.consent}{" "}
                  <Link href={`/${ROUTES.privacidad[lang]}`} className="underline underline-offset-2 hover:text-text-primary">
                    {dict.privacy_link}
                  </Link>
                </span>
              </label>

              {error && (
                <p role="alert" className="text-[12px] text-accent-ink">
                  {error}
                </p>
              )}
            </form>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-data text-text-muted">
              <span className="h-px flex-1 bg-border-light" />
              {dict.or}
              <span className="h-px flex-1 bg-border-light" />
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => snooze(SNOOZE_CLOSED_DAYS)}
              className="flex w-full items-center justify-center gap-2 border border-black-neutral/70 px-3 py-2.5 font-mono text-maya-label uppercase tracking-nav text-text-primary hover:bg-black-neutral hover:text-gray-warm transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.07c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.53-3.93-4.67-4.11-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.24-.27.53-.34.71-.34l.51.01c.16.01.38-.06.6.46.23.54.77 1.88.84 2.02.07.14.11.3.02.48-.09.18-.14.3-.27.46l-.41.48c-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.57.74 1.84.88.27.14.45.2.52.32.07.11.07.66-.17 1.33z" />
              </svg>
              {dict.whatsapp}
            </a>
          </>
        ) : (
          <div className="space-y-3 pr-6" aria-live="polite">
            <h2 id="catalog-popup-title" className="font-sans font-light text-maya-h4 uppercase tracking-editorial leading-tight">
              {dict.success_title}
            </h2>
            <p className="text-maya-small text-text-secondary leading-relaxed">
              {dict.success_description}
            </p>
            {sorted.length > 0 && (
              <ul className="divide-y divide-border-light border-y border-border-light">
                {sorted.map((c) => (
                  <li key={c.slug}>
                    <a
                      href={downloadUrl(c.catalog_url || "", `MAYA-${c.slug}-catalogo.pdf`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between py-2.5 text-maya-small uppercase tracking-wide hover:text-accent-ink transition-colors"
                    >
                      <span>{title(c)}</span>
                      <span className="font-mono text-[11px] text-text-muted">PDF ↓</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
