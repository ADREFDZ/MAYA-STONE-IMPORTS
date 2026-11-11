import type { Metadata } from "next";
import { getDictionary } from "@/app/dictionaries";
import ContactClient from "@/components/pages/Contact/ContactClient";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import { getContactCollections } from "@/lib/data/public";
import { toTitleCase } from "@/lib/utils/strings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: "es" | "en" }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const { seo } = await getDictionary(lang);

  const currentSlug = ROUTES.contacto[lang];
  const esSlug = ROUTES.contacto.es;
  const enSlug = ROUTES.contacto.en;

  return {
    title: seo.contact.title,
    description: seo.contact.description,
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esSlug}`,
        "en-US": `${SITE_URL}/${enSlug}`,
        "x-default": `${SITE_URL}/${esSlug}`,
      },
    },
    openGraph: {
      title: seo.contact.og_title,
      description: seo.contact.og_description,
      url: `${SITE_URL}/${currentSlug}`,
    },
  };
}

export default async function ContactoPage({ params }: Props) {
  const { lang } = await params;
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const [dict, rawCollections] = await Promise.all([
    getDictionary(currentLocale),
    getContactCollections(),
  ]);

  // Cada colección activa aparece sola en "Línea de interés" (valor = slug)
  const collections = rawCollections
    .filter((c) => c.slug)
    .map((c) => ({
      value: c.slug as string,
      label: toTitleCase(
        (currentLocale === "en" ? c.title_en || c.title_es : c.title_es) ||
          c.slug,
      ),
    }));

  return (
    <main className="w-full min-h-screen bg-background text-black-neutral font-sans selection:bg-accent selection:text-white overflow-x-clip">
      <ContactClient
        lang={currentLocale}
        dict={dict.contact}
        collections={collections}
      />
    </main>
  );
}
