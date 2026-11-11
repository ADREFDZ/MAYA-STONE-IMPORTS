"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FullscreenModal from "@/components/admin/FullscreenModal";
import ImageUploadField from "@/components/admin/ImageUploadField";
import {
  compressVideoForWeb,
  convertToWebP,
  STORAGE_CACHE_SECONDS,
  type VideoProgress,
} from "@/lib/utils/media";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import {
  saveCollectionAction,
  uploadCollectionLogoAction,
} from "./actions";

/** Límite del catálogo PDF (el plan de Supabase admite hasta 50 MB por archivo). */
const MAX_CATALOG_MB = 50;

export interface ProductSimple {
  sku: string;
  product_name: string;
  category: string;
  image_url?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
  availableProducts: ProductSimple[];
}

/**
 * Comprime un video para web (H.264 1080p, faststart) mostrando el avance.
 * Si algo falla (navegador sin WebAssembly, sin red para descargar ffmpeg…),
 * sube el original para no bloquear al admin.
 */
async function prepareVideo(file: File, onStatus: (text: string) => void) {
  const labels: Record<VideoProgress["stage"], string> = {
    loading: "Preparando compresor…",
    analyzing: "Analizando video…",
    compressing: "Optimizando",
    done: "Listo",
  };
  try {
    const out = await compressVideoForWeb(file, ({ stage, ratio }) =>
      onStatus(
        stage === "compressing" && ratio !== undefined
          ? `${labels[stage]} ${Math.round(ratio * 100)}%`
          : labels[stage],
      ),
    );
    if (out.size > 48 * 1024 * 1024) {
      throw new Error(
        `El video optimizado pesa ${(out.size / 1048576).toFixed(0)} MB (máx. 48 MB). Usa un clip más corto.`,
      );
    }
    return out;
  } catch (err) {
    if (err instanceof Error && err.message.includes("máx. 48 MB")) throw err;
    console.warn("[video] No se pudo optimizar, se sube el original:", err);
    if (file.size > 48 * 1024 * 1024) {
      throw new Error("No se pudo optimizar el video y el original supera 48 MB.");
    }
    return file;
  }
}

