import type { Metadata } from "next";
import { getDictionary } from "@/app/dictionaries";
import AboutHero from "@/components/pages/About/AboutHero";
import AboutEsencia from "@/components/pages/About/AboutEsencia";
import AboutManifiesto from "@/components/pages/About/AboutManifiesto";
import AboutPilares from "@/components/pages/About/AboutPilares";
import AboutCTA from "@/components/pages/About/AboutCTA";
import EditorialGallery from "@/components/ui/EditorialGallery";
import { ROUTES } from "@/lib/i18n/routes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const lang = (resolvedParams?.lang === "en" ? "en" : "es") as "es" | "en";
  const isEs = lang === "es";

  const currentSlug = ROUTES.about[lang];
  const esSlug = ROUTES.about.es;
  const enSlug = ROUTES.about.en;

  return {
    title: isEs
      ? "Nuestra Convicción y Manifiesto | Curaduría Honesta de la Tierra"
      : "Our Conviction & Manifesto | Honest Curation of the Earth",
    description: isEs
      ? "La arquitectura comienza mucho antes del edificio. Conoce la filosofía de MAYA: un ritmo de pensamiento lento que prioriza la permanencia sobre las modas efímeras."
      : "Architecture begins long before the building. Discover MAYA's philosophy: a deliberate, slow rhythm prioritizing permanence over ephemeral trends.",
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
        ? "Manifiesto y Filosofía | MAYA"
        : "Brand Manifesto & Philosophy | MAYA",
      description: isEs
        ? "No creemos en las verdades absolutas, creemos en lo que se sostiene cuando el brillo se apaga."
        : "We don't believe in absolute truths; we believe in what stands firm when the shine fades away.",
      url: `${SITE_URL}/${currentSlug}`,
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang === "en" ? "en" : "es";
  const dict = await getDictionary(lang);
  const t = dict.about;

  return (
    <main className="w-full bg-background text-text-primary min-h-screen font-sans overflow-x-clip selection:bg-accent selection:text-white">
      <AboutHero dict={t.hero} />
      <AboutEsencia dict={t.esencia} />
      <AboutManifiesto dict={t.manifesto} />
      <AboutPilares dict={t.pilares} />
      <EditorialGallery
        title={t.gallery?.title}
        subtitle={t.gallery?.subtitle}
      />
      <AboutCTA lang={lang} dict={t.cta} />
    </main>
  );
}
