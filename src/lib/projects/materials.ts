import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { slugify } from "@/lib/utils/strings";

/** Material de MAYA usado en un proyecto (resuelto a partir de su SKU). */
export interface ProjectMaterial {
  sku: string;
  name: string;
  image: string | null;
  stone_type: string | null;
  origin: string | null;
  collection: { slug: string; title_es: string | null; title_en: string | null } | null;
}

/** Enlace a la ficha del material dentro de su colección. */
export function projectMaterialHref(lang: string, m: ProjectMaterial): string | null {
  if (!m.collection?.slug) return null;
  const locale: Locale = lang === "en" ? "en" : "es";
  return `/${ROUTES.coleccion[locale]}/${m.collection.slug}?material=${slugify(m.name)}`;
}

export function projectMaterialCollectionTitle(lang: string, m: ProjectMaterial) {
  if (!m.collection) return null;
  return (lang === "en" ? m.collection.title_en : m.collection.title_es) || m.collection.title_es || m.collection.slug;
}
