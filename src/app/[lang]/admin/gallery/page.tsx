import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import GalleryManagerClient from "./GalleryManagerClient";

export const dynamic = "force-dynamic";

interface AdminGalleryPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AdminGalleryPage({
  params,
}: AdminGalleryPageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const supabase = await createClient();

  const { data: photos, error } = await supabase
    .from("gallery_photos")
    .select(
      "id, title, description, project_type, image_url, storage_path, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar galería en admin:", error);
  }

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-8 font-sans">
        <div className="border-b border-border-light pb-4 space-y-1">
          <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
            MÓDULO DE GALERÍA
          </span>
          <h1 className="font-sans font-light text-maya-h2 uppercase tracking-editorial text-black-neutral">
            EXPLORADOR EDITORIAL
          </h1>
          <p className="font-mono text-maya-small text-black-neutral/60 uppercase tracking-data">
            Administración e inspección de fotografías almacenadas en Storage
          </p>
        </div>

        <GalleryManagerClient initialPhotos={photos || []} lang={lang} />
      </div>
    </AdminLayout>
  );
}
