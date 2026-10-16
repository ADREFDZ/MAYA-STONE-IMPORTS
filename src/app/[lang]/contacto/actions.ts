"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

// =============================================================================
// PROTECCIÓN ANTI-SPAM
// -----------------------------------------------------------------------------
// 1. Honeypot: campo oculto "website" que un humano nunca llena.
// 2. Trampa de tiempo: un humano tarda más de 3 s en llenar el formulario.
// 3. Límite por IP: máx. 5 envíos cada 10 min (en memoria; por instancia).
//    Para algo más robusto en producción: Cloudflare Turnstile o Upstash.
// 4. Validación de formato y longitud de cada campo.
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

export async function submitContactAction(formData: FormData) {
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
      error: "Has enviado varias solicitudes seguidas. Intenta de nuevo en unos minutos.",
    };
  }

  // --- 4: validación
  const name = field(formData, "name", MAX.name);
  const email = field(formData, "email", MAX.email).toLowerCase();
  const phone = field(formData, "phone", MAX.phone);
  const company = field(formData, "company", MAX.company);
  const profile_type = field(formData, "profile_type", MAX.short);
  const contact_reason = field(formData, "contact_reason", MAX.short);
  const category_interest = field(formData, "category_interest", MAX.short);
  const preferred_date = field(formData, "preferred_date", 20);
  const preferred_time = field(formData, "preferred_time", MAX.short);
  const project_details = field(formData, "project_details", MAX.message);

  if (!name || !email || !profile_type || !contact_reason) {
    return {
      success: false,
      error: "Por favor completa los campos obligatorios.",
    };
  }

  if (!EMAIL_RE.test(email)) {
    return { success: false, error: "El correo electrónico no es válido." };
  }

  if (preferred_date && !/^\d{4}-\d{2}-\d{2}$/.test(preferred_date)) {
    return { success: false, error: "La fecha seleccionada no es válida." };
  }

  // --- Guardado (cliente anónimo: el formulario es público, no usa sesión)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: "Error de configuración en el servidor." };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("contact_leads").insert([
    {
      name,
      email,
      phone: phone || null,
      company: company || null,
      profile_type,
      contact_reason,
      category_interest: category_interest || null,
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || null,
      message: project_details || null,
      status: "nuevo",
    },
  ]);

  if (error) {
    console.error("Error guardando lead en Supabase:", error);
    return {
      success: false,
      error: "Ocurrió un error al enviar tu solicitud. Inténtalo de nuevo.",
    };
  }

  return { success: true };
}
