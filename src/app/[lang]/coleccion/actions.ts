"use server";

import { getCollectionsCatalogRaw } from "@/lib/data/public";

// =============================================================================
// TIPOS PÚBLICOS DEL DOMINIO (UI / COMPONENTES)
// =============================================================================

export interface MaterialRender {
  id: string;
  product_sku: string;
  render_url: string;
  application: string;
  sort_order?: number;
}

export interface MaterialItem {
  id: string;
  sku: string;
  name: string;
  aka?: string | null;
  category: string;
  stone_type?: string | null;
  type?: string | null;
  kind?: string | null;
  origin: string;
  status: string;
  description?: string | null;
  image: string | null;
  formats: string[];
  finishes: string[];
  uses: string[];
  renders: MaterialRender[];
}

export interface EditorialBlock {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  curatorialNote?: string;
  imageUrl?: string;
  bullets?: string[];
  layout?: "split-right" | "split-left" | "full-width" | "cards";
}

export interface CollectionItem {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  manifest?: string | null;
  description?: string | null;
  cover_image?: string | null;
  logo_url?: string | null;
  video_url?: string | null;
  gallery_images?: string[];
  is_active: boolean;
  sort_order?: number;
  materials: MaterialItem[];
  editorial_blocks?: EditorialBlock[];
}

// =============================================================================
// TIPOS DE BASE DE DATOS (SUPABASE SCHEMA MAPPING)
// =============================================================================

export type I18nRecord = {
  es?: string | null;
  en?: string | null;
  [key: string]: string | null | undefined;
};

export type I18nValue = string | I18nRecord | null | undefined;

export interface DbMaterialRender {
  id: string;
  product_sku: string;
  render_url: string;
  application: string;
  sort_order?: number | null;
}

export interface DbProduct {
  sku: string;
  product_name?: string | null;
  name?: string | null;
  title?: string | null;
  aka?: string | null;
  category?: string | null;
  stone_type?: string | null;
  type?: string | null;
  kind?: string | null;
  origin?: string | null;
  status?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_i18n?: I18nValue;
  image_url?: string | null;
  image?: string | null;
  formats?: string[] | null;
  finishes?: string[] | null;
  uses?: string[] | null;
  uses_en?: string[] | null;
  material_renders?: DbMaterialRender[] | null;
}

export interface DbCollectionProduct {
  sort_order?: number | null;
  products?: DbProduct | DbProduct[] | null;
}

export interface DbEditorialBlock {
  id: string;
  title?: I18nValue;
  title_en?: string | null;
  title_es?: string | null;
  subtitle?: I18nValue;
  subtitle_en?: string | null;
  subtitle_es?: string | null;
  content?: I18nValue;
  content_en?: string | null;
  content_es?: string | null;
  curatorialNote?: I18nValue;
  curatorialNote_en?: string | null;
  curatorialNote_es?: string | null;
  imageUrl?: string | null;
  bullets?: string[] | null;
  layout?: "split-right" | "split-left" | "full-width" | "cards";
}

export interface DbCollection {
  id: string;
  slug: string;
  title?: I18nValue;
  title_es?: string | null;
  title_en?: string | null;
  tagline?: I18nValue;
  tagline_es?: string | null;
  tagline_en?: string | null;
  manifest?: I18nValue;
  manifest_es?: string | null;
  manifest_en?: string | null;
  description?: I18nValue;
  description_es?: string | null;
  description_en?: string | null;
  cover_image?: string | null;
  logo_url?: string | null;
  video_url?: string | null;
  gallery_images?: string[] | null;
  editorial_blocks?: DbEditorialBlock[] | string | null;
  is_active: boolean;
  sort_order?: number | null;
  collection_products?: DbCollectionProduct[] | null;
}

// ==========================================
// HELPERS TIPADOS DE NORMALIZACIÓN
// ==========================================

function getCleanImageUrl(p?: Partial<DbProduct> | null): string | null {
  const rawUrl = p?.image_url || p?.image;
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (trimmed === "" || trimmed.includes("Showroom1")) return null;
  return trimmed;
}

function resolveI18nString(
  val: I18nValue,
  fallbackEn: string | null | undefined,
  fallbackEs: string | null | undefined,
  lang: string,
): string {
  if (typeof val === "object" && val !== null) {
    return val[lang] || val.es || val.en || fallbackEs || "";
  }
  if (typeof val === "string") {
    return val;
  }
  if (lang === "en") {
    return fallbackEn || fallbackEs || "";
  }
  return fallbackEs || "";
}

// ==========================================
// SERVER ACTION: CATÁLOGO ACTIVO
// ==========================================

