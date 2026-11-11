"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// SUSCRIPCIÓN DESDE EL POP-UP DE CATÁLOGO (email marketing)
// · Guarda desde el servidor (service role): la tabla no acepta la clave pública.
// · Anti-spam: honeypot, tiempo mínimo y límite por IP (como el formulario).
// · Solo se guarda con consentimiento explícito (casilla marcada).
// =============================================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string) {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  const e = hits.get(ip);
  if (!e || now > e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > RATE_LIMIT;
}

export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: "email" | "consent" | "rate" | "generic" };

export async function subscribeCatalogAction(
  formData: FormData,
): Promise<SubscribeResult> {
  const str = (k: string, max: number) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  };

  // Bots: se responde "ok" sin guardar
  const startedAt = Number(formData.get("started_at") || 0);
  if (str("website", 200) || !startedAt || Date.now() - startedAt < 2000) {
    return { ok: true };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";
  if (limited(ip)) return { ok: false, error: "rate" };

  const email = str("email", 160).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email" };
  if (formData.get("consent") !== "on") return { ok: false, error: "consent" };

  const lang = str("lang", 2) === "en" ? "en" : "es";
  const collection = str("collection", 80) || null;

  try {
    const db = createAdminClient();
    const now = new Date().toISOString();
    const { data: existing } = await db
      .from("newsletter_subscribers")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    const row = {
      lang,
      collection_slug: collection,
      consent_marketing: true,
      consent_at: now,
      status: "activo",
      updated_at: now,
    };

    const { error } = existing
      ? await db.from("newsletter_subscribers").update(row).eq("id", existing.id)
      : await db
          .from("newsletter_subscribers")
          .insert({ ...row, email, source: "popup_catalogo" });

    if (error) {
      console.error("[newsletter] No se pudo guardar:", error.message);
      return { ok: false, error: "generic" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[newsletter] Error:", err);
    return { ok: false, error: "generic" };
  }
}
