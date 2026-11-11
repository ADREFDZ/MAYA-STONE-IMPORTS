import Image from "next/image";
import { slugify } from "@/lib/utils/strings";
import { type Locale } from "@/lib/i18n/routes";
import CollectionLogoTitle from "./CollectionLogoTitle";

interface CollectionCatalogDownloadProps {
  /** PDF subido desde el admin para esta colección. */
  url?: string | null;
  collectionTitle: string;
  logoUrl?: string | null;
  coverImage?: string | null;
  lang?: string;
  dict?: any;
}

/** Fuerza la descarga en Supabase Storage (`?download=<nombre>`). */
function buildDownloadUrl(url: string, fileName: string) {
  try {
    const u = new URL(url);
    if (u.pathname.includes("/storage/v1/object/public/")) {
      u.searchParams.set("download", fileName);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * CTA FINAL DE CADA COLECCIÓN — CATÁLOGO DIGITAL
 * Descarga el PDF que se sube desde Admin → Colecciones → Catálogo Digital.
 * Si aún no hay PDF, el botón aparece deshabilitado ("Disponible muy pronto").
 * Toma los colores del tema de la colección (--col-*).
 */
export default function CollectionCatalogDownload({
  url,
  collectionTitle,
  logoUrl,
  coverImage,
  lang = "es",
  dict,
}: CollectionCatalogDownloadProps) {
  const t = dict?.collection_page?.catalog_download;
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const hasFile = Boolean(url);

  const fileName = `MAYA-${slugify(collectionTitle || "coleccion")}-${
    currentLocale === "en" ? "catalogue" : "catalogo"
  }.pdf`;

  const title = t?.title;
  const description = t?.description;
  const buttonLabel = t?.button;
  const meta = t?.meta;
  const note = hasFile ? t?.note : t?.unavailable_note;

  const buttonClass =
    "group/btn inline-flex w-full sm:w-auto items-center justify-center gap-4 px-6 py-3.5 lg:px-7 lg:py-4 font-mono text-maya-label uppercase tracking-nav transition-all duration-500 bg-col-accent text-col-on-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-4 focus-visible:ring-col-accent focus-visible:ring-offset-col-surface";

  const buttonContent = (
    <>
      <span>{buttonLabel}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-500 group-hover/btn:translate-y-0.5"
      >
        ↓
      </span>
    </>
  );

  return (
    <aside
      aria-label={`${t?.label} · ${collectionTitle}`}
      className="border-col-border bg-col-surface group relative grid grid-cols-1 md:grid-cols-12 overflow-hidden border shadow-2xl transition-colors duration-500"
    >
      {/* ESCENARIO: portada del catálogo como pieza impresa */}
      <div className="md:col-span-5 relative flex items-center justify-center px-8 py-9 sm:py-10 lg:py-12 bg-spec-bg overflow-hidden">
        {/* Luz suave detrás de la pieza */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 45%, var(--col-spec-border), transparent 70%)",
          }}
        />

        <div className="relative w-[44%] max-w-[170px] md:w-[62%] md:max-w-[210px] xl:max-w-[230px] aspect-[3/4] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5">
          {/* Hojas posteriores (efecto de volumen) */}
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 border border-spec-border bg-spec-bg"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 translate-x-1.5 translate-y-1.5 border border-spec-border bg-col-card"
          />

          {/* Portada */}
          <div className="absolute inset-0 overflow-hidden shadow-2xl bg-black-neutral">
            {coverImage && (
              <Image
                src={coverImage}
                alt=""
                fill
                sizes="230px"
                className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-black-pure/80 via-black-pure/25 to-black-pure/10"
            />
            <div
              aria-hidden="true"
              className="absolute inset-2.5 border border-white/25"
            />

            <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5 space-y-2.5">
              <CollectionLogoTitle
                as="p"
                title={collectionTitle}
                logoUrl={logoUrl}
                className="max-w-[90%] font-sans font-light text-maya-small lg:text-maya-h4 uppercase tracking-[0.14em] text-white"
                imgClassName="h-5 lg:h-6 brightness-0 invert"
              />
              <span className="block h-px w-6 bg-white/60" aria-hidden="true" />
              <span className="block font-mono text-[10px] uppercase tracking-data text-white/75">
                {t?.cover_caption}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="md:col-span-7 min-w-0 flex flex-col justify-center gap-5 sm:gap-6 lg:gap-7 p-6 sm:p-8 lg:p-10 xl:p-12">
        <div className="flex items-center gap-4">
          <span
            className="text-col-accent font-mono text-maya-label uppercase tracking-data whitespace-nowrap"
          >
            {t?.label}
          </span>
          <span
            aria-hidden="true"
            className="bg-col-border h-px flex-1"
          />
          <span
            className="text-col-muted font-mono text-maya-label uppercase tracking-data whitespace-nowrap"
          >
            {meta}
          </span>
        </div>

        <div className="space-y-3">
          <h3
            className="text-col-text font-sans font-light text-maya-h2 xl:text-maya-h1 uppercase tracking-editorial leading-[1.08] text-balance"
          >
            {title}
          </h3>
          <p
            className="text-col-muted font-sans text-maya-small sm:text-maya-body font-light leading-relaxed max-w-lg"
          >
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-6 sm:gap-y-3">
          {hasFile && url ? (
            <a
              href={buildDownloadUrl(url, fileName)}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonClass} hover:gap-6`}
            >
              {buttonContent}
            </a>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={`${buttonClass} opacity-40 cursor-not-allowed`}
            >
              {buttonContent}
            </button>
          )}
          <span
            className="text-col-muted font-mono text-maya-label uppercase tracking-data"
          >
            {note}
          </span>
        </div>
      </div>
    </aside>
  );
}
