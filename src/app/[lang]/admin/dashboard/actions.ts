"use server";

import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createClient } from "@/lib/supabase/server";

/** CSV de suscriptores activos (para importarlos en la herramienta de correo). */
export async function exportSubscribersAction(): Promise<
  { ok: true; csv: string } | { ok: false; error: string }
> {
  const guard = await requireAdmin();
  if (!guard.authorized) return { ok: false, error: guard.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, lang, collection_slug, source, consent_at, created_at")
    .eq("status", "activo")
    .eq("consent_marketing", true)
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Evita fórmulas al abrir en Excel y escapa comillas
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = ["email", "idioma", "coleccion", "origen", "consentimiento", "alta"];
  const rows = (data ?? []).map((r) =>
    [r.email, r.lang, r.collection_slug, r.source, r.consent_at, r.created_at].map(esc).join(","),
  );
  return { ok: true, csv: [header.join(","), ...rows].join("\n") };
}
