import type { Metadata } from "next";
import { getDictionary } from "@/app/dictionaries";
import ContactClient from "@/components/pages/Contact/ContactClient";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: "es" | "en" }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isEs = lang === "es";

  const currentSlug = ROUTES.contacto[lang];
  const esSlug = ROUTES.contacto.es;
  const enSlug = ROUTES.contacto.en;

  return {
    title: isEs
      ? "Diálogo de Creador a Creador | Showroom y Asesoría Técnica"
      : "Creator-to-Creator Dialogue | Showroom & Material Consultation",
    description: isEs
      ? "Acompañamos a arquitectos y constructores en la especificación y suministro de materia natural. Agenda una cita en nuestro showroom o solicita curaduría para tu obra."
      : "We accompany architects and builders in the specification and supply of natural matter. Schedule a showroom visit or request bespoke curation.",
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esSlug}`,
        "en-US": `${SITE_URL}/${enSlug}`,
        "x-default": `${SITE_URL}/${esSlug}`,
      },
    },
    openGraph: {
      title: isEs ? "Contacto y Showroom | MAYA" : "Contact & Showroom | MAYA",
      description: isEs
        ? "Un espacio de pensamiento y certeza técnica para transformar ideas en refugios con identidad."
        : "A space of architectural thought and technical certainty to turn ideas into timeless sanctuaries.",
      url: `${SITE_URL}/${currentSlug}`,
    },
  };
}

export default async function ContactoPage({ params }: Props) {
  const { lang } = await params;
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const dict = await getDictionary(currentLocale);

  return (
    <main className="w-full min-h-screen bg-background text-black-neutral font-sans selection:bg-accent selection:text-white overflow-x-clip">
      <ContactClient lang={currentLocale} dict={dict.contact} />
    </main>
  );
}
