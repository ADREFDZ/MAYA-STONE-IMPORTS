/**
 * ORIGEN DE CAMPAÑA (UTM) — solo en el navegador
 * -----------------------------------------------------------------------------
 * Al entrar al sitio desde un anuncio o enlace con UTM, se guarda de dónde
 * vino la persona (sin datos personales) durante 30 días. Así, si entra por
 * /coleccion/reserve y días después manda el formulario de contacto, el lead
 * queda ligado a esa campaña. Si vuelve desde otra campaña, se reemplaza
 * (cuenta la última campaña).
 */

const KEY = "maya_attribution";
const TTL_DAYS = 30;

export const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type Attribution = Partial<Record<(typeof UTM_FIELDS)[number], string>> & {
  landing_page?: string;
  referrer?: string;
  /** milisegundos de la primera visita con fbclid (para el parámetro fbc) */
  fbclid_at?: number;
  saved_at?: number;
};

const clean = (v: string | null) => (v || "").trim().slice(0, 200);

/** Lee la URL actual y guarda el origen si trae UTM o fbclid. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Attribution = {};
    for (const key of UTM_FIELDS) {
      const value = clean(params.get(key));
      if (value) found[key] = value;
    }
    if (Object.keys(found).length === 0) return;

    const ref = document.referrer;
    const external = ref && !ref.startsWith(window.location.origin);
    const data: Attribution = {
      ...found,
      landing_page: window.location.pathname.slice(0, 200),
      referrer: external ? ref.slice(0, 300) : undefined,
      fbclid_at: found.fbclid ? Date.now() : undefined,
      saved_at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/** Origen guardado (vigente) o vacío. */
export function readAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Attribution;
    if (!data.saved_at || Date.now() - data.saved_at > TTL_DAYS * 86_400_000) {
      localStorage.removeItem(KEY);
      return {};
    }
    return data;
  } catch {
    return {};
  }
}

/** ¿La persona aceptó cookies de analítica/marketing? (banner MAYA) */
export function hasMarketingConsent(): boolean {
  try {
    const raw = localStorage.getItem("maya_cookie_consent");
    if (!raw) return false;
    if (raw.startsWith("{")) {
      const p = JSON.parse(raw);
      return p.decision === "granted" && Date.now() < p.expiry;
    }
    return raw === "granted";
  } catch {
    return false;
  }
}

/** Valor de una cookie del navegador (para _fbp / _fbc del Pixel). */
export function readCookie(name: string): string {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}
