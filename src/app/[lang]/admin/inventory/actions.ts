"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { invalidatePublicCache } from "@/lib/data/public";

// ==========================================
// INTERFACES Y TIPOS
// ==========================================

export interface RenderItem {
  id: string;
  product_sku: string;
  render_url: string;
  application: string;
}

export interface ExtendedProductData {
  sku?: string;
  product_name?: string;
  aka?: string | null;
  category?: string;
  stone_type?: string;
  type?: string;
  kind?: string;
  origin?: string;
  status?: string;
  description?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  formats?: string[];
  finishes?: string[];
  uses?: string[];
  uses_en?: string[];
  material_renders?: RenderItem[];
}

function getStoragePathFromUrl(
  url: string | null | undefined,
  bucket = "materials",
): string | null {
  if (!url || typeof url !== "string") return null;
  const bucketPrefix = `/storage/v1/object/public/${bucket}/`;
  if (!url.includes(bucketPrefix)) return null;
  const parts = url.split(bucketPrefix);
  return parts[1] ? parts[1].split("?")[0] : null;
}

// ==========================================
// STORAGE & SUBIDA DE MULTIMEDIA (PLACA PRINCIPAL)
// ==========================================

export async function uploadMaterialImageAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const sku = formData.get("sku") as string;

    if (!file)
      return { success: false, error: "No se seleccionó ningún archivo." };
    if (!sku)
      return {
        success: false,
        error: "El SKU es requerido para asociar la imagen.",
      };

    const MAX_SIZE_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return {
        success: false,
        error: "La imagen excede el tamaño máximo permitido (2 MB).",
      };
    }

    const supabase = await createClient();
    const cleanSku = sku.trim().replace(/[^a-zA-Z0-9_-]/g, "");

    const fileName = `main.webp`;
    const filePath = `products/${cleanSku}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data } = supabase.storage.from("materials").getPublicUrl(filePath);
    const publicUrlWithCacheBust = `${data.publicUrl}?t=${Date.now()}`;

    return { success: true, url: publicUrlWithCacheBust };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al subir la imagen.";
    return { success: false, error: message };
  }
}

export async function deleteMaterialImageAction(sku: string) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const cleanSku = sku.trim().replace(/[^a-zA-Z0-9_-]/g, "");

    await supabase.storage
      .from("materials")
      .remove([
        `products/${cleanSku}/main.jpg`,
        `products/${cleanSku}/main.png`,
        `products/${cleanSku}/main.jpeg`,
        `products/${cleanSku}/main.webp`,
      ]);

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar la imagen.";
    return { success: false, error: message };
  }
}

// ==========================================
// RENDERS DE MATERIALES (BUCKET: materials/renders)
// ==========================================

export async function uploadMaterialRenderAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const sku = formData.get("sku") as string;
    const application =
      (formData.get("application") as string) || "Aplicación Arquitectónica";

    if (!file || !sku) {
      return { success: false, error: "Archivo y SKU son requeridos." };
    }

    const supabase = await createClient();
    const cleanSku = sku.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
    const filePath = `renders/${cleanSku}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: publicData } = supabase.storage
      .from("materials")
      .getPublicUrl(filePath);

    const { data: insertedData, error: dbError } = await supabase
      .from("material_renders")
      .insert({
        product_sku: sku,
        render_url: publicData.publicUrl,
        application,
      })
      .select()
      .single();

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath("/[lang]/admin/inventario", "page");
    revalidatePath("/[lang]/catalogo", "page");
    revalidatePath("/[lang]/colecciones", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();

    return { success: true, data: insertedData };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al procesar el render.";
    return { success: false, error: message };
  }
}

export async function deleteMaterialRenderAction(
  renderId: string,
  renderUrl: string,
) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();

    const storagePath = getStoragePathFromUrl(renderUrl, "materials");
    if (storagePath) {
      await supabase.storage.from("materials").remove([storagePath]);
    }

    const { error } = await supabase
      .from("material_renders")
      .delete()
      .eq("id", renderId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/inventario", "page");
    revalidatePath("/[lang]/catalogo", "page");
    revalidatePath("/[lang]/colecciones", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar el render.";
    return { success: false, error: message };
  }
}

export async function getMaterialRendersAction(sku: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("material_renders")
      .select("*")
      .eq("product_sku", sku)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message, data: [] };
    return { success: true, data: data || [] };
  } catch (err: unknown) {
    return { success: false, error: "Error al consultar renders.", data: [] };
  }
}

