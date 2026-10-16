import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache, updateTag } from "next/cache";

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
      .limit(4),
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

  // Pool de candidatos para "Variaciones y piezas relacionadas".
  // Se cachea el pool; la selección aleatoria de 4 se hace en CADA visita
  // (ver pickRandomVariations), así cada entrada al sitio muestra otros.
  let variationPool: typeof featuredRes.data = [];
  if (hero) {
    const { data: candidates } = await supabase
      .from("products")
      .select(PRODUCT_WITH_RENDERS)
      .eq("status", "active")
      .neq("sku", hero.sku)
      .not("image_url", "is", null)
      .limit(60);
    variationPool = candidates ?? [];
  }

  return {
    finishes: finishesRes.data ?? [],
    hero,
    variationPool: variationPool ?? [],
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
      variationPool: [],
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
// ARQUITECTURA / PROYECTOS
// =============================================================================

const getActiveProjectsCached = cached(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
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
  return data;
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

/**
 * Elige `count` materiales al azar del pool (Fisher–Yates).
 * Se llama en cada render del home, no dentro del caché.
 */
export function pickRandomVariations<T>(pool: T[], count = 4): T[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
