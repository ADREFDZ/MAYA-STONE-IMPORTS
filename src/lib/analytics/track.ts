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
  | "collection_view" // abrió la página de una colección
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
  collection_view: "ViewContent",
};

// Eventos personalizados de Meta (nombre con el que aparecen en Events Manager)
const META_CUSTOM: Partial<Record<TrackEvent, string>> = {
  catalog_download: "CatalogDownload",
  availability_click: "AvailabilityClick",
};

// Nombres recomendados por Google Analytics 4
const GA_NAMES: Record<TrackEvent, string> = {
  lead: "generate_lead",
  whatsapp_click: "whatsapp_click",
  catalog_download: "file_download",
  newsletter_signup: "sign_up",
  availability_click: "availability_click",
  collection_view: "view_item_list",
};

/**
 * @param options.eventId  mismo ID que el envío del servidor (API de
 *   Conversiones) para que Meta no cuente el evento dos veces.
 */
export function track(
  event: TrackEvent,
  params: Params = {},
  options: { eventId?: string } = {},
) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  try {
    const std = META_STANDARD[event];
    if (window.fbq) {
      const meta = options.eventId ? { eventID: options.eventId } : undefined;
      if (std) window.fbq("track", std, clean, meta);
      else window.fbq("trackCustom", META_CUSTOM[event] || event, clean, meta);
    }
    window.gtag?.("event", GA_NAMES[event], clean);
    window.clarity?.("event", event);
    vercelTrack(event, Object.fromEntries(Object.entries(clean).slice(0, 2)) as Record<string, string | number>);
  } catch {
    /* la medición nunca debe romper la interacción */
  }
}
