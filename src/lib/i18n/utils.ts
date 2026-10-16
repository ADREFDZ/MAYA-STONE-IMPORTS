export type Locale = "es" | "en";

export type LocalizedString =
  | Record<string, any>
  | string
  | number
  | boolean
  | any[]
  | null
  | undefined;

/**
 * Resuelve cualquier campo de Supabase o diccionarios garantizando siempre un string primitivo seguro para React.
 * Maneja objetos JSONB { es: "...", en: "..." }, strings serializados, arrays y llaves alternativas (title_es, etc.).
 */
export function getI18n(
  value: LocalizedString,
  lang: string = "es",
  fallbackLang: string = "es",
): string {
  if (value === null || value === undefined) return "";

  // 1. Strings planos o JSON serializado
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return getI18n(parsed, lang, fallbackLang);
      } catch {
        return value;
      }
    }
    return value;
  }

  // 2. Números o booleanos
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  // 3. Arrays (resuelve cada elemento recursivamente)
  if (Array.isArray(value)) {
    return value
      .map((item) => getI18n(item, lang, fallbackLang))
      .filter(Boolean)
      .join(" · ");
  }

  // 4. Objetos JSONB / Diccionarios
  if (typeof value === "object") {
    const directMatch =
      value[lang] ??
      value[fallbackLang] ??
      value.es ??
      value.en ??
      value[`${lang}`] ??
      value.title_es ??
      value.title_en ??
      value.description_es ??
      value.description_en ??
      value.subtitle_es ??
      value.subtitle_en;

    if (directMatch !== undefined && directMatch !== null) {
      return getI18n(directMatch, lang, fallbackLang);
    }

    const firstVal = Object.values(value)[0];
    if (firstVal !== undefined && firstVal !== null) {
      return getI18n(firstVal, lang, fallbackLang);
    }

    return "";
  }

  return String(value);
}
