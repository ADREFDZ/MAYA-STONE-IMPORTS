import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import { getActiveCollectionsAction, type MaterialItem } from "../actions";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import CollectionSection from "@/components/pages/Collection/CollectionSection";
import CollectionCTA from "@/components/pages/Collection/CollectionCTA";
import CollectionJsonLd from "@/components/seo/CollectionJsonLd";
import Button from "@/components/ui/Button";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

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

interface Props {
  params: Promise<{ lang: "es" | "en"; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const rawMaterial = resolvedSearchParams?.material;
  const materialQuery =
    typeof rawMaterial === "string"
      ? rawMaterial.trim()
      : Array.isArray(rawMaterial)
        ? rawMaterial[0]?.trim()
        : null;

  const collections = await getActiveCollectionsAction(lang);
  const cleanSlug = slugify(slug);

  const collection = collections.find(
    (c) =>
      slugify(c.slug || "") === cleanSlug ||
      slugify(c.title || "") === cleanSlug ||
      slugify((c as any).title_es || "") === cleanSlug ||
      slugify((c as any).title_en || "") === cleanSlug ||
      c.id?.toLowerCase() === cleanSlug,
  );

  if (!collection) return { title: "Colección no encontrada" };

  const isEs = lang === "es";
  const currentParent = ROUTES.coleccion[lang];
  const esParent = ROUTES.coleccion.es;
  const enParent = ROUTES.coleccion.en;
  const formattedColTitle = formatEditorialName(collection.title);

  if (materialQuery && collection.materials?.length) {
    const selectedMat = findMaterialMatch(collection.materials, materialQuery);

    if (selectedMat) {
      const matTitle = selectedMat.aka || selectedMat.name;
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

      const fullCanonical = `${SITE_URL}/${currentParent}/${collection.slug}?material=${materialQuery}`;
      const matImage =
        selectedMat.image || collection.cover_image || "/images/og-main.jpg";

      return {
        title,
        description,
        alternates: {
          canonical: fullCanonical,
          languages: {
            "es-MX": `${SITE_URL}/${esParent}/${collection.slug}?material=${materialQuery}`,
            "en-US": `${SITE_URL}/${enParent}/${collection.slug}?material=${materialQuery}`,
            "x-default": `${SITE_URL}/${esParent}/${collection.slug}?material=${materialQuery}`,
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

  const title = isEs
    ? `Colección ${formattedColTitle} · Curaduría de Materia`
    : `${formattedColTitle} Collection · Curation of Matter`;

  const sampleMaterials = (collection.materials || [])
    .slice(0, 4)
    .map((m) => m.aka || m.name)
    .join(", ");

  const description = isEs
    ? `Colección ${formattedColTitle}: ${sampleMaterials}. Materia natural seleccionada por su narrativa geológica, inercia térmica y permanencia estética.`
    : `${formattedColTitle} Collection: ${sampleMaterials}. Natural surfaces curated for geological narrative, thermal inertia, and timeless architecture.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${currentParent}/${collection.slug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esParent}/${collection.slug}`,
        "en-US": `${SITE_URL}/${enParent}/${collection.slug}`,
        "x-default": `${SITE_URL}/${esParent}/${collection.slug}`,
      },
    },
    openGraph: {
      title: `${title} | MAYA`,
      description,
      url: `${SITE_URL}/${currentParent}/${collection.slug}`,
      images: [
        {
          url: collection.cover_image || "/images/og-main.jpg",
          width: 1200,
          height: 630,
          alt: collection.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | MAYA`,
      description,
      images: [collection.cover_image || "/images/og-main.jpg"],
    },
  };
}

export default async function SingleCollectionPage({ params }: Props) {
  const { lang, slug } = await params;
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const dict = await getDictionary(currentLocale);
  const collections = await getActiveCollectionsAction(lang);
  const cleanSlug = slugify(slug);

  const collection = collections.find(
    (c) =>
      slugify(c.slug || "") === cleanSlug ||
      slugify(c.title || "") === cleanSlug ||
      slugify((c as any).title_es || "") === cleanSlug ||
      slugify((c as any).title_en || "") === cleanSlug ||
      c.id?.toLowerCase() === cleanSlug,
  );

  if (!collection) notFound();

  const collectionThemeSlug = slugify(
    collection.slug || collection.title || collection.id,
  );
  const themeClass = `theme-collection-${collectionThemeSlug}`;

  return (
    <main
      className={`min-h-screen pt-24 sm:pt-28 selection:bg-accent selection:text-white transition-colors duration-700 overflow-x-clip ${themeClass}`}
      style={{
        backgroundColor: "var(--col-bg, var(--color-surface))",
        color: "var(--col-text, var(--col-contrast, #252525))",
      }}
    >
      <CollectionJsonLd collection={collection} lang={currentLocale} />

      {/* ENLACE DE RETORNO EDITORIAL */}
      <div
        className="editorial-container pb-4 sm:pb-6 border-b transition-colors duration-500"
        style={{
          borderColor: "var(--col-border, rgba(255,255,255,0.15))",
        }}
      >
        <Button
          href={`/${ROUTES.coleccion[currentLocale]}`}
          variant="ghost"
          size="sm"
          icon={<span className="text-xs">←</span>}
          iconPosition="left"
          className="!font-mono !text-maya-label !tracking-data uppercase opacity-85 hover:opacity-100 transition-opacity"
          style={{
            color: "var(--col-text, var(--col-contrast, currentColor))",
          }}
        >
          {lang === "es"
            ? "Volver a Todas las Colecciones"
            : "Back to All Collections"}
        </Button>
      </div>

      <div className="editorial-container py-8 sm:py-12 lg:py-16">
        <CollectionSection
          collection={collection}
          lang={lang}
          index={0}
          dict={dict}
        />
      </div>

      <CollectionCTA dict={dict} lang={lang} />
    </main>
  );
}
