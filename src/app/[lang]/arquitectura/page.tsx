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
  const { seo } = await getDictionary(lang);

  const currentSlug = ROUTES.arquitectura[lang];
  const esSlug = ROUTES.arquitectura.es;
  const enSlug = ROUTES.arquitectura.en;

  return {
    title: seo.architecture.title,
    description: seo.architecture.description,
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esSlug}`,
        "en-US": `${SITE_URL}/${enSlug}`,
        "x-default": `${SITE_URL}/${esSlug}`,
      },
    },
    openGraph: {
      title: seo.architecture.og_title,
      description: seo.architecture.og_description,
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
