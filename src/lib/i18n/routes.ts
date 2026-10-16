export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

export interface RouteDefinition {
  es: string;
  en: string;
  folder: string;
}

export const ROUTES = {
  // El home en inglés vive en /en (URL propia para SEO); en español en /
  home: { es: "", en: "en", folder: "" },
  coleccion: { es: "coleccion", en: "collection", folder: "coleccion" },
  arquitectura: {
    es: "arquitectura",
    en: "architecture",
    folder: "arquitectura",
  },
  about: { es: "sobre-maya", en: "about-maya", folder: "about" },
  contacto: { es: "contacto", en: "contact", folder: "contacto" },
  privacidad: {
    es: "aviso-de-privacidad",
    en: "privacy-policy",
    folder: "privacidad",
  },
  terminos: {
    es: "terminos-y-condiciones",
    en: "terms-and-conditions",
    folder: "terminos",
  },
  cookies: {
    es: "politica-de-cookies",
    en: "cookie-policy",
    folder: "cookies",
  },
  login: { es: "login", en: "login", folder: "login" },
  admin: { es: "admin", en: "admin", folder: "admin" },
} satisfies Record<string, RouteDefinition>;

export function isLocale(value: string | undefined): value is Locale {
  return value === "es" || value === "en";
}

export function getLocaleFromCookie(cookieValue: string | undefined): Locale {
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}

export function findRouteBySlug(slug: string): {
  routeKey: string;
  route: RouteDefinition;
  locale: Locale;
} | null {
  for (const [routeKey, route] of Object.entries(ROUTES)) {
    if (route.es === slug) return { routeKey, route, locale: "es" };
    if (route.en === slug) return { routeKey, route, locale: "en" };
  }
  return null;
}

export function resolveRoute(
  pathname: string,
  cookieLang?: Locale,
): { lang: Locale; folder: string; routeKey: string } {
  const cleanPath = pathname.split("?")[0].replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { lang: cookieLang ?? DEFAULT_LOCALE, folder: "", routeKey: "home" };
  }

  const hasLocalePrefix = isLocale(segments[0]);
  const activeLang = hasLocalePrefix
    ? (segments[0] as Locale)
    : (cookieLang ?? DEFAULT_LOCALE);
  const pathSegments = hasLocalePrefix ? segments.slice(1) : segments;

  if (pathSegments.length === 0) {
    return { lang: activeLang, folder: "", routeKey: "home" };
  }

  const firstSegment = pathSegments[0];

  if (firstSegment === "admin") {
    return {
      lang: "es",
      folder: pathSegments.join("/"),
      routeKey: "admin",
    };
  }

  const routeMatch = findRouteBySlug(firstSegment);

  if (routeMatch) {
    const isNeutralSlug = routeMatch.route.es === routeMatch.route.en;
    const lang = hasLocalePrefix
      ? activeLang
      : isNeutralSlug
        ? (cookieLang ?? DEFAULT_LOCALE)
        : routeMatch.locale;

    const remainingPath = pathSegments.slice(1).join("/");
    const folder = remainingPath
      ? `${routeMatch.route.folder}/${remainingPath}`
      : routeMatch.route.folder;

    return { lang, folder, routeKey: routeMatch.routeKey };
  }

  return {
    lang: activeLang,
    folder: pathSegments.join("/"),
    routeKey: pathSegments[0],
  };
}

export function getCleanPath(
  pathname: string,
  targetLang: Locale,
  searchParams?: string | URLSearchParams,
): string {
  const [pathOnly, rawQuery] = pathname.split("?");
  const effectiveQuery = searchParams ?? rawQuery ?? "";

  const cleanPath = pathOnly.replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/").filter(Boolean);
  const hasLocale = isLocale(segments[0]);
  const pathSegments = hasLocale ? segments.slice(1) : segments;

  if (pathSegments.length === 0) {
    return buildPublicUrl(ROUTES.home[targetLang], effectiveQuery);
  }

  const firstSegment = pathSegments[0];

  if (firstSegment === "admin") {
    return buildPublicUrl(pathSegments.join("/"), effectiveQuery);
  }

  const routeMatch = findRouteBySlug(firstSegment);

  if (routeMatch) {
    const targetParentSlug = routeMatch.route[targetLang];
    const subPath = pathSegments.slice(1).join("/");
    const fullSlug = subPath
      ? `${targetParentSlug}/${subPath}`
      : targetParentSlug;
    return buildPublicUrl(fullSlug, effectiveQuery);
  }

  return buildPublicUrl(pathSegments.join("/"), effectiveQuery);
}

function buildPublicUrl(
  slug: string,
  searchParams?: string | URLSearchParams,
): string {
  const path = slug ? `/${slug}` : "/";
  const query =
    typeof searchParams === "string"
      ? searchParams.replace(/^\?/, "")
      : (searchParams?.toString() ?? "");
  return query ? `${path}?${query}` : path;
}
