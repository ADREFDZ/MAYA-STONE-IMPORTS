"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// CONTEO DE DESCARGAS DE CATÁLOGOS (dashboard del admin)
// -----------------------------------------------------------------------------
// Anónimo: solo guarda qué catálogo, desde dónde, idioma y fecha. Sin IP ni
// datos de la persona, así que cuenta todas las descargas (con o sin cookies).
// Límite por IP en memoria para que nadie infle los números a propósito.
// =============================================================================

const SOURCES = ["coleccion", "aviso_catalogos", "promocion", "otro"] as const;
export type CatalogDownloadSource = (typeof SOURCES)[number];

const LIMIT = 30; // descargas por IP cada 10 min
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

export async function recordCatalogDownloadAction(
  catalog: string,
  source: string,
  lang?: string,
): Promise<void> {
  const cleanCatalog = String(catalog || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
  if (!cleanCatalog) return;
  const cleanSource = (SOURCES as readonly string[]).includes(source) ? source : "otro";

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.resetAt) hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else if (++e.count > LIMIT) return;
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }

  try {
    const db = createAdminClient();
    await db.from("catalog_downloads").insert({
      catalog: cleanCatalog,
      source: cleanSource,
      lang: lang === "en" ? "en" : "es",
    });
  } catch (err) {
    console.error("[catalogos] No se pudo registrar la descarga:", err);
  }
}
