import type { CollectionItem } from "@/app/[lang]/coleccion/actions";
import type { Locale } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

interface CollectionJsonLdProps {
  collection: CollectionItem;
  lang: Locale;
}

export default function CollectionJsonLd({
  collection,
  lang,
}: CollectionJsonLdProps) {
  const isEs = lang === "es";

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/coleccion/${collection.slug}#collection`,
    name: `${collection.title} | Curaduría de Materia Natural`,
    headline: collection.tagline || collection.title,
    description: collection.description || collection.manifest || "",
    url: `${SITE_URL}/coleccion/${collection.slug}`,
    image: collection.cover_image || undefined,
    inLanguage: isEs ? "es-MX" : "en-US",
    publisher: {
      "@type": "Organization",
      name: "MAYA",
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `Catálogo de ${collection.title}`,
      numberOfItems: collection.materials?.length || 0,
      itemListElement: (collection.materials || []).map((mat, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Product",
          name: mat.name,
          image: mat.image || collection.cover_image || undefined,
          description:
            mat.description ||
            `${mat.name} (${mat.category}). Origen: ${mat.origin}. Materia natural curada por MAYA.`,
          category: mat.category,
          countryOfOrigin: mat.origin,
          material: mat.stone_type || collection.title,
          offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "USD",
            price: "ContactForPrice",
            url: `${SITE_URL}/coleccion/${collection.slug}?material=${mat.sku}`,
          },
        },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
