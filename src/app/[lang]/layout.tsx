import type { Metadata } from "next";
import localFont from "next/font/local";
import LanguageTransitionOverlay from "@/components/ui/LanguageTransitionOverlay";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import MetaPixel from "@/components/analytics/MetaPixel";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import { getDictionary } from "../dictionaries";
import type { Locale } from "@/lib/i18n/routes";
import "../globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

const graphik = localFont({
  src: [
    {
      path: "../../../public/fonts/Graphik-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Graphik-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Graphik-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-graphik",
});

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const lang: Locale = resolvedParams?.lang === "en" ? "en" : "es";
  const isEs = lang === "es";

  return {
    metadataBase: new URL(SITE_URL),
    // Canonical y hreflang se definen en cada página (cada ruta tiene slug
    // propio por idioma); aquí no se declaran para no heredar valores erróneos.
    title: {
      default: isEs
        ? "MAYA | Naturaleza Redefinida como Objeto de Diseño"
        : "MAYA | Nature Redefined as a Design Object",
      template: "%s | MAYA",
    },
    description: isEs
      ? "Grupo de estudios dedicados a la curaduría honesta de la materia. Mármoles, cuarcitas, travertinos y maderas nobles que dotan a la arquitectura de intimidad, permanencia y tiempo profundo."
      : "A collective of studios dedicated to the honest curation of natural matter. Marbles, quartzites, travertines, and fine hardwoods endowing architecture with intimacy, permanence, and deep time.",
    keywords: isEs
      ? [
          "Superficies naturales para arquitectura",
          "Curaduría de piedra natural",
          "Curaduría honesta de la tierra",
          "Materia natural para arquitectura",
          "Mármoles y cuarcitas de origen",
          "Travertino de alta gama",
          "Maderas nobles para interiorismo",
          "Superficies arquitectónicas con permanencia",
          "Mármol de alta gama México",
          "Cuarcitas importadas",
          "Interiorismo de lujo",
          "MAYA Stone Imports",
          "Naturaleza redefinida como objeto de diseño",
          "Grupo MAYA",
        ]
      : [
          "Natural surfaces for architecture",
          "Natural stone curation",
          "Luxury imported marble",
          "Exotic quartzite slabs",
          "High-end interior design",
          "MAYA Stone Imports",
          "Nature redefined as a design object",
          "Honest curation of the Earth",
          "Natural matter for architecture",
          "Curated marble and quartzite slabs",
          "Architectural travertine",
          "Fine hardwoods for interior design",
          "Contemplative architectural surfaces",
          "MAYA Group",
        ],
    authors: [{ name: "MAYA", url: SITE_URL }],
    creator: "MAYA Stone Imports",
    publisher: "MAYA Stone Imports",
    openGraph: {
      siteName: "MAYA",
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
      url: isEs ? `${SITE_URL}/` : `${SITE_URL}/en`,
      title: isEs
        ? "MAYA | Naturaleza Redefinida como Objeto de Diseño"
        : "MAYA | Nature Redefined as a Design Object",
      description: isEs
        ? "Un contrapunto a la réplica artificial: superficies minerales y maderas seleccionadas como cápsulas del tiempo geológico."
        : "A counterpoint to artificial replicas: mineral surfaces and noble timber curated as geological time capsules.",
      images: [
        {
          url: "/images/og-main.jpg",
          width: 1200,
          height: 630,
          alt: "MAYA Stone Imports",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isEs
        ? "MAYA | Naturaleza Redefinida como Objeto de Diseño"
        : "MAYA | Nature Redefined as a Design Object",
      description: isEs
        ? "La naturaleza crea el material. La arquitectura le da significado. MAYA conecta ambos mundos."
        : "Nature creates the material. Architecture gives it meaning. MAYA bridges both worlds.",
      images: ["/images/og-main.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const resolvedParams = await params;
  const lang: Locale = resolvedParams?.lang === "en" ? "en" : "es";
  const dict = await getDictionary(lang);

  return (
    <html
      lang={lang}
      className={`${graphik.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-background">
        <LanguageTransitionOverlay />
        <Header dict={dict.navbar} lang={lang} />
        <main className="grow">{children}</main>
        <Footer dict={dict.footer} lang={lang} />
        <CookieConsentBanner lang={lang} dict={dict.cookie_consent} />
        {/* Meta Pixel: solo se carga si el usuario acepta cookies */}
        <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
      </body>
    </html>
  );
}
