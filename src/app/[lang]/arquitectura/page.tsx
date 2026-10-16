import type { Metadata } from "next";
import { getDictionary } from "@/app/dictionaries";
import { getActiveProjects } from "@/lib/data/public";
import ArchitectureClient from "@/components/pages/Arquitectura/ArchitectureClient";
import { ROUTES } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: "es" | "en" }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isEs = lang === "es";

  const currentSlug = ROUTES.arquitectura[lang];
  const esSlug = ROUTES.arquitectura.es;
  const enSlug = ROUTES.arquitectura.en;

  return {
    title: isEs
      ? "De la Intención a la Materia | Obras y Aplicaciones Arquitectónicas"
      : "From Architectural Intent to Matter | Landmark Works & Bespoke Craft",
    description: isEs
      ? "Proyectos residenciales, hospitalidad y desarrollos emblemáticos intervenidos con materia natural: St. Regis Costa Mujeres, Amanvari Los Cabos, Maena y residencias privadas."
      : "High-end residential and luxury hospitality projects crafted with natural stone and fine timber: St. Regis, Amanvari, and bespoke private estates.",
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esSlug}`,
        "en-US": `${SITE_URL}/${enSlug}`,
        "x-default": `${SITE_URL}/${esSlug}`,
      },
    },
    openGraph: {
      title: isEs
        ? "Arquitectura y Proyectos | MAYA"
        : "Architecture & Landmark Projects | MAYA",
      description: isEs
        ? "Donde la precisión constructiva y los materiales naturales sostienen una estética duradera."
        : "Where architectural precision and authentic natural materials sustain lasting permanence.",
      url: `${SITE_URL}/${currentSlug}`,
    },
  };
}

export default async function ArchitecturePage({ params }: Props) {
  const { lang } = await params;
  const [dict, projects] = await Promise.all([
    getDictionary(lang),
    getActiveProjects(),
  ]);

  return (
    <ArchitectureClient
      projects={projects || []}
      lang={lang}
      dict={dict.architecture}
    />
  );
}
