"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FullscreenModal from "@/components/admin/FullscreenModal";
import ImageUploadField from "@/components/admin/ImageUploadField";
import TagInputList from "@/components/admin/TagInputList";
import { convertToWebP } from "@/lib/utils/media";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import {
  saveProjectAction,
  uploadProjectCoverAction,
  uploadProjectGalleryAction,
  ProjectFormData,
} from "./actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ProjectFormData | null;
}

export default function ProjectModal({ isOpen, onClose, initialData }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "gallery" | "materials"
  >("general");

  const [titleEs, setTitleEs] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Residencial");
  const [location, setLocation] = useState("");
  const [shortDescEs, setShortDescEs] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [descEs, setDescEs] = useState("");
  const [descEn, setDescEn] = useState("");
  const [showInHome, setShowInHome] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [materialSkus, setMaterialSkus] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitleEs(initialData.title_es || "");
      setTitleEn(initialData.title_en || "");
      setSlug(initialData.slug || "");
      setCategory(initialData.category || "Residencial");
      setLocation(initialData.location || "");
      setShortDescEs(initialData.short_description_es || "");
      setShortDescEn(initialData.short_description_en || "");
      setDescEs(initialData.description_es || "");
      setDescEn(initialData.description_en || "");
      setShowInHome(initialData.show_in_home ?? false);
      setIsActive(initialData.is_active ?? true);
      setSortOrder(initialData.sort_order ?? 0);
      setCoverImage(initialData.cover_image || "");
      setCoverPreview(initialData.cover_image || null);
      setGalleryImages(
        Array.isArray(initialData.gallery_images)
          ? initialData.gallery_images
          : [],
      );
      setMaterialSkus(
        Array.isArray(initialData.material_skus)
          ? initialData.material_skus
          : [],
      );
    } else {
      setTitleEs("");
      setTitleEn("");
      setSlug("");
      setCategory("Residencial");
      setLocation("");
      setShortDescEs("");
      setShortDescEn("");
      setDescEs("");
      setDescEn("");
      setShowInHome(false);
      setIsActive(true);
      setSortOrder(0);
      setCoverImage("");
      setCoverPreview(null);
      setGalleryImages([]);
      setMaterialSkus([]);
    }
    setPendingCoverFile(null);
    setActiveTab("general");
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

  const handleAutoTranslate = async () => {
    if (!titleEs && !shortDescEs && !descEs) {
      alert("Ingresa al menos el título o una descripción en español.");
      return;
    }

    setIsTranslating(true);
    const res = await autoTranslateAction({
      title: titleEs,
      short_description: shortDescEs,
      description: descEs,
    });
    setIsTranslating(false);

    if (res.success && res.data) {
      if (res.data.title) setTitleEn(res.data.title);
      if (res.data.short_description)
        setShortDescEn(res.data.short_description);
      if (res.data.description) setDescEn(res.data.description);
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

  const handleAddGalleryImages = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!slug) {
      alert("Ingresa primero el nombre y slug del proyecto.");
      return;
    }

    setUploadingGallery(true);
    const uploaded: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const optimized = await convertToWebP(files[i], 2560, 0.92);
        const fd = new FormData();
        fd.append("file", optimized);
        fd.append("slug", slug);

        const res = await uploadProjectGalleryAction(fd);
        if (res.success && res.url) {
          uploaded.push(res.url);
        }
      }
      if (uploaded.length > 0) {
        setGalleryImages((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
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
        const fd = new FormData();
        fd.append("file", optimizedCover);
        fd.append("slug", slug);

        const res = await uploadProjectCoverAction(fd);
        if (res.success && res.url) {
          finalCoverUrl = res.url;
        } else {
          alert("Error al subir portada: " + res.error);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        return;
      }
    }

    const payload: ProjectFormData = {
      id: initialData?.id,
      title_es: titleEs,
      title_en: titleEn,
      slug,
      category,
      location,
      short_description_es: shortDescEs,
      short_description_en: shortDescEn,
      description_es: descEs,
      description_en: descEn,
      cover_image: finalCoverUrl,
      gallery_images: galleryImages,
      material_skus: materialSkus,
      show_in_home: showInHome,
      is_active: isActive,
      sort_order: Number(sortOrder),
    };

    const res = await saveProjectAction(payload);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      alert("Error al guardar proyecto: " + res.error);
    }
  };

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSubmit}
      title={
        initialData?.id
          ? `Editando: ${initialData.title_es}`
          : "Nuevo Proyecto Arquitectónico"
      }
      subtitle="ESTUDIO DE ARQUITECTURA"
      isSubmitting={isSubmitting || uploadingGallery || isTranslating}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: "general", label: "1. Datos Generales & Portada" },
        {
          id: "gallery",
          label: "2. Galería de Obra",
          badgeCount: galleryImages.length,
        },
        {
          id: "materials",
          label: "3. Materiales Aplicados",
          badgeCount: materialSkus.length,
        },
      ]}
    >
      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="space-y-6 font-sans">
          <div className="flex justify-between items-center border-b border-border-light pb-3">
            <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 font-semibold">
              Datos Principales
            </span>
            <button
              type="button"
              disabled={isTranslating}
              onClick={handleAutoTranslate}
              className="px-3.5 py-1.5 bg-accent-soft border border-accent/30 text-accent-ink font-mono text-maya-label uppercase font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>
                {isTranslating ? "✦ Traduciendo..." : "✦ Auto-traducir con IA"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Nombre del Proyecto (Español) *
              </label>
              <input
                type="text"
                required
                value={titleEs}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej. St. Regis"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Nombre del Proyecto (Inglés)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Ej. St. Regis Resort"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Slug URL *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="st-regis"
                className="w-full px-3.5 py-2.5 border border-accent/25 font-mono text-maya-small bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Tipología / Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small font-mono bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="Hospitality">Hospitality / Hotel</option>
                <option value="Residencial">Residencial / Villas</option>
                <option value="Comercial">Comercial / Retail</option>
                <option value="Usos Mixtos">Usos Mixtos / Corporativo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Ubicación / Ciudad
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Costa Mujeres, Quintana Roo"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Orden de Aparición
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-accent/25 font-mono text-maya-small bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <ImageUploadField
            label="Fotografía Principal de Portada"
            previewUrl={coverPreview}
            onFileSelect={handleSelectCover}
            onRemove={() => {
              setCoverImage("");
              setCoverPreview(null);
              setPendingCoverFile(null);
            }}
            aspect="portrait"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Resumen Corto (Español)
              </label>
              <textarea
                rows={2}
                value={shortDescEs}
                onChange={(e) => setShortDescEs(e.target.value)}
                placeholder="1-2 frases descriptivas del concepto..."
                className="w-full block min-h-[80px] p-3 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral focus:outline-none focus:border-accent resize-y rounded-3xs leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Resumen Corto (Inglés)
              </label>
              <textarea
                rows={2}
                value={shortDescEn}
                onChange={(e) => setShortDescEn(e.target.value)}
                placeholder="1-2 descriptive sentences..."
                className="w-full block min-h-[80px] p-3 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral focus:outline-none focus:border-accent resize-y rounded-3xs leading-relaxed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Memoria Descriptiva Completa (Español)
              </label>
              <textarea
                rows={4}
                value={descEs}
                onChange={(e) => setDescEs(e.target.value)}
                placeholder="Descripción arquitectónica amplia, intención de diseño y ejecución..."
                className="w-full block min-h-[120px] p-3 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral focus:outline-none focus:border-accent resize-y rounded-3xs leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-mono text-maya-label uppercase text-black-neutral/70 font-semibold">
                Memoria Descriptiva Completa (Inglés)
              </label>
              <textarea
                rows={4}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Full architectural statement and execution overview in English..."
                className="w-full block min-h-[120px] p-3 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral focus:outline-none focus:border-accent resize-y rounded-3xs leading-relaxed"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border-light font-mono text-maya-small">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInHome}
                onChange={(e) => setShowInHome(e.target.checked)}
                className="accent-accent w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-black-neutral">
                Destacar en Sección Home
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-black-neutral w-4 h-4 cursor-pointer"
              />
              <span>Proyecto Activo (Visible)</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: GALLERY */}
      {activeTab === "gallery" && (
        <div className="space-y-6 font-sans">
          <div className="flex justify-between items-center border-b border-border-light pb-3">
            <div>
              <h3 className="text-maya-h4 font-light uppercase tracking-editorial text-black-neutral">
                Fotografías de Obra e Interiorismo ({galleryImages.length})
              </h3>
              <p className="font-mono text-maya-label text-black-neutral/50">
                Sube renders y fotografías terminadas en alta definición.
              </p>
            </div>
            {uploadingGallery && (
              <span className="font-mono text-maya-label text-accent-ink animate-pulse">
                Optimizando y subiendo...
              </span>
            )}
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleAddGalleryImages}
            disabled={uploadingGallery}
            className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {galleryImages.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-4/3 border border-border-light bg-black-pure overflow-hidden group rounded-2xs shadow-2xs"
              >
                <img
                  src={url}
                  alt={`Obra ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-mono w-5 h-5 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MATERIALS */}
      {activeTab === "materials" && (
        <div className="space-y-6 font-sans">
          <TagInputList
            label="SKUs de Materiales MAYA Utilizados en este Proyecto"
            placeholder="Ej. MAR-001, TRAVERTINO-ROMANO..."
            items={materialSkus}
            onChange={setMaterialSkus}
            badgeStyle="accent"
          />
        </div>
      )}
    </FullscreenModal>
  );
}
