"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { subscribeCatalogAction } from "@/app/[lang]/coleccion/subscribe";
import { track } from "@/lib/analytics/track";
import { lockScroll } from "@/lib/utils/scrollLock";
import { NOVEMBER_PROMO, isNovemberPromoActive } from "@/lib/promo/november";

// =============================================================================
// PROMOCIÓN "NOVEMBER AT MAYA"
// -----------------------------------------------------------------------------
// Ventana al estilo del catálogo impreso: franja de mármol + "November at MAYA".
// · Se abre sola en el home y en colecciones (2.5 s después de responder el
//   aviso de cookies), una vez por visita.
// · Para descargar el PDF se pide correo (se guarda en Suscriptores con origen
//   "promo_noviembre_2026"). Después: WhatsApp o formulario de contacto.
// · Al cerrarla queda una pestaña pequeña para volver a abrirla.
// · Fechas y apagado manual: src/lib/promo/november.ts
// =============================================================================

const STORAGE_KEY = "maya_promo_nov2026";
const SESSION_KEY = "maya_promo_nov2026_shown";
const OPEN_DELAY_MS = 2500;
const SNOOZE_DAYS = 3;

type Stored = { state: "dismissed" | "downloaded" | "hidden"; until: number };

export interface PromoNovemberDict {
  lockup: string;
  offer_label: string;
  description: string;
  form_intro: string;
  email_label: string;
  email_placeholder: string;
  consent: string;
  privacy_link: string;
  submit: string;
  submitting: string;
  success_title: string;
  success_retry: string;
  next_title: string;
  next_text: string;
  whatsapp: string;
  whatsapp_message: string;
  contact: string;
  pill: string;
  pill_offer: string;
  pill_hide: string;
  close: string;
  image_alt: string;
  errors: { email: string; consent: string; rate: string; generic: string };
}

interface Props {
  lang: Locale;
  dict?: PromoNovemberDict;
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

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeStored(state: Stored["state"], days: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state, until: Date.now() + days * 86_400_000 }),
    );
  } catch {
    /* sin almacenamiento: solo aplica en esta visita */
  }
}

function cookieDecisionMade(): boolean {
  try {
    return Boolean(localStorage.getItem("maya_cookie_consent"));
  } catch {
    return true;
  }
}

