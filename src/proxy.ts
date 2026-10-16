import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, resolveRoute, type Locale } from "@/lib/i18n/routes";

const SECRET_LOGIN_KEY =
  process.env.ADMIN_LOGIN_KEY || process.env.LOGIN_KEY || "";

// =============================================================================
// COOKIE DEL GATE DE LOGIN FIRMADA (HMAC-SHA256)
// -----------------------------------------------------------------------------
// Antes la cookie valía siempre "granted" y cualquiera podía crearla a mano.
// Ahora contiene `<expiración>.<firma>`, firmada con ADMIN_LOGIN_KEY: no se
// puede falsificar ni extender sin conocer la clave.
// =============================================================================
const GATE_COOKIE = "admin_gate_pass";
const GATE_TTL_SECONDS = 60 * 30; // 30 minutos

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_LOGIN_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createGateToken(): Promise<string> {
  const expiresAt = String(Date.now() + GATE_TTL_SECONDS * 1000);
  return `${expiresAt}.${await hmac(expiresAt)}`;
}

async function isValidGateToken(token: string | undefined): Promise<boolean> {
  if (!token || !SECRET_LOGIN_KEY) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  const expected = await hmac(expiresAt);
  // Comparación en tiempo constante
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// =============================================================================
// RATE LIMITING EN MEMORIA (5 intentos fallidos cada 15 min por IP)
// =============================================================================
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

const loginRateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = loginRateLimitMap.get(ip);

  // Limpieza preventiva si el mapa crece
  if (loginRateLimitMap.size > 5000) {
    for (const [key, value] of loginRateLimitMap.entries()) {
      if (now > value.resetAt) loginRateLimitMap.delete(key);
    }
  }

  if (!entry || now > entry.resetAt) {
    loginRateLimitMap.set(ip, { attempts: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.attempts += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.attempts };
}

// =============================================================================
// MIDDLEWARE HANDLER
// =============================================================================
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const rawPath = pathname.replace(/^\/+|\/+$/g, "");
  const segments = rawPath.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const hasInternalLocale = isLocale(firstSegment);

  const cookieLang = request.cookies.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined;

  // 1. Resolver idioma y carpeta física interna
  const { lang, folder } = resolveRoute(rawPath, cookieLang);

  const setLocaleCookie = (response: NextResponse) => {
    response.cookies.set("NEXT_LOCALE", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  };

  // 2a. Home en inglés: /en es una URL pública real (no se redirige)
  const isEnglishHome = segments.length === 1 && firstSegment === "en";

  if (isEnglishHome) {
    const rewriteUrl = new URL("/en", request.url);
    rewriteUrl.search = request.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // 2b. Home "/" con preferencia guardada en inglés → /en (temporal, 307).
  // Googlebot no envía cookies, así que siempre indexa "/" en español.
  if (segments.length === 0 && cookieLang === "en") {
    const enHome = new URL("/en", request.url);
    enHome.search = request.nextUrl.search;
    return NextResponse.redirect(enHome, 307);
  }

  // 2c. Normalización de URLs con prefijo innecesario (/es/..., /en/...)
  // Redirección permanente (308) para consolidar SEO en la URL limpia.
  if (hasInternalLocale) {
    const publicSubPath = segments.slice(1).join("/");
    const cleanUrl = new URL(
      publicSubPath ? `/${publicSubPath}` : "/",
      request.url,
    );
    cleanUrl.search = request.nextUrl.search;
    const response = NextResponse.redirect(cleanUrl, 308);
    setLocaleCookie(response);
    return response;
  }

  // 3. Login Gate & Rate Limiting sobre ?key=
  const isLogin = folder === "login";

  if (isLogin) {
    const clientIp = getClientIp(request);
    const key = request.nextUrl.searchParams.get("key");
    const gateCookie = request.cookies.get(GATE_COOKIE)?.value;
    const hasGate = await isValidGateToken(gateCookie);

    if (key !== null) {
      const { allowed } = checkRateLimit(clientIp);

      if (!allowed) {
        return new NextResponse(
          "Demasiados intentos fallidos de acceso. Intente más tarde.",
          { status: 429, headers: { "Retry-After": "900" } },
        );
      }

      const validKey = SECRET_LOGIN_KEY.length > 0 && key === SECRET_LOGIN_KEY;

      if (validKey) {
        loginRateLimitMap.delete(clientIp); // Restablecer intentos en caso de éxito
        const cleanUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(cleanUrl);

        response.cookies.set(GATE_COOKIE, await createGateToken(), {
          path: "/",
          maxAge: GATE_TTL_SECONDS,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        setLocaleCookie(response);
        return response;
      }

      // Clave incorrecta -> redirige a inicio
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!hasGate) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4. Ruta interna
  const internalPath = folder ? `/${lang}/${folder}` : `/${lang}`;
  const isAdminRoute = folder === "admin" || folder.startsWith("admin/");

  // 4b. Rutas públicas: no se consulta Supabase aquí. Evita un viaje de red a
  // Supabase Auth en cada visita (las páginas públicas no dependen de sesión).
  if (!isAdminRoute && !isLogin) {
    const rewriteUrl = new URL(internalPath, request.url);
    rewriteUrl.search = request.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    setLocaleCookie(response);
    return response;
  }

  // 5. Cliente Supabase y verificación de sesión
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const rewriteUrl = new URL(internalPath, request.url);
    rewriteUrl.search = request.nextUrl.search;
    const response = NextResponse.rewrite(rewriteUrl);
    setLocaleCookie(response);
    return response;
  }

  let supabaseResponse = NextResponse.rewrite(
    new URL(internalPath, request.url),
  );

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.rewrite(
          new URL(internalPath, request.url),
        );

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 6. Proteger rutas administrativas en middleware
  if (isAdminRoute) {
    if (!user) {
      const response = NextResponse.redirect(new URL("/", request.url));
      setLocaleCookie(response);
      return response;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile || profile.role !== "admin") {
      const response = NextResponse.redirect(new URL("/", request.url));
      setLocaleCookie(response);
      return response;
    }
  }

  // 7. Reescritura final
  const rewriteUrl = new URL(internalPath, request.url);
  rewriteUrl.search = request.nextUrl.search;

  supabaseResponse = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: request.headers,
    },
  });

  setLocaleCookie(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Excluye estáticos y archivos de metadatos (robots, sitemap, iconos, manifest)
    // para que el proxy no los reescriba a /[lang]/... y respondan 404.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm|ogg|mov|m4v|avi|wav|pdf|otf|ttf|woff|woff2|xml|txt|webmanifest)$).*)",
  ],
};
