// =============================================================================
// REGIONES DE VENTA → VENDEDOR EN MONDAY
// -----------------------------------------------------------------------------
// Misma tabla de regiones que usa el CRM (maya-erp · sales_regions/region_states)
// y el bot de WhatsApp. Si cambia un vendedor o se agrega una ciudad, actualizar
// aquí también. Los IDs son de usuarios de monday.com (gpomaya.monday.com).
// =============================================================================

export interface SalesRegion {
  region: string;
  seller: string;
  mondayUserId: number;
  places: string[];
}

export const SALES_REGIONS: SalesRegion[] = [
  {
    region: "Bajío",
    seller: "Raquel Márquez",
    mondayUserId: 106522487,
    places: [
      "Ags", "Aguascalientes", "Celaya", "Gto", "Guanajuato", "Irapuato",
      "Juriquilla", "León", "Qro", "Querétaro", "San Luis Potosí",
      "San Miguel de Allende", "Silao", "SLP", "Zacatecas",
    ],
  },
  {
    region: "Centro",
    seller: "Evelyn Orozco",
    mondayUserId: 103507868,
    places: [
      "Acapulco", "CDMX", "Ciudad de México", "Cuernavaca", "DF",
      "Edo. de México", "Edo. Méx.", "Edomex", "Estado de Méx.",
      "Estado de México", "Guerrero", "Hidalgo", "Metepec", "Morelos",
      "Pachuca", "Puebla", "Tlaxcala", "Toluca",
    ],
  },
  {
    region: "Norte",
    seller: "Denisse Villegas",
    mondayUserId: 108199912,
    places: [
      "Baja California", "Baja California Sur", "BC", "BCS",
      "Cabo San Lucas", "Chihuahua", "Ciudad Juárez", "Coahuila", "Culiacán",
      "Durango", "Ensenada", "Hermosillo", "La Paz", "Los Cabos", "Mazatlán",
      "Mexicali", "Monterrey", "N.L.", "NL", "Nuevo Laredo", "Nuevo León",
      "Reynosa", "Saltillo", "San José del Cabo", "San Pedro Garza García",
      "Sinaloa", "Sonora", "Tamaulipas", "Tampico", "Tijuana", "Torreón",
    ],
  },
  {
    region: "Occidente",
    seller: "Paulina Martínez",
    mondayUserId: 113862407,
    places: [
      "Colima", "GDL", "Guadalajara", "Jalisco", "Manzanillo", "Michoacán",
      "Morelia", "Nayarit", "Nuevo Vallarta", "Puerto Vallarta", "Punta Mita",
      "Tepic", "Vallarta", "Zapopan",
    ],
  },
  {
    region: "Sureste",
    seller: "Rodrigo Avilés",
    mondayUserId: 82623103,
    places: [
      "Bacalar", "Boca del Río", "Campeche", "Cancún", "Chiapas", "Cozumel",
      "Holbox", "Huatulco", "Mérida", "Oaxaca", "Playa del Carmen",
      "Puerto Escondido", "Puerto Morelos", "Q. Roo", "QRoo", "Quintana Roo",
      "San Cristóbal de las Casas", "Tabasco", "Tulum", "Tuxtla",
      "Tuxtla Gutiérrez", "Valladolid", "Veracruz", "Villahermosa", "Xalapa",
      "Yucatán",
    ],
  },
];

/** Ubicación no reconocida: se asigna a administración para que la reparta. */
export const FALLBACK_ASSIGNEE = {
  seller: "Isabel Ayala",
  mondayUserId: 118071150,
};

/** minúsculas, sin acentos ni signos; espacios simples */
function normalize(text: string): string {
  return ` ${text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

// Todas las variantes ordenadas de la más larga a la más corta, para que
// "Baja California Sur" gane sobre "Baja California" y "San Luis Potosí"
// sobre cualquier coincidencia parcial.
const INDEX = SALES_REGIONS.flatMap((r) =>
  r.places.map((p) => ({ key: normalize(p), region: r })),
).sort((a, b) => b.key.length - a.key.length);

/**
 * Región de venta según lo que la persona escribió en "Ubicación".
 * Coincide por palabras completas ("León, Gto." → Bajío; "Leonardo" no).
 */
export function findSalesRegion(location: string | null | undefined) {
  if (!location) return null;
  const text = normalize(location);
  return INDEX.find((entry) => text.includes(entry.key))?.region ?? null;
}
