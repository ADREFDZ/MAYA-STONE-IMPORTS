import type { Locale } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

export interface ProjectSchemaProps {
  title: string;
  slug: string;
  location: string;
  description: string;
  coverImage: string;
  galleryImages?: string[];
  materialsUsed?: string[];
  lang: Locale;
}

export default function ProjectJsonLd({
  title,
  slug,
  location,
  description,
  coverImage,
  galleryImages = [],
  materialsUsed = [],
  lang,
}: ProjectSchemaProps) {
  const isEs = lang === "es";

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${SITE_URL}/arquitectura/${slug}#project`,
    name: title,
    headline: `${title} | Curaduría de Materia por MAYA`,
    description: description,
    image: [coverImage, ...galleryImages].filter(Boolean),
    inLanguage: isEs ? "es-MX" : "en-US",
    creator: {
      "@type": "Organization",
      name: "MAYA Stone Imports",
      url: SITE_URL,
    },
    contentLocation: {
      "@type": "Place",
      name: location,
    },
    keywords: [
      ...materialsUsed,
      "Curaduría de piedra natural",
      "Arquitectura de alta gama",
      "MAYA Stone Imports",
    ],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/arquitectura/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
