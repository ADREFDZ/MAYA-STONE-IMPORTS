"use server";

import { headers } from "next/headers";
import { getDictionary } from "@/app/dictionaries";
import { createAdminClient } from "@/lib/supabase/admin";
import { CRM_CLIENT_TYPES, syncLeadToCrm } from "@/lib/crm/webLeads";

// =============================================================================
// PROTECCIÓN ANTI-SPAM
// -----------------------------------------------------------------------------
// 1. Honeypot: campo oculto "website" que un humano nunca llena.
// 2. Trampa de tiempo: un humano tarda más de 3 s en llenar el formulario.
// 3. Límite por IP: máx. 5 envíos cada 10 min (en memoria; por instancia).
//    Para algo más robusto en producción: Cloudflare Turnstile o Upstash.
// 4. Validación de formato y longitud de cada campo.
// 5. El guardado se hace desde el servidor con la llave privada (service role):
//    la tabla contact_leads ya NO acepta inserciones con la clave pública, así
//    que nadie puede saltarse estas protecciones escribiendo directo en Supabase.
// 6. Después de guardar, el lead se envía al CRM de MAYA (ver lib/crm/webLeads).
// =============================================================================

const MIN_FILL_MS = 3000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const submissions = new Map<string, { count: number; resetAt: number }>();

const MAX = {
  name: 120,
  email: 160,
  phone: 40,
  company: 160,
  location: 120,
  project: 120,
  short: 80,
  message: 4000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(formData: FormData, key: string, max: number): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (submissions.size > 5000) {
    for (const [k, v] of submissions) if (now > v.resetAt) submissions.delete(k);
  }
  const entry = submissions.get(ip);
  if (!entry || now > entry.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// Motivos válidos del formulario público
const ALLOWED_REASONS = ["showroom", "samples", "quote", "other"];

export async function submitContactAction(formData: FormData) {
  // Mensajes de error en el idioma de la página (vienen del diccionario)
  const lang = formData.get("lang") === "en" ? "en" : "es";
  const { contact } = await getDictionary(lang);
  const errors = contact.errors;

  // --- 1 y 2: honeypot y tiempo de llenado. A un bot le respondemos "éxito"
  // para no darle pistas, pero no se guarda nada.
  const honeypot = field(formData, "website", 200);
  const startedAt = Number(formData.get("form_started_at") || 0);
  const tooFast = !startedAt || Date.now() - startedAt < MIN_FILL_MS;
  if (honeypot || tooFast) {
    return { success: true };
  }

  // --- 3: límite por IP
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";
  if (isRateLimited(ip)) {
    return {
      success: false,
      error: errors.rate_limit,
    };
  }

  // --- 4: validación
  const name = field(formData, "name", MAX.name);
  const email = field(formData, "email", MAX.email).toLowerCase();
  const phone = field(formData, "phone", MAX.phone);
  const company = field(formData, "company", MAX.company);
  const location = field(formData, "location", MAX.location);
  const project_name = field(formData, "project_name", MAX.project);
  // Material desde el que llegó ("Consultar disponibilidad" → ?material=)
  const material_interest = field(formData, "material_interest", MAX.project);
  const profile_type = field(formData, "profile_type", MAX.short);
  const contact_reason = field(formData, "contact_reason", MAX.short);
  const category_interest = field(formData, "category_interest", MAX.short);
  const preferred_date = field(formData, "preferred_date", 20);
  const preferred_time = field(formData, "preferred_time", MAX.short);
  const project_details = field(formData, "project_details", MAX.message);

  if (
    !name ||
    !email ||
    !location ||
    !(CRM_CLIENT_TYPES as readonly string[]).includes(profile_type) ||
    !ALLOWED_REASONS.includes(contact_reason)
  ) {
    return {
      success: false,
      error: errors.required,
    };
  }

  if (!EMAIL_RE.test(email)) {
    return { success: false, error: errors.invalid_email };
  }

  if (preferred_date && !/^\d{4}-\d{2}-\d{2}$/.test(preferred_date)) {
    return { success: false, error: errors.invalid_date };
  }

  // --- Guardado (servidor, llave privada; la clave pública ya no puede insertar)
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return { success: false, error: errors.server_config };
  }

  const { data: saved, error } = await supabase
    .from("contact_leads")
    .insert([
      {
        name,
        email,
        phone: phone || null,
        company: company || null,
        location,
        project_name: project_name || null,
        material_interest: material_interest || null,
        profile_type,
        contact_reason,
        category_interest: category_interest || null,
        preferred_date: preferred_date || null,
        preferred_time: preferred_time || null,
        message: project_details || null,
        status: "nuevo",
      },
    ])
    .select("id")
    .single();

  if (error || !saved) {
    console.error("Error guardando lead en Supabase:", error);
    return {
      success: false,
      error: errors.generic,
    };
  }

  // --- Envío al CRM de MAYA. Si falla, el lead ya quedó guardado en el admin
  // (marcado con el error) y se puede reenviar; al visitante no le afecta.
  try {
    const es = (await getDictionary("es")).contact.form;
    let interestLabel: string | null = null;
    if (category_interest) {
      const fixed = (es.category_options as Record<string, string>)[
        category_interest
      ];
      if (fixed && category_interest !== "placeholder") {
        interestLabel = fixed;
      } else {
        const { data: col } = await supabase
          .from("collections")
          .select("title_es")
          .eq("slug", category_interest)
          .maybeSingle();
        interestLabel = col?.title_es || category_interest;
      }
    }

    await syncLeadToCrm(saved.id, {
      web_lead_id: saved.id,
      name,
      company: company || null,
      project_name: project_name || null,
      location,
      email,
      phone: phone || null,
      client_type: profile_type,
      contact_reason,
      reason_label:
        (es.reason_options as Record<string, string>)[contact_reason] ||
        contact_reason,
      category_interest: category_interest || null,
      interest_label: interestLabel,
      preferred_date: preferred_date || null,
      preferred_time_label: preferred_time
        ? (es.time_options as Record<string, string>)[preferred_time] ||
          preferred_time
        : null,
      message: project_details || null,
      lang,
    });
  } catch (err) {
    console.error("[crm] Error inesperado al enviar el lead:", err);
  }

  return { success: true };
}
