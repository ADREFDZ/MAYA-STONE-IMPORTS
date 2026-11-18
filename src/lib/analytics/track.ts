/**
 * MEDICIÓN DE EVENTOS (Vercel Analytics + Meta Pixel + GA4 + Microsoft Clarity)
 * -----------------------------------------------------------------------------
 * Un solo llamado `track("lead", {...})` envía el evento a las herramientas
 * que estén cargadas.
 *   · Vercel Analytics: sin cookies ni datos personales, mide siempre.
 *     (En Pro admite 2 propiedades por evento: se envían las 2 primeras.)
 *   · Meta, GA4 y Clarity: solo si la persona aceptó cookies.
 */

import { track as vercelTrack } from "@vercel/analytics";

export type TrackEvent =
  | "lead" // formulario de contacto enviado
  | "whatsapp_click" // clic a WhatsApp (contacto, pop-up)
  | "catalog_download" // descarga de catálogo PDF
  | "newsletter_signup" // registro en el pop-up de catálogos
  | "availability_click"; // "Consultar disponibilidad" de un material

type Params = Record<string, string | number | undefined>;

type Fbq = (...args: unknown[]) => void;
type Gtag = (...args: unknown[]) => void;
type Clarity = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    gtag?: Gtag;
    clarity?: Clarity;
  }
}

// Eventos estándar de Meta (sirven para optimizar campañas)
const META_STANDARD: Partial<Record<TrackEvent, string>> = {
  lead: "Lead",
  whatsapp_click: "Contact",
  newsletter_signup: "CompleteRegistration",
  catalog_download: "ViewContent",
};

// Nombres recomendados por Google Analytics 4
const GA_NAMES: Record<TrackEvent, string> = {
  lead: "generate_lead",
  whatsapp_click: "whatsapp_click",
  catalog_download: "file_download",
  newsletter_signup: "sign_up",
  availability_click: "availability_click",
};

export function track(event: TrackEvent, params: Params = {}) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  try {
    const std = META_STANDARD[event];
    if (window.fbq) {
      if (std) window.fbq("track", std, clean);
      else window.fbq("trackCustom", event, clean);
    }
    window.gtag?.("event", GA_NAMES[event], clean);
    window.clarity?.("event", event);
    vercelTrack(event, Object.fromEntries(Object.entries(clean).slice(0, 2)) as Record<string, string | number>);
  } catch {
    /* la medición nunca debe romper la interacción */
  }
}
