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