export async function getActiveCollectionsAction(
  lang: string = "es",
): Promise<CollectionItem[]> {
  try {
    // Lectura cacheada (ver src/lib/data/public.ts)
    const { data: collectionsData, error } = await getCollectionsCatalogRaw();

    if (error) {
      console.error("Error cargando colecciones:", error.message);
      return [];
    }

    const rawCollections = (collectionsData as unknown as DbCollection[]) || [];

    return rawCollections.map((col): CollectionItem => {
      const rawProducts = col.collection_products || [];
      const sortedProducts = [...rawProducts].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
      );

      const materials: MaterialItem[] = sortedProducts
        .map((cp): MaterialItem | null => {
          const p = Array.isArray(cp.products) ? cp.products[0] : cp.products;
          if (!p || !p.sku) return null;

          const rawStatus = (p.status || "active").toLowerCase().trim();
          if (
            rawStatus === "inactive" ||
            rawStatus === "inactivo" ||
            rawStatus === "draft" ||
            rawStatus === "borrador" ||
            rawStatus === "archived"
          ) {
            return null;
          }

          const desc = resolveI18nString(
            p.description_i18n,
            p.description_en,
            p.description,
            lang,
          );

          const productName =
            p.product_name || p.name || p.title || p.aka || p.sku || "Material";

          const renders: MaterialRender[] = (p.material_renders || []).map(
            (r): MaterialRender => ({
              id: r.id,
              product_sku: r.product_sku,
              render_url: r.render_url,
              application: r.application,
              sort_order: r.sort_order ?? undefined,
            }),
          );

          // ✦ Resolución estricta de usos según el idioma solicitado
          let resolvedUses: string[] = [];
          if (lang === "en") {
            if (Array.isArray(p.uses_en) && p.uses_en.length > 0) {
              resolvedUses = p.uses_en;
            } else if (Array.isArray(p.uses)) {
              resolvedUses = p.uses;
            }
          } else {
            resolvedUses = Array.isArray(p.uses) ? p.uses : [];
          }

          return {
            id: p.sku,
            sku: p.sku,
            name: productName,
            aka: p.aka || null,
            category: p.category || "Otros",
            stone_type: p.stone_type || null,
            type: p.type || "SLAB",
            kind: p.kind || "Stock",
            origin: p.origin || "Internacional",
            status: p.status || "active",
            description: desc,
            image: getCleanImageUrl(p),
            formats: Array.isArray(p.formats) ? p.formats : [],
            finishes: Array.isArray(p.finishes) ? p.finishes : [],
            uses: resolvedUses,
            renders,
          };
        })
        .filter((item): item is MaterialItem => item !== null);

      let parsedBlocks: DbEditorialBlock[] = [];
      if (Array.isArray(col.editorial_blocks)) {
        parsedBlocks = col.editorial_blocks;
      } else if (typeof col.editorial_blocks === "string") {
        try {
          parsedBlocks = JSON.parse(col.editorial_blocks || "[]");
        } catch {
          parsedBlocks = [];
        }
      }

      const editorial_blocks: EditorialBlock[] = parsedBlocks.map(
        (b): EditorialBlock => ({
          id: b.id,
          title: resolveI18nString(b.title, b.title_en, b.title_es, lang),
          subtitle: resolveI18nString(
            b.subtitle,
            b.subtitle_en,
            b.subtitle_es,
            lang,
          ),
          content: resolveI18nString(
            b.content,
            b.content_en,
            b.content_es,
            lang,
          ),
          curatorialNote: resolveI18nString(
            b.curatorialNote,
            b.curatorialNote_en,
            b.curatorialNote_es,
            lang,
          ),
          imageUrl: b.imageUrl || "",
          bullets: Array.isArray(b.bullets) ? b.bullets : [],
          layout: b.layout,
        }),
      );

      const title = resolveI18nString(
        col.title,
        col.title_en,
        col.title_es,
        lang,
      );
      const tagline = resolveI18nString(
        col.tagline,
        col.tagline_en,
        col.tagline_es,
        lang,
      );
      const manifest = resolveI18nString(
        col.manifest,
        col.manifest_en,
        col.manifest_es,
        lang,
      );
      const description = resolveI18nString(
        col.description,
        col.description_en,
        col.description_es,
        lang,
      );

      return {
        id: col.id,
        slug: col.slug,
        title: title || col.title_es || col.title_en || "Colección",
        tagline: tagline || null,
        manifest: manifest || null,
        description: description || null,
        cover_image: col.cover_image || null,
        logo_url: col.logo_url || null,
        video_url: col.video_url || null,
        gallery_images: Array.isArray(col.gallery_images)
          ? col.gallery_images
          : [],
        is_active: col.is_active,
        sort_order: col.sort_order || 0,
        materials,
        editorial_blocks,
      };
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error en getActiveCollectionsAction";
    console.error(message);
    return [];
  }
}
