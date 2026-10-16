import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * INSTAGRAM — API OFICIAL DE META
 * -----------------------------------------------------------------------------
 * Soporta los dos tipos de token de Meta:
 *  1. "Instagram API with Instagram Login" → token que empieza con "IG…".
 *     Endpoint: graph.instagram.com/me/media. Caduca a los 60 días y aquí se
 *     RENUEVA SOLO (se guarda el token vigente en la tabla `instagram_auth`).
 *  2. "Instagram API with Facebook Login" → token de página "EAA…".
 *     Requiere INSTAGRAM_USER_ID (id de la cuenta profesional de Instagram).
 *
 * Variables de entorno (.env.local / hosting):
 *   INSTAGRAM_ACCESS_TOKEN   (obligatoria, token inicial)
 *   INSTAGRAM_USER_ID        (solo para tokens de Facebook Login)
 */

export const INSTAGRAM_PAGE_SIZE = 12;
const GRAPH_VERSION = "v25.0";
const REFRESH_WHEN_DAYS_LEFT = 10;
const CACHE_SECONDS = 60 * 60; // 1 hora

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export interface InstagramSlide {
  id: string;
  type: "IMAGE" | "VIDEO";
  imageUrl: string; // imagen o portada del video
  videoUrl?: string;
}

export interface InstagramPost {
  id: string;
  type: InstagramMediaType;
  imageUrl: string; // miniatura para la rejilla
  videoUrl?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  slides?: InstagramSlide[]; // solo carruseles
}

export interface InstagramProfile {
  username: string;
  name?: string;
  pictureUrl?: string;
  followers?: number;
  mediaCount?: number;
}

export interface InstagramPage {
  posts: InstagramPost[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Token: lectura, renovación automática y almacenamiento
// ---------------------------------------------------------------------------

const isInstagramLoginToken = (token: string) => token.startsWith("IG");

async function getAccessToken(): Promise<string | null> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || "";
  const envTail = envToken.slice(-12);

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    // Sin service role (entorno incompleto): se usa directamente el token del .env
    return envToken || null;
  }

  const { data: stored } = await supabase
    .from("instagram_auth")
    .select("access_token, expires_at, seed_tail")
    .eq("id", 1)
    .maybeSingle();

  let token: string | null = stored?.access_token ?? null;
  let expiresAt = stored?.expires_at ? new Date(stored.expires_at).getTime() : 0;

  // Primera vez, o pusiste un token NUEVO en el .env → se toma el del .env
  if (envToken && (!stored || stored.seed_tail !== envTail)) {
    token = envToken;
    expiresAt = 0;
    await supabase.from("instagram_auth").upsert({
      id: 1,
      access_token: envToken,
      seed_tail: envTail,
      expires_at: null,
      refreshed_at: null,
      updated_at: new Date().toISOString(),
    });
  }

  if (!token) return null;

  // Renovación automática (solo tokens de Instagram Login, que caducan a 60 días)
  const daysLeft = (expiresAt - Date.now()) / 86_400_000;
  if (isInstagramLoginToken(token) && (!expiresAt || daysLeft < REFRESH_WHEN_DAYS_LEFT)) {
    try {
      const res = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (res.ok && json.access_token) {
        token = json.access_token as string;
        await supabase
          .from("instagram_auth")
          .update({
            access_token: token,
            expires_at: new Date(Date.now() + (json.expires_in ?? 5_184_000) * 1000).toISOString(),
            refreshed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1);
      } else {
        // Meta no permite renovar tokens con menos de 24 h de antigüedad;
        // se sigue usando el actual y se reintenta en la siguiente lectura.
        console.warn("[instagram] No se pudo renovar el token:", json?.error?.message);
      }
    } catch (err) {
      console.warn("[instagram] Error renovando token:", err);
    }
  }

  return token;
}

// ---------------------------------------------------------------------------
// Lectura de publicaciones
// ---------------------------------------------------------------------------

const FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}";

interface RawMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: { data?: RawMedia[] };
}

