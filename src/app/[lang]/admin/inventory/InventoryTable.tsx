"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import FullscreenModal from "@/components/admin/FullscreenModal";
import {
  createProductAction,
  updateProductAction,
  uploadMaterialImageAction,
  deleteMaterialImageAction,
  uploadMaterialRenderAction,
  deleteMaterialRenderAction,
  RenderItem,
} from "./actions";

interface Product {
  id?: string;
  sku: string;
  product_name: string;
  aka: string | null;
  category: string;
  stone_type: string;
  type: string;
  kind: string;
  origin: string;
  status: string;
  description?: string | null;
  description_en?: string | null;
  description_i18n?: { es?: string; en?: string } | null;
  image_url?: string | null;
  formats?: string[];
  finishes?: string[];
  uses?: string[];
  uses_en?: string[];
  material_renders?: RenderItem[];
}

async function convertToWebP(
  file: File,
  maxWidth = 2560,
  quality = 0.92,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo obtener el contexto del canvas."));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Error al generar el Blob WebP."));
              return;
            }
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp" },
            );
            resolve(webpFile);
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function InventoryTable({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<
    "general" | "specs" | "uses" | "renders"
  >("general");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formatInput, setFormatInput] = useState("");
  const [finishInput, setFinishInput] = useState("");
  const [useInput, setUseInput] = useState("");
  const [useInputEn, setUseInputEn] = useState("");

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [shouldDeleteOriginalImage, setShouldDeleteOriginalImage] =
    useState(false);

  // Estados exclusivos para Renders
  const [rendersList, setRendersList] = useState<RenderItem[]>([]);
  const [renderFile, setRenderFile] = useState<File | null>(null);
  const [renderPreview, setRenderPreview] = useState<string | null>(null);
  const [renderAppInput, setRenderAppInput] = useState("");
  const [uploadingRender, setUploadingRender] = useState(false);
  const [originalRenderSize, setOriginalRenderSize] = useState("");

  const [formData, setFormData] = useState<Partial<Product>>({
    sku: "",
    product_name: "",
    aka: "",
    category: "Natural Stone",
    stone_type: "",
    type: "SLAB",
    kind: "Stock",
    origin: "-",
    description: "",
    description_en: "",
    image_url: "",
    formats: [],
    finishes: [],
    uses: [],
    uses_en: [],
    status: "active",
  });

  const isWood = formData.category === "Natural Wood";

  const filteredProducts = initialProducts.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.stone_type &&
        p.stone_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.description_en &&
        p.description_en.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  function resetImageStates() {
    setPendingImageFile(null);
    setPreviewImageUrl(null);
    setShouldDeleteOriginalImage(false);
    setRenderFile(null);
    setRenderPreview(null);
    setRenderAppInput("");
    setOriginalRenderSize("");
  }

  function handleOpenCreate() {
    setEditingProduct(null);
    setFormData({
      sku: "",
      product_name: "",
      aka: "",
      category: "Natural Stone",
      stone_type: "",
      type: "SLAB",
      kind: "Stock",
      origin: "-",
      description: "",
      description_en: "",
      image_url: "",
      formats: [],
      finishes: [],
      uses: [],
      uses_en: [],
      status: "active",
    });
    setRendersList([]);
    setFormatInput("");
    setFinishInput("");
    setUseInput("");
    setUseInputEn("");
    resetImageStates();
    setError(null);
    setModalTab("general");
    setIsModalOpen(true);
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      ...product,
      category: product.category || "Natural Stone",
      description: product.description || product.description_i18n?.es || "",
      description_en:
        product.description_en || product.description_i18n?.en || "",
      image_url: product.image_url || undefined,
      formats: Array.isArray(product.formats) ? [...product.formats] : [],
      finishes: Array.isArray(product.finishes) ? [...product.finishes] : [],
      uses: Array.isArray(product.uses) ? [...product.uses] : [],
      uses_en: Array.isArray(product.uses_en) ? [...product.uses_en] : [],
      status: product.status || "active",
    });
    setRendersList(
      Array.isArray(product.material_renders)
        ? [...product.material_renders]
        : [],
    );
    setFormatInput("");
    setFinishInput("");
    setUseInput("");
    setUseInputEn("");
    resetImageStates();
    setError(null);
    setModalTab("general");
    setIsModalOpen(true);
  }

  const handleAutoTranslateAll = async () => {
    const hasDesc = formData.description && formData.description.trim() !== "";
    const hasUses = formData.uses && formData.uses.length > 0;

    if (!hasDesc && !hasUses) {
      alert("Ingresa la descripción o aplicaciones en español primero.");
      return;
    }

    setIsTranslating(true);

    const payload: { description?: string; subtitle?: string } = {};
    if (hasDesc) payload.description = formData.description!;
    if (hasUses) payload.subtitle = (formData.uses || []).join(" | ");

    const res = await autoTranslateAction(payload);
    setIsTranslating(false);

    if (res.success && res.data) {
      setFormData((prev) => {
        const updated = { ...prev };
        if (res.data?.description) {
          updated.description_en = res.data.description;
        }
        if (res.data?.subtitle) {
          updated.uses_en = res.data.subtitle
            .split("|")
            .map((u) => u.trim())
            .filter(Boolean);
        }
        return updated;
      });
    } else {
      alert("Error al traducir: " + res.error);
    }
  };

  function handleAddFormat(e?: React.MouseEvent | React.KeyboardEvent) {
    if (e) e.preventDefault();
    const value = formatInput.trim();
    if (!value) return;
    const currentFormats = formData.formats || [];
    if (!currentFormats.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        formats: [...(prev.formats || []), value],
      }));
    }
    setFormatInput("");
  }

  function handleRemoveFormat(index: number) {
    const currentFormats = [...(formData.formats || [])];
    currentFormats.splice(index, 1);
    setFormData((prev) => ({ ...prev, formats: currentFormats }));
  }

  function handleAddFinish(e?: React.MouseEvent | React.KeyboardEvent) {
    if (e) e.preventDefault();
    const value = finishInput.trim();
    if (!value) return;
    const currentFinishes = formData.finishes || [];
    if (!currentFinishes.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        finishes: [...(prev.finishes || []), value],
      }));
    }
    setFinishInput("");
  }

  function handleRemoveFinish(index: number) {
    const currentFinishes = [...(formData.finishes || [])];
    currentFinishes.splice(index, 1);
    setFormData((prev) => ({ ...prev, finishes: currentFinishes }));
  }

  function handleAddUse(e?: React.MouseEvent | React.KeyboardEvent) {
    if (e) e.preventDefault();
    const value = useInput.trim();
    if (!value) return;
    const currentUses = formData.uses || [];
    if (!currentUses.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        uses: [...(prev.uses || []), value],
      }));
    }
    setUseInput("");
  }

  function handleRemoveUse(index: number) {
    const currentUses = [...(formData.uses || [])];
    currentUses.splice(index, 1);
    setFormData((prev) => ({ ...prev, uses: currentUses }));
  }

  function handleAddUseEn(e?: React.MouseEvent | React.KeyboardEvent) {
    if (e) e.preventDefault();
    const value = useInputEn.trim();
    if (!value) return;
    const currentUsesEn = formData.uses_en || [];
    if (!currentUsesEn.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        uses_en: [...(prev.uses_en || []), value],
      }));
    }
    setUseInputEn("");
  }

  function handleRemoveUseEn(index: number) {
    const currentUsesEn = [...(formData.uses_en || [])];
    currentUsesEn.splice(index, 1);
    setFormData((prev) => ({ ...prev, uses_en: currentUsesEn }));
  }

  function handleSelectImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingImageFile(file);
    setPreviewImageUrl(URL.createObjectURL(file));
    setShouldDeleteOriginalImage(false);
  }

  function handleMarkRemoveImage() {
    setPendingImageFile(null);
    setPreviewImageUrl(null);
    setShouldDeleteOriginalImage(true);
    setFormData((prev) => ({ ...prev, image_url: undefined }));
  }

  function handleSelectRenderFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setRenderFile(file);
    setRenderPreview(URL.createObjectURL(file));
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setOriginalRenderSize(`${sizeInMB} MB`);
  }

  async function handleUploadRender() {
    const targetSku = editingProduct?.sku || formData.sku;
    if (!targetSku) {
      alert("Se requiere el SKU del material para asociar el render.");
      return;
    }
    if (!renderFile) {
      alert("Por favor selecciona un archivo de render.");
      return;
    }

    setUploadingRender(true);
    try {
      const optimized = await convertToWebP(renderFile, 2560, 0.92);
      const data = new FormData();
      data.append("file", optimized);
      data.append("sku", targetSku.trim());
      data.append(
        "application",
        renderAppInput.trim() || "Aplicación Arquitectónica",
      );

      const res = await uploadMaterialRenderAction(data);
      if (res.success && res.data) {
        setRendersList((prev) => [res.data, ...prev]);
        setRenderFile(null);
        setRenderPreview(null);
        setRenderAppInput("");
        setOriginalRenderSize("");
        router.refresh();
      } else {
        alert("Error al subir render: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error optimizando la imagen del render.");
    } finally {
      setUploadingRender(false);
    }
  }

  async function handleDeleteRender(renderId: string, url: string) {
    if (!confirm("¿Deseas eliminar este render de aplicación?")) return;

    const res = await deleteMaterialRenderAction(renderId, url);
    if (res.success) {
      setRendersList((prev) => prev.filter((r) => r.id !== renderId));
      router.refresh();
    } else {
      alert("Error al eliminar: " + res.error);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let finalImageUrl = formData.image_url;

    if (shouldDeleteOriginalImage && editingProduct?.sku) {
      await deleteMaterialImageAction(editingProduct.sku);
      finalImageUrl = undefined;
    }

    if (pendingImageFile && formData.sku) {
      try {
        const optimizedFile = await convertToWebP(pendingImageFile, 2560, 0.92);

        const data = new FormData();
        data.append("file", optimizedFile);
        data.append("sku", formData.sku.trim());

        const uploadRes = await uploadMaterialImageAction(data);
        if (uploadRes.success && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        } else {
          setError(uploadRes.error || "Error al subir la imagen.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error optimizando la imagen:", err);
        setError("Ocurrió un error al procesar la imagen seleccionada.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      ...formData,
      category: formData.category || "Natural Stone",
      stone_type: formData.stone_type || "",
      type: formData.type || (isWood ? "Select" : "SLAB"),
      kind: formData.kind || (isWood ? "15/4 mm" : "Stock"),
      description: formData.description ?? undefined,
      description_en: formData.description_en ?? undefined,
      image_url: finalImageUrl ?? undefined,
      aka: formData.aka ?? undefined,
      formats: [...(formData.formats || [])],
      finishes: [...(formData.finishes || [])],
      uses: Array.isArray(formData.uses) ? [...formData.uses] : [],
      uses_en: Array.isArray(formData.uses_en) ? [...formData.uses_en] : [],
      status: formData.status || "active",
    };

    let res;
    if (editingProduct) {
      res = await updateProductAction(editingProduct.sku, payload);
    } else {
      res = await createProductAction(payload);
    }

    if (!res.success) {
      setError(res.error || "Ocurrió un error al guardar los datos.");
    } else {
      setIsModalOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  const currentPreview =
    previewImageUrl || (!shouldDeleteOriginalImage ? formData.image_url : null);

  return (
    <div className="space-y-4 font-sans">
      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por SKU, material, especie o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 text-maya-body border border-accent/25 rounded-3xs bg-accent-soft text-black-neutral placeholder:text-black-neutral/40 focus:outline-none focus:border-accent font-sans"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 text-maya-small border border-accent/25 rounded-3xs bg-accent-soft text-black-neutral font-mono focus:outline-none focus:border-accent cursor-pointer shrink-0"
          >
            <option value="all">Todas las líneas</option>
            <option value="Natural Stone">
              Piedra Natural (Natural Stone)
            </option>
            <option value="Natural Wood">
              Madera de Ingeniería (Natural Wood)
            </option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data rounded-3xs hover:bg-black-pure transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          + Agregar Material
        </button>
      </div>

      {/* ─── TABLA ADAPTATIVA ─── */}
      <div className="overflow-x-auto border border-border-light rounded-2xs bg-surface shadow-2xs">
        <table className="w-full text-left border-collapse font-sans text-maya-small min-w-[760px]">
          <thead>
            <tr className="bg-surface border-b border-border-light font-mono text-maya-label tracking-data uppercase text-black-neutral/70 font-semibold">
              <th className="p-3.5">Muestra</th>
              <th className="p-3.5">SKU</th>
              <th className="p-3.5">Nombre & Subtítulo</th>
              <th className="p-3.5">Línea & Especie</th>
              <th className="p-3.5">Grado / Espesor</th>
              <th className="p-3.5">Medidas / Formato</th>
              <th className="p-3.5 text-center">Estado</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-black-neutral/40 font-mono text-maya-small italic"
                >
                  {searchTerm || categoryFilter !== "all"
                    ? "No se encontraron materiales con esos criterios de búsqueda."
                    : "No hay materiales registrados en el inventario."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isItemWood = p.category === "Natural Wood";
                return (
                  <tr
                    key={p.sku}
                    className="hover:bg-accent-soft/30 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="w-12 h-12 rounded-3xs bg-surface border border-border-light overflow-hidden relative flex items-center justify-center shadow-2xs">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-mono text-maya-label text-black-neutral/40 text-center select-none">
                            Sin Foto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-maya-small text-accent-ink font-bold">
                      {p.sku}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-black-neutral">
                        {p.product_name}
                      </div>
                      {p.aka && (
                        <div className="text-maya-label text-black-neutral/50 font-mono">
                          AKA: {p.aka}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="inline-block px-1.5 py-0.5 rounded-3xs font-mono text-[9px] uppercase font-bold border mb-1 bg-surface-secondary border-border-light text-black-neutral/80">
                        {isItemWood ? "Madera" : "Piedra"}
                      </div>
                      <div className="text-maya-label font-mono text-black-neutral/70">
                        {p.stone_type || "-"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-black-neutral">
                        {isItemWood
                          ? `Grado: ${p.type || "-"}`
                          : p.type || "SLAB"}
                      </div>
                      <div className="text-maya-label font-mono text-black-neutral/50">
                        {isItemWood
                          ? `Espesor: ${p.kind || "-"}`
                          : p.kind || "Stock"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {p.formats && p.formats.length > 0 ? (
                          p.formats.map((fmt, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 text-maya-label font-mono bg-surface border border-border-light text-black-neutral/80 rounded-3xs"
                            >
                              {fmt}
                            </span>
                          ))
                        ) : (
                          <span className="text-maya-label text-black-neutral/40 font-mono">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 font-mono text-[9px] uppercase rounded-3xs border font-bold ${
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {p.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1.5 text-black-neutral bg-surface hover:bg-surface-secondary border border-border-light hover:border-black-neutral font-mono text-maya-label uppercase tracking-data rounded-3xs transition-colors cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL INTEGRADO ─── */}
      <FullscreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={
          editingProduct
            ? `Editando: ${editingProduct.product_name}`
            : isWood
              ? "Nueva Duela de Ingeniería"
              : "Nuevo Material Natural"
        }
        subtitle="CATÁLOGO DE INVENTARIO"
        isSubmitting={loading || isTranslating}
        activeTab={modalTab}
        onTabChange={(tabId: any) => setModalTab(tabId)}
        tabs={[
          { id: "general", label: "1. General & Imagen" },
          {
            id: "specs",
            label: isWood
              ? "2. Grado, Espesor & Formato"
              : "2. Medidas & Acabados",
          },
          {
            id: "uses",
            label: "3. Usos & Aplicaciones",
            badgeCount: formData.uses?.length || 0,
          },
          {
            id: "renders",
            label: "4. Renders de Aplicación",
            badgeCount: rendersList.length,
          },
        ]}
      >
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 font-mono text-maya-small rounded-3xs">
            ⚠️ {error}
          </div>
        )}

        {/* TAB 1: GENERAL */}
        {modalTab === "general" && (
          <div className="space-y-6 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  SKU (Identificador Único) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingProduct}
                  value={formData.sku || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder={isWood ? "Ej. MAD-001" : "Ej. MAR-001"}
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body font-mono bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent disabled:opacity-50"
                />
              </div>

              {/* Selector de Clasificación / Línea */}
              <div className="space-y-1.5">
                <label className="block font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
                  Línea de Material *
                </label>
                <select
                  value={formData.category || "Natural Stone"}
                  onChange={(e) => {
                    const nextCategory = e.target.value;
                    const nextIsWood = nextCategory === "Natural Wood";
                    setFormData({
                      ...formData,
                      category: nextCategory,
                      type: nextIsWood ? "Select" : "SLAB",
                      kind: nextIsWood ? "15/4 mm" : "Stock",
                    });
                  }}
                  className="w-full px-3.5 py-2.5 border border-accent/40 text-maya-body bg-accent-soft text-black-neutral font-semibold rounded-3xs focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="Natural Stone">
                    Piedra Natural (Natural Stone)
                  </option>
                  <option value="Natural Wood">
                    Madera de Ingeniería (Natural Wood)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  Estado en la Web
                </label>
                <select
                  value={formData.status || "active"}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral font-mono rounded-3xs focus:outline-none focus:border-accent"
                >
                  <option value="active">Activo (Visible en Catálogo)</option>
                  <option value="inactive">Inactivo (Oculto)</option>
                </select>
              </div>
            </div>

            {/* Imagen Principal */}
            <div className="p-5 bg-surface border border-border-light rounded-2xs space-y-3 shadow-2xs">
              <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                {isWood
                  ? "Fotografía de la Duela / Muestra de Madera"
                  : "Fotografía de la Placa / Muestra Natural"}
              </span>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-surface border border-border-light overflow-hidden flex items-center justify-center shrink-0 rounded-2xs shadow-2xs">
                  {currentPreview ? (
                    <img
                      src={currentPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-mono text-maya-label text-black-neutral/40 uppercase">
                      Sin Foto
                    </span>
                  )}
                </div>
                <div className="space-y-2 flex-1 font-mono text-maya-small">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelectImage}
                    className="text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
                  />
                  {currentPreview && (
                    <button
                      type="button"
                      onClick={handleMarkRemoveImage}
                      className="block px-2.5 py-1 text-maya-label text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-3xs cursor-pointer"
                    >
                      Eliminar Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      product_name: e.target.value,
                    })
                  }
                  placeholder={
                    isWood ? "Ej. ROBLE NATURAL HAUTE" : "Ej. EMERALD LEATHER"
                  }
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  {isWood
                    ? "Colección / Sub-línea (AKA)"
                    : "AKA (Nombre Alternativo / Cantera)"}
                </label>
                <input
                  type="text"
                  value={formData.aka || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, aka: e.target.value })
                  }
                  placeholder={
                    isWood ? "Ej. Colección Heritage" : "Ej. EMERALD LEATHER BR"
                  }
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body font-mono bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                  País de Origen
                </label>
                <input
                  type="text"
                  value={formData.origin || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  placeholder={
                    isWood
                      ? "Ej. Francia, Alemania, EE.UU."
                      : "Ej. Brasil, Italia, México"
                  }
                  className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Descripciones Bilingües con IA */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/80 font-semibold">
                  {isWood
                    ? "Narrativa & Reseña de la Madera"
                    : "Narrativa & Reseña de la Piedra"}
                </span>
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={handleAutoTranslateAll}
                  className="px-3.5 py-1.5 bg-accent-soft border border-accent/30 text-accent-ink font-mono text-maya-label uppercase tracking-data font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>
                    {isTranslating
                      ? "✦ Traduciendo..."
                      : "✦ Auto-traducir todo con IA"}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                    Descripción Editorial (Español)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Redacta la historia, textura, vetas y tonalidad del material..."
                    className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-none leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                    Descripción Editorial (Inglés / English)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description_en || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description_en: e.target.value,
                      })
                    }
                    placeholder="Material description for the English version..."
                    className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-none leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPECS (MEDIDAS Y ACABADOS SEGÚN CATEGORÍA) */}
        {modalTab === "specs" && (
          <div className="space-y-8 font-sans">
            {/* Campos condicionales superiores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {isWood ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                      Especie de Madera *
                    </label>
                    <input
                      type="text"
                      value={formData.stone_type || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, stone_type: e.target.value })
                      }
                      placeholder="Ej. Roble Blanco Europeo, Nogal Americano"
                      className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                      Grado de Madera (Grade) *
                    </label>
                    <input
                      type="text"
                      value={formData.type || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      placeholder="Ej. Select / Nature / Character / Rustik"
                      className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                      Espesor Nominal (Thickness) *
                    </label>
                    <input
                      type="text"
                      value={formData.kind || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, kind: e.target.value })
                      }
                      placeholder="Ej. 14 mm, 15/4 mm, 20 mm"
                      className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                      Tipo de Piedra
                    </label>
                    <input
                      type="text"
                      value={formData.stone_type || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, stone_type: e.target.value })
                      }
                      placeholder="Ej. Mármol, Cuarcita, Travertino, Granito"
                      className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                      Tipo de Presentación
                    </label>
                    <input
                      type="text"
                      value={formData.type || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      placeholder="Ej. SLAB, TILE, Mosaico"
                      className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                      Disponibilidad
                    </label>
                    <input
                      type="text"
                      value={formData.kind || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, kind: e.target.value })
                      }
                      placeholder="Ej. Stock / Bajo Pedido"
                      className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Formatos / Dimensiones */}
            <div className="space-y-3 pt-6 border-t border-border-light">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                {isWood
                  ? "Formatos, Anchos y Largos de Duela"
                  : "Formatos & Medidas Específicas"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    isWood
                      ? "Ej. 190 x 1900 mm o Duela 220 mm"
                      : "Ej. 337 x 184 cm o Placa 2cm"
                  }
                  value={formatInput}
                  onChange={(e) => setFormatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFormat(e);
                  }}
                  className="flex-1 px-3.5 py-2.5 border border-accent/25 text-maya-body font-mono bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={(e) => handleAddFormat(e)}
                  className="px-4 py-2 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data hover:bg-black-pure cursor-pointer rounded-3xs shrink-0"
                >
                  + Agregar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {formData.formats && formData.formats.length > 0 ? (
                  formData.formats.map((fmt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-soft border border-accent/30 text-accent-ink rounded-3xs font-mono text-maya-label uppercase"
                    >
                      <span>{fmt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFormat(idx)}
                        className="opacity-60 hover:opacity-100 hover:text-red-600 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="font-mono text-maya-label text-black-neutral/40 italic">
                    Sin formatos especificados.
                  </p>
                )}
              </div>
            </div>

            {/* Acabados */}
            <div className="space-y-3 pt-6 border-t border-border-light">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                {isWood
                  ? "Acabados & Tratamiento Superficial"
                  : "Acabados Disponibles"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    isWood
                      ? "Ej. Cepillado, Aceite UV, Mate, Ahumado, Barniz"
                      : "Ej. Leather, Pulido, Apomazado, Cepillado"
                  }
                  value={finishInput}
                  onChange={(e) => setFinishInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFinish(e);
                  }}
                  className="flex-1 px-3.5 py-2.5 border border-accent/25 text-maya-body font-mono bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={(e) => handleAddFinish(e)}
                  className="px-4 py-2 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data hover:bg-black-pure cursor-pointer rounded-3xs shrink-0"
                >
                  + Agregar
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {formData.finishes && formData.finishes.length > 0 ? (
                  formData.finishes.map((fn, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-light text-black-neutral rounded-3xs font-mono text-maya-label uppercase"
                    >
                      <span>{fn}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFinish(idx)}
                        className="opacity-50 hover:opacity-100 hover:text-red-600 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="font-mono text-maya-label text-black-neutral/40 italic">
                    Sin acabados registrados.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USOS (BILINGÜE ES / EN) */}
        {modalTab === "uses" && (
          <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-border-light">
              <div>
                <h3 className="font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                  Aplicaciones & Usos Arquitectónicos Bilingües
                </h3>
                <p className="font-mono text-maya-label text-black-neutral/50 mt-0.5">
                  Especifica dónde se recomienda instalar este material.
                </p>
              </div>
              <button
                type="button"
                disabled={isTranslating}
                onClick={handleAutoTranslateAll}
                className="px-3.5 py-1.5 bg-accent-soft border border-accent/30 text-accent-ink font-mono text-maya-label uppercase tracking-data font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <span>
                  {isTranslating
                    ? "✦ Traduciendo..."
                    : "✦ Auto-traducir Usos con IA"}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Español */}
              <div className="space-y-3">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/80 font-semibold">
                  Aplicaciones (Español)
                </label>

                <div className="flex flex-wrap gap-1 pb-1">
                  {(isWood
                    ? [
                        "Pisos Interiores",
                        "Muros y Lambrines",
                        "Plafones",
                        "Recámaras",
                        "Tráfico Residencial",
                        "Tráfico Comercial Ligero",
                      ]
                    : [
                        "Interiores",
                        "Exteriores",
                        "Cubiertas y Cocinas",
                        "Muros y Fachadas",
                        "Pisos de Alto Tráfico",
                        "Baños & Zonas Húmedas",
                      ]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const current = formData.uses || [];
                        if (!current.includes(preset)) {
                          setFormData((prev) => ({
                            ...prev,
                            uses: [...(prev.uses || []), preset],
                          }));
                        }
                      }}
                      className="px-2 py-0.5 bg-accent-soft hover:bg-accent hover:text-white border border-accent/30 text-accent-ink font-mono text-[9px] uppercase rounded-3xs transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Pisos Interiores, Lambrines..."
                    value={useInput}
                    onChange={(e) => setUseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddUse(e);
                    }}
                    className="flex-1 px-3.5 py-2 border border-accent/25 text-maya-small font-sans bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddUse(e)}
                    className="px-3.5 py-2 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase hover:bg-black-pure rounded-3xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.uses && formData.uses.length > 0 ? (
                    formData.uses.map((useItem, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-soft border border-accent/30 text-accent-ink rounded-3xs font-mono text-maya-label uppercase font-medium"
                      >
                        <span>{useItem}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUse(idx)}
                          className="opacity-60 hover:opacity-100 hover:text-red-600 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="font-mono text-maya-label text-black-neutral/40 italic">
                      Sin aplicaciones en español.
                    </p>
                  )}
                </div>
              </div>

              {/* Columna Inglés */}
              <div className="space-y-3">
                <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/80 font-semibold">
                  Applications (Inglés / English)
                </label>

                <div className="flex flex-wrap gap-1 pb-1">
                  {(isWood
                    ? [
                        "Indoor Flooring",
                        "Wall Cladding",
                        "Ceilings",
                        "Bedrooms",
                        "Residential Traffic",
                        "Commercial Traffic",
                      ]
                    : [
                        "Interiors",
                        "Exteriors",
                        "Countertops & Kitchens",
                        "Walls & Cladding",
                        "High-Traffic Flooring",
                        "Bathrooms & Wet Areas",
                      ]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const current = formData.uses_en || [];
                        if (!current.includes(preset)) {
                          setFormData((prev) => ({
                            ...prev,
                            uses_en: [...(prev.uses_en || []), preset],
                          }));
                        }
                      }}
                      className="px-2 py-0.5 bg-accent-soft hover:bg-accent hover:text-white border border-accent/30 text-accent-ink font-mono text-[9px] uppercase rounded-3xs transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex. Indoor Flooring, Walls..."
                    value={useInputEn}
                    onChange={(e) => setUseInputEn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddUseEn(e);
                    }}
                    className="flex-1 px-3.5 py-2 border border-accent/25 text-maya-small font-sans bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddUseEn(e)}
                    className="px-3.5 py-2 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase hover:bg-black-pure rounded-3xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.uses_en && formData.uses_en.length > 0 ? (
                    formData.uses_en.map((useItem, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border-light text-black-neutral rounded-3xs font-mono text-maya-label uppercase font-medium"
                      >
                        <span>{useItem}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveUseEn(idx)}
                          className="opacity-50 hover:opacity-100 hover:text-red-600 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="font-mono text-maya-label text-black-neutral/40 italic">
                      Sin aplicaciones en inglés.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RENDERS DE APLICACIÓN */}
        {modalTab === "renders" && (
          <div className="space-y-6 font-sans">
            {!editingProduct && !formData.sku ? (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 font-mono text-maya-small rounded-3xs">
                ⚠️ Primero debes registrar y guardar los datos generales del
                material (SKU) para poder asociarle renders de aplicación.
              </div>
            ) : (
              <>
                <div className="space-y-1 pb-2 border-b border-border-light">
                  <h3 className="font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                    Subir Render de Aplicación (Optimización WebP Automática)
                  </h3>
                  <p className="font-mono text-maya-label text-black-neutral/50">
                    Se escalan a máx. 2560px, comprimen a WebP y se alojan en el
                    bucket de materiales bajo este SKU:{" "}
                    <span className="font-bold text-accent-ink">
                      {editingProduct?.sku || formData.sku}
                    </span>
                  </p>
                </div>

                {/* Subidor de Renders */}
                <div className="p-4 bg-surface border border-border-light rounded-2xs space-y-3 shadow-2xs">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-7">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSelectRenderFile}
                        className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Aplicación (ej. Sala Principal, Recámara Master, Duela Muro)"
                        value={renderAppInput}
                        onChange={(e) => setRenderAppInput(e.target.value)}
                        className="w-full px-3 py-2 border border-accent/25 text-maya-small font-sans focus:outline-none bg-accent-soft rounded-3xs placeholder:text-black-neutral/35"
                      />
                    </div>
                  </div>

                  {renderPreview && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-border-light">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-surface-secondary border border-border-light overflow-hidden shrink-0 rounded-3xs shadow-2xs">
                          <img
                            src={renderPreview}
                            alt="Preview Render"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-mono text-maya-label">
                          <span className="text-black-neutral font-medium block">
                            Render seleccionado
                          </span>
                          <span className="text-black-neutral/50">
                            Peso original: {originalRenderSize} ➔ WebP
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={uploadingRender}
                        onClick={handleUploadRender}
                        className="px-4 py-2 bg-emerald-800 text-white font-mono text-maya-label uppercase tracking-data hover:bg-emerald-900 transition-colors disabled:opacity-50 cursor-pointer font-bold rounded-3xs shadow-xs"
                      >
                        {uploadingRender
                          ? "Procesando..."
                          : "✦ Optimizar y Subir Render"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Galería de Renders Actuales */}
                <div className="space-y-2">
                  <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60 font-semibold">
                    Renders Registrados ({rendersList.length})
                  </span>

                  {rendersList.length === 0 ? (
                    <p className="font-mono text-maya-label text-black-neutral/40 italic">
                      No se han subido renders arquitectónicos para este
                      material.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {rendersList.map((rnd) => (
                        <div
                          key={rnd.id}
                          className="p-2 border border-border-light bg-surface space-y-1.5 flex flex-col justify-between rounded-2xs shadow-2xs"
                        >
                          <div className="h-24 bg-surface-secondary border border-border-light overflow-hidden relative rounded-3xs">
                            <img
                              src={rnd.render_url}
                              alt={rnd.application}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="font-sans text-maya-label font-medium text-black-neutral truncate pr-2">
                              {rnd.application}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRender(rnd.id, rnd.render_url)
                              }
                              className="text-red-600 hover:text-red-800 font-mono text-maya-label cursor-pointer font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </FullscreenModal>
    </div>
  );
}
