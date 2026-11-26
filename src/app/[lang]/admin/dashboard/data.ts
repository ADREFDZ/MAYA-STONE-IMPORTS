import "server-only";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// DATOS DEL DASHBOARD (lectura con la sesión del admin; RLS = solo admins)
// =============================================================================

const DAY = 86_400_000;

export const REASON_LABELS: Record<string, string> = {
  quote: "Cotización",
  samples: "Muestras",
  showroom: "Visita al showroom",
  other: "Otros",
  consulting: "Asesoría",
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  arquitecto: "Arquitecto",
  interiorista: "Interiorista",
  desarrollador: "Desarrollador",
  marmolero: "Marmolero",
  cliente_final: "Cliente final",
  comercializadora: "Comercializadora",
  otro: "Otro",
  // valores anteriores del formulario
  architecture: "Arquitecto",
  architect: "Arquitecto",
  interior: "Interiorista",
  developer: "Desarrollador",
  construction: "Constructora",
  private: "Cliente final",
  other: "Otro",
};

export const DOWNLOAD_SOURCE_LABELS: Record<string, string> = {
  coleccion: "Página de la colección",
  aviso_catalogos: "Aviso de catálogos",
  promocion: "Promoción",
  otro: "Otro",
};

export const SUBSCRIBER_SOURCE_LABELS: Record<string, string> = {
  popup_catalogo: "Aviso de catálogos",
  promo_noviembre_2026: "Promoción November at MAYA",
};

/** Catálogos que no son de una colección (promociones) */
const EXTRA_CATALOG_LABELS: Record<string, string> = {
  "november-at-maya-2026": "November at MAYA (promoción)",
};

export interface CatalogRow {
  label: string;
  d7: number;
  d30: number;
  d90: number;
}

export interface CountItem {
  label: string;
  count: number;
}

