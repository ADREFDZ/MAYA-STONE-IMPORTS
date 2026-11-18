/**
 * NORMALIZA LOS ISOTIPOS DE LAS COLECCIONES YA SUBIDOS
 * -----------------------------------------------------------------------------
 * Por qué: algunos isotipos traían márgenes transparentes grandes (≈35 % del
 * alto) y otros no, así que a la misma altura unos se veían más grandes. Además
 * pesaban mucho (hasta 11,000 px de ancho).
 *
 * Qué hace, por cada colección con isotipo raster (PNG/WebP/JPG):
 *   1. Recorta los márgenes transparentes.
 *   2. Lo reduce a 240 px de alto (PNG).
 *   3. Lo sube como archivo NUEVO (…/logo/logo-<fecha>-norm.png) y actualiza
 *      collections.logo_url. El original NO se borra (queda de respaldo).
 *
 * Uso (desde la carpeta del proyecto, en la terminal de VS Code):
 *   Prueba (no cambia nada):  node --env-file=.env.local scripts/normalizar-logos.mjs
 *   Aplicar cambios:          node --env-file=.env.local scripts/normalizar-logos.mjs --aplicar
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const APPLY = process.argv.includes("--aplicar");
const LOGO_HEIGHT = 240;
const BUCKET = "materials";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const prefix = `${url}/storage/v1/object/public/${BUCKET}/`;

const { data: cols, error } = await db
  .from("collections")
  .select("id, slug, logo_url")
  .not("logo_url", "is", null);
if (error) throw error;

console.log(APPLY ? "== APLICANDO CAMBIOS ==" : "== PRUEBA (no se cambia nada) ==");

for (const c of cols) {
  const logo = c.logo_url?.split("?")[0];
  if (!logo) continue;
  if (/\.svg$/i.test(logo)) {
    console.log(`- ${c.slug}: SVG, se deja igual`);
    continue;
  }
  if (/-norm\.png$/i.test(logo)) {
    console.log(`- ${c.slug}: ya normalizado`);
    continue;
  }

  const res = await fetch(logo);
  if (!res.ok) {
    console.log(`! ${c.slug}: no se pudo descargar (${res.status})`);
    continue;
  }
  const input = Buffer.from(await res.arrayBuffer());
  const before = await sharp(input).metadata();
  const output = await sharp(input)
    .trim({ threshold: 10 })
    .resize({ height: LOGO_HEIGHT, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const after = await sharp(output).metadata();

  console.log(
    `- ${c.slug}: ${before.width}×${before.height} (${Math.round(input.length / 1024)} KB)` +
      ` → ${after.width}×${after.height} (${Math.round(output.length / 1024)} KB)`,
  );

  if (!APPLY) continue;

  const folder = logo.startsWith(prefix)
    ? logo.slice(prefix.length).replace(/\/[^/]+$/, "")
    : `collections/${c.slug}/logo`;
  const path = `${folder}/logo-${Date.now()}-norm.png`;

  const up = await db.storage.from(BUCKET).upload(path, output, {
    contentType: "image/png",
    cacheControl: "31536000",
    upsert: false,
  });
  if (up.error) {
    console.log(`  ! error al subir: ${up.error.message}`);
    continue;
  }
  const newUrl = `${prefix}${path}?t=${Date.now()}`;
  const upd = await db.from("collections").update({ logo_url: newUrl }).eq("id", c.id);
  console.log(upd.error ? `  ! error al guardar: ${upd.error.message}` : `  ✓ actualizado`);
}

console.log(
  APPLY
    ? "\nListo. Los cambios se ven en el sitio en unos minutos (caché) o al hacer Redeploy."
    : "\nSi todo se ve bien, corre lo mismo con --aplicar.",
);
