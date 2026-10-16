import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import ProjectsManagerClient from "./ProjectsManagerClient";
import { ProjectFormData } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function AdminProjectsPage({ params }: Props) {
  const { lang } = await params;
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) console.error("Error al cargar proyectos:", error.message);

  const formattedProjects: ProjectFormData[] = (projects || []).map(
    (p: any) => {
      const titleObj =
        typeof p.title === "object" && p.title !== null ? p.title : {};
      const shortDescObj =
        typeof p.short_description === "object" && p.short_description !== null
          ? p.short_description
          : {};
      const descObj =
        typeof p.description === "object" && p.description !== null
          ? p.description
          : {};

      return {
        id: p.id,
        title_es: titleObj.es || p.title_es || "",
        title_en: titleObj.en || p.title_en || "",
        slug: p.slug,
        category: p.category,
        location: p.location || "",
        short_description_es: shortDescObj.es || p.short_description_es || "",
        short_description_en: shortDescObj.en || p.short_description_en || "",
        description_es: descObj.es || p.description_es || "",
        description_en: descObj.en || p.description_en || "",
        cover_image: p.cover_image || "",
        gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : [],
        material_skus: Array.isArray(p.material_skus) ? p.material_skus : [],
        show_in_home: p.show_in_home ?? false,
        is_active: p.is_active ?? true,
        sort_order: p.sort_order ?? 0,
      };
    },
  );

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-8 font-sans">
        <div className="border-b border-border-light pb-4 space-y-1">
          <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
            ESTUDIO & OBRAS EMBLEMÁTICAS
          </span>
          <h1 className="font-sans font-light text-maya-h2 text-black-neutral uppercase tracking-editorial">
            GESTIÓN DE PROYECTOS ARQUITECTÓNICOS
          </h1>
          <p className="font-mono text-maya-small text-black-neutral/60 uppercase tracking-data">
            Administración de obras, fichas técnicas y presencia en la Home
          </p>
        </div>

        <ProjectsManagerClient initialProjects={formattedProjects} />
      </div>
    </AdminLayout>
  );
}
