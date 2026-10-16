"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSingleFeaturedProductAction } from "./actions";

interface ProductSimple {
  sku: string;
  product_name: string;
  category: string;
  image_url?: string | null;
  is_featured?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableProducts: ProductSimple[];
}

export default function SelectFeaturedMaterialModal({
  isOpen,
  onClose,
  availableProducts,
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [submittingSku, setSubmittingSku] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = Array.from(
    new Set(availableProducts.map((p) => p.category).filter(Boolean)),
  );

  const filteredProducts = availableProducts.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectMaterial = async (sku: string) => {
    setSubmittingSku(sku);
    const res = await setSingleFeaturedProductAction(sku);
    setSubmittingSku(null);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      alert("Error al asignar material destacado: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black-pure/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-surface border border-border-light w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xs overflow-hidden">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-surface-secondary shrink-0">
          <div>
            <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink block font-semibold">
              SELECCIÓN DE MATERIAL PROTAGONISTA
            </span>
            <h3 className="font-sans font-light text-maya-h4 tracking-editorial uppercase text-black-neutral">
              Seleccionar Material Destacado para la Home
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-black-neutral/50 hover:text-black-neutral font-mono text-sm cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Buscador */}
        <div className="p-4 border-b border-border-light bg-surface flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
          <p className="font-sans text-maya-small text-black-neutral/70">
            Haz clic en el material que desees fijar como portada principal en
            el Home.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-border-light font-mono text-maya-label bg-surface focus:outline-none cursor-pointer rounded-3xs"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Buscar SKU o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-border-light text-maya-small font-sans focus:outline-none bg-surface w-full sm:w-48 rounded-3xs placeholder:text-black-neutral/35"
            />
          </div>
        </div>

        {/* Rejilla del Inventario */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-warm/40">
          {filteredProducts.map((prod) => {
            const isCurrentlyFeatured = !!prod.is_featured;
            const isSelected = submittingSku === prod.sku;

            return (
              <div
                key={prod.sku}
                className={`bg-surface border p-3 flex flex-col justify-between space-y-2.5 transition-all rounded-2xs ${
                  isCurrentlyFeatured
                    ? "border-accent ring-1 ring-accent shadow-xs"
                    : "border-border-light hover:border-border-strong shadow-2xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="w-full h-28 bg-surface-secondary border border-border-light overflow-hidden relative rounded-3xs">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-black-neutral/30 uppercase">
                        Sin Foto
                      </div>
                    )}

                    {isCurrentlyFeatured && (
                      <span className="absolute top-1.5 left-1.5 bg-accent text-white font-mono text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-wider rounded-3xs">
                        ACTUAL
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-mono text-maya-label text-accent-ink font-bold block">
                      {prod.sku}
                    </span>
                    <h4 className="font-sans text-maya-small font-medium text-black-neutral uppercase truncate">
                      {prod.product_name}
                    </h4>
                    <p className="font-mono text-maya-label text-black-neutral/50 truncate">
                      {prod.category}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCurrentlyFeatured || !!submittingSku}
                  onClick={() => handleSelectMaterial(prod.sku)}
                  className={`w-full py-2 font-mono text-maya-label uppercase font-bold tracking-data transition-colors cursor-pointer rounded-3xs ${
                    isCurrentlyFeatured
                      ? "bg-accent/10 text-accent-ink border border-accent/30 cursor-default"
                      : "bg-black-neutral text-white hover:bg-black-pure"
                  }`}
                >
                  {isSelected
                    ? "Asignando..."
                    : isCurrentlyFeatured
                      ? "✓ Destacado Actual"
                      : "Seleccionar Este"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
