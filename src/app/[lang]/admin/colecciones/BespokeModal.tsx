"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FullscreenModal from "@/components/admin/FullscreenModal";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { convertToWebP } from "@/lib/utils/media";
import { createClient } from "@/lib/supabase/client";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import {
  saveBespokeFinishAction,
  uploadBespokeImageAction,
  BespokeFinishData,
} from "./actions";

interface ProductSimple {
  sku: string;
  product_name: string;
  category: string;
  image_url?: string | null;
}

interface BespokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BespokeFinishData | null;
  availableProducts: ProductSimple[];
}

export default function BespokeModal({
  isOpen,
  onClose,
  initialData,
  availableProducts,
}: BespokeModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "applications_gallery" | "compatible_materials"
  >("general");

  const [titleEs, setTitleEs] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitleEs, setSubtitleEs] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [descriptionEs, setDescriptionEs] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);

  const [applications, setApplications] = useState<string[]>([]);
  const [appInput, setAppInput] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [compatibleSkus, setCompatibleSkus] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showInHome, setShowInHome] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitleEs(initialData.title_es || "");
      setTitleEn(initialData.title_en || "");
      setSlug(initialData.slug || "");
      setSubtitleEs(initialData.subtitle_es || "");
      setSubtitleEn(initialData.subtitle_en || "");
      setDescriptionEs(initialData.description_es || "");
      setDescriptionEn(initialData.description_en || "");
      setCoverImage(initialData.cover_image || "");
      setCoverPreview(initialData.cover_image || null);
      setApplications(
        Array.isArray(initialData.applications) ? initialData.applications : [],
      );
      setGalleryImages(
        Array.isArray(initialData.gallery_images)
          ? initialData.gallery_images
          : [],
      );
      setCompatibleSkus(
        Array.isArray(initialData.compatible_materials_skus)
          ? initialData.compatible_materials_skus
          : [],
      );
      setSortOrder(initialData.sort_order ?? 0);
      setIsActive(initialData.is_active ?? true);
      setShowInHome(initialData.show_in_home ?? true);
    } else {
      setTitleEs("");
      setTitleEn("");
      setSlug("");
      setSubtitleEs("");
      setSubtitleEn("");
      setDescriptionEs("");
      setDescriptionEn("");
      setCoverImage("");
      setCoverPreview(null);
      setApplications([]);
      setGalleryImages([]);
      setCompatibleSkus([]);
      setSortOrder(0);
      setIsActive(true);
      setShowInHome(true);
    }
    setActiveTab("general");
    setPendingCoverFile(null);
    setAppInput("");
  }, [initialData, isOpen]);

  const handleTitleChange = (val: string) => {
    setTitleEs(val);
    if (!initialData?.id) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleAutoTranslateBespoke = async () => {
    if (!titleEs && !subtitleEs && !descriptionEs) {
      alert("Ingresa los textos en español primero.");
      return;
    }

    setIsTranslating(true);
    const res = await autoTranslateAction({
      title: titleEs,
      subtitle: subtitleEs,
      description: descriptionEs,
    });
    setIsTranslating(false);

    if (res.success && res.data) {
      if (res.data.title) setTitleEn(res.data.title);
      if (res.data.subtitle) setSubtitleEn(res.data.subtitle);
      if (res.data.description) setDescriptionEn(res.data.description);
    } else {
      alert("Error al traducir: " + res.error);
    }
  };

  const handleSelectCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCover = () => {
    setCoverImage("");
    setCoverPreview(null);
    setPendingCoverFile(null);
  };

  const handleAddApplication = () => {
    const val = appInput.trim();
    if (val && !applications.includes(val)) {
      setApplications([...applications, val]);
      setAppInput("");
    }
  };

  const handleRemoveApplication = (idx: number) => {
    setApplications(applications.filter((_, i) => i !== idx));
  };

  const handleAddGalleryMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !slug) {
      if (!slug) alert("Ingresa primero el título y slug del acabado.");
      return;
    }

    setUploadingGallery(true);
    const uploadedUrls: string[] = [];
    const supabase = createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          const optimizedFile = await convertToWebP(file, 2560, 0.92);
          const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
          const filePath = `bespoke/${cleanSlug}/gallery/${fileName}`;

          const { error } = await supabase.storage
            .from("materials")
            .upload(filePath, optimizedFile, {
              contentType: "image/webp",
              cacheControl: "3600",
              upsert: true,
            });

          if (!error) {
            const { data } = supabase.storage
              .from("materials")
              .getPublicUrl(filePath);
            uploadedUrls.push(`${data.publicUrl}?t=${Date.now()}`);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((prev) => [...prev, ...uploadedUrls]);
      }
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const toggleSku = (sku: string) => {
    setCompatibleSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalCoverUrl = coverImage;

    if (pendingCoverFile && slug) {
      try {
        const optimizedCover = await convertToWebP(
          pendingCoverFile,
          2560,
          0.92,
        );
        const formData = new FormData();
        formData.append("file", optimizedCover);
        formData.append("slug", slug);

        const uploadRes = await uploadBespokeImageAction(formData);
        if (uploadRes.success && uploadRes.url) {
          finalCoverUrl = uploadRes.url;
        } else {
          alert("Error al subir portada: " + uploadRes.error);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        return;
      }
    }

    const res = await saveBespokeFinishAction({
      id: initialData?.id,
      title_es: titleEs,
      title_en: titleEn,
      slug,
      subtitle_es: subtitleEs,
      subtitle_en: subtitleEn,
      description_es: descriptionEs,
      description_en: descriptionEn,
      cover_image: finalCoverUrl,
      gallery_images: galleryImages,
      applications,
      compatible_materials_skus: compatibleSkus,
      sort_order: Number(sortOrder),
      is_active: isActive,
      show_in_home: showInHome,
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      alert("Error al guardar: " + res.error);
    }
  };

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

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSubmit}
      title={
        initialData?.id
          ? `Editando Acabado: ${initialData.title_es}`
          : "Nuevo Acabado / Proceso Bespoke"
      }
      isSubmitting={isSubmitting || uploadingGallery || isTranslating}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: "general", label: "1. Especificación & Portada" },
        {
          id: "applications_gallery",
          label: "2. Aplicaciones & Galería",
          badgeCount: galleryImages.length,
        },
        {
          id: "compatible_materials",
          label: "3. Materiales Compatibles",
          badgeCount: compatibleSkus.length,
        },
      ]}
    >
      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="space-y-6 sm:space-y-8 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4">
            <h3 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
              Datos del Bespoke
            </h3>
            <button
              type="button"
              disabled={isTranslating}
              onClick={handleAutoTranslateBespoke}
              className="px-3.5 py-1.5 bg-accent/10 border border-accent/30 text-accent-ink font-mono text-maya-label uppercase tracking-data font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto shrink-0"
            >
              <span>
                {isTranslating ? "✦ Traduciendo..." : "✦ Auto-traducir con IA"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Nombre del Acabado (Español) *
              </label>
              <input
                type="text"
                required
                value={titleEs}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej. CANALADO & FLUTED"
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-body bg-surface rounded-3xs focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Nombre del Acabado (Inglés)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Ej. FLUTED & GROOVED"
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-body bg-surface rounded-3xs focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Slug Identificador *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="canalado-fluted"
                className="w-full px-3.5 py-2.5 border border-border-light font-mono text-maya-small bg-surface-secondary focus:outline-none rounded-3xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Subtítulo / Técnica (Español)
              </label>
              <input
                type="text"
                value={subtitleEs}
                onChange={(e) => setSubtitleEs(e.target.value)}
                placeholder="Ej. Texturas rítmicas de bajo relieve"
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-body bg-surface rounded-3xs focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Subtítulo / Técnica (Inglés)
              </label>
              <input
                type="text"
                value={subtitleEn}
                onChange={(e) => setSubtitleEn(e.target.value)}
                placeholder="Ej. Rhythmic low-relief textures"
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-body bg-surface rounded-3xs focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Orden de Visualización
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-border-light font-mono text-maya-small bg-surface focus:outline-none rounded-3xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Descripción Técnica (Español) *
              </label>
              <textarea
                rows={4}
                required
                value={descriptionEs}
                onChange={(e) => setDescriptionEs(e.target.value)}
                placeholder="Describe el método de maquinado, corte CNC o labrado a mano..."
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-small bg-surface resize-y font-sans leading-relaxed rounded-3xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Descripción Técnica (Inglés / English)
              </label>
              <textarea
                rows={4}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Technical craft specification in English..."
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-small bg-surface resize-y font-sans leading-relaxed rounded-3xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-light">
            <ImageUploadField
              label="Muestra Fotográfica Principal (Textura 16:10)"
              previewUrl={coverPreview}
              onFileSelect={handleSelectCover}
              onRemove={handleRemoveCover}
              aspect="landscape"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border-light">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-black-neutral w-4 h-4"
              />
              <span className="text-maya-small font-medium text-black-neutral">
                Acabado Activo en la Plataforma
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInHome}
                onChange={(e) => setShowInHome(e.target.checked)}
                className="accent-black-neutral w-4 h-4"
              />
              <span className="text-maya-small font-medium text-black-neutral">
                Mostrar en Sección Bespoke del Home
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: APLICACIONES & GALERÍA */}
      {activeTab === "applications_gallery" && (
        <div className="space-y-8 font-sans">
          <div className="space-y-3">
            <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
              Usos & Aplicaciones Arquitectónicas
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Revestimientos de Muro, Lavabos Monolíticos, Islas"
                value={appInput}
                onChange={(e) => setAppInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddApplication();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 border border-border-light text-maya-small font-sans focus:outline-none rounded-3xs bg-surface placeholder:text-black-neutral/35"
              />
              <button
                type="button"
                onClick={handleAddApplication}
                className="px-4 py-2 bg-black-neutral text-white font-mono text-maya-label uppercase tracking-data hover:bg-black-pure rounded-3xs cursor-pointer"
              >
                + Agregar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {applications.map((app, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent-ink font-mono text-maya-label uppercase font-medium rounded-3xs"
                >
                  <span>{app}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveApplication(idx)}
                    className="text-accent-ink hover:text-red-600 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-border-light">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
                  Galería de Aplicaciones Reales ({galleryImages.length})
                </h4>
                <p className="font-mono text-maya-label text-black-neutral/50">
                  Fotografías de detalle y proyectos con este proceso ejecutado.
                </p>
              </div>
              {uploadingGallery && (
                <span className="font-mono text-maya-label text-accent-ink animate-pulse">
                  Subiendo imágenes...
                </span>
              )}
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleAddGalleryMedia}
              disabled={uploadingGallery}
              className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
            />

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square border border-border-light group overflow-hidden bg-black-pure rounded-2xs shadow-2xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Muestra ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryImages((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MATERIALES COMPATIBLES */}
      {activeTab === "compatible_materials" && (
        <div className="space-y-4 font-sans">
          <div className="border-b border-border-light pb-4">
            <h3 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
              Vincular Materiales del Inventario ({compatibleSkus.length})
            </h3>
            <p className="font-mono text-maya-label text-black-neutral/60 mt-0.5">
              Selecciona qué piedras naturales admiten este tipo de acabado
              artesanal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-border-light font-mono text-maya-small bg-surface focus:outline-none cursor-pointer rounded-3xs"
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
              className="px-3 py-2 border border-border-light text-maya-small font-sans focus:outline-none bg-surface w-full sm:w-64 rounded-3xs placeholder:text-black-neutral/35"
            />
          </div>

          <div className="max-h-[380px] overflow-y-auto border border-border-light p-4 bg-surface-secondary grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 rounded-2xs">
            {filteredProducts.map((prod) => {
              const isSelected = compatibleSkus.includes(prod.sku);
              return (
                <div
                  key={prod.sku}
                  onClick={() => toggleSku(prod.sku)}
                  className={`relative p-2.5 border transition-all cursor-pointer flex flex-col justify-between select-none rounded-2xs ${
                    isSelected
                      ? "bg-surface border-accent shadow-xs ring-1 ring-accent"
                      : "bg-surface border-border-light opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                        isSelected
                          ? "bg-accent text-white"
                          : "bg-surface-secondary text-black-neutral/40 border border-border-light"
                      }`}
                    >
                      {isSelected ? "✓" : "+"}
                    </span>
                  </div>

                  <div className="w-full h-24 bg-surface-secondary border border-border-light overflow-hidden mb-2 relative flex items-center justify-center rounded-3xs">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-mono text-maya-label text-black-neutral/30 uppercase">
                        Sin Foto
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-mono text-maya-label text-accent-ink font-bold truncate">
                      {prod.sku}
                    </p>
                    <h4 className="font-sans text-maya-small font-medium text-black-neutral truncate leading-tight">
                      {prod.product_name}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </FullscreenModal>
  );
}
