import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import { getActiveCollectionsAction, type MaterialItem } from "../actions";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import CollectionSection from "@/components/pages/Collection/CollectionSection";
import CollectionCTA from "@/components/pages/Collection/CollectionCTA";
import CollectionJsonLd from "@/components/seo/CollectionJsonLd";
import Button from "@/components/ui/Button";
import { fillTemplate } from "@/lib/utils/strings";

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

  const { seo } = await getDictionary(lang);

  if (!collection) return { title: seo.collection.not_found };

  const currentParent = ROUTES.coleccion[lang];
  const esParent = ROUTES.coleccion.es;
  const enParent = ROUTES.coleccion.en;
  const formattedColTitle = formatEditorialName(collection.title);

  if (materialQuery && collection.materials?.length) {
    const selectedMat = findMaterialMatch(collection.materials, materialQuery);

    if (selectedMat) {
      const matTitle = selectedMat.aka || selectedMat.name;
      const title = fillTemplate(seo.collection.material_title, {
        material: matTitle,
        collection: formattedColTitle,
      });

      const categoryText = selectedMat.category
        ? selectedMat.category.toLowerCase()
        : seo.collection.category_fallback;
      const originText = selectedMat.origin ? ` (${selectedMat.origin})` : "";

      const description =
        selectedMat.description ||
        fillTemplate(seo.collection.material_description, {
          material: matTitle,
          category: categoryText,
          origin: originText,
        });

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

  const title = fillTemplate(seo.collection.collection_title, {
    collection: formattedColTitle,
  });

  const sampleMaterials = (collection.materials || [])
    .slice(0, 4)
    .map((m) => m.aka || m.name)
    .join(", ");

  const description = fillTemplate(seo.collection.collection_description, {
    collection: formattedColTitle,
    materials: sampleMaterials,
  });

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
      className={`collection-surface min-h-screen pt-24 sm:pt-28 selection:bg-accent selection:text-white transition-colors duration-700 overflow-x-clip ${themeClass}`}
    >
      <CollectionJsonLd collection={collection} lang={currentLocale} />

      {/* ENLACE DE RETORNO EDITORIAL */}
      <div
        className="border-col-border editorial-container pb-4 sm:pb-6 border-b transition-colors duration-500"
      >
        <Button
          href={`/${ROUTES.coleccion[currentLocale]}`}
          variant="ghost"
          size="sm"
          icon={<span className="text-xs">←</span>}
          iconPosition="left"
          className="text-col-text !font-mono !text-maya-label !tracking-data uppercase opacity-85 hover:opacity-100 transition-opacity"
        >
          {dict.collection_page.back_to_all}
        </Button>
      </div>

      {/* CollectionSection maneja sus propios anchos (editorial / márgenes del header) */}
      <div className="py-8 sm:py-12 lg:py-16">
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
