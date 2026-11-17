import Image from "next/image";
import Link from "next/link";
import {
  projectMaterialCollectionTitle,
  projectMaterialHref,
  type ProjectMaterial,
} from "@/lib/projects/materials";

export interface ProjectMaterialsDict {
  title: string;
  view: string;
  count_one: string;
  count_other: string;
}

interface Props {
  materials?: ProjectMaterial[] | null;
  lang: string;
  dict?: ProjectMaterialsDict;
  /** "light" = fondo claro (ficha del proyecto) · "dark" = galería oscura */
  tone?: "light" | "dark";
  /** Versión compacta: solo miniaturas y nombres (listado de obras) */
  compact?: boolean;
}

/**
 * MATERIALES USADOS EN UN PROYECTO
 * Solo aparece si en Admin → Proyectos → Materiales se eligió al menos uno.
 * Cada material enlaza a su ficha dentro de su colección.
 */
export default function ProjectMaterials({
  materials,
  lang,
  dict,
  tone = "light",
  compact = false,
}: Props) {
  if (!materials || materials.length === 0 || !dict) return null;

  const dark = tone === "dark";
  const count = `${materials.length} ${materials.length === 1 ? dict.count_one : dict.count_other}`;

  return (
    <section
      aria-label={dict.title}
      className={`space-y-3 ${dark ? "text-gray-warm" : "text-black-neutral"}`}
    >
      <div
        className={`flex items-baseline justify-between gap-3 border-b pb-2 ${
          dark ? "border-gray-warm/15" : "border-border-light"
        }`}
      >
        <h3 className={`font-mono text-maya-label uppercase tracking-data ${dark ? "text-gray-warm/70" : "text-accent-ink"}`}>
          {dict.title}
        </h3>
        <span className={`text-[12px] ${dark ? "text-gray-warm/50" : "text-text-muted"}`}>{count}</span>
      </div>

      <ul className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2"}>
        {materials.map((m) => {
          const href = projectMaterialHref(lang, m);
          const collection = projectMaterialCollectionTitle(lang, m);
          const body = (
            <>
              <span
                className={`relative shrink-0 overflow-hidden border ${
                  compact ? "h-8 w-8" : "h-12 w-12"
                } ${dark ? "border-gray-warm/20 bg-black-pure/40" : "border-border-light bg-surface"}`}
              >
                {m.image && (
                  <Image src={m.image} alt="" fill sizes="48px" className="object-cover" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-maya-small uppercase tracking-wide truncate">{m.name}</span>
                {!compact && (
                  <span className={`block text-[12px] truncate ${dark ? "text-gray-warm/55" : "text-text-secondary"}`}>
                    {[collection, m.stone_type, m.origin].filter(Boolean).join(" / ")}
                  </span>
                )}
              </span>
            </>
          );
          const cls = `flex items-center gap-3 border p-1.5 pr-3 transition-colors ${
            dark
              ? "border-gray-warm/15 hover:border-gray-warm/50"
              : "border-border-light bg-background/60 hover:border-black-neutral"
          }`;
          return (
            <li key={m.sku}>
              {href ? (
                <Link href={href} className={cls} title={dict.view}>
                  {body}
                </Link>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
