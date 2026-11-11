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

// =============================================================================
// DISTRIBUCIÓN SIMÉTRICA (DESKTOP)
// -----------------------------------------------------------------------------
// Las fotos se reparten en filas COMPLETAS de 2 o 3, nunca queda una fila a
// medias. Cada fila tiene todas sus fotos del mismo tamaño:
//   · Fila de 2 → fotos grandes 3:2 (abren la sección)
//   · Fila de 3 → fotos 4:3
// Ej.: 5 fotos = 2 + 3 · 6 = 3 + 3 · 7 = 2 + 2 + 3 · 8 = 2 + 3 + 3
// Tablet: rejilla de 2 uniforme; si sobra una, ocupa el ancho completo.
// =============================================================================
const ROW_CLASSES: Record<1 | 2 | 3, string> = {
  1: "lg:col-span-6 lg:aspect-21/9",
  2: "lg:col-span-3 lg:aspect-3/2",
  3: "lg:col-span-2 lg:aspect-4/3",
};

function buildRows(total: number): (1 | 2 | 3)[] {
  if (total <= 0) return [];
  if (total === 1) return [1];
  const rows: (1 | 2 | 3)[] = [];
  const remainder = total % 3;
  const pairs = remainder === 0 ? 0 : remainder === 2 ? 1 : 2;
  for (let i = 0; i < pairs; i++) rows.push(2);
  const triples = (total - pairs * 2) / 3;
  for (let i = 0; i < triples; i++) rows.push(3);
  // Tamaño de fila asignado a cada foto, en orden
  return rows.flatMap((size) => Array(size).fill(size) as (1 | 2 | 3)[]);
}

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
              lg:grid-cols-6
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
            {(() => {
              const rowSizes = buildRows(photos.length);
              const isTabletOrphan = photos.length % 2 === 1;
              return photos.map((photo, index) => {
              const desktopLayout = ROW_CLASSES[rowSizes[index] ?? 3];
              const spansTablet =
                isTabletOrphan && index === photos.length - 1;
              const formattedIdx = String(index + 1).padStart(2, "0");

              return (
                <article
                  key={photo.id}
                  className={`
                    w-full
                    min-w-full
                    sm:min-w-0
                    sm:w-auto
                    ${spansTablet ? "sm:col-span-2" : ""}
                    ${desktopLayout.split(" ")[0]}
                    shrink-0
                    sm:shrink
                    snap-start
                    sm:snap-none
                    group
                    flex
                    flex-col
                    space-y-2
                    sm:space-y-2.5
                  `}
                >
                  {/* IMAGEN: aspect-square en móvil para 100% de consistencia, relación equilibrada en desktop */}
                  <div
                    className={`
                      relative
                      w-full
                      aspect-square
                      ${spansTablet ? "sm:aspect-16/9" : "sm:aspect-4/3"}
                      ${desktopLayout.split(" ")[1]}
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
                      sizes={
                        rowSizes[index] === 3
                          ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          : "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                      }
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-103 pointer-events-none"
                    />

                    <div className="absolute inset-0 bg-black-pure/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                  </div>

                  {/* Solo la imagen: sin título ni número debajo */}
                </article>
              );
              });
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}
