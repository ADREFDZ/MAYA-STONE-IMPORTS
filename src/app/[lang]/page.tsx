import type { Metadata } from "next";
import { getHomeData, pickRandomVariations } from "@/lib/data/public";
import { getDictionary } from "../dictionaries";
import Hero from "@/components/sections/Hero/Hero";
import Philosophy from "@/components/sections/Philosophy/Philosophy";
import Collection from "@/components/sections/Collection/Collection";
import CollectionsBento from "@/components/sections/Collection/CollectionsBento";
import ProjectsSection from "@/components/sections/Projects/ProjectsSection";
import BespokeSection from "@/components/sections/Bespoke/BespokeSection";
import InstagramFeed from "@/components/sections/Instagram/InstagramFeed";
import FinalCTA from "@/components/sections/CTA/FinalCTA";
import BrandJsonLd from "@/components/seo/BrandJsonLd";

// Se renderiza en cada visita para que las variaciones cambien (los datos
// de Supabase siguen cacheados en src/lib/data/public.ts).
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

interface PageProps {
  params: Promise<{ lang: "es" | "en" }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const isEs = lang === "es";
  const homeUrl = isEs ? `${SITE_URL}/` : `${SITE_URL}/en`;

  const brandTitle = isEs
    ? "MAYA | Naturaleza Redefinida como Objeto de Diseño"
    : "MAYA | Nature Redefined as a Design Object";

  const brandDescription = isEs
    ? "No despachamos materiales; acompañamos al profesional del diseño en el hallazgo de superficies que dotan al espacio de alma y permanencia."
    : "We don't dispatch materials; we accompany design professionals in finding surfaces that give architecture soul and permanence.";

  return {
    title: {
      absolute: brandTitle,
    },
    description: brandDescription,
    alternates: {
      canonical: homeUrl,
      languages: {
        "es-MX": `${SITE_URL}/`,
        "en-US": `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/`,
      },
    },
    openGraph: {
      title: brandTitle,
      description: brandDescription,
      url: homeUrl,
      images: [
        {
          url: "/images/og-main.jpg",
          width: 1200,
          height: 630,
          alt: brandTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandTitle,
      description: brandDescription,
      images: ["/images/og-main.jpg"],
    },
  };
}

export default async function Home({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const { finishes, hero, variationPool, bentoCollections, homeProjects } =
    await getHomeData();
  // 4 variaciones distintas en cada visita (el destacado nunca cambia)
  const related = pickRandomVariations(variationPool, 4);

  return (
    <div className="w-full bg-background selection:bg-accent selection:text-white">
      <BrandJsonLd lang={lang} />
      <Hero key={`hero-${lang}`} dict={dict.hero} lang={lang} />
      <Philosophy
        dict={dict.philosophy}
        lang={lang}
      />
      <Collection
        dict={dict.collection}
        lang={lang}
        initialHero={hero}
        initialRelated={related}
      />
      <CollectionsBento
        dict={dict.categories_bento}
        lang={lang}
        collections={bentoCollections}
      />
      <BespokeSection
        lang={lang}
        finishes={finishes}
        dict={dict.bespoke}
      />
      <ProjectsSection
        lang={lang}
        projects={homeProjects}
        dict={dict.projects}
      />
      <InstagramFeed
        dict={dict.instagram}
      />
      <FinalCTA key={`cta-${lang}`} dict={dict.final_cta} lang={lang} />
    </div>
  );
}