function topCounts(
  values: (string | null | undefined)[],
  labels?: Record<string, string>,
  limit = 6,
): CountItem[] {
  const map = new Map<string, number>();
  for (const raw of values) {
    const v = (raw || "").trim();
    if (!v) continue;
    const label = labels?.[v] || labels?.[v.toLowerCase()] || v;
    // agrupa sin distinguir mayúsculas / acentos básicos
    const key = label.toLocaleLowerCase("es-MX");
    const prev = [...map.keys()].find((k) => k.toLocaleLowerCase("es-MX") === key);
    map.set(prev || label, (map.get(prev || label) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Inicio de semana (lunes) en hora local de México */
function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export async function getDashboardData() {
  const supabase = await createClient();
  const now = Date.now();
  const since90 = new Date(now - 90 * DAY).toISOString();

  const [
    leadsRes,
    totalLeadsRes,
    recentRes,
    subsCountRes,
    subsRecentRes,
    subs30Res,
    productsRes,
    collectionsRes,
    downloadsRes,
    subsAllRes,
    allCollectionsRes,
  ] =
    await Promise.all([
      supabase
        .from("contact_leads")
        .select("created_at, contact_reason, profile_type, location, material_interest, crm_lead_code, crm_error, utm_source, utm_campaign, utm_content, fbclid")
        .gte("created_at", since90)
        .order("created_at", { ascending: false }),
      supabase.from("contact_leads").select("id", { count: "exact", head: true }),
      supabase
        .from("contact_leads")
        .select("id, name, company, location, contact_reason, profile_type, created_at, crm_lead_code")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "activo"),
      supabase
        .from("newsletter_subscribers")
        .select("email, collection_slug, source, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(now - 30 * DAY).toISOString()),
      supabase
        .from("products")
        .select("sku, aka, product_name, image_url, description, description_i18n, status, collection_products(collection_id)")
        .eq("status", "active"),
      supabase
        .from("collections")
        .select("id, slug, title_es, cover_image, catalog_url, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("catalog_downloads")
        .select("catalog, source, created_at")
        .gte("created_at", since90)
        .order("created_at", { ascending: false })
        .limit(20000),
      supabase
        .from("newsletter_subscribers")
        .select("source, collection_slug, status, created_at")
        .limit(20000),
      supabase.from("collections").select("slug, title_es"),
    ]);

  const leads = leadsRes.data ?? [];
  const inRange = (from: number, to: number) =>
    leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= from && t < to;
    }).length;

  // ---- KPIs
  const last7 = inRange(now - 7 * DAY, now + 1);
  const prev7 = inRange(now - 14 * DAY, now - 7 * DAY);
  const last30 = inRange(now - 30 * DAY, now + 1);
  const recent30 = leads.filter((l) => new Date(l.created_at).getTime() >= now - 30 * DAY);
  const synced = recent30.filter((l) => l.crm_lead_code).length;
  const crmFailed = leads.filter((l) => !l.crm_lead_code && l.crm_error).length;

  // ---- Leads por semana (últimas 8)
  const thisWeek = weekStart(new Date(now));
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (7 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      label: start.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      count: inRange(start.getTime(), end.getTime()),
      current: i === 7,
    };
  });

  // ---- Pendientes de contenido (solo materiales que están en alguna colección)
  type P = {
    sku: string;
    aka: string | null;
    product_name: string | null;
    image_url: string | null;
    description: string | null;
    description_i18n: { en?: string } | null;
    collection_products: { collection_id: string }[] | null;
  };
  const inCollections = ((productsRes.data ?? []) as P[]).filter(
    (p) => (p.collection_products ?? []).length > 0,
  );
  const name = (p: P) => p.aka || p.product_name || p.sku;
  const noImage = inCollections.filter((p) => !p.image_url).map(name);
  const noDescription = inCollections.filter((p) => !(p.description || "").trim()).map(name);
  const noEnglish = inCollections
    .filter((p) => (p.description || "").trim() && !(p.description_i18n?.en || "").trim())
    .map(name);
  const collections = collectionsRes.data ?? [];
  const noCatalog = collections.filter((c) => !c.catalog_url).map((c) => c.title_es || c.slug);
  const noCover = collections.filter((c) => !c.cover_image).map((c) => c.title_es || c.slug);

  // ---- Catálogos descargados (conteo anónimo propio)
  const catalogTitles: Record<string, string> = { ...EXTRA_CATALOG_LABELS };
  for (const c of allCollectionsRes.data ?? []) {
    if (c.slug) catalogTitles[c.slug] = c.title_es || c.slug;
  }
  const downloads = downloadsRes.data ?? [];
  const age = (iso: string) => now - new Date(iso).getTime();
  const rowsMap = new Map<string, CatalogRow>();
  for (const dl of downloads) {
    const label = catalogTitles[dl.catalog] || dl.catalog;
    const row = rowsMap.get(label) || { label, d7: 0, d30: 0, d90: 0 };
    const a = age(dl.created_at);
    row.d90 += 1;
    if (a <= 30 * DAY) row.d30 += 1;
    if (a <= 7 * DAY) row.d7 += 1;
    rowsMap.set(label, row);
  }
  const catalogRows = [...rowsMap.values()].sort((a, b) => b.d90 - a.d90 || b.d30 - a.d30);
  const downloadsIn = (from: number, to: number) =>
    downloads.filter((dl) => {
      const t = new Date(dl.created_at).getTime();
      return t >= from && t < to;
    }).length;
  const downloadWeeks = weeks.map((w, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (7 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { ...w, count: downloadsIn(start.getTime(), end.getTime()) };
  });

  // ---- Suscriptores por origen e interés
  const subsAll = subsAllRes.data ?? [];
  const subs7 = subsAll.filter((x) => age(x.created_at) <= 7 * DAY).length;

  return {
    catalogs: {
      rows: catalogRows,
      last7: downloadsIn(now - 7 * DAY, now + 1),
      last30: downloadsIn(now - 30 * DAY, now + 1),
      prev30: downloadsIn(now - 60 * DAY, now - 30 * DAY),
      weeks: downloadWeeks,
      bySource: topCounts(downloads.map((dl) => dl.source), DOWNLOAD_SOURCE_LABELS),
    },
    subscribers: {
      total: subsAll.length,
      last7: subs7,
      bySource: topCounts(subsAll.map((x) => x.source), SUBSCRIBER_SOURCE_LABELS),
      byInterest: topCounts(
        subsAll.map((x) => x.collection_slug),
        catalogTitles,
        6,
      ),
    },
    kpis: {
      last7,
      prev7,
      last30,
      totalLeads: totalLeadsRes.count ?? 0,
      subscribers: subsCountRes.count ?? 0,
      subscribers30: subs30Res.count ?? 0,
      crmSyncedPct: recent30.length ? Math.round((synced / recent30.length) * 100) : null,
      crmFailed,
    },
    weeks,
    campaigns: {
      withCampaign: leads.filter((l) => l.utm_source || l.utm_campaign || l.fbclid).length,
      total: leads.length,
      bySource: topCounts(
        leads.map((l) =>
          l.utm_source || l.utm_campaign || l.fbclid
            ? (l.utm_source || (l.fbclid ? "facebook" : "otro")).toLowerCase()
            : "Directo / orgánico",
        ),
        { facebook: "Meta", fb: "Meta", ig: "Meta", instagram: "Meta", meta: "Meta" },
      ),
      byCampaign: topCounts(leads.map((l) => l.utm_campaign), undefined, 8),
      byAd: topCounts(leads.map((l) => l.utm_content), undefined, 8),
    },
    byReason: topCounts(leads.map((l) => l.contact_reason), REASON_LABELS),
    byClientType: topCounts(leads.map((l) => l.profile_type), CLIENT_TYPE_LABELS),
    topMaterials: topCounts(leads.map((l) => l.material_interest), undefined, 8),
    topLocations: topCounts(leads.map((l) => l.location), undefined, 6),
    recentLeads: recentRes.data ?? [],
    recentSubscribers: subsRecentRes.data ?? [],
    gaps: [
      { label: "Materiales sin foto", items: noImage, href: "inventory" },
      { label: "Materiales sin descripción", items: noDescription, href: "inventory" },
      { label: "Materiales sin descripción en inglés", items: noEnglish, href: "inventory" },
      { label: "Colecciones sin catálogo PDF", items: noCatalog, href: "colecciones" },
      { label: "Colecciones sin portada", items: noCover, href: "colecciones" },
    ],
  };
}