export default function CollectionModal({
  isOpen,
  onClose,
  initialData,
  availableProducts,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "media_inventory"
  >("general");

  const [titleEs, setTitleEs] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [taglineEs, setTaglineEs] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [manifestEs, setManifestEs] = useState("");
  const [manifestEn, setManifestEn] = useState("");
  const [descriptionEs, setDescriptionEs] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [catalogUrl, setCatalogUrl] = useState("");
  const [pendingCatalogFile, setPendingCatalogFile] = useState<File | null>(
    null,
  );

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitleEs(initialData.title_es || "");
      setTitleEn(initialData.title_en || "");
      setSlug(initialData.slug || "");
      setLogoUrl(initialData.logo_url || "");
      setLogoPreview(initialData.logo_url || null);
      setTaglineEs(initialData.tagline_es || "");
      setTaglineEn(initialData.tagline_en || "");
      setManifestEs(initialData.manifest_es || "");
      setManifestEn(initialData.manifest_en || "");
      setDescriptionEs(initialData.description_es || "");
      setDescriptionEn(initialData.description_en || "");
      setVideoUrl(initialData.video_url || "");
      setCoverImage(initialData.cover_image || "");
      setCoverPreview(initialData.cover_image || null);

      setCatalogUrl(initialData.catalog_url || "");
      setIsActive(initialData.is_active ?? true);
      setSelectedSkus(
        Array.isArray(initialData.selected_skus)
          ? initialData.selected_skus
          : [],
      );
    } else {
      setTitleEs("");
      setTitleEn("");
      setSlug("");
      setLogoUrl("");
      setLogoPreview(null);
      setTaglineEs("");
      setTaglineEn("");
      setManifestEs("");
      setManifestEn("");
      setDescriptionEs("");
      setDescriptionEn("");
      setVideoUrl("");
      setCoverImage("");
      setCoverPreview(null);
      setCatalogUrl("");
      setIsActive(true);
      setSelectedSkus([]);
    }
    setActiveTab("general");
    setPendingCoverFile(null);
    setPendingLogoFile(null);
    setPendingCatalogFile(null);
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

  const handleAutoTranslateGeneral = async () => {
    if (!titleEs && !taglineEs && !manifestEs && !descriptionEs) {
      alert("Ingresa al menos el título o contenido en español.");
      return;
    }

    setIsTranslating(true);
    const res = await autoTranslateAction({
      title: titleEs,
      tagline: taglineEs,
      manifest: manifestEs,
      description: descriptionEs,
    });
    setIsTranslating(false);

    if (res.success && res.data) {
      if (res.data.title) setTitleEn(res.data.title);
      if (res.data.tagline) setTaglineEn(res.data.tagline);
      if (res.data.manifest) setManifestEn(res.data.manifest);
      if (res.data.description) setDescriptionEn(res.data.description);
    } else {
      alert("Error al traducir: " + res.error);
    }
  };

  const handleSelectCatalog = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      alert("El catálogo debe ser un archivo PDF.");
      return;
    }
    if (file.size > MAX_CATALOG_MB * 1024 * 1024) {
      alert(
        `El PDF pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB. Comprímelo a menos de ${MAX_CATALOG_MB} MB.`,
      );
      return;
    }
    setPendingCatalogFile(file);
  };

  const handleRemoveCatalog = () => {
    setCatalogUrl("");
    setPendingCatalogFile(null);
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

  const handleSelectLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setLogoPreview(null);
    setPendingLogoFile(null);
  };

  const handleSelectVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // El original puede ser pesado: se comprime aquí antes de subir.
    const MAX_INPUT_MB = 600;
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      alert(
        `El video pesa ${(file.size / (1024 * 1024)).toFixed(0)} MB. El máximo para procesar en el navegador es ${MAX_INPUT_MB} MB.`,
      );
      return;
    }

    if (!slug) {
      alert("Ingresa primero el título y slug.");
      return;
    }

    setUploadingVideo(true);
    try {
      const supabase = createClient();
      const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
      const webVideo = await prepareVideo(file, setVideoStatus);
      setVideoStatus("Subiendo…");
      const fileName = `hero-loop-${Date.now()}.mp4`;
      const filePath = `collections/${cleanSlug}/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(filePath, webVideo, {
          contentType: "video/mp4",
          cacheControl: STORAGE_CACHE_SECONDS,
          upsert: true,
        });

      if (uploadError) {
        alert("Error al subir video: " + uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("materials")
        .getPublicUrl(filePath);

      setVideoUrl(`${publicData.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      console.error(err);
      alert("Error procesando la subida del video.");
    } finally {
      setUploadingVideo(false);
      setVideoStatus("");
    }
  };

  const toggleSku = (sku: string) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalCoverUrl = coverImage;
    let finalLogoUrl = logoUrl;

    if (slug) {
      if (pendingCoverFile) {
        // La portada se sube DIRECTO a Storage desde el navegador (igual que la
        // galería). Antes pasaba por una Server Action y, con imágenes grandes,
        // superaba el límite de 10 MB del proxy: fallaba en silencio y la
        // colección se guardaba sin portada.
        try {
          const optimizedCover = await convertToWebP(
            pendingCoverFile,
            { maxBytes: 12 * 1024 * 1024 },
          );
          const supabase = createClient();
          const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
          const filePath = `collections/${cleanSlug}/cover-${Date.now()}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, optimizedCover, {
              contentType: optimizedCover.type,
              cacheControl: "31536000",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage
            .from("materials")
            .getPublicUrl(filePath);
          finalCoverUrl = publicData.publicUrl;
        } catch (err) {
          console.error("Error subiendo portada:", err);
          const msg = err instanceof Error ? err.message : String(err);
          setIsSubmitting(false);
          alert(
            "No se pudo subir la portada: " +
              msg +
              "\nNo se guardaron los cambios; inténtalo de nuevo.",
          );
          return;
        }
      }

      if (pendingLogoFile) {
        try {
          const formData = new FormData();
          formData.append("file", pendingLogoFile);
          formData.append("slug", slug);

          const uploadLogoRes = await uploadCollectionLogoAction(formData);
          if (uploadLogoRes.success && uploadLogoRes.url) {
            finalLogoUrl = uploadLogoRes.url;
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    // Catálogo PDF: se sube directo a Storage desde el navegador
    let finalCatalogUrl = catalogUrl;
    if (pendingCatalogFile) {
      if (!slug) {
        setIsSubmitting(false);
        alert("Ingresa primero el título y slug.");
        return;
      }
      try {
        const supabase = createClient();
        const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
        const filePath = `collections/${cleanSlug}/catalogo-${cleanSlug}-${Date.now()}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, pendingCatalogFile, {
            contentType: "application/pdf",
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("materials")
          .getPublicUrl(filePath);
        finalCatalogUrl = publicData.publicUrl;
      } catch (err) {
        console.error("Error subiendo catálogo:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setIsSubmitting(false);
        alert(
          "No se pudo subir el catálogo PDF: " +
            msg +
            "\nNo se guardaron los cambios; inténtalo de nuevo.",
        );
        return;
      }
    }

    const res = await saveCollectionAction({
      id: initialData?.id,
      title_es: titleEs,
      title_en: titleEn,
      slug,
      logo_url: finalLogoUrl,
      tagline_es: taglineEs,
      tagline_en: taglineEn,
      manifest_es: manifestEs,
      manifest_en: manifestEn,
      description_es: descriptionEs,
      description_en: descriptionEn,
      cover_image: finalCoverUrl,
      video_url: videoUrl,
      // La galería/moodboard de la colección ya no se usa en el sitio.
      gallery_images: [],
      catalog_url: finalCatalogUrl,
      is_active: isActive,
      selected_skus: selectedSkus,
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
          ? `Editando: ${initialData.title_es}`
          : "Nueva Colección"
      }
      isSubmitting={
        isSubmitting || uploadingVideo || isTranslating
      }
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: "general", label: "1. Portadilla, Logo & Medios" },
        {
          id: "media_inventory",
          label: "2. Materiales & Galería",
          badgeCount: selectedSkus.length,
        },
      ]}
    >
      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="space-y-6 sm:space-y-8 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4">
            <h3 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
              Información General, Logotipo & Portadilla (Bilingüe)
            </h3>
            <button
              type="button"
              disabled={isTranslating}
              onClick={handleAutoTranslateGeneral}
              className="px-3.5 py-1.5 bg-accent-soft border border-accent/30 text-accent-ink font-mono text-maya-label uppercase tracking-data font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto shrink-0"
            >
              <span>
                {isTranslating ? "✦ Traduciendo..." : "✦ Auto-traducir con IA"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Título (Español) *
              </label>
              <input
                type="text"
                required
                value={titleEs}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ej. TRAVERTINO"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Título (Inglés)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Ej. TRAVERTINE"
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Slug URL *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="travertino"
                className="w-full px-3.5 py-2.5 border border-accent/25 font-mono text-maya-small bg-accent-soft text-black-neutral focus:outline-none focus:border-accent rounded-3xs"
              />
            </div>
          </div>

          {/* Subida de Logo Propio de la Colección */}
          <div className="p-4 sm:p-5 bg-surface border border-border-light rounded-2xs space-y-3 shadow-2xs">
            <div className="space-y-0.5">
              <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                Logotipo / Isotipo de la Colección (PNG Transparente, SVG o
                WebP)
              </span>
              <p className="font-mono text-maya-label text-black-neutral/50">
                Se mostrará en la portadilla y navegación en sustitución del
                texto plano.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
              <div className="w-48 h-20 bg-black-pure border border-border-light flex items-center justify-center p-3 rounded-3xs relative overflow-hidden shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="font-mono text-[10px] uppercase text-white/30 text-center tracking-data">
                    Sin Logo (Usará Texto)
                  </span>
                )}
              </div>

              <div className="space-y-2 font-mono text-maya-small flex-1">
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  onChange={handleSelectLogo}
                  className="text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
                />
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="block px-2.5 py-1 text-maya-label text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-3xs cursor-pointer"
                  >
                    Remover Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Tagline / Cita (Español)
              </label>
              <input
                type="text"
                value={taglineEs}
                onChange={(e) => setTaglineEs(e.target.value)}
                placeholder='Ej. "El registro mineral de la superficie terrestre."'
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral font-serif italic rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Tagline / Cita (Inglés)
              </label>
              <input
                type="text"
                value={taglineEn}
                onChange={(e) => setTaglineEn(e.target.value)}
                placeholder='Ej. "The mineral record of the earth surface."'
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral font-serif italic rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Manifiesto (Español)
              </label>
              <textarea
                rows={4}
                value={manifestEs}
                onChange={(e) => setManifestEs(e.target.value)}
                placeholder="Texto introductorio en español..."
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-y font-sans leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Manifiesto (Inglés)
              </label>
              <textarea
                rows={4}
                value={manifestEn}
                onChange={(e) => setManifestEn(e.target.value)}
                placeholder="Introductory statement in English..."
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-y font-sans leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Reseña Corta para Home (Español)
              </label>
              <textarea
                rows={3}
                value={descriptionEs}
                onChange={(e) => setDescriptionEs(e.target.value)}
                placeholder="Texto breve de 2 líneas en español..."
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-y font-sans leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Reseña Corta para Home (Inglés)
              </label>
              <textarea
                rows={3}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Short 2-line summary in English..."
                className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-y font-sans leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-4 border-t border-border-light">
            <ImageUploadField
              label="Fotografía de Portada (4:5)"
              previewUrl={coverPreview}
              onFileSelect={handleSelectCover}
              onRemove={handleRemoveCover}
              aspect="portrait"
            />

            <div className="p-4 sm:p-5 bg-surface border border-border-light rounded-2xs space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                  Video Hero en Loop (Opcional)
                </span>
                {uploadingVideo && (
                  <span
                    role="status"
                    className="font-mono text-maya-label text-accent-ink animate-pulse"
                  >
                    {videoStatus || "Subiendo..."}
                  </span>
                )}
              </div>

              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleSelectVideo}
                disabled={uploadingVideo}
                className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
              />

              {videoUrl && (
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xs border border-border-light bg-black-pure">
                  <video
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setVideoUrl("")}
                    className="absolute top-1.5 right-1.5 bg-red-600 text-white font-mono text-maya-label px-2 py-0.5 rounded-3xs cursor-pointer shadow-xs"
                  >
                    Remover Video
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-surface border border-border-light rounded-2xs space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral font-semibold">
                Catálogo Digital (PDF)
              </span>
              <span className="font-mono text-maya-label text-black-neutral/50">
                Se descarga al final de la colección · Máx. {MAX_CATALOG_MB} MB
              </span>
            </div>

            {(catalogUrl || pendingCatalogFile) && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 border border-border-light bg-gray-warm rounded-3xs">
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="shrink-0 font-mono text-maya-label px-1.5 py-0.5 bg-black-neutral text-gray-warm rounded-3xs">
                    PDF
                  </span>
                  <span className="truncate font-sans text-maya-small text-black-neutral">
                    {pendingCatalogFile
                      ? `${pendingCatalogFile.name} · ${(pendingCatalogFile.size / (1024 * 1024)).toFixed(1)} MB (se sube al guardar)`
                      : decodeURIComponent(
                          catalogUrl.split("/").pop()?.split("?")[0] || "",
                        )}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {catalogUrl && !pendingCatalogFile && (
                    <a
                      href={catalogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-maya-label uppercase tracking-data text-accent-ink underline underline-offset-2"
                    >
                      Ver
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveCatalog}
                    className="font-mono text-maya-label uppercase tracking-data text-red-600 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleSelectCatalog}
              className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
            />
            <p className="font-sans text-maya-label text-black-neutral/50">
              Para actualizarlo, sube el nuevo PDF y guarda: el anterior se
              reemplaza automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border-light">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-black-neutral cursor-pointer w-4 h-4"
            />
            <label
              htmlFor="is_active"
              className="text-maya-small text-black-neutral cursor-pointer select-none font-sans font-medium"
            >
              Colección Activa (Visible en catálogo y filtros públicos)
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: MATERIALES & GALERÍA */}
      {activeTab === "media_inventory" && (
        <div className="space-y-8 sm:space-y-10 font-sans">
          <div className="space-y-4">
            <div className="border-b border-border-light pb-4">
              <h3 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
                Materiales Asignados ({selectedSkus.length})
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2 border border-accent/25 font-mono text-maya-small bg-accent-soft text-black-neutral focus:border-accent focus:outline-none cursor-pointer rounded-3xs"
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
                placeholder="Buscar por SKU o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3.5 py-2 border border-accent/25 font-sans text-maya-small focus:border-accent focus:outline-none bg-accent-soft text-black-neutral w-full sm:w-64 rounded-3xs placeholder:text-black-neutral/40"
              />
            </div>

            <div className="max-h-[380px] overflow-y-auto border border-border-light p-3 sm:p-4 bg-surface grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 rounded-2xs">
              {filteredProducts.map((prod) => {
                const isSelected = selectedSkus.includes(prod.sku);
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
                            : "bg-surface text-black-neutral/40 border border-border-light"
                        }`}
                      >
                        {isSelected ? "✓" : "+"}
                      </span>
                    </div>

                    <div className="w-full h-24 bg-surface border border-border-light overflow-hidden mb-2 relative flex items-center justify-center rounded-3xs">
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
        </div>
      )}
    </FullscreenModal>
  );
}
