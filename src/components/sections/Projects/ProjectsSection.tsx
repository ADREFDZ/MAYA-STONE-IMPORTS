import Link from "next/link";
import { getI18n } from "@/lib/i18n/utils";
import { cleanImageUrl } from "@/lib/utils/strings";
import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface ProjectsSectionProps {
  lang: "es" | "en";
  /** Proyectos del home, cargados y cacheados en el servidor (getHomeData). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects?: any[];
  dict: {
    badge?: any;
    title?: any;
    view_all?: any;
    explore?: any;
    no_photo?: any;
  };
}



export default function ProjectsSection({
  lang,
  dict,
  projects = [],
}: ProjectsSectionProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  if (!projects || projects.length === 0) return null;

  const [leadProject, ...secondaryProjects] = projects;

  const leadTitle = getI18n(leadProject.title ?? leadProject.title_es, lang);
  const leadDesc = getI18n(
    leadProject.short_description ??
      leadProject.short_description_es ??
      leadProject.description ??
      leadProject.description_es,
    lang,
  );
  const leadCategory = getI18n(leadProject.category, lang);
  const leadLocation = getI18n(leadProject.location, lang);
  const leadImg = cleanImageUrl(leadProject.cover_image);
  const leadSlug = getI18n(leadProject.slug, lang) || String(leadProject.id);

  const badgeText = getI18n(dict?.badge, lang) || "PROYECTOS & OBRAS";
  const titleText = getI18n(dict?.title, lang) || "ARQUITECTURA EN PIEDRA";
  const viewAllText = getI18n(dict?.view_all, lang) || "Ver Todas las Obras";
  const exploreText = getI18n(dict?.explore, lang) || "Explorar Ficha de Obra";
  const noPhotoText = getI18n(dict?.no_photo, lang) || "Sin Fotografía";

  return (
    <section className="w-full bg-background border-t border-border-light maya-section font-sans selection:bg-black-neutral selection:text-gray-warm overflow-hidden">
      <div className="editorial-container space-y-6 sm:space-y-8 md:space-y-10">
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6 border-b border-border-light pb-4 sm:pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <SectionLabel variant="minimal" theme="accent">
              {badgeText}
            </SectionLabel>
            <h2 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral">
              {titleText}
            </h2>
          </div>

          <Button
            href={`/${ROUTES.arquitectura[currentLocale]}`}
            variant="ghost"
            align="right"
            icon={<span className="text-base sm:text-lg leading-none">→</span>}
            iconPosition="right"
            className="text-maya-small tracking-nav uppercase text-black-neutral/70 hover:text-black-neutral self-start md:self-auto"
          >
            {viewAllText}
          </Button>
        </div>

        {/* RETÍCULA EDITORIAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* PROYECTO PRINCIPAL (HERO CARD) */}
          <div className="lg:col-span-7 flex">
            <Link
              href={`/${ROUTES.arquitectura[currentLocale]}/${encodeURIComponent(leadSlug)}`}
              className="group flex flex-col justify-between w-full bg-surface border border-border-light hover:border-border-strong transition-all duration-500 rounded-2xs overflow-hidden shadow-2xs p-4 sm:p-5 md:p-6"
            >
              <div className="space-y-4 sm:space-y-5">
                {/* CONTENEDOR DE IMAGEN PRINCIPAL */}
                <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden bg-black-neutral/5 border border-border-light rounded-3xs">
                  {leadImg ? (
                    <Image
                      src={leadImg}
                      alt={leadTitle}
                      fill
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover group-hover:scale-104 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-black-neutral/30 uppercase tracking-widest">
                      {noPhotoText}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black-pure/0 group-hover:bg-black-pure/5 transition-colors duration-500" />
                </div>

                {/* METADATOS Y CONTENIDO */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-maya-label uppercase tracking-data border-b border-border-light pb-2">
                    <span className="text-accent-ink font-semibold">
                      {leadCategory}
                    </span>
                    {leadLocation && (
                      <span className="text-black-neutral/50 font-normal">
                        {leadLocation}
                      </span>
                    )}
                  </div>

                  <h3 className="font-sans text-maya-h3 font-light tracking-editorial uppercase text-black-neutral group-hover:text-accent-ink transition-colors duration-300 leading-snug">
                    {leadTitle}
                  </h3>

                  {leadDesc && (
                    <p className="font-sans text-maya-body text-black-neutral/70 font-light line-clamp-3 leading-relaxed">
                      {leadDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* FOOTER INTERACTIVO */}
              <div className="pt-3 mt-4 sm:mt-6 border-t border-border-light flex items-center justify-between font-mono text-maya-label uppercase tracking-nav text-black-neutral/60 group-hover:text-accent-ink transition-colors duration-300">
                <span className="font-medium">{exploreText}</span>
                <span className="text-base sm:text-lg group-hover:translate-x-1.5 transition-transform duration-300 leading-none">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* LISTA SECUNDARIA */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-4 justify-between">
            {secondaryProjects.map((proj) => {
              const title = getI18n(proj.title ?? proj.title_es, lang);
              const category = getI18n(proj.category, lang);
              const location = getI18n(proj.location, lang);
              const imgSrc = cleanImageUrl(proj.cover_image);
              const slug = getI18n(proj.slug, lang) || String(proj.id);
              const materialsText =
                proj.material_skus && proj.material_skus.length > 0
                  ? getI18n(proj.material_skus.slice(0, 2), lang)
                  : "";

              return (
                <Link
                  key={proj.id}
                  href={`/${ROUTES.arquitectura[currentLocale]}/${encodeURIComponent(slug)}`}
                  className="group flex-1 flex flex-col sm:flex-row gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-surface border border-border-light hover:border-border-strong transition-all duration-500 rounded-2xs items-stretch sm:items-center justify-between shadow-2xs"
                >
                  {/* MINIATURA PROPORCIONAL */}
                  <div className="relative w-full sm:w-36 md:w-40 aspect-16/10 sm:aspect-4/3 shrink-0 overflow-hidden bg-black-neutral/5 border border-border-light rounded-3xs">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, 160px"
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-black-neutral/30 uppercase">
                        {noPhotoText}
                      </div>
                    )}
                  </div>

                  {/* INFORMACIÓN DEL PROYECTO */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Categoría superior */}
                    <div className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold truncate">
                      {category}
                    </div>

                    {/* Título */}
                    <h4 className="font-sans text-maya-h4 font-light tracking-editorial uppercase text-black-neutral group-hover:text-accent-ink transition-colors duration-300 line-clamp-2 leading-tight">
                      {title}
                    </h4>

                    {/* Ubicación limpia y materiales */}
                    <div className="pt-0.5 space-y-0.5 font-mono text-maya-label uppercase tracking-data text-black-neutral/50">
                      {location && (
                        <p className="truncate text-black-neutral/60 font-light">
                          {location}
                        </p>
                      )}
                      {materialsText && (
                        <p className="text-black-neutral/40 truncate">
                          {materialsText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* FLECHA DE ACCIÓN */}
                  <div className="hidden sm:flex items-center text-lg md:text-xl font-mono text-black-neutral/40 group-hover:text-accent-ink group-hover:translate-x-1 transition-all duration-300 pl-1 pr-1 leading-none">
                    →
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
