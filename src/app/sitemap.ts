import { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/data/public";
import { ROUTES } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

/** Construye la URL pública a partir de un slug ("" = home). */
function toUrl(slug: string) {
  return slug ? `${SITE_URL}/${slug}` : `${SITE_URL}/`;
}

/**
 * Genera DOS entradas (ES y EN) para la misma página, cada una con su
 * bloque hreflang completo, como recomienda Google para sitios bilingües.
 */
function bilingual(
  esSlug: string,
  enSlug: string,
  opts: {
    lastModified?: Date;
    changeFrequency: ChangeFrequency;
    priority: number;
  },
): MetadataRoute.Sitemap {
  const languages = {
    "es-MX": toUrl(esSlug),
    "en-US": toUrl(enSlug),
    "x-default": toUrl(esSlug),
  };
  const base = {
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    alternates: { languages },
  };
  return [
    { url: toUrl(esSlug), priority: opts.priority, ...base },
    { url: toUrl(enSlug), priority: Math.max(0.1, opts.priority - 0.1), ...base },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects, collections } = await getSitemapEntries();

  // 1. Páginas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    ...bilingual(ROUTES.home.es, ROUTES.home.en, {
      changeFrequency: "weekly",
      priority: 1.0,
    }),
    ...bilingual(ROUTES.coleccion.es, ROUTES.coleccion.en, {
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    ...bilingual(ROUTES.arquitectura.es, ROUTES.arquitectura.en, {
      changeFrequency: "weekly",
      priority: 0.9,
    }),
    ...bilingual(ROUTES.about.es, ROUTES.about.en, {
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...bilingual(ROUTES.contacto.es, ROUTES.contacto.en, {
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...bilingual(ROUTES.privacidad.es, ROUTES.privacidad.en, {
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    ...bilingual(ROUTES.terminos.es, ROUTES.terminos.en, {
      changeFrequency: "yearly",
      priority: 0.3,
    }),
    ...bilingual(ROUTES.cookies.es, ROUTES.cookies.en, {
      changeFrequency: "yearly",
      priority: 0.3,
    }),
  ];

  // 2. Colecciones (desde Supabase, cacheado)
  const collectionRoutes = collections.flatMap((c) =>
    bilingual(
      `${ROUTES.coleccion.es}/${c.slug}`,
      `${ROUTES.coleccion.en}/${c.slug}`,
      {
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ),
  );

  // 3. Proyectos de arquitectura
  const projectRoutes = projects.flatMap((p) =>
    bilingual(
      `${ROUTES.arquitectura.es}/${p.slug}`,
      `${ROUTES.arquitectura.en}/${p.slug}`,
      {
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ),
  );

  return [...staticRoutes, ...collectionRoutes, ...projectRoutes];
}
