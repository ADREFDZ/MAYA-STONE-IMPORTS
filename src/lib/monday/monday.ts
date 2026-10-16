interface CreateMondayLeadParams {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  profile_type?: string | null;
  reason?: string | null;
  category_interest?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  message?: string | null;
}

// Diccionario para traducir etiquetas técnicas a nombres ejecutivos
const REASON_LABELS: Record<string, string> = {
  showroom: "Visita Showroom",
  quote: "Cotización de Proyecto",
  samples: "Solicitud de Muestras",
  consulting: "Asesoría Técnica / Bespoke",
  other: "Contacto General",
};

const CATEGORY_LABELS: Record<string, string> = {
  all: "Toda la Colección",
  stone: "Piedra Natural (Mármol / Cuarcita / Travertino)",
  wood: "Maderas Nobles",
  bespoke: "Proyectos a Medida",
};

const PROFILE_LABELS: Record<string, string> = {
  architect: "Arquitecto / Estudio",
  developer: "Desarrolladora / Constructora",
  private: "Cliente Particular",
  other: "Otro",
};

export async function sendLeadToMonday(params: CreateMondayLeadParams) {
  const token = process.env.MONDAY_API_TOKEN;
  const boardId = process.env.MONDAY_LEADS_BOARD_ID;

  if (!token || !boardId) {
    console.warn(
      "⚠️ Monday.com: MONDAY_API_TOKEN o MONDAY_LEADS_BOARD_ID no configurados.",
    );
    return { success: false, error: "Missing configuration" };
  }

  const todayIso = new Date().toISOString().split("T")[0];

  const readableReason =
    REASON_LABELS[params.reason || ""] || params.reason || "Web Contact";
  const readableCategory =
    CATEGORY_LABELS[params.category_interest || ""] || params.category_interest;
  const readableProfile =
    PROFILE_LABELS[params.profile_type || ""] ||
    params.profile_type ||
    "No especificado";

  // Estructura de ficha ejecutiva para Comments
  const commentsParts = [
    `[WEB MAYA] MOTIVO: ${readableReason.toUpperCase()}`,
    `• Perfil: ${readableProfile}`,
    readableCategory ? `• Materia de interés: ${readableCategory}` : null,
    params.preferred_date
      ? `• Cita propuesta: ${params.preferred_date} (${params.preferred_time === "morning" ? "Mañana" : "Tarde"})`
      : null,
    params.message ? `• Detalles: "${params.message.trim()}"` : null,
  ].filter(Boolean);

  const formattedComments = commentsParts.join("\n");

  // Nombre del ítem principal en Monday
  const itemName = params.company?.trim()
    ? `${params.company.trim().toUpperCase()} (${params.name.trim()})`
    : params.name.trim().toUpperCase();

  // Mapeo seguro con los Column IDs de tu tablero
  // Ajusta las llaves si tu Monday usa 'text', 'date', etc.
  const columnValues: Record<string, any> = {
    // Estado inicial
    status: { label: "New Lead" },

    // Fecha de registro
    date: { date: todayIso },

    // Empresa
    company: params.company?.trim() || params.name.trim(),

    // Perfil profesional
    title: readableProfile,

    // Correo electrónico
    email: {
      email: params.email.trim(),
      text: params.email.trim(),
    },

    // Teléfono
    phone: params.phone
      ? {
          phone: params.phone.trim().replace(/[^\d+]/g, ""),
          countryShortName: "MX",
        }
      : undefined,

    // Comentarios estructurados
    comments: formattedComments,

    // Canal de procedencia
    canal_de_origen: "Página Web",
  };

  // Limpiar campos undefined
  Object.keys(columnValues).forEach((key) => {
    if (columnValues[key] === undefined) {
      delete columnValues[key];
    }
  });

  const query = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item (
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const variables = {
    boardId: Number(boardId),
    itemName,
    columnValues: JSON.stringify(columnValues),
  };

  try {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "API-Version": "2024-01",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    const result = await res.json();

    if (result.errors) {
      console.error("Monday API GraphQL Error:", JSON.stringify(result.errors));
      return { success: false, errors: result.errors };
    }

    return { success: true, itemId: result.data?.create_item?.id };
  } catch (error) {
    console.error("Error al conectar con Monday:", error);
    return { success: false, error };
  }
}
