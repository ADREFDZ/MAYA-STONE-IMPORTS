"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { revalidatePath } from "next/cache";
import { invalidatePublicCache } from "@/lib/data/public";

export async function deleteGalleryPhoto(
  id: string,
  storagePath: string,
  lang: string,
) {
  const guard = await requireAdmin();
  if (!guard.authorized) return { success: false, message: guard.error };

  const supabase = await createClient();

  // 1. Borrar archivo de Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("editorial_gallery")
    .remove([storagePath]);

  if (storageError) {
    console.error("Error al borrar en Storage:", storageError);
    return {
      success: false,
      message: "Error al borrar el archivo físico de Storage.",
    };
  }

  // 2. Borrar registro de la base de datos
  const { error: dbError } = await supabase
    .from("gallery_photos")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error("Error al borrar en BD:", dbError);
    return {
      success: false,
      message: "Error al eliminar el registro de la base de datos.",
    };
  }

  revalidatePath(`/${lang}/admin/gallery`);
  revalidatePath(`/${lang}/about`);
  invalidatePublicCache();

  return { success: true };
}

export async function updateGalleryPhoto(
  id: string,
  data: {
    title: string;
    project_type: string | null;
    description: string | null;
  },
  lang: string,
) {
  const guard = await requireAdmin();
  if (!guard.authorized) return { success: false, message: guard.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("gallery_photos")
    .update({
      title: data.title,
      project_type: data.project_type,
      description: data.description,
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar fotografía:", error);
    return { success: false, message: error.message };
  }

  revalidatePath(`/${lang}/admin/gallery`);
  revalidatePath(`/${lang}/about`);
  invalidatePublicCache();

  return { success: true };
}