function normalize(raw: RawMedia): InstagramPost | null {
  const type = (raw.media_type || "IMAGE").toUpperCase() as InstagramMediaType;
  const isVideo = type === "VIDEO";
  const imageUrl = isVideo ? raw.thumbnail_url || "" : raw.media_url || raw.thumbnail_url || "";
  if (!imageUrl) return null;

  const slides =
    type === "CAROUSEL_ALBUM"
      ? (raw.children?.data ?? [])
          .map((c): InstagramSlide | null => {
            const childVideo = (c.media_type || "").toUpperCase() === "VIDEO";
            const img = childVideo ? c.thumbnail_url : c.media_url;
            if (!img) return null;
            return {
              id: c.id,
              type: childVideo ? "VIDEO" : "IMAGE",
              imageUrl: img,
              videoUrl: childVideo ? c.media_url : undefined,
            };
          })
          .filter((s): s is InstagramSlide => s !== null)
      : undefined;

  return {
    id: raw.id,
    type,
    imageUrl,
    videoUrl: isVideo ? raw.media_url : undefined,
    permalink: raw.permalink,
    caption: raw.caption,
    timestamp: raw.timestamp,
    slides,
  };
}

/** URL base de la cuenta según el tipo de token. */
function accountBase(token: string) {
  return isInstagramLoginToken(token)
    ? `https://graph.instagram.com/${GRAPH_VERSION}/me`
    : `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.INSTAGRAM_USER_ID}`;
}

async function fetchPage(after?: string | null): Promise<InstagramPage> {
  const token = await getAccessToken();
  if (!token) return { posts: [], nextCursor: null };

  const base = `${accountBase(token)}/media`;

  const params = new URLSearchParams({
    fields: FIELDS,
    limit: String(INSTAGRAM_PAGE_SIZE),
    access_token: token,
  });
  if (after) params.set("after", after);

  const res = await fetch(`${base}?${params}`, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    // Se lanza para que el caché NO guarde un resultado vacío
    throw new Error(json?.error?.message || `Instagram API ${res.status}`);
  }

  const posts = ((json.data ?? []) as RawMedia[])
    .map(normalize)
    .filter((p): p is InstagramPost => p !== null);

  return {
    posts,
    nextCursor: json.paging?.next ? (json.paging?.cursors?.after ?? null) : null,
  };
}

const fetchPageCached = unstable_cache(
  async (after: string) => fetchPage(after || null),
  ["instagram-page"],
  { revalidate: CACHE_SECONDS, tags: ["instagram"] },
);

/** Página de publicaciones (cacheada 1 h). Nunca lanza error. */
export async function getInstagramPage(after?: string | null): Promise<InstagramPage> {
  try {
    return await fetchPageCached(after ?? "");
  } catch (err) {
    console.error("[instagram] Error obteniendo publicaciones:", err);
    return { posts: [], nextCursor: null };
  }
}

// ---------------------------------------------------------------------------
// Perfil (foto, usuario y contadores)
// ---------------------------------------------------------------------------

const fetchProfileCached = unstable_cache(
  async (): Promise<InstagramProfile | null> => {
    const token = await getAccessToken();
    if (!token) return null;

    const params = new URLSearchParams({
      fields: "username,name,profile_picture_url,followers_count,media_count",
      access_token: token,
    });
    const res = await fetch(`${accountBase(token)}?${params}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `Instagram API ${res.status}`);

    return {
      username: json.username,
      name: json.name,
      pictureUrl: json.profile_picture_url,
      followers: json.followers_count,
      mediaCount: json.media_count,
    };
  },
  ["instagram-profile"],
  { revalidate: CACHE_SECONDS, tags: ["instagram"] },
);

/** Perfil de la cuenta (cacheado 1 h). Devuelve null si falla. */
export async function getInstagramProfile(): Promise<InstagramProfile | null> {
  try {
    return await fetchProfileCached();
  } catch (err) {
    console.error("[instagram] Error obteniendo el perfil:", err);
    return null;
  }
}