// ==========================================
// CONSULTAS DE INVENTARIO
// ==========================================

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, material_renders(*)")
    .order("updated_at", { ascending: false });

  if (error) return [];

  return (data || []).map((p: any) => {
    const descI18n =
      typeof p.description_i18n === "object" && p.description_i18n !== null
        ? p.description_i18n
        : {};

    return {
      ...p,
      description: descI18n.es || p.description || "",
      description_en: descI18n.en || p.description_en || "",
      uses: Array.isArray(p.uses) ? p.uses : [],
      uses_en: Array.isArray(p.uses_en)
        ? p.uses_en
        : Array.isArray(p.uses)
          ? p.uses
          : [],
      material_renders: Array.isArray(p.material_renders)
        ? p.material_renders
        : [],
    };
  });
}

export async function getInventorySummary() {
  const supabase = await createClient();

  const [totalRes, activeRes, lastUpdatedRes] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("products")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const total = totalRes.count || 0;
  const active = activeRes.count || 0;
  const lastSync: string | null = lastUpdatedRes.data?.updated_at ?? null;

  return {
    total,
    active,
    outOfStock: total - active,
    lastSync,
  };
}

// ==========================================
// OPERACIONES CRUD INDIVIDUALES
// ==========================================

export async function createProductAction(data: ExtendedProductData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();

    if (!data.sku || !data.product_name) {
      return { success: false, error: "El SKU y el Nombre son obligatorios." };
    }

    const rawUrl = data.image_url;
    const cleanImage = rawUrl && rawUrl.trim() !== "" ? rawUrl.trim() : null;

    const { error } = await supabase.from("products").insert({
      sku: data.sku.trim(),
      product_name: data.product_name.trim(),
      aka: data.aka ?? null,
      category: data.category || "Otros",
      stone_type: data.stone_type || "",
      type: data.type || "SLAB",
      kind: data.kind || "Stock",
      origin: data.origin || "-",
      description: data.description ?? null,
      description_en: data.description_en ?? null,
      description_i18n: {
        es: data.description || "",
        en: data.description_en || "",
      },
      image_url: cleanImage,
      formats: Array.isArray(data.formats) ? data.formats : [],
      finishes: Array.isArray(data.finishes) ? data.finishes : [],
      uses: Array.isArray(data.uses) ? data.uses : [],
      uses_en: Array.isArray(data.uses_en)
        ? data.uses_en
        : Array.isArray(data.uses)
          ? data.uses
          : [],
      status: data.status || "active",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Ya existe un producto con este SKU." };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/[lang]/admin/inventario", "page");
    revalidatePath("/[lang]/catalogo", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al crear el producto.";
    return { success: false, error: message };
  }
}

export async function updateProductAction(
  sku: string,
  data: ExtendedProductData,
) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();

    const rawUrl = data.image_url;
    const cleanImage = rawUrl && rawUrl.trim() !== "" ? rawUrl.trim() : null;

    const { error } = await supabase
      .from("products")
      .update({
        product_name: data.product_name,
        aka: data.aka ?? null,
        category: data.category,
        stone_type: data.stone_type,
        type: data.type,
        kind: data.kind,
        origin: data.origin,
        description: data.description ?? null,
        description_en: data.description_en ?? null,
        description_i18n: {
          es: data.description || "",
          en: data.description_en || "",
        },
        image_url: cleanImage,
        formats: Array.isArray(data.formats) ? data.formats : [],
        finishes: Array.isArray(data.finishes) ? data.finishes : [],
        uses: Array.isArray(data.uses) ? data.uses : [],
        uses_en: Array.isArray(data.uses_en)
          ? data.uses_en
          : Array.isArray(data.uses)
            ? data.uses
            : [],
        status: data.status || "active",
        updated_at: new Date().toISOString(),
      })
      .eq("sku", sku);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/inventario", "page");
    revalidatePath("/[lang]/catalogo", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al actualizar.";
    return { success: false, error: message };
  }
}

export async function deleteProductAction(sku: string) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();

    const { error } = await supabase.from("products").delete().eq("sku", sku);
    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/inventario", "page");
    revalidatePath("/[lang]/catalogo", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar.";
    return { success: false, error: message };
  }
}
