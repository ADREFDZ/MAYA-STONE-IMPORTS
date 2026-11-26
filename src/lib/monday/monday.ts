import { FALLBACK_ASSIGNEE, findSalesRegion } from "@/lib/monday/regions";

// =============================================================================
// ENVÍO DE LEADS DEL SITIO A MONDAY (tablero "1. Leads")
// -----------------------------------------------------------------------------
// Cada solicitud del formulario de contacto crea un lead en el grupo
// "1. LEADS POR CONTACTAR" con:
//   · Estatus "1. POR CONTACTAR" y Origen "MAYA | SITIO WEB"
//   · Vendedor según la región de la ubicación (src/lib/monday/regions.ts);
//     si no se reconoce, Isabel Ayala
//   · Empresa, Proyecto, Correo, Teléfono y una ficha completa en Comments
// y le manda una notificación en Monday al vendedor asignado.
//
// Variables (Vercel → Secret): MONDAY_API_TOKEN, MONDAY_LEADS_BOARD_ID
// Solo se usa en el servidor: nunca importar desde un componente "use client".
// =============================================================================

const API_URL = "https://api.monday.com/v2";

// IDs de columnas y grupo del tablero "1. Leads" (7263709584)
const COL = {
  seller: "multiple_person_mknxacpy",
  status: "lead_status",
  company: "lead_company",
  project: "text",
  email: "lead_email",
  phone: "lead_phone",
  comments: "long_text",
  source: "color_mm6sh70j",
} as const;
const GROUP_NEW_LEADS = "group_mm8kxw5g"; // "1. LEADS POR CONTACTAR"
// Se usan los IDs internos de las etiquetas (no el texto): si las renombran
// en Monday, el envío sigue funcionando y no se crean etiquetas duplicadas.
const STATUS_NEW_ID = 0; // ESTATUS → "1. POR CONTACTAR"
const SOURCE_WEB_ID = 153; // ORIGEN → "MAYA | SITIO WEB"

export interface MondayWebLead {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  project_name?: string | null;
  location: string;
  client_type_label?: string | null;
  reason_label?: string | null;
  interest_label?: string | null;
  material_interest?: string | null;
  preferred_date?: string | null;
  preferred_time_label?: string | null;
  message?: string | null;
  lang?: string | null;
}

export type MondaySendResult =
  | { ok: true; itemId: string; seller: string; region: string | null }
  | { ok: false; error: string };

async function mondayRequest<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.errors || json.error_message) {
      const msg =
        json?.errors?.[0]?.message ||
        json?.error_message ||
        `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    return json.data as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Teléfono para la columna de Monday: solo dígitos y país (MX por defecto). */
function phoneValue(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // +52 1 / +52 al inicio, o número nacional de 10 dígitos
  if (raw.trim().startsWith("+") && !digits.startsWith("52")) {
    return { phone: `+${digits}` }; // otro país: Monday lo detecta por la lada
  }
  const national = digits.replace(/^521?/, "");
  return { phone: `52${national.slice(-10)}`, countryShortName: "MX" };
}

function buildComments(lead: MondayWebLead, regionText: string): string {
  return [
    `[SITIO WEB] ${(lead.reason_label || "Contacto").toUpperCase()}`,
    `• Ubicación: ${lead.location} (${regionText})`,
    lead.client_type_label ? `• Perfil: ${lead.client_type_label}` : null,
    lead.company ? `• Empresa: ${lead.company}` : null,
    lead.project_name ? `• Proyecto: ${lead.project_name}` : null,
    lead.interest_label ? `• Interés: ${lead.interest_label}` : null,
    lead.material_interest ? `• Material consultado: ${lead.material_interest}` : null,
    lead.preferred_date
      ? `• Cita propuesta: ${lead.preferred_date}${lead.preferred_time_label ? ` (${lead.preferred_time_label})` : ""}`
      : null,
    `• Correo: ${lead.email}`,
    lead.phone ? `• Teléfono: ${lead.phone}` : null,
    lead.lang === "en" ? "• Idioma: inglés" : null,
    lead.message ? `\nMensaje:\n${lead.message.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendLeadToMonday(
  lead: MondayWebLead,
): Promise<MondaySendResult> {
  const token = process.env.MONDAY_API_TOKEN;
  const boardId = process.env.MONDAY_LEADS_BOARD_ID;
  if (!token || !boardId) {
    return { ok: false, error: "Faltan MONDAY_API_TOKEN o MONDAY_LEADS_BOARD_ID." };
  }

  const region = findSalesRegion(lead.location);
  const assignee = region ?? FALLBACK_ASSIGNEE;
  const regionText = region
    ? `región ${region.region}`
    : "región no reconocida, asignar manualmente";

  // Nombre como en el tablero: "NOMBRE / EMPRESA"
  const itemName = [lead.name, lead.company]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" / ")
    .toUpperCase()
    .slice(0, 250);

  const base: Record<string, unknown> = {
    [COL.status]: { index: STATUS_NEW_ID },
    [COL.source]: { index: SOURCE_WEB_ID },
    [COL.seller]: {
      personsAndTeams: [{ id: assignee.mondayUserId, kind: "person" }],
    },
    [COL.comments]: { text: buildComments(lead, regionText) },
  };
  if (lead.company?.trim()) base[COL.company] = lead.company.trim();
  if (lead.project_name?.trim()) base[COL.project] = lead.project_name.trim();

  // Correo y teléfono van aparte: si Monday rechazara su formato, el lead se
  // crea igual sin ellos (ya vienen en Comments).
  const contact: Record<string, unknown> = {
    [COL.email]: { email: lead.email, text: lead.email },
  };
  const phone = lead.phone ? phoneValue(lead.phone) : null;
  if (phone) contact[COL.phone] = phone;

  const create = `
    mutation ($board: ID!, $group: String!, $name: String!, $values: JSON!) {
      create_item(board_id: $board, group_id: $group, item_name: $name,
                  column_values: $values) { id }
    }`;

  try {
    let itemId: string;
    try {
      const data = await mondayRequest<{ create_item: { id: string } }>(token, create, {
        board: boardId,
        group: GROUP_NEW_LEADS,
        name: itemName,
        values: JSON.stringify({ ...base, ...contact }),
      });
      itemId = data.create_item.id;
    } catch (firstError) {
      console.warn("[monday] Reintento sin correo/teléfono:", firstError);
      const data = await mondayRequest<{ create_item: { id: string } }>(token, create, {
        board: boardId,
        group: GROUP_NEW_LEADS,
        name: itemName,
        values: JSON.stringify(base),
      });
      itemId = data.create_item.id;
    }

    // Aviso al vendedor (campana de Monday). Si falla, el lead ya existe.
    try {
      const text = region
        ? `Nuevo lead del sitio web (${region.region}): ${itemName} · ${lead.location}`
        : `Nuevo lead del sitio web SIN REGIÓN (${lead.location}): ${itemName}. Asígnalo al vendedor que corresponda.`;
      await mondayRequest(
        token,
        `mutation ($user: ID!, $target: ID!, $text: String!) {
           create_notification(user_id: $user, target_id: $target, text: $text,
                               target_type: Project) { text }
         }`,
        { user: assignee.mondayUserId, target: itemId, text },
      );
    } catch (err) {
      console.error("[monday] Lead creado pero no se pudo notificar:", err);
    }

    return {
      ok: true,
      itemId,
      seller: assignee.seller,
      region: region?.region ?? null,
    };
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? "Monday no respondió a tiempo."
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, error: msg.slice(0, 300) };
  }
}
