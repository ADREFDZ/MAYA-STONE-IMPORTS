"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CollectionModal from "./CollectionModal";
import FeaturedHomeModal from "./FeaturedHomeModal";
import SelectFeaturedMaterialModal from "./SelectFeaturedMaterialModal";
import BespokeModal from "./BespokeModal";
import {
  deleteCollectionAction,
  deleteBespokeFinishAction,
  EditorialBlockData,
  BespokeFinishData,
} from "./actions";

export interface CollectionItem {
  id: string;
  title_es: string;
  slug: string;
  tagline_es?: string;
  manifest_es?: string;
  description_es?: string;
  cover_image?: string;
  video_url?: string;
  gallery_images?: string[];
  editorial_blocks?: EditorialBlockData[];
  is_active: boolean;
  selected_skus: string[];
  assigned_products: Array<{
    sku: string;
    product_name: string;
    category: string;
    image_url?: string | null;
  }>;
}

interface ProductExtended {
  sku: string;
  product_name: string;
  category: string;
  stone_type?: string;
  origin?: string;
  image_url?: string | null;
  description?: string | null;
  uses?: string[] | null;
  material_renders?: any[] | null;
  is_featured?: boolean;
}

interface Props {
  initialCollections: CollectionItem[];
  availableProducts: ProductExtended[];
  initialBespoke: BespokeFinishData[];
}

