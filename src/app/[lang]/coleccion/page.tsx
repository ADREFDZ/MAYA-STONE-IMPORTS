import type { Metadata } from "next";
import { getDictionary } from "@/app/dictionaries";
import { getActiveCollectionsAction, type MaterialItem } from "./actions";
import CollectionCatalog from "@/components/pages/Collection/CollectionCatalog";
import { ROUTES } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanAndDecode(str: string): string {
  try {
    return decodeURIComponent(str.replace(/\+/g, " ")).trim();
  } catch {
    return str.trim();
  }
}

function slugify(text: string): string {
  return cleanAndDecode(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatEditorialName(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function findMaterialMatch(
  materials: MaterialItem[],
  query: string,
): MaterialItem | null {
  if (!query || !materials || materials.length === 0) return null;
  const decodedQuery = cleanAndDecode(query).toLowerCase();
  const querySlug = slugify(decodedQuery);
  const queryTokens = querySlug.split("-").filter(Boolean);

  if (queryTokens.length === 0) return null;

  for (const m of materials) {
    if (
      m.sku?.toLowerCase() === decodedQuery ||
      m.id?.toLowerCase() === decodedQuery
    )
      return m;
    const akaSlug = m.aka ? slugify(m.aka) : "";
    const nameSlug = m.name ? slugify(m.name) : "";
    if (akaSlug === querySlug || nameSlug === querySlug) return m;
  }

  for (const m of materials) {
    const akaSlug = m.aka ? slugify(m.aka) : "";
    const nameSlug = m.name ? slugify(m.name) : "";
    if (akaSlug && (akaSlug.includes(querySlug) || querySlug.includes(akaSlug)))
      return m;
    if (
      nameSlug &&
      (nameSlug.includes(querySlug) || querySlug.includes(nameSlug))
    )
      return m;
  }

  let bestMatch: MaterialItem | null = null;
  let highestScore = 0;

  for (const m of materials) {
    const akaTokens = m.aka ? slugify(m.aka).split("-").filter(Boolean) : [];
    const nameTokens = m.name ? slugify(m.name).split("-").filter(Boolean) : [];
    const allTokens = new Set([...akaTokens, ...nameTokens]);

    let matchedCount = 0;
    for (const token of queryTokens) {
      if (allTokens.has(token)) {
        matchedCount++;
      }
    }

    if (matchedCount > highestScore) {
      highestScore = matchedCount;
      bestMatch = m;
    }
  }

  if (highestScore > 0 && bestMatch) {
    return bestMatch;
  }

  return null;
}

interface ColeccionPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ColeccionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as "es" | "en";
  const isEs = lang === "es";

  const currentSlug = ROUTES.coleccion[lang];
  const esSlug = ROUTES.coleccion.es;
  const enSlug = ROUTES.coleccion.en;

  const rawMaterial = resolvedSearchParams?.material;
  const materialQuery =
    typeof rawMaterial === "string"
      ? rawMaterial.trim()
      : Array.isArray(rawMaterial)
        ? rawMaterial[0]?.trim()
        : null;

  // 1. SI SE CONSULTA UN MATERIAL EN EL CATÁLOGO GENERAL
  if (materialQuery) {
    const collections = await getActiveCollectionsAction(lang);

    for (const col of collections) {
      const selectedMat = findMaterialMatch(col.materials || [], materialQuery);

      if (selectedMat) {
        const matTitle = selectedMat.aka || selectedMat.name;
        const formattedColTitle = formatEditorialName(col.title);
        const title = isEs
          ? `${matTitle} · Colección ${formattedColTitle}`
          : `${matTitle} · ${formattedColTitle} Collection`;

        const categoryText = selectedMat.category
          ? selectedMat.category.toLowerCase()
          : isEs
            ? "piedra natural"
            : "natural stone";
        const originText = selectedMat.origin ? ` (${selectedMat.origin})` : "";

        const description =
          selectedMat.description ||
          (isEs
            ? `${matTitle}, ${categoryText}${originText}. Superficie natural curada para arquitectura y diseño de alta permanencia.`
            : `${matTitle}, curated ${categoryText}${originText}. Natural architectural surface selected for enduring permanence.`);

        const fullCanonical = `${SITE_URL}/${currentSlug}?material=${materialQuery}`;
        const matImage =
          selectedMat.image || col.cover_image || "/images/og-main.jpg";

        return {
          title,
          description,
          alternates: {
            canonical: fullCanonical,
            languages: {
              "es-MX": `${SITE_URL}/${esSlug}?material=${materialQuery}`,
              "en-US": `${SITE_URL}/${enSlug}?material=${materialQuery}`,
              "x-default": `${SITE_URL}/${esSlug}?material=${materialQuery}`,
            },
          },
          openGraph: {
            title: `${title} | MAYA`,
            description,
            url: fullCanonical,
            images: [
              {
                url: matImage,
                width: 1200,
                height: 630,
                alt: `${matTitle} · MAYA`,
              },
            ],
          },
          twitter: {
            card: "summary_large_image",
            title: `${title} | MAYA`,
            description,
            images: [matImage],
          },
        };
      }
    }
  }

  // 2. METADATOS GENERALES DEL CATÁLOGO COMPLETO
  const title = isEs
    ? "Curaduría de la Materia · Piedras Naturales y Maderas Nobles"
    : "Curation of Matter · Natural Stone & Fine Hardwoods";

  const description = isEs
    ? "Catálogo editorial de mármoles, cuarcitas, travertinos y maderas curadas por su narrativa geológica y permanencia en la arquitectura contemporánea."
    : "Editorial archive of marble, quartzite, travertine, and fine hardwoods curated for architectural permanence and geological presence.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esSlug}`,
        "en-US": `${SITE_URL}/${enSlug}`,
        "x-default": `${SITE_URL}/${esSlug}`,
      },
    },
    openGraph: {
      title: `${title} | MAYA`,
      description,
      url: `${SITE_URL}/${currentSlug}`,
      images: [
        {
          url: "/images/og-main.jpg",
          width: 1200,
          height: 630,
          alt: "MAYA",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | MAYA`,
      description,
      images: ["/images/og-main.jpg"],
    },
  };
}

export default async function ColeccionPage({ params }: ColeccionPageProps) {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as "es" | "en";
  const dict = await getDictionary(lang);
  const collections = await getActiveCollectionsAction(lang);

  return (
    <CollectionCatalog collections={collections} lang={lang} dict={dict} />
  );
}
