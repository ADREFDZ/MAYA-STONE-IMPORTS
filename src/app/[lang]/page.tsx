import type { Metadata } from "next";
import { getHomeData } from "@/lib/data/public";
import { getDictionary } from "../dictionaries";
import Hero from "@/components/sections/Hero/Hero";
import Philosophy from "@/components/sections/Philosophy/Philosophy";
import Process from "@/components/sections/Process/Process";
import Collection from "@/components/sections/Collection/Collection";
import CollectionsBento from "@/components/sections/Collection/CollectionsBento";
import ProjectsSection from "@/components/sections/Projects/ProjectsSection";
import BespokeSection from "@/components/sections/Bespoke/BespokeSection";
import InstagramFeed from "@/components/sections/Instagram/InstagramFeed";
import FinalCTA from "@/components/sections/CTA/FinalCTA";
import BrandJsonLd from "@/components/seo/BrandJsonLd";

// Se renderiza en cada visita (los datos de Supabase siguen cacheados en
// src/lib/data/public.ts).
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
  const { seo } = await getDictionary(lang);

  const brandTitle = seo.home.title;
  const brandDescription = seo.home.description;

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
  const { finishes, hero, bentoCollections, homeProjects } =
    await getHomeData();

  return (
    <div className="w-full bg-background selection:bg-accent selection:text-white">
      <BrandJsonLd lang={lang} dict={dict.seo.brand} />
      <Hero key={`hero-${lang}`} dict={dict.hero} lang={lang} />
      <Philosophy
        dict={dict.philosophy}
        lang={lang}
      />
      <Process dict={dict.process} lang={lang} />
      <Collection
        dict={dict.collection}
        lang={lang}
        initialHero={hero}
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