export default function CollectionsManagerClient({
  initialCollections,
  availableProducts,
  initialBespoke,
}: Props) {
  const router = useRouter();

  // Se omite "bespoke" de las pestañas activas visibles
  const [activeTab, setActiveTab] = useState<"collections" | "featured_home">(
    "collections",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<CollectionItem | null>(null);

  const [isSelectMaterialOpen, setIsSelectMaterialOpen] = useState(false);
  const [editingFeaturedProduct, setEditingFeaturedProduct] =
    useState<ProductExtended | null>(null);

  // Estados conservados intactos para reactivación futura
  const [isBespokeModalOpen, setIsBespokeModalOpen] = useState(false);
  const [selectedBespoke, setSelectedBespoke] =
    useState<BespokeFinishData | null>(null);

  const currentFeatured = availableProducts.find((p) => p.is_featured) || null;

  const handleCreateCollection = () => {
    setSelectedCollection(null);
    setIsModalOpen(true);
  };

  const handleEditCollection = (col: CollectionItem) => {
    setSelectedCollection(col);
    setIsModalOpen(true);
  };

  const handleDeleteCollection = async (id: string, title: string) => {
    if (confirm(`¿Estás seguro de eliminar la colección "${title}"?`)) {
      const res = await deleteCollectionAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert("Error al eliminar: " + res.error);
      }
    }
  };

  // Handlers conservados para cuando se reactive el módulo
  const handleCreateBespoke = () => {
    setSelectedBespoke(null);
    setIsBespokeModalOpen(true);
  };

  const handleEditBespoke = (item: BespokeFinishData) => {
    setSelectedBespoke(item);
    setIsBespokeModalOpen(true);
  };

  const handleDeleteBespoke = async (id: string, title: string) => {
    if (confirm(`¿Estás seguro de eliminar el acabado "${title}"?`)) {
      const res = await deleteBespokeFinishAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert("Error al eliminar: " + res.error);
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Selector de Pestañas de Gestión */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-surface border border-border-light p-4 rounded-2xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("collections")}
            className={`px-3.5 py-2 font-mono text-maya-label uppercase tracking-data transition-colors cursor-pointer border rounded-3xs ${
              activeTab === "collections"
                ? "bg-black-neutral text-white font-bold border-black-neutral shadow-xs"
                : "bg-surface text-black-neutral/70 border-border-light hover:border-black-neutral/40"
            }`}
          >
            Colecciones Curadas ({initialCollections.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("featured_home")}
            className={`px-3.5 py-2 font-mono text-maya-label uppercase tracking-data transition-colors cursor-pointer border rounded-3xs ${
              activeTab === "featured_home"
                ? "bg-accent text-white font-bold border-accent shadow-xs"
                : "bg-surface text-black-neutral/70 border-border-light hover:border-black-neutral/40"
            }`}
          >
            Material Portada Home
          </button>
        </div>

        {activeTab === "collections" && (
          <button
            type="button"
            onClick={handleCreateCollection}
            className="bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data px-4 py-2 hover:bg-black-pure transition-colors cursor-pointer rounded-3xs shrink-0"
          >
            + Nueva Colección
          </button>
        )}
      </div>

      {/* ─── TAB 1: COLECCIONES (TARJETAS TOTALMENTE BLANCAS) ─── */}
      {activeTab === "collections" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialCollections.map((col) => (
            <div
              key={col.id}
              className="bg-surface border border-border-light flex flex-col justify-between hover:border-border-strong transition-all rounded-2xs group overflow-hidden shadow-2xs"
            >
              <div className="bg-surface">
                {/* Cabecera de Imágenes */}
                <div className="h-44 bg-surface border-b border-border-light p-2.5 grid grid-cols-3 gap-1.5 overflow-hidden relative">
                  {col.cover_image ? (
                    <div className="col-span-3 h-full bg-surface overflow-hidden relative rounded-3xs border border-border-light">
                      <img
                        src={col.cover_image}
                        alt={col.title_es}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <span className="absolute bottom-2 left-2 bg-black-pure/85 text-white font-mono text-[9px] uppercase tracking-data px-2 py-0.5 rounded-3xs">
                        PORTADA
                      </span>
                    </div>
                  ) : col.assigned_products.length > 0 ? (
                    col.assigned_products.slice(0, 3).map((prod, idx) => (
                      <div
                        key={idx}
                        className="h-full bg-surface border border-border-light overflow-hidden relative rounded-3xs"
                      >
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-black-neutral/30">
                            Sin Foto
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 flex items-center justify-center font-mono text-maya-label text-black-neutral/30 uppercase">
                      Sin materiales asignados
                    </div>
                  )}
                </div>

                {/* Contenido Editorial */}
                <div className="p-5 space-y-2.5 bg-surface">
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-medium text-maya-h4 uppercase text-black-neutral">
                      {col.title_es}
                    </h3>
                    <span className="font-mono text-maya-label text-black-neutral/60 bg-surface px-2.5 py-0.5 rounded-3xs border border-border-light">
                      {col.editorial_blocks?.length || 0} Bloques
                    </span>
                  </div>

                  <p className="font-mono text-maya-label text-accent-ink tracking-wide">
                    /{col.slug}
                  </p>

                  {col.tagline_es && (
                    <p className="font-serif italic text-maya-small text-black-neutral/70 line-clamp-1">
                      &ldquo;{col.tagline_es}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Barra de Acciones */}
              <div className="p-4 border-t border-border-light bg-surface flex justify-end gap-2 font-mono text-maya-label uppercase tracking-data">
                <button
                  type="button"
                  onClick={() => handleEditCollection(col)}
                  className="px-3.5 py-1.5 text-black-neutral bg-surface border border-border-light hover:border-black-neutral hover:bg-surface-secondary transition-colors cursor-pointer rounded-3xs"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCollection(col.id, col.title_es)}
                  className="px-3.5 py-1.5 text-red-600 bg-surface border border-red-200 hover:bg-red-50/70 transition-colors cursor-pointer rounded-3xs"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 2: MATERIAL DESTACADO EN HOME ─── */}
      {activeTab === "featured_home" && (
        <div className="space-y-6">
          <div className="bg-amber-50/90 border border-amber-200 p-4 font-mono text-maya-small text-amber-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-2xs shadow-2xs">
            <div>
              <p className="font-bold uppercase tracking-data">
                MATERIAL PROTAGONISTA ACTUAL EN PORTADA
              </p>
              <p className="font-sans font-light text-maya-label text-amber-900/80 mt-0.5">
                Pieza principal que encabeza la sección editorial de materia
                prima.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSelectMaterialOpen(true)}
              className="bg-black-neutral text-white font-mono text-maya-label uppercase tracking-data px-4 py-2.5 hover:bg-black-pure transition-colors cursor-pointer shrink-0 rounded-3xs shadow-xs"
            >
              Cambiar Material Destacado ⇄
            </button>
          </div>

          {currentFeatured ? (
            <div className="bg-surface border-2 border-accent p-6 rounded-2xs shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 h-56 bg-surface border border-border-light overflow-hidden relative rounded-3xs shadow-2xs">
                {currentFeatured.image_url ? (
                  <img
                    src={currentFeatured.image_url}
                    alt={currentFeatured.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-black-neutral/30">
                    SIN FOTO
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-accent text-white font-mono text-maya-label font-bold px-2.5 py-1 uppercase tracking-wider rounded-3xs shadow-xs">
                  PORTADA HOME
                </span>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div>
                  <span className="font-mono text-maya-small text-accent-ink font-bold block">
                    SKU: {currentFeatured.sku}
                  </span>
                  <h2 className="font-sans font-light text-maya-h2 text-black-neutral uppercase tracking-editorial mt-0.5">
                    {currentFeatured.product_name}
                  </h2>
                  <p className="font-mono text-maya-label text-black-neutral/60">
                    Categoría: {currentFeatured.category} · Origen:{" "}
                    {currentFeatured.origin || "Importación Directa"}
                  </p>
                </div>

                <div className="bg-surface p-3.5 border border-border-light font-sans text-maya-small text-black-neutral/80 rounded-3xs">
                  <p className="font-mono text-maya-label text-black-neutral/50 uppercase block mb-1 font-semibold">
                    Reseña Editorial en Home:
                  </p>
                  <p className="line-clamp-2 font-light">
                    {currentFeatured.description ||
                      "Selección de materia prima natural curada para proyectos arquitectónicos de alta especificidad."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFeaturedProduct(currentFeatured)}
                    className="bg-black-neutral text-white font-mono text-maya-label uppercase tracking-data px-5 py-2.5 hover:bg-black-pure transition-colors cursor-pointer font-bold rounded-3xs shadow-xs"
                  >
                    Subir Renders y Editar Detalles (
                    {Array.isArray(currentFeatured.material_renders)
                      ? currentFeatured.material_renders.length
                      : 0}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSelectMaterialOpen(true)}
                    className="border border-border-strong text-black-neutral font-mono text-maya-label uppercase tracking-data px-4 py-2.5 hover:bg-surface transition-colors cursor-pointer rounded-3xs"
                  >
                    Elegir Otro Material
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-border-strong p-12 text-center space-y-4 rounded-2xs">
              <p className="font-mono text-maya-small text-black-neutral/50 uppercase">
                No hay ningún material seleccionado como destacado actualmente.
              </p>
              <button
                type="button"
                onClick={() => setIsSelectMaterialOpen(true)}
                className="bg-accent text-white font-mono text-maya-label uppercase tracking-data px-6 py-3 hover:bg-black-pure transition-colors cursor-pointer font-bold rounded-3xs shadow-xs"
              >
                + Seleccionar Material del Inventario
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedCollection}
        availableProducts={availableProducts}
      />

      {/* Modal de Bespoke conservado en el DOM pero desactivado */}
      <BespokeModal
        isOpen={isBespokeModalOpen}
        onClose={() => setIsBespokeModalOpen(false)}
        initialData={selectedBespoke}
        availableProducts={availableProducts}
      />

      <SelectFeaturedMaterialModal
        isOpen={isSelectMaterialOpen}
        onClose={() => setIsSelectMaterialOpen(false)}
        availableProducts={availableProducts}
      />

      <FeaturedHomeModal
        isOpen={!!editingFeaturedProduct}
        onClose={() => setEditingFeaturedProduct(null)}
        product={editingFeaturedProduct}
      />
    </div>
  );
}
