import { createHash } from "crypto";

// =============================================================================
// API DE CONVERSIONES DE META (envío del Lead desde el servidor)
// -----------------------------------------------------------------------------
// Complementa al Pixel del navegador: si un bloqueador de anuncios o Safari
// impide que el Pixel mande el Lead, este envío sí llega. Ambos usan el mismo
// event_id, así Meta lo cuenta UNA sola vez.
// Solo se usa cuando la persona aceptó cookies (se respeta el "no" del banner).
// Correo, teléfono y nombre viajan cifrados (SHA-256), como pide Meta.
//
// Variables (Vercel):
//   META_CAPI_TOKEN            (Secret) token de Events Manager
//   NEXT_PUBLIC_META_PIXEL_ID  ID del Pixel
//   META_CAPI_TEST_CODE        (opcional) código de "Probar eventos"; quitarlo después
// Solo servidor: nunca importar desde un componente "use client".
// =============================================================================

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v23.0";

const sha256 = (value: string) =>
  createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length === 10) return `52${digits}`; // número nacional de México
  return digits.replace(/^521(\d{10})$/, "52$1");
}

export interface MetaLeadInput {
  eventId: string;
  eventSourceUrl: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  customData?: Record<string, string | undefined | null>;
}

export type MetaSendResult = { ok: true } | { ok: false; error: string };

export async function sendLeadToMeta(input: MetaLeadInput): Promise<MetaSendResult> {
  const token = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!token || !pixelId) {
    return { ok: false, error: "Faltan META_CAPI_TOKEN o NEXT_PUBLIC_META_PIXEL_ID." };
  }

  const phone = input.phone ? normalizePhone(input.phone) : null;
  const firstName = (input.name || "").trim().split(/\s+/)[0];

  const userData: Record<string, unknown> = {
    em: [sha256(input.email)],
    country: [sha256("mx")],
  };
  if (phone) userData.ph = [sha256(phone)];
  if (firstName) userData.fn = [sha256(firstName)];
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.fbp) userData.fbp = input.fbp;

  const customData = Object.fromEntries(
    Object.entries(input.customData || {}).filter(([, v]) => v),
  );

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };
  if (process.env.META_CAPI_TEST_CODE) {
    body.test_event_code = process.env.META_CAPI_TEST_CODE;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      },
    );
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.error) {
      return {
        ok: false,
        error: String(json?.error?.message || `HTTP ${res.status}`).slice(0, 300),
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.name === "AbortError"
          ? "Meta no respondió a tiempo."
          : String(err).slice(0, 300),
    };
  } finally {
    clearTimeout(timer);
  }
}
