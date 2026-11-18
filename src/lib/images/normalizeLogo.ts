import sharp from "sharp";

/** Alto final de los isotipos (px). Suficiente para pantallas retina. */
export const LOGO_HEIGHT = 240;

/**
 * Recorta los márgenes transparentes (o del color del borde) de un isotipo y
 * lo reduce a LOGO_HEIGHT px de alto en PNG. Así todos los isotipos ocupan
 * su caja completa y se ven del mismo tamaño en el sitio.
 */
export async function normalizeLogo(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .trim({ threshold: 10 })
    .resize({ height: LOGO_HEIGHT, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}
