"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { invalidatePublicCache } from "@/lib/data/public";

export interface ProjectFormData {
  id?: string;
  title_es: string;
  title_en?: string;
  slug: string;
  category: string;
  location?: string;
  short_description_es?: string;
  short_description_en?: string;
  description_es?: string;
  description_en?: string;
  cover_image?: string;
  gallery_images?: string[];
  material_skus?: string[];
  show_in_home: boolean;
  is_active: boolean;
  sort_order?: number;
}

function getStoragePathFromUrl(
  url?: string | null,
  bucket = "projects",
): string | null {
  if (!url || typeof url !== "string") return null;
  const prefix = `/storage/v1/object/public/${bucket}/`;
  if (!url.includes(prefix)) return null;
  return url.split(prefix)[1]?.split("?")[0] || null;
}

export async function uploadProjectCoverAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;
    if (!file || !slug) {
      return { success: false, error: "Archivo y slug requeridos." };
    }

    const supabase = await createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = `${cleanSlug}/cover-${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from("projects")
      .upload(filePath, file, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) return { success: false, error: error.message };

    const { data } = supabase.storage.from("projects").getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al subir portada.",
    };
  }
}

export async function uploadProjectGalleryAction(formData: FormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;
    if (!file || !slug) {
      return { success: false, error: "Archivo y slug requeridos." };
    }

    const supabase = await createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = `${cleanSlug}/gallery-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;

    const { error } = await supabase.storage
      .from("projects")
      .upload(filePath, file, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) return { success: false, error: error.message };

    const { data } = supabase.storage.from("projects").getPublicUrl(filePath);
    return { success: true, url: data.publicUrl };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al subir galería.",
    };
  }
}

export async function saveProjectAction(data: ProjectFormData) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const projectId = data.id;

    // Purga física de fotos retiradas en Storage
    if (projectId) {
      const { data: oldProj } = await supabase
        .from("projects")
        .select("cover_image, gallery_images")
        .eq("id", projectId)
        .single();

      if (oldProj) {
        const pathsToDelete: string[] = [];
        if (oldProj.cover_image && oldProj.cover_image !== data.cover_image) {
          const path = getStoragePathFromUrl(oldProj.cover_image);
          if (path) pathsToDelete.push(path);
        }
        const oldGallery = Array.isArray(oldProj.gallery_images)
          ? oldProj.gallery_images
          : [];
        const newGallerySet = new Set(data.gallery_images || []);
        oldGallery.forEach((url: string) => {
          if (!newGallerySet.has(url)) {
            const path = getStoragePathFromUrl(url);
            if (path) pathsToDelete.push(path);
          }
        });
        if (pathsToDelete.length > 0) {
          await supabase.storage.from("projects").remove(pathsToDelete);
        }
      }
    }

    const payload = {
      // Columnas JSONB multilenguaje
      title: { es: data.title_es, en: data.title_en || "" },
      short_description: {
        es: data.short_description_es || "",
        en: data.short_description_en || "",
      },
      description: {
        es: data.description_es || "",
        en: data.description_en || "",
      },

      // Columnas legadas para compatibilidad
      title_es: data.title_es,
      title_en: data.title_en || null,
      slug: data.slug,
      category: data.category,
      location: data.location || null,
      short_description_es: data.short_description_es || null,
      short_description_en: data.short_description_en || null,
      description_es: data.description_es || null,
      description_en: data.description_en || null,
      cover_image: data.cover_image || null,
      gallery_images: data.gallery_images || [],
      material_skus: data.material_skus || [],
      show_in_home: data.show_in_home,
      is_active: data.is_active,
      sort_order: data.sort_order || 0,
      updated_at: new Date().toISOString(),
    };

    if (projectId) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", projectId);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from("projects").insert(payload);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/[lang]/admin/projects", "page");
    revalidatePath("/[lang]/arquitectura", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al guardar proyecto.",
    };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const { data: proj } = await supabase
      .from("projects")
      .select("cover_image, gallery_images")
      .eq("id", id)
      .single();

    if (proj) {
      const pathsToDelete: string[] = [];
      if (proj.cover_image) {
        const path = getStoragePathFromUrl(proj.cover_image);
        if (path) pathsToDelete.push(path);
      }
      if (Array.isArray(proj.gallery_images)) {
        proj.gallery_images.forEach((url: string) => {
          const path = getStoragePathFromUrl(url);
          if (path) pathsToDelete.push(path);
        });
      }
      if (pathsToDelete.length > 0) {
        await supabase.storage.from("projects").remove(pathsToDelete);
      }
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/projects", "page");
    revalidatePath("/[lang]/arquitectura", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al eliminar proyecto.",
    };
  }
}

export async function toggleProjectHomeAction(
  id: string,
  show_in_home: boolean,
) {
  try {
    const guard = await requireAdmin();
    if (!guard.authorized) return { success: false, error: guard.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from("projects")
      .update({ show_in_home, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/[lang]/admin/projects", "page");
    revalidatePath("/[lang]/arquitectura", "page");
    revalidatePath("/[lang]", "page");
    invalidatePublicCache();
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al actualizar.",
    };
  }
}
