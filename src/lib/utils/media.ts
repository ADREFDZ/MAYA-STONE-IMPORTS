export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.includes("/videos/")
  );
}

/* =============================================================================
   IMÁGENES · PREPARACIÓN PARA SUBIR (calidad "master")
   -----------------------------------------------------------------------------
   Supabase guarda el archivo tal cual: no comprime nada. La compresión para
   cada pantalla la hace después next/image (AVIF/WebP al tamaño exacto del
   dispositivo). Por eso aquí NO buscamos un archivo ligero, sino un "master"
   de alta calidad que sirva para pantallas 4K:

   · Lado largo máximo 4096 px (≈ 16 MP como máximo: límite seguro del canvas
     en iPhone/iPad; más grande, Safari genera imágenes en blanco).
   · WebP calidad 0.95 (prácticamente sin pérdida visible en vetas/texturas).
   · Si la foto ya es pequeña y es JPEG/WebP, se sube sin recomprimir.
   · Safari antiguo no sabe generar WebP: en ese caso se usa JPEG 0.95.
   ========================================================================== */

export const IMAGE_MASTER_MAX_SIDE = 4096;
export const IMAGE_MASTER_QUALITY = 0.95;
/** Cabecera de caché para subidas con nombre único (1 año, inmutable). */
export const STORAGE_CACHE_SECONDS = "31536000";

export interface ImageMasterOptions {
  /** Lado largo máximo en px (por defecto 4096). */
  maxSide?: number;
  /** Calidad inicial 0–1 (por defecto 0.95). */
  quality?: number;
  /**
   * Peso máximo del archivo. Las subidas que pasan por una Server Action
   * tienen límite de cuerpo (hosting/proxy), por eso el valor por defecto es
   * 4 MB. Las subidas DIRECTAS a Storage pueden usar más (p. ej. 12 MB).
   * Si se excede, se baja la calidad en pasos pequeños y, solo si hace falta,
   * el tamaño.
   */
  maxBytes?: number;
}

