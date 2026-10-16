"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { invalidatePublicCache } from "@/lib/data/public";

export interface EditorialBlockData {
  id: string;
  title: string;
  title_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  content: string;
  content_en?: string;
  curatorialNote?: string;
  curatorialNote_en?: string;
  bullets?: string[];
  imageUrl?: string;
}

export interface CollectionFormData {
  id?: string;
  title_es: string;
  title_en?: string;
  slug: string;
  logo_url?: string;
  tagline_es?: string;
  tagline_en?: string;
  manifest_es?: string;
  manifest_en?: string;
  description_es?: string;
  description_en?: string;
  cover_image?: string;
  video_url?: string;
  gallery_images?: string[];
  editorial_blocks?: EditorialBlockData[];
  is_active: boolean;
  selected_skus: string[];
}

export interface BespokeFinishData {
  id?: string;
  title_es: string;
  title_en?: string;
  slug: string;
  subtitle_es?: string;
  subtitle_en?: string;
  description_es?: string;
  description_en?: string;
  cover_image?: string;
  gallery_images?: string[];
  applications?: string[];
  compatible_materials_skus?: string[];
  sort_order?: number;
  is_active: boolean;
  show_in_home: boolean;
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
// SECCIÓN: ACCIONES DE COLECCIONES
// ==========================================

export async function uploadCollectionCoverAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file || !slug) {
      return { success: false, error: "Archivo y Slug son requeridos." };
    }

    const supabase = await createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `cover-${Date.now()}.webp`;
    const filePath = `collections/${cleanSlug}/${fileName}`;

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

    return {
      success: true,
      url: `${publicData.publicUrl}?t=${Date.now()}`,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al subir portada.";
    return { success: false, error: message };
  }
}

