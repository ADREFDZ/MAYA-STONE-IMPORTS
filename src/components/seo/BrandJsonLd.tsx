import type { Locale } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

interface BrandJsonLdProps {
  lang: Locale;
  dict: {
    description: string;
    slogan: string;
    knows_about: string[];
  };
}

export default function BrandJsonLd({ lang, dict }: BrandJsonLdProps) {
  const isEs = lang === "es";

  const schema = {
    "@context": "https://schema.org",
    // Store (subtipo de LocalBusiness): showroom físico con horario y dirección
    "@type": "Store",
    "@id": `${SITE_URL}/#organization`,
    name: "MAYA",
    legalName: "MAYA Stone Imports",
    url: SITE_URL,
    logo: `${SITE_URL}/images/MAYA_LOGOTIPO_LIGHT.png`,
    image: `${SITE_URL}/images/og-main.jpg`,
    description: dict.description,
    slogan: dict.slogan,
    telephone: "+52 477 704 0874",
    email: "info@gpomaya.com",
    priceRange: "$$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Blvrd Francisco Villa 4602-Bodega A4, Leon I",
      addressLocality: "León",
      addressRegion: "Guanajuato",
      postalCode: "37235",
      addressCountry: "MX",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 21.1455128,
      longitude: -101.634853,
    },
    hasMap: "https://maps.app.goo.gl/y5f7Qx2M6tXgK8Vb8",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    sameAs: ["https://www.instagram.com/gpo.maya"],
    knowsAbout: dict.knows_about,
    inLanguage: isEs ? "es-MX" : "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // "<" escapado: un texto con "</script>" no puede romper la etiqueta
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
