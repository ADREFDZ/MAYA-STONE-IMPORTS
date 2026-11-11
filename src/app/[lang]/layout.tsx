import type { Metadata } from "next";
import localFont from "next/font/local";
import LanguageTransitionOverlay from "@/components/ui/LanguageTransitionOverlay";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import MetaPixel from "@/components/analytics/MetaPixel";
import Analytics from "@/components/analytics/Analytics";
import { Suspense } from "react";
import CookieConsentBanner from "@/components/ui/CookieConsentBanner";
import CatalogPopup from "@/components/ui/CatalogPopup";
import { getCatalogLinks } from "@/lib/data/public";
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
  const { seo } = await getDictionary(lang);

  return {
    metadataBase: new URL(SITE_URL),
    // Canonical y hreflang se definen en cada página (cada ruta tiene slug
    // propio por idioma); aquí no se declaran para no heredar valores erróneos.
    title: {
      default: seo.site.title,
      template: "%s | MAYA",
    },
    description: seo.site.description,
    keywords: seo.site.keywords,
    authors: [{ name: "MAYA", url: SITE_URL }],
    creator: "MAYA Stone Imports",
    publisher: "MAYA Stone Imports",
    openGraph: {
      siteName: "MAYA",
      locale: isEs ? "es_MX" : "en_US",
      type: "website",
      url: isEs ? `${SITE_URL}/` : `${SITE_URL}/en`,
      title: seo.site.title,
      description: seo.site.og_description,
      images: [
        {
          url: "/images/og-main.jpg",
          width: 1200,
          height: 630,
          alt: seo.site.og_image_alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.site.title,
      description: seo.site.twitter_description,
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
  const catalogs = await getCatalogLinks();

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
        {/* Aviso de catálogos (correo o WhatsApp) en momentos puntuales */}
        <CatalogPopup
          lang={lang}
          dict={dict.collection_page.catalog_popup}
          catalogs={catalogs}
          whatsappNumber={dict.contact.cards.whatsapp_number}
        />
        {/* Meta Pixel: solo se carga si el usuario acepta cookies */}
        <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        {/* GA4 + Clarity (mapas de calor): solo con consentimiento */}
        <Suspense fallback={null}>
          <Analytics
            gaId={process.env.NEXT_PUBLIC_GA_ID}
            clarityId={process.env.NEXT_PUBLIC_CLARITY_ID}
          />
        </Suspense>
      </body>
    </html>
  );
}
