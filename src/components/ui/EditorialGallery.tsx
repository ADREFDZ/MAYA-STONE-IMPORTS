import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import SectionLabel from "@/components/ui/SectionLabel";

interface EditorialGalleryProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
  folder?: string;
}

// Patrón proporcionado: 1 elemento completo en móvil, grilla equilibrada en desktop
const GALLERY_PATTERNS = [
  "lg:aspect-16/10",
  "lg:aspect-4/3",
  "lg:aspect-square",
  "lg:aspect-square",
  "lg:aspect-4/3",
  "lg:aspect-16/10",
];

export default async function EditorialGallery({
  title,
  subtitle,
  limit,
  className = "",
  folder = "test",
}: EditorialGalleryProps) {
  const supabase = await createClient();

  let query = supabase
    .from("gallery_photos")
    .select("id, title, description, project_type, image_url, storage_path")
    .ilike("storage_path", `${folder}/%`)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: photos, error } = await query;

  if (error || !photos || photos.length === 0) {
    return (
      <div className="py-16 text-center font-mono text-maya-label text-text-muted uppercase tracking-data border-t border-border-light">
        No hay registros visuales en &quot;{folder}&quot;
      </div>
    );
  }

  return (
    <section
      className={`w-full maya-section bg-surface text-text-primary overflow-hidden border-t border-border-light font-sans ${className}`}
    >
      <div className="editorial-container space-y-6 sm:space-y-8 md:space-y-10">
        {/* CABECERA EDITORIAL */}
        {(title || subtitle) && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-light pb-4 sm:pb-5">
            <div className="space-y-2 max-w-xl">
              {subtitle && (
                <SectionLabel variant="minimal" theme="accent">
                  {subtitle}
                </SectionLabel>
              )}
              {title && (
                <h2 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-text-primary leading-tight">
                  {title}
                </h2>
              )}
            </div>
          </div>
        )}

        {/* ENVOLTORIO EXTERIOR QUE CORTA DESBORDES */}
        <div className="w-full overflow-hidden">
          {/* CONTENEDOR FOTOGRÁFICO: CARRUSEL 1 A 1 EN MÓVIL / GRID EQUILIBRADA EN TABLET Y DESKTOP */}
          <div
            className="
              flex
              sm:grid
              sm:grid-cols-2
              lg:grid-cols-3
              overflow-x-auto
              overflow-y-hidden
              sm:overflow-visible
              snap-x
              snap-mandatory
              sm:snap-none
              gap-4
              sm:gap-5
              lg:gap-6
              items-start
              no-scrollbar
              pb-4
              sm:pb-0
              select-none
            "
          >
            {photos.map((photo, index) => {
              const desktopAspect =
                GALLERY_PATTERNS[index % GALLERY_PATTERNS.length];
              const formattedIdx = String(index + 1).padStart(2, "0");

              return (
                <article
                  key={photo.id}
                  className="
                    w-full
                    min-w-full
                    sm:min-w-0
                    sm:w-auto
                    shrink-0
                    sm:shrink
                    snap-start
                    sm:snap-none
                    group
                    flex
                    flex-col
                    space-y-2
                    sm:space-y-2.5
                  "
                >
                  {/* IMAGEN: aspect-square en móvil para 100% de consistencia, relación equilibrada en desktop */}
                  <div
                    className={`
                      relative
                      w-full
                      aspect-square
                      sm:aspect-4/3
                      ${desktopAspect}
                      max-h-[380px]
                      overflow-hidden
                      rounded-2xs
                      bg-surface-secondary
                      border
                      border-border-light
                      shadow-2xs
                    `}
                  >
                    <Image
                      src={photo.image_url}
                      alt={photo.title || `Registro visual ${formattedIdx}`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-103 pointer-events-none"
                    />

                    <div className="absolute inset-0 bg-black-pure/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                  </div>

                  {(photo.title || photo.project_type) && (
                    <div className="flex items-center justify-between font-mono text-maya-label tracking-data text-text-muted pt-0.5 px-0.5">
                      <span className="uppercase text-text-primary/80 truncate text-[11px] sm:text-xs">
                        {photo.title || photo.project_type}
                      </span>
                      <span className="text-text-muted/50 pl-2 shrink-0 text-[11px]">
                        {formattedIdx}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
