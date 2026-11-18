/**
 * EQUILIBRIO ÓPTICO DE ISOTIPOS
 * -----------------------------------------------------------------------------
 * A la misma altura, un isotipo ancho o de trazo grueso (TRAVERTINO) se ve
 * mucho más grande que uno corto o de trazo fino (RESERVE). Para que todos se
 * perciban del mismo tamaño se ajusta cada uno según:
 *   · su proporción (ancho/alto): los anchos se dibujan más bajos.
 *   · su "tinta" (porcentaje de píxeles opacos): los gruesos, un poco más bajos.
 * Fórmula habitual en muros de logotipos: alto ∝ ratio^-0.5 · tinta^-0.25
 * (la tinta se atenúa para no encoger de más a los de trazo grueso).
 */

export interface LogoMetric {
  ratio: number; // ancho / alto (isotipo ya recortado, sin márgenes)
  ink: number; // 0–1, proporción de píxeles opacos
}

const DEFAULT_INK = 0.15;

/** Mide proporción y tinta de un <img> ya cargado. */
export function measureLogo(img: HTMLImageElement): LogoMetric | null {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return null;
  const ratio = w / h;
  let ink = DEFAULT_INK;
  try {
    // Muestra reducida: basta para estimar la tinta y es rápido
    const sw = Math.min(600, w);
    const sh = Math.max(1, Math.round(sw / ratio));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(img, 0, 0, sw, sh);
      const data = ctx.getImageData(0, 0, sw, sh).data;
      let sum = 0;
      for (let i = 3; i < data.length; i += 4) sum += data[i];
      const measured = sum / 255 / (sw * sh);
      // Imágenes sin transparencia (JPG con fondo) darían 1: se ignoran
      if (measured > 0.01 && measured < 0.9) ink = measured;
    }
  } catch {
    // Imagen sin CORS: se usa la tinta por defecto
  }
  return { ratio, ink };
}

/** Altura relativa de cada isotipo (el más alto = 1) y el ancho relativo máximo. */
export function balanceLogos(metrics: Record<string, LogoMetric>) {
  const raw: Record<string, number> = {};
  for (const [key, m] of Object.entries(metrics)) {
    raw[key] = Math.pow(m.ratio, -0.5) * Math.pow(m.ink, -0.25);
  }
  const maxRaw = Math.max(...Object.values(raw), 0) || 1;
  const rel: Record<string, number> = {};
  let maxWidth = 0;
  for (const [key, value] of Object.entries(raw)) {
    rel[key] = value / maxRaw;
    maxWidth = Math.max(maxWidth, metrics[key].ratio * rel[key]);
  }
  return { rel, maxWidth: maxWidth || 1 };
}
