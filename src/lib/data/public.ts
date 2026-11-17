import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache, updateTag } from "next/cache";
import type { ProjectMaterial } from "@/lib/projects/materials";

/**
 * DATOS PÚBLICOS CACHEADOS
 * -----------------------------------------------------------------------------
 * Todas las lecturas de Supabase que alimentan las páginas públicas pasan por
 * aquí. Usan un cliente SIN cookies (anon key) para que el resultado sea el
 * mismo para cualquier visitante y se pueda cachear.
 *
 * - El caché dura PUBLIC_REVALIDATE_SECONDS como máximo.
 * - Cualquier Server Action de admin que modifique contenido debe llamar a
 *   `invalidatePublicCache()` para que el sitio público se actualice al instante.
 */

export const PUBLIC_DATA_TAG = "public-data";
export const PUBLIC_REVALIDATE_SECONDS = 300; // 5 minutos

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  key: string,
) {
  return unstable_cache(fn, ["maya", key], {
    tags: [PUBLIC_DATA_TAG],
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  });
}

/**
 * Si Supabase falla, lanzamos error DENTRO del caché para que ese resultado
 * vacío NO se guarde; afuera devolvemos un valor seguro para que la página
 * siga funcionando y se reintente en la siguiente visita.
 */
function assertOk(...results: { error: { message: string } | null }[]) {
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[public-data] ${label}:`, err);
    return fallback;
  }
}

/** Invalida todo el contenido público. Llamar desde Server Actions de admin. */
export function invalidatePublicCache() {
  updateTag(PUBLIC_DATA_TAG);
}

// =============================================================================
// HOME
// =============================================================================

const PRODUCT_WITH_RENDERS = `
  *,
  material_renders!product_sku (id, product_sku, render_url, application, sort_order)
`;

const getHomeDataCached = cached(async () => {
  const supabase = createPublicClient();

  const [finishesRes, featuredRes, bentoRes, projectsRes] = await Promise.all([
    supabase
      .from("bespoke_finishes")
      .select("*")
      .eq("is_active", true)
      .eq("show_in_home", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(PRODUCT_WITH_RENDERS)
      .eq("is_featured", true)
      .limit(1),
    supabase
      .from("collections")
      .select(
        `
        *,
        collection_products (
          product_sku,
          products ( image_url )
        )
      `,
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("projects")
      .select(
        "id, title, title_es, category, location, short_description, short_description_es, description, description_es, cover_image, slug, material_skus",
      )
      .eq("is_active", true)
      .eq("show_in_home", true)
      .order("sort_order", { ascending: true })
      // Todos los marcados para la Home (tope de seguridad: 12)
      .limit(12),
  ]);

  assertOk(finishesRes, featuredRes, bentoRes, projectsRes);

  let hero = featuredRes.data?.[0] ?? null;

  if (!hero) {
    const fallbackRes = await supabase
      .from("products")
      .select(PRODUCT_WITH_RENDERS)
      .limit(1);
    hero = fallbackRes.data?.[0] ?? null;
  }

  return {
    finishes: finishesRes.data ?? [],
    hero,
    bentoCollections: bentoRes.data ?? [],
    homeProjects: projectsRes.data ?? [],
  };
}, "home");

export const getHomeData = () =>
  safe(
    getHomeDataCached,
    {
      finishes: [],
      hero: null,
      bentoCollections: [],
      homeProjects: [],
    } as Awaited<ReturnType<typeof getHomeDataCached>>,
    "home",
  );

// =============================================================================
// COLECCIONES (catálogo completo con materiales y renders)
// =============================================================================

const getCollectionsCatalogCached = cached(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      *,
      collection_products (
        sort_order,
        products (
          *,
          material_renders (*)
        )
      )
    `,
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}, "collections-catalog");

export async function getCollectionsCatalogRaw() {
  try {
    return { data: await getCollectionsCatalogCached(), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: { message } };
  }
}

