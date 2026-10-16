import { createClient } from "@/lib/supabase/server";
import AdminLayout from "@/components/admin/AdminLayout";
import CollectionsManagerClient from "./CollectionsManagerClient";
import { getBespokeFinishes } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function AdminColeccionesPage({ params }: Props) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const supabase = await createClient();

  const [
    { data: collections, error: colError },
    { data: products, error: prodError },
    bespokeFinishes,
  ] = await Promise.all([
    supabase
      .from("collections")
      .select(
        `
          *,
          collection_products (
            product_sku,
            sort_order,
            products (
              sku,
              product_name,
              category,
              image_url
            )
          )
        `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select(
        `
          *,
          material_renders!product_sku (
            id,
            product_sku,
            render_url,
            application
          )
        `,
      )
      .order("product_name", { ascending: true }),
    getBespokeFinishes(false),
  ]);

  if (colError) console.error("Error al cargar colecciones:", colError.message);
  if (prodError) console.error("Error al cargar productos:", prodError.message);

  // Normalización con soporte bilingüe (JSONB + legadas)
  const formattedCollections = (collections || []).map((col: any) => {
    const sortedProducts = (col.collection_products || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((cp: any) => cp.products)
      .filter(Boolean);

    const titleObj =
      typeof col.title === "object" && col.title !== null ? col.title : {};
    const taglineObj =
      typeof col.tagline === "object" && col.tagline !== null
        ? col.tagline
        : {};
    const manifestObj =
      typeof col.manifest === "object" && col.manifest !== null
        ? col.manifest
        : {};
    const descObj =
      typeof col.description === "object" && col.description !== null
        ? col.description
        : {};

    return {
      id: col.id,
      title_es: titleObj.es || col.title_es || "",
      title_en: titleObj.en || col.title_en || "",
      slug: col.slug,
      tagline_es: taglineObj.es || col.tagline_es || "",
      tagline_en: taglineObj.en || col.tagline_en || "",
      manifest_es: manifestObj.es || col.manifest_es || "",
      manifest_en: manifestObj.en || col.manifest_en || "",
      description_es: descObj.es || col.description_es || "",
      description_en: descObj.en || col.description_en || "",
      cover_image: col.cover_image || "",
      logo_url: col.logo_url || "",
      video_url: col.video_url || "",
      gallery_images: Array.isArray(col.gallery_images)
        ? col.gallery_images
        : [],
      editorial_blocks: Array.isArray(col.editorial_blocks)
        ? col.editorial_blocks
        : typeof col.editorial_blocks === "string"
          ? JSON.parse(col.editorial_blocks || "[]")
          : [],
      is_active: col.is_active,
      selected_skus: sortedProducts.map((p: any) => p.sku),
      assigned_products: sortedProducts,
    };
  });

  return (
    <AdminLayout lang={lang}>
      <div className="space-y-8 font-sans">
        <div className="border-b border-black-neutral/15 pb-4">
          <span className="text-[10px] uppercase tracking-data text-accent-ink font-medium block font-mono">
            MÓDULO DE CURADURÍA
          </span>
          <h1 className="font-sans font-light text-2xl md:text-3xl text-black-neutral uppercase tracking-editorial mt-1">
            COLECCIONES Y DESTACADOS
          </h1>
          <p className="font-mono text-xs text-black-neutral/60 uppercase tracking-data mt-1">
            Organiza los catálogos temáticos, procesos de taller y materiales de
            portada
          </p>
        </div>

        <CollectionsManagerClient
          initialCollections={formattedCollections}
          availableProducts={products || []}
          initialBespoke={bespokeFinishes || []}
        />
      </div>
    </AdminLayout>
  );
}
