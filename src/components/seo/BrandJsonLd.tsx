import type { Locale } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

export default function BrandJsonLd({ lang }: { lang: Locale }) {
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
    description: isEs
      ? "Grupo de estudios dedicados a la curaduría de la materia: mármoles, cuarcitas, travertinos, granitos y maderas nobles para la arquitectura y el interiorismo."
      : "A collective of studios dedicated to the curation of natural matter: marble, quartzite, travertine, granite, and noble timber for architecture and interior design.",
    slogan: isEs
      ? "Naturaleza redefinida como objeto de diseño."
      : "Nature redefined as a design object.",
    telephone: "+52 477 854 4033",
    email: "hola@gpomaya.com",
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
    knowsAbout: isEs
      ? [
          "Superficies naturales para arquitectura",
          "Curaduría de piedra natural",
          "Mármoles y cuarcitas de origen",
          "Travertino de alta gama",
          "Maderas nobles para interiorismo",
          "Mármol de alta gama en México",
          "Cuarcitas importadas",
          "Interiorismo de lujo",
        ]
      : [
          "Natural surfaces for architecture",
          "Natural stone curation",
          "Marble and quartzite sourcing",
          "High-end travertine",
          "Fine hardwoods for interior design",
          "Luxury marble in Mexico",
          "Imported quartzite",
          "Luxury interior design",
        ],
    inLanguage: isEs ? "es-MX" : "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
