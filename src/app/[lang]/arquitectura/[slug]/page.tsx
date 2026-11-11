import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProjectBySlug } from "@/lib/data/public";
import { ROUTES } from "@/lib/i18n/routes";
import { getI18n } from "@/lib/i18n/utils";
import ProjectJsonLd from "@/components/seo/ProjectJsonLd";
import Button from "@/components/ui/Button";
import { getDictionary } from "@/app/dictionaries";
import { fillTemplate } from "@/lib/utils/strings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gpomaya.com";

interface Props {
  params: Promise<{ lang: "es" | "en"; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = await getProjectBySlug(slug);
  const { seo } = await getDictionary(lang);

  if (!project) return { title: seo.project.not_found };

  const rawTitle = getI18n(project.title || project.title_es, lang);
  const rawLocation = getI18n(project.location, lang);
  const rawDesc = getI18n(
    project.description || project.description_es || project.short_description,
    lang,
  );

  const title = fillTemplate(seo.project.title, { project: rawTitle });

  const description =
    rawDesc ||
    fillTemplate(seo.project.description_fallback, { location: rawLocation });

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

  // Diccionario tipado según el idioma
  const dict = (await import(`@/dictionaries/${lang}.json`)).default;
  const t = dict.project_detail;

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
    <main className="min-h-screen bg-background text-black-neutral selection:bg-accent selection:text-white font-sans overflow-x-clip">
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

      {/* Ancho máximo 1920px: en pantallas muy grandes las fotos no se amplían
          más allá de su resolución real (evita que se vean pixeladas). */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-[1920px] mx-auto min-h-screen items-start">
        {/* LADO IZQUIERDO: 50% VIEWPORT A SANGRE PURA */}
        <div className="relative w-full h-[60vh] sm:h-[75vh] max-h-[720px] lg:h-screen lg:max-h-[960px] lg:sticky lg:top-0 bg-black-neutral overflow-hidden">
          {project.cover_image ? (
            <Image
              src={project.cover_image}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, (max-width: 1920px) 50vw, 960px"
              quality={90}
              className="object-cover object-center scale-[1.01] transition-transform duration-1000 ease-out hover:scale-103"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-white/30 uppercase tracking-widest">
              {t.no_visual_record}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black-pure/75 via-black-pure/15 to-transparent pointer-events-none" />

          <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between pointer-events-none">
            <span className="font-mono text-maya-label uppercase tracking-data text-white/95 bg-black-pure/75 backdrop-blur-md px-3.5 py-1.5 border border-white/10 rounded-3xs">
              {category}
            </span>

            {location && (
              <span className="font-mono text-maya-label uppercase tracking-data text-white/80">
                {location}
              </span>
            )}
          </div>
        </div>

        {/* LADO DERECHO: DOSSIER EDITORIAL CON MÁRGENES DE MAYA */}
        <div className="w-full px-6 sm:px-10 lg:pl-16 lg:pr-14 xl:pl-20 xl:pr-20 pt-10 sm:pt-14 lg:pt-28 pb-20 sm:pb-28 space-y-12 sm:space-y-16">
          <div className="space-y-6">
            <div className="border-b border-border-light pb-4">
              <Link
                href={`/${ROUTES.arquitectura[lang]}`}
                className="group inline-flex items-center gap-2 font-mono text-maya-label uppercase tracking-data text-black-neutral/70 hover:text-black-neutral transition-colors"
              >
                <span className="text-accent-ink transition-transform duration-300 group-hover:-translate-x-1 font-semibold">
                  ←
                </span>
                <span className="font-medium">{t.back_button}</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
              <span>{category}</span>
              {location && (
                <>
                  <span className="text-black-neutral/30">/</span>
                  <span className="text-black-neutral/60 font-normal">
                    {location}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-sans font-light tracking-editorial text-maya-h1 sm:text-maya-display uppercase text-black-neutral leading-[1.02]">
              {title}
            </h1>

            {statement && (
              <div className="border-l-2 border-accent pl-5 sm:pl-7 py-1">
                <p className="font-serif italic text-maya-body sm:text-maya-body-lg text-black-neutral/85 leading-relaxed">
                  &ldquo;{statement}&rdquo;
                </p>
              </div>
            )}
          </div>

          {materialsList.length > 0 && (
            <div className="p-6 bg-surface rounded-2xs border border-border-light space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border-light pb-2 font-mono text-maya-label uppercase tracking-data">
                <span className="text-accent-ink font-semibold">
                  {t.materials_title}
                </span>
                <span className="text-black-neutral/40">
                  {materialsList.length} {t.materials_count}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {materialsList.map((mat: string, idx: number) => (
                  <span
                    key={idx}
                    className="font-mono text-maya-label uppercase tracking-data text-black-neutral bg-background border border-border-light px-3 py-1.5 rounded-3xs shadow-2xs"
                  >
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {description && (
            <section className="space-y-3">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                {t.memory_title}
              </span>

              <p className="font-sans text-maya-body sm:text-maya-body-lg text-black-neutral/80 font-light leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </section>
          )}

          {galleryImages.length > 0 && (
            <section className="space-y-6 pt-6 border-t border-border-light">
              <div className="flex items-center justify-between">
                <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 font-semibold">
                  {t.gallery_title}
                </span>
                <span className="font-mono text-maya-label text-black-neutral/40">
                  {galleryImages.length} {t.gallery_views}
                </span>
              </div>

              {/* Galería en 2 columnas en pantallas grandes (fotos más contenidas);
                  cada 3ª foto ocupa el ancho completo como pausa visual. */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
                {galleryImages.map((imgUrl: string, idx: number) => {
                  const isPanoramic = idx % 3 === 0;

                  return (
                    <div
                      key={idx}
                      className={`group relative w-full overflow-hidden rounded-2xs bg-black-neutral/5 border border-border-light shadow-2xs ${
                        isPanoramic
                          ? "aspect-16/10 xl:col-span-2"
                          : "aspect-4/3"
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`${title} · ${idx + 1}`}
                        fill
                        sizes={
                          isPanoramic
                            ? "(max-width: 1024px) 100vw, (max-width: 1920px) 45vw, 860px"
                            : "(max-width: 1024px) 100vw, (max-width: 1280px) 45vw, (max-width: 1920px) 22vw, 430px"
                        }
                        quality={90}
                        className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-104"
                      />

                      <div className="absolute bottom-3 right-3 z-10 font-mono text-[11px] text-white/80 bg-black-pure/60 backdrop-blur-md px-2 py-0.5 rounded-3xs border border-white/10 pointer-events-none">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA EDITORIAL DE ASESORÍA MATERIAL */}
          <div className="p-7 sm:p-8 bg-black-neutral text-gray-warm rounded-2xs border border-gray-warm/15 shadow-xl space-y-4">
            <div className="space-y-1.5">
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                {t.cta_eyebrow}
              </span>
              <p className="font-sans text-maya-h3 font-light uppercase tracking-editorial text-white leading-snug">
                {t.cta_title}
              </p>
            </div>

            <div className="pt-2">
              <Button
                href={`/${ROUTES.contacto[lang]}?reason=quote&project=${encodeURIComponent(title || slug)}`}
                variant="outline-light"
                size="md"
                icon={<span>→</span>}
                iconPosition="right"
                fullWidth
                className="hover:border-accent hover:text-white transition-colors"
              >
                {t.cta_button}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
