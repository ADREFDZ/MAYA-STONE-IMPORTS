/** Utilidades de texto/URLs compartidas por componentes públicos. */

/** Convierte un texto en slug URL-safe: "Mármol Calacatta" → "marmol-calacatta". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Quita parámetros de query de una URL de imagen (p. ej. tokens de Supabase). */
export function cleanImageUrl(
  url: string | null | undefined,
  fallback = "",
): string {
  if (!url) return fallback;
  return String(url).split("?")[0];
}

/**
 * Rellena una plantilla de los diccionarios: fillTemplate("Hola {name}", { name: "Ana" }).
 * Las llaves sin valor se dejan vacías.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] == null ? "" : String(values[key]),
  );
}

/** "DUNE IVORY" / "dune ivory" → "Dune Ivory" (nombres de colección en listas). */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