export async function convertToWebP(
  file: File,
  {
    maxSide = IMAGE_MASTER_MAX_SIDE,
    quality = IMAGE_MASTER_QUALITY,
    maxBytes = 4 * 1024 * 1024,
  }: ImageMasterOptions = {},
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen."));
      el.src = url;
    });

    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    let side = Math.min(maxSide, Math.max(srcW, srcH));

    // Ya cabe, es formato web y pesa poco → subir el original intacto
    // (evita una compresión extra innecesaria).
    if (
      side === Math.max(srcW, srcH) &&
      (file.type === "image/webp" || file.type === "image/jpeg") &&
      file.size <= maxBytes
    ) {
      return file;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo inicializar el contexto del canvas.");

    const draw = () => {
      const scale = side / Math.max(srcW, srcH);
      canvas.width = Math.round(srcW * scale);
      canvas.height = Math.round(srcH * scale);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    const encode = async (q: number) => {
      const toBlob = (type: string) =>
        new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
      let blob = await toBlob("image/webp");
      // Safari < 17 devuelve PNG si no soporta WebP: usar JPEG de alta calidad
      if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
      if (!blob) throw new Error("Error al generar la imagen optimizada.");
      return blob;
    };

    draw();
    const ladder = [quality, 0.92, 0.88, 0.84].filter((q) => q <= quality);
    let blob = await encode(ladder[0]);
    for (let i = 1; i < ladder.length && blob.size > maxBytes; i++) {
      blob = await encode(ladder[i]);
    }
    // Último recurso: reducir resolución (nunca por debajo de 2560 px)
    while (blob.size > maxBytes && side > 2560) {
      side = Math.max(2560, Math.round(side * 0.85));
      draw();
      blob = await encode(0.88);
    }

    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ext, {
      type: blob.type,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* =============================================================================
   VIDEOS · COMPRESIÓN EN EL NAVEGADOR ANTES DE SUBIR
   -----------------------------------------------------------------------------
   Supabase tampoco procesa videos. Un MP4 directo de cámara/edición suele pesar
   decenas de MB y tener el índice ("moov") al final, así que el navegador no
   puede reproducir hasta descargarlo casi todo.

   Aquí, con ffmpeg (WebAssembly, se descarga solo al usarlo, ~30 MB una vez):
   · H.264 1080p máx., CRF 21 (alta calidad), sin audio (los videos del sitio
     van silenciados), "faststart" → empieza a reproducirse al instante.
   · Si el video ya es ligero y H.264, solo se reordena (faststart) sin
     recomprimir: segundos en vez de minutos.
   ========================================================================== */

// Se descarga del CDN solo cuando el admin sube un video (≈30 MB, queda en
// caché del navegador). Para auto-hospedarlo, copia node_modules/@ffmpeg/core/
// dist/esm a public/ffmpeg y define NEXT_PUBLIC_FFMPEG_CORE_URL=/ffmpeg
const FFMPEG_CORE_URL =
  process.env.NEXT_PUBLIC_FFMPEG_CORE_URL ||
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

/** Clase FFmpeg servida desde /public (ver comentario en compressVideoForWeb). */
const FFMPEG_CLASS_URL = "/ffmpeg/index.js";

/** Tipos mínimos de la instancia de ffmpeg.wasm que usamos. */
type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;

/** Descarga un recurso y lo expone como blob: URL (evita problemas de CORS). */
async function toBlobURL(url: string, mimeType: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url}`);
  const buf = await res.arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: mimeType }));
}

/** Por debajo de esto (y ≤1080p) no se recomprime, solo se aplica faststart. */
const VIDEO_LIGHT_BYTES_PER_SEC = 900 * 1024; // ≈ 7 Mbps

export interface VideoProgress {
  stage: "loading" | "analyzing" | "compressing" | "done";
  /** 0–1 cuando se conoce */
  ratio?: number;
}

async function readVideoMeta(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<{ w: number; h: number; duration: number }>(
      (resolve) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.muted = true;
        v.onloadedmetadata = () =>
          resolve({ w: v.videoWidth, h: v.videoHeight, duration: v.duration });
        v.onerror = () => resolve({ w: 0, h: 0, duration: 0 });
        v.src = url;
      },
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressVideoForWeb(
  file: File,
  onProgress?: (p: VideoProgress) => void,
): Promise<File> {
  onProgress?.({ stage: "loading" });

  // ffmpeg se carga DIRECTO desde /public/ffmpeg (copia de @ffmpeg/ffmpeg),
  // sin pasar por el empaquetador: Turbopack/Webpack no saben resolver el
  // `new Worker(new URL(...))` dinámico de la librería y rompen el build.
  const { FFmpeg } = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ FFMPEG_CLASS_URL
  )) as { FFmpeg: new () => FFmpegInstance };

  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) =>
    onProgress?.({
      stage: "compressing",
      ratio: Math.max(0, Math.min(1, progress)),
    }),
  );

  await ffmpeg.load({
    coreURL: await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_URL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  onProgress?.({ stage: "analyzing" });
  const meta = await readVideoMeta(file);
  const longSide = Math.max(meta.w, meta.h);
  const bytesPerSec = meta.duration > 0 ? file.size / meta.duration : Infinity;
  const isMp4 = /\.mp4$/i.test(file.name) || file.type === "video/mp4";
  const alreadyLight =
    isMp4 && longSide > 0 && longSide <= 1920 && bytesPerSec <= VIDEO_LIGHT_BYTES_PER_SEC;

  const input = "input" + (file.name.match(/\.[^/.]+$/)?.[0] || ".mp4");
  await ffmpeg.writeFile(input, new Uint8Array(await file.arrayBuffer()));

  // Escala solo si excede 1080p, respetando vertical/horizontal
  const scale =
    meta.w >= meta.h
      ? "scale='min(1920,iw)':-2:flags=lanczos"
      : "scale=-2:'min(1920,ih)':flags=lanczos";

  const args = alreadyLight
    ? ["-i", input, "-c", "copy", "-an", "-movflags", "+faststart", "out.mp4"]
    : [
        "-i", input,
        "-an",
        "-vf", scale,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "21",
        "-maxrate", "7M",
        "-bufsize", "14M",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "out.mp4",
      ];

  const code = await ffmpeg.exec(args);
  if (code !== 0) {
    ffmpeg.terminate();
    throw new Error("No se pudo procesar el video.");
  }

  const data = (await ffmpeg.readFile("out.mp4")) as Uint8Array;
  ffmpeg.terminate();
  onProgress?.({ stage: "done", ratio: 1 });

  const out = new File(
    [new Uint8Array(data)],
    file.name.replace(/\.[^/.]+$/, "") + ".mp4",
    { type: "video/mp4" },
  );
  // Si por alguna razón quedó más pesado (ya venía muy optimizado), usar el original
  return out.size < file.size || !isMp4 ? out : file;
}
