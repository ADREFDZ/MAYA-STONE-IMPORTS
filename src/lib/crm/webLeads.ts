import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// ENVÍO DE LEADS DEL SITIO AL CRM DE MAYA (proyecto Supabase "maya-erp")
// -----------------------------------------------------------------------------
// Llama al "buzón" public.crm_web_lead_intake del ERP. El ERP:
//   · arma el nombre del lead (Empresa / Nombre / Proyecto),
//   · asigna al vendedor de la región según la ubicación (como el bot de WhatsApp),
//   · avisa al vendedor (o a administración si no reconoce la ubicación).
// La función solo acepta la clave ERP_WEB_LEAD_KEY (el ERP guarda únicamente su hash).
// Solo se usa en el servidor: nunca importar desde un componente "use client".
// =============================================================================

/** Tipos de cliente del CRM (crm_options · lista tipo_cliente). */
export const CRM_CLIENT_TYPES = [
  "arquitecto",
  "interiorista",
  "desarrollador",
  "marmolero",
  "cliente_final",
  "comercializadora",
  "otro",
] as const;
export type CrmClientType = (typeof CRM_CLIENT_TYPES)[number];

export interface WebLeadPayload {
  web_lead_id: string;
  name: string;
  company?: string | null;
  project_name?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  client_type?: string | null;
  contact_reason?: string | null;
  reason_label?: string | null;
  category_interest?: string | null;
  interest_label?: string | null;
  preferred_date?: string | null;
  preferred_time_label?: string | null;
  message?: string | null;
  lang?: string | null;
}

export type CrmSendResult =
  | { ok: true; code: string; region: string | null; assigned: boolean }
  | { ok: false; error: string };

export async function sendLeadToCrm(
  payload: WebLeadPayload,
): Promise<CrmSendResult> {
  const url = process.env.ERP_SUPABASE_URL;
  const apiKey = process.env.ERP_SUPABASE_PUBLISHABLE_KEY;
  const leadKey = process.env.ERP_WEB_LEAD_KEY;

  if (!url || !apiKey || !leadKey) {
    return { ok: false, error: "Faltan variables ERP_* en el servidor." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${url}/rest/v1/rpc/crm_web_lead_intake`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_key: leadKey, p: payload }),
      cache: "no-store",
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      const msg =
        (json && (json.message || json.error)) || `HTTP ${res.status}`;
      return { ok: false, error: String(msg).slice(0, 300) };
    }
    return {
      ok: true,
      code: String(json.code),
      region: json.region ?? null,
      assigned: Boolean(json.assigned),
    };
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? "El CRM no respondió a tiempo."
        : String(err);
    return { ok: false, error: msg.slice(0, 300) };
  } finally {
    clearTimeout(timer);
  }
}

/** Envía y deja registrado en contact_leads si llegó al CRM (o el error). */
export async function syncLeadToCrm(
  leadId: string,
  payload: WebLeadPayload,
): Promise<CrmSendResult> {
  const result = await sendLeadToCrm(payload);
  try {
    const supabase = createAdminClient();
    await supabase
      .from("contact_leads")
      .update(
        result.ok
          ? {
              crm_lead_code: result.code,
              crm_synced_at: new Date().toISOString(),
              crm_error: null,
            }
          : { crm_error: result.error },
      )
      .eq("id", leadId);
  } catch (err) {
    console.error("[crm] No se pudo registrar el estado del envío:", err);
  }
  if (!result.ok) console.error("[crm] Lead no enviado al CRM:", result.error);
  return result;
}