function startDownload() {
  const a = document.createElement("a");
  a.href = NOVEMBER_PROMO.pdfUrl;
  a.download = NOVEMBER_PROMO.pdfFileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function PromoNovemberPopup({ lang, dict, whatsappNumber }: Props) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedAt = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const segments = pathname.split("/").filter(Boolean);
  const excluded = segments.some((s) => EXCLUDED.includes(s));
  const pagePath = segments[0] === "en" ? segments.slice(1) : segments;
  const isLanding =
    pagePath.length === 0 ||
    pagePath[0] === ROUTES.coleccion.es ||
    pagePath[0] === ROUTES.coleccion.en;
  // Nada se dibuja hasta que un efecto lo decide en el navegador, así que las
  // fechas se evalúan siempre con el reloj del visitante (sin desajustes de HTML).
  const enabled = Boolean(dict) && !excluded && isNovemberPromoActive();

  // Apertura automática / pestaña
  useEffect(() => {
    if (!enabled) return;
    const stored = readStored();
    const hidden = stored?.state === "hidden" && stored.until > Date.now();
    const snoozed =
      stored?.state === "downloaded" ||
      (stored?.state === "dismissed" && stored.until > Date.now());

    let shownThisVisit = false;
    try {
      shownThisVisit = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* ignorar */
    }

    if (!isLanding || snoozed || shownThisVisit) {
      if (hidden || !stored) return;
      const t = window.setTimeout(() => setPill(true), 0);
      return () => window.clearTimeout(t);
    }

    const timer = window.setInterval(() => {
      if (!cookieDecisionMade()) return;
      window.clearInterval(timer);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignorar */
      }
      openedAt.current = Date.now();
      setOpen(true);
    }, OPEN_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [enabled, isLanding]);

  const close = useCallback(() => {
    setOpen(false);
    if (!done) writeStored("dismissed", SNOOZE_DAYS);
    setPill(true);
    window.setTimeout(() => pillRef.current?.focus(), 50);
  }, [done]);

  // Bloqueo de scroll, foco inicial, Esc y foco atrapado dentro de la ventana
  useEffect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const t = window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 450);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function reopen() {
    openedAt.current = Date.now();
    setOpen(true);
  }

  function hidePill() {
    setPill(false);
    writeStored(done ? "downloaded" : "hidden", SNOOZE_DAYS);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dict) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (fd.get("consent") !== "on") {
      setError(dict.errors.consent);
      return;
    }
    setSending(true);
    fd.set("elapsed_ms", String(Date.now() - openedAt.current));
    fd.set("lang", lang);
    fd.set("collection", NOVEMBER_PROMO.id);
    fd.set("source", NOVEMBER_PROMO.subscriberSource);
    let res: Awaited<ReturnType<typeof subscribeCatalogAction>>;
    try {
      res = await subscribeCatalogAction(fd);
    } catch (err) {
      console.error("[promo-noviembre] Error al enviar:", err);
      res = { ok: false, error: "generic" };
    } finally {
      setSending(false);
    }
    if (!res.ok) {
      setError(dict.errors[res.error]);
      return;
    }
    track("newsletter_signup", { source: NOVEMBER_PROMO.subscriberSource });
    track("catalog_download", { catalog: NOVEMBER_PROMO.id });
    writeStored("downloaded", 365);
    setDone(true);
    startDownload();
  }

  if (!enabled || !dict) return null;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(dict.whatsapp_message)}`;
  const contactHref = `/${ROUTES.contacto[lang]}?promo=november`;

  return (
    <>
      {/* PESTAÑA PARA VOLVER A ABRIR
          Como el lomo de un catálogo: franja de mármol + firma "November at
          MAYA" + la oferta. Papel claro para destacar sobre fotos oscuras. */}
      {pill && !open && (
        <div className="group fixed z-40 right-3 bottom-3 sm:right-6 sm:bottom-6 flex items-stretch bg-background text-text-primary border border-black-neutral/10 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-500">
          <button
            ref={pillRef}
            type="button"
            onClick={reopen}
            className="flex items-stretch text-left cursor-pointer"
          >
            {/* Lomo de mármol: se ensancha al pasar el cursor */}
            <span
              aria-hidden="true"
              className="block w-3.5 group-hover:w-6 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-cover bg-center"
              style={{ backgroundImage: `url(${NOVEMBER_PROMO.imageVertical})` }}
            />
            <span className="flex flex-col justify-center gap-1.5 pl-3.5 pr-4 py-2.5 sm:py-3">
              <span className="flex items-center gap-2 text-[11px] font-light tracking-[0.12em] text-text-secondary">
                {dict.lockup}
                <Image
                  src="/images/MAYA_LOGOTIPO.png"
                  alt="MAYA"
                  width={68}
                  height={10}
                  className="h-[9px] w-auto"
                />
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-sans font-light text-[26px] leading-none tracking-[-0.03em] tabular-nums">
                  {NOVEMBER_PROMO.discount}%
                </span>
                <span className="text-maya-small leading-tight text-text-primary">
                  {dict.pill_offer}
                </span>
              </span>
            </span>
            <span className="sr-only">{dict.pill}</span>
          </button>
          <button
            type="button"
            onClick={hidePill}
            aria-label={dict.pill_hide}
            className="self-start h-8 w-8 flex items-center justify-center text-text-secondary/70 hover:text-text-primary cursor-pointer transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3 stroke-current stroke-[1.5]" fill="none" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* VENTANA */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
          <button
            type="button"
            aria-label={dict.close}
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-black-pure/55 backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in duration-300 cursor-default"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-nov-title"
            className="relative w-full sm:w-[720px] max-h-[92dvh] overflow-y-auto bg-background text-text-primary shadow-2xl grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)]"
          >
            {/* Franja de mármol: horizontal en celular, vertical en pantallas grandes */}
            <div className="relative h-24 sm:h-auto sm:min-h-[520px] overflow-hidden bg-black-neutral">
              <Image
                src={NOVEMBER_PROMO.imageHorizontal}
                alt=""
                fill
                sizes="100vw"
                className="object-cover sm:hidden"
                priority
              />
              <Image
                src={NOVEMBER_PROMO.imageVertical}
                alt={dict.image_alt}
                fill
                sizes="200px"
                className="object-cover hidden sm:block"
                priority
              />
            </div>

            <div className="relative flex flex-col px-5 pt-5 pb-6 sm:px-9 sm:pt-9 sm:pb-8">
              <button
                type="button"
                onClick={close}
                aria-label={dict.close}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 h-9 w-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current stroke-[1.5]" fill="none" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Firma del catálogo */}
              <h2 id="promo-nov-title" className="pr-10">
                <span className="block font-sans font-light text-maya-body sm:text-maya-h4 tracking-[0.12em] text-text-primary">
                  {dict.lockup}
                </span>
                <Image
                  src="/images/MAYA_LOGOTIPO.png"
                  alt="MAYA"
                  width={202}
                  height={30}
                  className="mt-2 h-5 sm:h-[26px] w-auto"
                />
              </h2>

              {!done ? (
                <>
                  {/* La oferta: el único elemento grande */}
                  <p className="mt-7 sm:mt-9 flex items-end gap-3 sm:gap-4">
                    <span className="font-sans font-light leading-[0.8] tracking-[-0.04em] text-[64px] sm:text-[88px] tabular-nums">
                      {NOVEMBER_PROMO.discount}%
                    </span>
                    <span className="pb-1 max-w-[12rem] text-maya-small sm:text-maya-body leading-snug text-text-primary">
                      {dict.offer_label}
                    </span>
                  </p>

                  <p className="mt-5 max-w-[34rem] text-maya-small leading-relaxed text-text-secondary">
                    {dict.description}
                  </p>

                  <form onSubmit={onSubmit} noValidate className="mt-6 sm:mt-auto sm:pt-7 space-y-2.5">
                    <p className="text-maya-small text-text-primary">{dict.form_intro}</p>
                    <input type="text" name="maya_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                    <label htmlFor="promo-nov-email" className="sr-only">
                      {dict.email_label}
                    </label>
                    <div className="flex flex-col min-[420px]:flex-row">
                      <input
                        ref={emailRef}
                        id="promo-nov-email"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        placeholder={dict.email_placeholder}
                        className="min-w-0 flex-1 bg-surface-secondary/60 border border-border-light min-[420px]:border-r-0 px-3.5 py-3 text-maya-small text-text-primary placeholder:text-text-primary/40 focus:border-black-neutral transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={sending}
                        className="shrink-0 px-5 py-3 bg-black-neutral text-gray-warm text-maya-small tracking-[0.04em] hover:bg-black-pure transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {sending ? dict.submitting : dict.submit}
                      </button>
                    </div>
                    <label className="flex items-start gap-2 text-[11px] leading-snug text-text-secondary cursor-pointer">
                      <input type="checkbox" name="consent" className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-accent)]" />
                      <span>
                        {dict.consent}{" "}
                        <Link
                          href={`/${ROUTES.privacidad[lang]}`}
                          className="underline underline-offset-2 hover:text-text-primary"
                        >
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
                </>
              ) : (
                <div className="mt-8 sm:mt-10 flex flex-col flex-1" aria-live="polite">
                  <p className="font-sans font-light text-maya-h4 leading-tight">{dict.success_title}</p>
                  <a
                    href={NOVEMBER_PROMO.pdfUrl}
                    download={NOVEMBER_PROMO.pdfFileName}
                    className="mt-2 self-start text-maya-small text-text-secondary underline underline-offset-4 hover:text-text-primary"
                  >
                    {dict.success_retry}
                  </a>

                  <div className="mt-8 sm:mt-auto pt-6 border-t border-border-light">
                    <p className="text-maya-body text-text-primary">{dict.next_title}</p>
                    <p className="mt-1 text-maya-small text-text-secondary">{dict.next_text}</p>
                    <div className="mt-5 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-track="whatsapp_click"
                        data-track-label={NOVEMBER_PROMO.id}
                        className="flex items-center justify-center gap-2 bg-black-neutral text-gray-warm px-4 py-3 text-maya-small hover:bg-black-pure transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.07c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.23-3.27-.68-2.77-1.09-4.53-3.93-4.67-4.11-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.24-.27.53-.34.71-.34l.51.01c.16.01.38-.06.6.46.23.54.77 1.88.84 2.02.07.14.11.3.02.48-.09.18-.14.3-.27.46l-.41.48c-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.11.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.25.09 1.57.74 1.84.88.27.14.45.2.52.32.07.11.07.66-.17 1.33z" />
                        </svg>
                        {dict.whatsapp}
                      </a>
                      <Link
                        href={contactHref}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center border border-black-neutral/70 px-4 py-3 text-maya-small text-text-primary hover:bg-black-neutral hover:text-gray-warm transition-colors"
                      >
                        {dict.contact}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
