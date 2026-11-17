/**
 * OPTIMIZA LAS FOTOS PESADAS YA SUBIDAS A SUPABASE STORAGE
 * -----------------------------------------------------------------------------
 * Por qué: fotos de ~4 MB (4096 px) hacían que el optimizador de Next.js
 * fallara con "upstream image response timed out".
 *
 * Qué hace:
 *   1. Busca imágenes de más de 1.5 MB en los buckets del sitio.
 *   2. Crea una versión WebP de 3000 px máx. y calidad 88 (sin pérdida visible)
 *      con un nombre nuevo: foto.webp → foto-web.webp
 *   3. Cambia en la base de datos todas las referencias a la foto vieja por la
 *      nueva (proyectos, materiales, renders, colecciones, galería, bespoke).
 *   4. NO borra las fotos originales (quedan como respaldo en Storage).
 *
 * Uso (desde la carpeta del proyecto, en la terminal de VS Code):
 *   Prueba (no cambia nada):  node --env-file=.env.local scripts/optimizar-imagenes-storage.mjs
 *   Aplicar cambios:          node --env-file=.env.local scripts/optimizar-imagenes-storage.mjs --aplicar
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const APPLY = process.argv.includes("--aplicar");
const BUCKETS = ["projects", "materials", "editorial_gallery"];
const MIN_BYTES = 1.5 * 1024 * 1024;
const MAX_SIDE = 3000;
const QUALITY = 88;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const publicUrl = (bucket, path) => `${url}/storage/v1/object/public/${bucket}/${path}`;

// Recorre un bucket completo (carpetas incluidas)
async function listAll(bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 100, offset });
    if (error) throw error;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) out.push(...(await listAll(bucket, path))); // carpeta
      else out.push({ path, size: item.metadata?.size ?? 0, type: item.metadata?.mimetype ?? "" });
    }
    if (data.length < 100) break;
  }
  return out;
}

// Columnas que guardan URLs de Storage
const TARGETS = [
  ["projects", "cover_image"],
  ["projects", "gallery_images"],
  ["products", "image_url"],
  ["material_renders", "render_url"],
  ["collections", "cover_image"],
  ["collections", "gallery_images"],
  ["collections", "editorial_blocks"],
  ["gallery_photos", "image_url"],
  ["bespoke_finishes", "cover_image"],
  ["bespoke_finishes", "gallery_images"],
];

async function replaceUrls(map) {
  let changed = 0;
  for (const [table, col] of TARGETS) {
    const { data, error } = await db.from(table).select(`id, ${col}`);
    if (error) {
      console.warn(`  (omitido ${table}.${col}: ${error.message})`);
      continue;
    }
    for (const row of data) {
      const before = row[col];
      if (before == null) continue;
      let text = JSON.stringify(before);
      for (const [oldUrl, newUrl] of map) text = text.split(oldUrl).join(newUrl);
      if (text === JSON.stringify(before)) continue;
      changed++;
      if (APPLY) {
        const { error: upErr } = await db.from(table).update({ [col]: JSON.parse(text) }).eq("id", row.id);
        if (upErr) console.error(`  Error en ${table}.${col} (${row.id}): ${upErr.message}`);
      }
    }
  }
  return changed;
}

const map = [];
let savedBytes = 0;

for (const bucket of BUCKETS) {
  const files = (await listAll(bucket)).filter(
    (f) => f.type.startsWith("image/") && f.size > MIN_BYTES && !f.path.includes("-web."),
  );
  console.log(`\n${bucket}: ${files.length} imagen(es) de más de 1.5 MB`);

  for (const f of files) {
    const { data: blob, error } = await db.storage.from(bucket).download(f.path);
    if (error) {
      console.error(`  No se pudo descargar ${f.path}: ${error.message}`);
      continue;
    }
    const input = Buffer.from(await blob.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 5 })
      .toBuffer();

    const newPath = f.path.replace(/\.[^./]+$/, "") + "-web.webp";
    console.log(
      `  ${f.path}  ${(f.size / 1048576).toFixed(1)} MB → ${(output.length / 1048576).toFixed(1)} MB`,
    );
    savedBytes += f.size - output.length;

    if (APPLY) {
      const { error: upErr } = await db.storage.from(bucket).upload(newPath, output, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
      if (upErr) {
        console.error(`  Error al subir ${newPath}: ${upErr.message}`);
        continue;
      }
    }
    map.push([publicUrl(bucket, f.path), publicUrl(bucket, newPath)]);
  }
}

const rows = map.length ? await replaceUrls(map) : 0;
console.log(
  `\n${map.length} foto(s) · ahorro ${(savedBytes / 1048576).toFixed(1)} MB · ${rows} registro(s) a actualizar.`,
);
console.log(
  APPLY
    ? "Listo. Borra la carpeta .next/cache/images y reinicia `npm run dev`."
    : "Fue una PRUEBA: no se cambió nada. Para aplicar, agrega --aplicar.",
);