// =============================================================================
// CONTACTO: colecciones activas para "Línea de interés" del formulario
// =============================================================================

const getContactCollectionsCached = cached(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("slug, title_es, title_en")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title_es", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}, "contact-collections");

export const getContactCollections = () =>
  safe(getContactCollectionsCached, [], "contact-collections");

// =============================================================================
// CATÁLOGOS PDF (pop-up de catálogo en todo el sitio)
// =============================================================================

const getCatalogLinksCached = cached(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("slug, title_es, title_en, catalog_url")
    .eq("is_active", true)
    .not("catalog_url", "is", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).filter((c) => Boolean(c.catalog_url));
}, "catalog-links");

export const getCatalogLinks = () =>
  safe(getCatalogLinksCached, [], "catalog-links");

// =============================================================================
// ARQUITECTURA / PROYECTOS
// -----------------------------------------------------------------------------
// `material_skus` guarda los SKUs elegidos en Admin → Proyectos → Materiales.
// Aquí se convierten en materiales con nombre, foto y colección
// (`materials_resolved`), solo los que existen y están activos.
// =============================================================================

type SupabasePublic = ReturnType<typeof createPublicClient>;

async function attachMaterials<T extends { material_skus?: unknown }>(
  supabase: SupabasePublic,
  projects: T[],
): Promise<(T & { materials_resolved: ProjectMaterial[] })[]> {
  const skus = [
    ...new Set(
      projects.flatMap((p) =>
        Array.isArray(p.material_skus)
          ? (p.material_skus as unknown[]).filter((s): s is string => typeof s === "string")
          : [],
      ),
    ),
  ];
  const bySku = new Map<string, ProjectMaterial>();
  if (skus.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select(
        "sku, aka, product_name, image_url, stone_type, origin, status, collection_products(collections(slug, title_es, title_en, is_active))",
      )
      .in("sku", skus)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    for (const p of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = ((p as any).collection_products ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((cp: any) => cp?.collections)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => c && c.is_active);
      bySku.set(p.sku, {
        sku: p.sku,
        name: p.aka || p.product_name || p.sku,
        image: p.image_url || null,
        stone_type: p.stone_type || null,
        origin: p.origin && p.origin !== "-" ? p.origin : null,
        collection: cols[0]
          ? { slug: cols[0].slug, title_es: cols[0].title_es, title_en: cols[0].title_en }
          : null,
      });
    }
  }
  return projects.map((p) => ({
    ...p,
    materials_resolved: (Array.isArray(p.material_skus) ? (p.material_skus as string[]) : [])
      .map((s) => bySku.get(s))
      .filter((m): m is ProjectMaterial => Boolean(m)),
  }));
}

// =============================================================================
// =============================================================================

const getActiveProjectsCached = cached(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return attachMaterials(supabase, data ?? []);
}, "projects-active");

export const getActiveProjects = () =>
  safe(getActiveProjectsCached, [], "projects-active");

const getProjectBySlugCached = cached(async (slug: string) => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [withMaterials] = await attachMaterials(supabase, [data]);
  return withMaterials;
}, "project-by-slug");

export const getProjectBySlug = (slug: string) =>
  safe(() => getProjectBySlugCached(slug), null, "project-by-slug");

// =============================================================================
// SITEMAP
// =============================================================================

const getSitemapEntriesCached = cached(async () => {
  const supabase = createPublicClient();
  const [projectsRes, collectionsRes] = await Promise.all([
    supabase.from("projects").select("slug, updated_at").eq("is_active", true),
    supabase.from("collections").select("slug, updated_at").eq("is_active", true),
  ]);
  assertOk(projectsRes, collectionsRes);
  return {
    projects: projectsRes.data ?? [],
    collections: collectionsRes.data ?? [],
  };
}, "sitemap");

export const getSitemapEntries = () =>
  safe(getSitemapEntriesCached, { projects: [], collections: [] }, "sitemap");
