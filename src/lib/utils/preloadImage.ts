import { getImageProps } from "next/image";

/**
 * Precarga una imagen con EXACTAMENTE la misma URL optimizada que pedirá
 * <Image> (mismo `sizes` y `quality`), para que al mostrarla ya esté en caché
 * y el cambio sea instantáneo. Se ignora en el servidor y no repite trabajo.
 */
const requested = new Set<string>();

export function preloadImage(
  src: string | null | undefined,
  sizes: string,
  quality?: number,
) {
  if (!src || typeof window === "undefined") return;
  const key = `${src}|${sizes}|${quality ?? ""}`;
  if (requested.has(key)) return;
  requested.add(key);
  try {
    const { props } = getImageProps({ src, alt: "", fill: true, sizes, quality });
    const img = new window.Image();
    img.decoding = "async";
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  } catch {
    requested.delete(key);
  }
}
