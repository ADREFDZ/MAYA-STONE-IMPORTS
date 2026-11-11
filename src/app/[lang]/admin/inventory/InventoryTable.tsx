"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import FullscreenModal from "@/components/admin/FullscreenModal";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  uploadMaterialImageAction,
  deleteMaterialImageAction,
  uploadMaterialRenderAction,
  deleteMaterialRenderAction,
  RenderItem,
} from "./actions";
import { convertToWebP } from "@/lib/utils/media";

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
  collections?: { slug: string; title: string }[];
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

  // ─── Filtros del inventario ───
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [stoneFilter, setStoneFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contentFilter, setContentFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "sku">("recent");
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const uniqSorted = (list: (string | null | undefined)[]) =>
    [...new Set(list.map((v) => (v || "").trim()).filter((v) => v && v !== "-"))].sort(
      (a, b) => a.localeCompare(b, "es"),
    );

  const collectionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of initialProducts)
      for (const c of p.collections || []) map.set(c.slug, c.title);
    return [...map.entries()]
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title, "es"));
  }, [initialProducts]);
  const stoneOptions = useMemo(
    () => uniqSorted(initialProducts.map((p) => p.stone_type)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialProducts],
  );
  const originOptions = useMemo(
    () => uniqSorted(initialProducts.map((p) => p.origin)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialProducts],
  );

  const activeFilterCount = [
    collectionFilter,
    categoryFilter,
    stoneFilter,
    originFilter,
    statusFilter,
    contentFilter,
  ].filter((v) => v !== "all").length;

  function clearFilters() {
    setCollectionFilter("all");
    setCategoryFilter("all");
    setStoneFilter("all");
    setOriginFilter("all");
    setStatusFilter("all");
    setContentFilter("all");
    setSearchTerm("");
  }

  const norm = (v: string) =>
    v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const visibleProducts = useMemo(() => {
    const q = norm(searchTerm.trim());
    const list = initialProducts.filter((p) => {
      if (q) {
        const hay = norm(
          [
            p.product_name,
            p.aka,
            p.sku,
            p.stone_type,
            p.origin,
            p.category,
            ...(p.finishes || []),
            ...(p.collections || []).map((c) => c.title),
          ]
            .filter(Boolean)
            .join(" "),
        );
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (stoneFilter !== "all" && (p.stone_type || "").trim() !== stoneFilter) return false;
      if (originFilter !== "all" && (p.origin || "").trim() !== originFilter) return false;
      if (statusFilter === "active" && p.status !== "active") return false;
      if (statusFilter === "inactive" && p.status === "active") return false;
      if (collectionFilter === "none" && (p.collections || []).length > 0) return false;
      if (
        collectionFilter !== "all" &&
        collectionFilter !== "none" &&
        !(p.collections || []).some((c) => c.slug === collectionFilter)
      )
        return false;
      if (contentFilter === "no_image" && p.image_url) return false;
      if (contentFilter === "no_desc" && (p.description || "").trim()) return false;
      if (contentFilter === "no_en" && (p.description_en || "").trim()) return false;
      if (contentFilter === "no_renders" && (p.material_renders?.length || 0) > 0) return false;
      return true;
    });
    if (sortBy === "name")
      list.sort((a, b) => (a.aka || a.product_name).localeCompare(b.aka || b.product_name, "es"));
    if (sortBy === "sku") list.sort((a, b) => a.sku.localeCompare(b.sku));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialProducts,
    searchTerm,
    categoryFilter,
    stoneFilter,
    originFilter,
    statusFilter,
    collectionFilter,
    contentFilter,
    sortBy,
  ]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteProductAction(deleteTarget.sku);
    setDeleting(false);
    if (!res.success) {
      setDeleteError(res.error || "No se pudo eliminar.");
      return;
    }
    setDeleteTarget(null);
    setExpandedSku(null);
    router.refresh();
  }

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
      const optimized = await convertToWebP(renderFile);
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
        const optimizedFile = await convertToWebP(pendingImageFile);

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
      {/* ─── BARRA DE BÚSQUEDA Y FILTROS ─── */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 md:items-center">
          <div className="relative flex-1">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 stroke-current text-text-muted" fill="none" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Buscar por nombre, SKU, piedra, origen o acabado…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar materiales"
              className="w-full pl-9 pr-3.5 py-2.5 text-maya-small border border-border-light bg-surface-secondary/60 text-black-neutral placeholder:text-black-neutral/40 focus:outline-none focus:border-black-neutral"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Ordenar"
              className="px-3 py-2.5 text-maya-small border border-border-light bg-surface-secondary/60 cursor-pointer select-chevron"
            >
              <option value="recent">Más recientes</option>
              <option value="name">Nombre (A–Z)</option>
              <option value="sku">SKU</option>
            </select>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-black-neutral text-gray-warm text-maya-small hover:bg-black-pure transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              + Agregar material
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {[
            {
              label: "Colección",
              value: collectionFilter,
              set: setCollectionFilter,
              options: [
                ["all", "Todas"],
                ["none", "Sin colección"],
                ...collectionOptions.map((c) => [c.slug, c.title]),
              ],
            },
            {
              label: "Línea",
              value: categoryFilter,
              set: setCategoryFilter,
              options: [
                ["all", "Todas"],
                ["Natural Stone", "Piedra natural"],
                ["Natural Wood", "Madera"],
              ],
            },
            {
              label: "Tipo de piedra",
              value: stoneFilter,
              set: setStoneFilter,
              options: [["all", "Todos"], ...stoneOptions.map((v) => [v, v])],
            },
            {
              label: "Origen",
              value: originFilter,
              set: setOriginFilter,
              options: [["all", "Todos"], ...originOptions.map((v) => [v, v])],
            },
            {
              label: "Estado",
              value: statusFilter,
              set: setStatusFilter,
              options: [
                ["all", "Todos"],
                ["active", "Visibles en la web"],
                ["inactive", "Ocultos"],
              ],
            },
            {
              label: "Contenido",
              value: contentFilter,
              set: setContentFilter,
              options: [
                ["all", "Todo"],
                ["no_image", "Sin foto"],
                ["no_desc", "Sin descripción"],
                ["no_en", "Sin descripción en inglés"],
                ["no_renders", "Sin renders"],
              ],
            },
          ].map((f) => (
            <label key={f.label} className="flex flex-col gap-1">
              <span className="text-[11px] text-text-muted">{f.label}</span>
              <select
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className={`px-2.5 py-2 text-maya-small border bg-surface-secondary/60 cursor-pointer select-chevron ${
                  f.value !== "all" ? "border-black-neutral" : "border-border-light"
                }`}
              >
                {f.options.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-maya-small text-text-secondary">
          <span>
            {visibleProducts.length} de {initialProducts.length} materiales
          </span>
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="underline underline-offset-2 hover:text-black-neutral cursor-pointer">
              Limpiar filtros ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* ─── LISTA DE MATERIALES ─── */}
      <div className="border border-border-light bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse text-maya-small min-w-[880px]">
          <thead>
            <tr className="border-b border-border-light text-[11px] text-text-muted">
              <th className="px-3 py-2.5 w-8"><span className="sr-only">Detalle</span></th>
              <th className="px-3 py-2.5 font-normal">Material</th>
              <th className="px-3 py-2.5 font-normal">Colección</th>
              <th className="px-3 py-2.5 font-normal">Tipo · Origen</th>
              <th className="px-3 py-2.5 font-normal">Acabados</th>
              <th className="px-3 py-2.5 font-normal">Formatos</th>
              <th className="px-3 py-2.5 font-normal">Estado</th>
              <th className="px-3 py-2.5 font-normal text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-text-secondary">
                  {activeFilterCount > 0 || searchTerm
                    ? "Ningún material coincide con la búsqueda o los filtros."
                    : "Aún no hay materiales. Usa “Agregar material”."}
                </td>
              </tr>
            ) : (
              visibleProducts.map((p) => {
                const open = expandedSku === p.sku;
                const missingEn = !(p.description_en || "").trim();
                const renders = p.material_renders?.length || 0;
                const more = (list: string[] | undefined, n: number) =>
                  (list?.length || 0) > n ? ` +${(list?.length || 0) - n}` : "";
                return (
                  <Fragment key={p.sku}>
                    <tr
                      className={`border-b border-border-light align-middle transition-colors ${
                        open ? "bg-accent-soft/40" : "hover:bg-accent-soft/25"
                      } ${p.status !== "active" ? "text-black-neutral/55" : ""}`}
                    >
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setExpandedSku(open ? null : p.sku)}
                          aria-expanded={open}
                          aria-label={open ? "Ocultar detalle" : "Ver detalle"}
                          className="h-7 w-7 flex items-center justify-center border border-border-light hover:border-black-neutral cursor-pointer"
                        >
                          <span aria-hidden="true" className={`text-[10px] transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-11 h-11 shrink-0 bg-surface-secondary border border-border-light overflow-hidden flex items-center justify-center">
                            {p.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] text-red-800 text-center leading-tight">Sin<br />foto</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-black-neutral truncate max-w-[240px]">{p.aka || p.product_name}</p>
                            <p className="text-[11px] text-text-muted font-mono tabular-nums">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.collections && p.collections.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {p.collections.map((c) => (
                              <span key={c.slug} className="px-1.5 py-0.5 text-[11px] border border-border-light bg-surface-secondary/60">
                                {c.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p>{p.stone_type || (p.category === "Natural Wood" ? "Madera" : "—")}</p>
                        <p className="text-[11px] text-text-muted">{p.origin && p.origin !== "-" ? p.origin : "—"}</p>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] max-w-[200px]">
                        {(p.finishes || []).slice(0, 2).join(", ") || "—"}
                        <span className="text-text-muted">{more(p.finishes, 2)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] max-w-[180px]">
                        {(p.formats || []).slice(0, 2).join(", ") || "—"}
                        <span className="text-text-muted">{more(p.formats, 2)}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] ${p.status === "active" ? "text-emerald-800" : "text-text-muted"}`}>
                          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${p.status === "active" ? "bg-emerald-600" : "bg-black-neutral/30"}`} />
                          {p.status === "active" ? "Visible" : "Oculto"}
                        </span>
                        {(missingEn || !p.image_url) && (
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            {[!p.image_url && "sin foto", missingEn && "sin inglés"].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="px-3 py-1.5 text-[12px] border border-border-light hover:border-black-neutral cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Eliminar ${p.aka || p.product_name}`}
                          className="ml-1.5 px-2.5 py-1.5 text-[12px] border border-border-light text-red-800 hover:border-red-800 hover:bg-red-50 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>

                    {open && (
                      <tr className="border-b border-border-light bg-accent-soft/20">
                        <td />
                        <td colSpan={7} className="px-3 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            <div className="lg:col-span-5 space-y-2">
                              <p className="text-[11px] text-text-muted">Descripción</p>
                              <p className="text-[13px] leading-relaxed text-black-neutral/85 line-clamp-6">
                                {p.description || "Sin descripción."}
                              </p>
                              <p className={`text-[12px] ${missingEn ? "text-amber-800" : "text-text-secondary"}`}>
                                Inglés: {missingEn ? "falta traducción" : "listo"}
                              </p>
                            </div>
                            <dl className="lg:col-span-7 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-[13px]">
                              <dt className="text-text-muted">Nombre completo</dt>
                              <dd>{p.product_name}</dd>
                              <dt className="text-text-muted">Tipo / stock</dt>
                              <dd>{[p.type, p.kind].filter(Boolean).join(" · ") || "—"}</dd>
                              <dt className="text-text-muted">Acabados</dt>
                              <dd>{(p.finishes || []).join(", ") || "—"}</dd>
                              <dt className="text-text-muted">Formatos</dt>
                              <dd>{(p.formats || []).join(", ") || "—"}</dd>
                              <dt className="text-text-muted">Usos</dt>
                              <dd>{(p.uses || []).join(", ") || "—"}</dd>
                              <dt className="text-text-muted">Renders</dt>
                              <dd>{renders > 0 ? `${renders} imagen${renders > 1 ? "es" : ""}` : "Sin renders"}</dd>
                            </dl>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── CONFIRMAR ELIMINACIÓN ─── */}
      {deleteTarget && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black-neutral/60 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="w-full max-w-md bg-background border border-border-light p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 id="delete-title" className="text-maya-h4 font-light uppercase tracking-editorial">
              Eliminar {deleteTarget.aka || deleteTarget.product_name}
            </h3>
            <p className="text-maya-small text-text-secondary leading-relaxed">
              Se borrará el material <span className="font-mono">{deleteTarget.sku}</span>, sus renders
              y su lugar en {deleteTarget.collections?.length ? `la colección ${deleteTarget.collections.map((c) => c.title).join(", ")}` : "las colecciones"}.
              No se puede deshacer. Si solo quieres quitarlo de la web, edítalo y márcalo como oculto.
            </p>
            {deleteError && <p className="text-[12px] text-red-800">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-maya-small border border-border-light hover:border-black-neutral cursor-pointer">
                Cancelar
              </button>
              <button type="button" disabled={deleting} onClick={handleConfirmDelete} className="px-4 py-2 text-maya-small bg-red-800 text-white hover:bg-red-900 disabled:opacity-60 cursor-pointer">
                {deleting ? "Eliminando…" : "Eliminar material"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    Se guardan en alta calidad (hasta 4096 px) y se alojan en el
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
