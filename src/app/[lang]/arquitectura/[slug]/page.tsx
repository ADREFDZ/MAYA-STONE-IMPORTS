import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProjectBySlug } from "@/lib/data/public";
import { ROUTES } from "@/lib/i18n/routes";
import { getI18n } from "@/lib/i18n/utils";
import ProjectJsonLd from "@/components/seo/ProjectJsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

interface Props {
  params: Promise<{ lang: "es" | "en"; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return { title: "Obra no encontrada" };

  const isEs = lang === "es";
  const rawTitle = getI18n(project.title || project.title_es, lang);
  const rawLocation = getI18n(project.location, lang);
  const rawDesc = getI18n(
    project.description || project.description_es || project.short_description,
    lang,
  );

  const title = isEs
    ? `${rawTitle} | Obra y Curaduría Arquitectónica`
    : `${rawTitle} | Architectural Landmark & Curation`;

  const description =
    rawDesc ||
    (isEs
      ? `Intervención arquitectónica en ${rawLocation} con materia natural curada por MAYA.`
      : `Architectural intervention in ${rawLocation} featuring natural matter curated by MAYA.`);

  const currentParent = ROUTES.arquitectura[lang];
  const esParent = ROUTES.arquitectura.es;
  const enParent = ROUTES.arquitectura.en;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${currentParent}/${slug}`,
      languages: {
        "es-MX": `${SITE_URL}/${esParent}/${slug}`,
        "en-US": `${SITE_URL}/${enParent}/${slug}`,
        "x-default": `${SITE_URL}/${esParent}/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${currentParent}/${slug}`,
      images: [
        {
          url: project.cover_image || "/images/og-main.jpg",
          width: 1200,
          height: 630,
          alt: rawTitle,
        },
      ],
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { lang, slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const title = getI18n(project.title || project.title_es, lang);
  const category = getI18n(project.category, lang);
  const location = getI18n(project.location, lang);
  const statement = getI18n(project.statement || project.statement_es, lang);
  const description = getI18n(
    project.description ||
      project.description_es ||
      project.short_description ||
      project.short_description_es,
    lang,
  );

  const galleryImages: string[] = Array.isArray(project.gallery)
    ? project.gallery
    : Array.isArray(project.gallery_images)
      ? project.gallery_images
      : [];

  const rawMaterials = Array.isArray(project.materials)
    ? project.materials
    : Array.isArray(project.material_skus)
      ? project.material_skus
      : [];

  const materialsList: string[] = rawMaterials.map((m: any) =>
    getI18n(m, lang),
  );

  return (
    <main className="min-h-screen bg-background text-black-neutral pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-24 selection:bg-accent selection:text-white font-sans overflow-x-clip">
      <ProjectJsonLd
        title={title}
        slug={slug}
        location={location || "México"}
        description={description}
        coverImage={project.cover_image || ""}
        galleryImages={galleryImages}
        materialsUsed={materialsList}
        lang={lang}
      />

      <div className="editorial-container space-y-8 sm:space-y-12">
        {/* RETORNO A ARQUITECTURA */}
        <div className="border-b border-border-light pb-4 sm:pb-5">
          <Link
            href={`/${ROUTES.arquitectura[lang]}`}
            className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 hover:text-black-neutral transition-colors inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>
              {lang === "es" ? "Volver a Arquitectura" : "Back to Architecture"}
            </span>
          </Link>
        </div>

        {/* CABECERA EDITORIAL */}
        <header className="space-y-4 sm:space-y-5 max-w-4xl">
          <div className="flex items-center gap-2.5 font-mono text-maya-label uppercase tracking-data">
            <span className="text-accent-ink font-semibold">{category}</span>
            {location && (
              <>
                <span className="text-black-neutral/30">/</span>
                <span className="text-black-neutral/60">{location}</span>
              </>
            )}
          </div>

          <h1 className="font-sans font-light tracking-editorial text-maya-h1 sm:text-maya-display uppercase text-black-neutral leading-[1.05]">
            {title}
          </h1>

          {statement && (
            <div className="border-l-2 border-accent pl-4 sm:pl-6 pt-1">
              <p className="font-serif italic text-maya-body sm:text-maya-body-lg text-black-neutral/80 leading-relaxed">
                &ldquo;{statement}&rdquo;
              </p>
            </div>
          )}
        </header>

        {/* FOTOGRAFÍA PRINCIPAL */}
        {project.cover_image && (
          <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden rounded-2xs bg-black-neutral/5 border border-border-light shadow-md">
            <Image
              src={project.cover_image}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}

        {/* NARRATIVA Y MATERIALES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start border-b border-border-light pb-12 sm:pb-16">
          <div className="lg:col-span-8 space-y-3">
            <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
              {lang === "es"
                ? "Memoria de Intervención"
                : "Intervention Record"}
            </span>
            {description && (
              <p className="font-sans text-maya-body sm:text-maya-body-lg text-black-neutral/80 font-light leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}
          </div>

          {materialsList.length > 0 && (
            <div className="lg:col-span-4 bg-surface p-5 sm:p-6 rounded-2xs border border-border-light space-y-3">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                {lang === "es"
                  ? "Materia Natural en Obra"
                  : "Natural Matter Applied"}
              </span>
              <div className="flex flex-wrap gap-2">
                {materialsList.map((mat: string, idx: number) => (
                  <span
                    key={idx}
                    className="font-mono text-maya-label uppercase tracking-data text-black-neutral bg-surface-secondary border border-border-light px-2.5 py-1 rounded-3xs shadow-2xs"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* REGISTRO FOTOGRÁFICO DE OBRA */}
        {galleryImages.length > 0 && (
          <section className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h2 className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 font-semibold">
                {lang === "es"
                  ? "Registro Fotográfico de Obra"
                  : "Project Gallery Record"}
              </h2>
              <span className="font-mono text-maya-label text-black-neutral/40">
                {galleryImages.length}{" "}
                {lang === "es" ? "Perspectivas" : "Views"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {galleryImages.map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  className="relative aspect-16/10 w-full overflow-hidden rounded-2xs bg-black-neutral/5 border border-border-light group shadow-xs"
                >
                  <Image
                    src={imgUrl}
                    alt={`${title} - Vista ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