export async function uploadCollectionLogoAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file || !slug) {
      return { success: false, error: "Archivo y Slug son requeridos." };
    }

    const supabase = await createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "webp";
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `collections/${cleanSlug}/logo/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file, {
        contentType: file.type || "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: publicData } = supabase.storage
      .from("materials")
      .getPublicUrl(filePath);

    return {
      success: true,
      url: `${publicData.publicUrl}?t=${Date.now()}`,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al subir logo de la colección.";
    return { success: false, error: message };
  }
}

export async function uploadCollectionGalleryAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file || !slug) {
      return { success: false, error: "Archivo y Slug son requeridos." };
    }

    const supabase = await createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
    const filePath = `collections/${cleanSlug}/gallery/${fileName}`;

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

    return {
      success: true,
      url: `${publicData.publicUrl}?t=${Date.now()}`,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al subir imagen a galería.";
    return { success: false, error: message };
  }
}

export async function saveCollectionAction(data: CollectionFormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    let collectionId = data.id;

    if (collectionId) {
      const { data: oldCol } = await supabase
        .from("collections")
        .select("cover_image, logo_url, video_url, gallery_images")
        .eq("id", collectionId)
        .single();

      if (oldCol) {
        const pathsToDelete: string[] = [];

        if (oldCol.cover_image && oldCol.cover_image !== data.cover_image) {
          const path = getStoragePathFromUrl(oldCol.cover_image);
          if (path) pathsToDelete.push(path);
        }

        if (oldCol.logo_url && oldCol.logo_url !== data.logo_url) {
          const path = getStoragePathFromUrl(oldCol.logo_url);
          if (path) pathsToDelete.push(path);
        }

        if (oldCol.video_url && oldCol.video_url !== data.video_url) {
          const path = getStoragePathFromUrl(oldCol.video_url);
          if (path) pathsToDelete.push(path);
        }

        const oldGallery = Array.isArray(oldCol.gallery_images)
          ? oldCol.gallery_images
          : [];
        const newGallerySet = new Set(data.gallery_images || []);

        oldGallery.forEach((oldUrl: string) => {
          if (!newGallerySet.has(oldUrl)) {
            const path = getStoragePathFromUrl(oldUrl);
            if (path) pathsToDelete.push(path);
          }
        });

        if (pathsToDelete.length > 0) {
          await supabase.storage.from("materials").remove(pathsToDelete);
        }
      }
    }

    const normalizedEditorialBlocks = (data.editorial_blocks || []).map(
      (b) => ({
        id: b.id,
        title: b.title || "",
        title_en: b.title_en || "",
        subtitle: b.subtitle || "",
        subtitle_en: b.subtitle_en || "",
        content: b.content || "",
        content_en: b.content_en || "",
        curatorialNote: b.curatorialNote || "",
        curatorialNote_en: b.curatorialNote_en || "",
        bullets: Array.isArray(b.bullets) ? b.bullets : [],
        imageUrl: b.imageUrl || "",
      }),
    );

    const payload = {
      title: { es: data.title_es, en: data.title_en || data.title_es },
      tagline: {
        es: data.tagline_es || "",
        en: data.tagline_en || data.tagline_es || "",
      },
      manifest: {
        es: data.manifest_es || "",
        en: data.manifest_en || data.manifest_es || "",
      },
      description: {
        es: data.description_es || "",
        en: data.description_en || data.description_es || "",
      },

      title_es: data.title_es,
      title_en: data.title_en || null,
      slug: data.slug,
      logo_url: data.logo_url || null,
      tagline_es: data.tagline_es || null,
      tagline_en: data.tagline_en || null,
      manifest_es: data.manifest_es || null,
      manifest_en: data.manifest_en || null,
      description_es: data.description_es || null,
      description_en: data.description_en || null,

      cover_image: data.cover_image || null,
      video_url: data.video_url || null,
      gallery_images: data.gallery_images || [],
      editorial_blocks: normalizedEditorialBlocks,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    };

    if (collectionId) {
      const { error: updateError } = await supabase
        .from("collections")
        .update(payload)
        .eq("id", collectionId);

      if (updateError) return { success: false, error: updateError.message };
    } else {
      const { data: newCol, error: insertError } = await supabase
        .from("collections")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) return { success: false, error: insertError.message };
      collectionId = newCol.id;
    }

    await supabase
      .from("collection_products")
      .delete()
      .eq("collection_id", collectionId);

    if (data.selected_skus && data.selected_skus.length > 0) {
      const junctionRows = data.selected_skus.map((sku, index) => ({
        collection_id: collectionId,
        product_sku: sku,
        sort_order: index + 1,
      }));

      const { error: junctionError } = await supabase
        .from("collection_products")
        .insert(junctionRows);

      if (junctionError)
        return { success: false, error: junctionError.message };
    }

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al guardar la colección.";
    return { success: false, error: message };
  }
}

export async function deleteCollectionAction(id: string) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();

    const { data: col } = await supabase
      .from("collections")
      .select("cover_image, logo_url, video_url, gallery_images")
      .eq("id", id)
      .single();

    if (col) {
      const pathsToDelete: string[] = [];

      if (col.cover_image) {
        const path = getStoragePathFromUrl(col.cover_image);
        if (path) pathsToDelete.push(path);
      }

      if (col.logo_url) {
        const path = getStoragePathFromUrl(col.logo_url);
        if (path) pathsToDelete.push(path);
      }

      if (col.video_url) {
        const path = getStoragePathFromUrl(col.video_url);
        if (path) pathsToDelete.push(path);
      }

      if (Array.isArray(col.gallery_images)) {
        col.gallery_images.forEach((url: string) => {
          const path = getStoragePathFromUrl(url);
          if (path) pathsToDelete.push(path);
        });
      }

      if (pathsToDelete.length > 0) {
        await supabase.storage.from("materials").remove(pathsToDelete);
      }
    }

    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar la colección.";
    return { success: false, error: message };
  }
}

// ==========================================
// SECCIÓN: MATERIAL DESTACADO Y RENDERS
// ==========================================

export async function setSingleFeaturedProductAction(selectedSku: string) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();

    const { error: resetError } = await supabase
      .from("products")
      .update({ is_featured: false })
      .neq("sku", "___dummy___");

    if (resetError) return { success: false, error: resetError.message };

    const { error: setFeaturedError } = await supabase
      .from("products")
      .update({ is_featured: true, updated_at: new Date().toISOString() })
      .eq("sku", selectedSku);

    if (setFeaturedError)
      return { success: false, error: setFeaturedError.message };

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al actualizar material destacado.";
    return { success: false, error: message };
  }
}

export async function toggleFeaturedProductAction(
  sku: string,
  isFeatured: boolean,
) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq("sku", sku);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de servidor.";
    return { success: false, error: message };
  }
}

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

    const { error: dbError } = await supabase.from("material_renders").insert({
      product_sku: sku,
      render_url: publicData.publicUrl,
      application,
    });

    if (dbError) return { success: false, error: dbError.message };

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
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

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar el render.";
    return { success: false, error: message };
  }
}

export async function updateFeaturedMaterialDetailsAction(payload: {
  sku: string;
  description?: string;
  description_en?: string;
  uses?: string[];
  uses_en?: string[];
  is_featured: boolean;
}) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({
        description: payload.description,
        description_en: payload.description_en || null,
        description_i18n: {
          es: payload.description || "",
          en: payload.description_en || "",
        },
        uses: payload.uses || [],
        uses_en: payload.uses_en || payload.uses || [],
        is_featured: payload.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq("sku", payload.sku);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error al actualizar detalles.";
    return { success: false, error: message };
  }
}

// ==========================================
// SECCIÓN: ACABADOS BESPOKE (CONSERVADOS)
// ==========================================

export async function getBespokeFinishes(onlyActive = true) {
  const supabase = await createClient();
  let query = supabase
    .from("bespoke_finishes")
    .select("*")
    .order("sort_order", { ascending: true });

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener bespoke finishes:", error.message);
    return [];
  }
  return data || [];
}

export async function uploadBespokeImageAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file || !slug) {
      return { success: false, error: "Archivo y Slug requeridos." };
    }

    const supabase = await createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `bespoke-${Date.now()}.webp`;
    const filePath = `bespoke/${cleanSlug}/${fileName}`;

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

    return { success: true, url: `${publicData.publicUrl}?t=${Date.now()}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error de subida.";
    return { success: false, error: message };
  }
}

export async function saveBespokeFinishAction(data: BespokeFinishData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const payload = {
      title: { es: data.title_es, en: data.title_en || "" },
      subtitle: { es: data.subtitle_es || "", en: data.subtitle_en || "" },
      description: {
        es: data.description_es || "",
        en: data.description_en || "",
      },

      title_es: data.title_es,
      title_en: data.title_en || null,
      slug: data.slug,
      subtitle_es: data.subtitle_es || null,
      subtitle_en: data.subtitle_en || null,
      description_es: data.description_es || null,
      description_en: data.description_en || null,
      cover_image: data.cover_image || null,
      gallery_images: data.gallery_images || [],
      applications: data.applications || [],
      compatible_materials_skus: data.compatible_materials_skus || [],
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active,
      show_in_home: data.show_in_home,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await supabase
        .from("bespoke_finishes")
        .update(payload)
        .eq("id", data.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from("bespoke_finishes").insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al guardar.";
    return { success: false, error: message };
  }
}

export async function deleteBespokeFinishAction(id: string) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from("bespoke_finishes")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/colecciones", "page");
    revalidatePath("/[lang]/coleccion", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al eliminar.";
    return { success: false, error: message };
  }
}
