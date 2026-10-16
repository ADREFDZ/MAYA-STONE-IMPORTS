"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FullscreenModal from "@/components/admin/FullscreenModal";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { convertToWebP, isVideoUrl } from "@/lib/utils/media";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import {
  saveCollectionAction,
  uploadCollectionLogoAction,
  EditorialBlockData,
} from "./actions";

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

export default function CollectionModal({
  isOpen,
  onClose,
  initialData,
  availableProducts,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "editorial" | "media_inventory"
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
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [editorialBlocks, setEditorialBlocks] = useState<EditorialBlockData[]>(
    [],
  );

  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
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

      let parsedGallery = initialData.gallery_images;
      if (typeof parsedGallery === "string") {
        try {
          parsedGallery = JSON.parse(parsedGallery);
        } catch {
          parsedGallery = [];
        }
      }
      setGalleryImages(Array.isArray(parsedGallery) ? parsedGallery : []);

      let rawBlocks = initialData.editorial_blocks;
      if (typeof rawBlocks === "string") {
        try {
          rawBlocks = JSON.parse(rawBlocks);
        } catch {
          rawBlocks = [];
        }
      }

      if (Array.isArray(rawBlocks)) {
        const normalizedBlocks: EditorialBlockData[] = rawBlocks.map(
          (b: any, idx: number) => ({
            id: b.id || `block-${Date.now()}-${idx}`,
            title: b.title || b.title_es || "",
            title_en: b.title_en || "",
            subtitle: b.subtitle || b.subtitle_es || "",
            subtitle_en: b.subtitle_en || "",
            content: b.content || b.content_es || b.body || "",
            content_en: b.content_en || "",
            curatorialNote:
              b.curatorialNote ||
              b.curatorial_note ||
              b.curatorial_note_es ||
              "",
            curatorialNote_en: b.curatorialNote_en || "",
            bullets: Array.isArray(b.bullets) ? b.bullets : [],
          }),
        );
        setEditorialBlocks(normalizedBlocks);
      } else {
        setEditorialBlocks([]);
      }

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
      setGalleryImages([]);
      setEditorialBlocks([]);
      setIsActive(true);
      setSelectedSkus([]);
    }
    setActiveTab("general");
    setPendingCoverFile(null);
    setPendingLogoFile(null);
    setUploadProgressText("");
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

  const handleAutoTranslateBlock = async (bIdx: number) => {
    const block = editorialBlocks[bIdx];
    if (
      !block.title &&
      !block.subtitle &&
      !block.content &&
      !block.curatorialNote
    ) {
      alert("Ingresa contenido en español en este ensayo primero.");
      return;
    }

    setIsTranslating(true);
    const res = await autoTranslateAction({
      title: block.title,
      subtitle: block.subtitle,
      content: block.content,
      curatorialNote: block.curatorialNote,
    });
    setIsTranslating(false);

    if (res.success && res.data) {
      setEditorialBlocks((prev) => {
        const updated = [...prev];
        updated[bIdx] = {
          ...updated[bIdx],
          title_en: res.data?.title || updated[bIdx].title_en,
          subtitle_en: res.data?.subtitle || updated[bIdx].subtitle_en,
          content_en: res.data?.content || updated[bIdx].content_en,
          curatorialNote_en:
            res.data?.curatorialNote || updated[bIdx].curatorialNote_en,
        };
        return updated;
      });
    } else {
      alert("Error al traducir el ensayo: " + res.error);
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

    const MAX_SIZE_MB = 35;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(
        `El video pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB. Optimízalo a menos de ${MAX_SIZE_MB} MB.`,
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
      const ext = file.name.split(".").pop() || "mp4";
      const fileName = `hero-loop-${Date.now()}.${ext}`;
      const filePath = `collections/${cleanSlug}/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(filePath, file, {
          contentType: file.type || "video/mp4",
          cacheControl: "3600",
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
    }
  };

  const handleAddGalleryMedia = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !slug) {
      if (!slug) alert("Ingresa primero el título y slug.");
      return;
    }

    setUploadingGallery(true);
    const uploadedUrls: string[] = [];
    const supabase = createClient();
    const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Procesando ${i + 1} de ${files.length}...`);

        if (file.type.startsWith("image/")) {
          const optimizedFile = await convertToWebP(file, 2560, 0.92);
          const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
          const filePath = `collections/${cleanSlug}/gallery/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, optimizedFile, {
              contentType: "image/webp",
              cacheControl: "3600",
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from("materials")
              .getPublicUrl(filePath);
            uploadedUrls.push(`${publicData.publicUrl}?t=${Date.now()}`);
          }
        } else if (file.type.startsWith("video/")) {
          const ext = file.name.split(".").pop() || "mp4";
          const fileName = `gallery-vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;
          const filePath = `collections/${cleanSlug}/videos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, file, {
              contentType: file.type || "video/mp4",
              cacheControl: "3600",
              upsert: true,
            });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from("materials")
              .getPublicUrl(filePath);
            uploadedUrls.push(`${publicData.publicUrl}?t=${Date.now()}`);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((prev) => [...prev, ...uploadedUrls]);
      }
    } finally {
      setUploadingGallery(false);
      setUploadProgressText("");
      e.target.value = "";
    }
  };

  const handleAddEditorialBlock = () => {
    setEditorialBlocks((prev) => [
      ...prev,
      {
        id: `block-${Date.now()}`,
        title: "",
        title_en: "",
        subtitle: "",
        subtitle_en: "",
        content: "",
        content_en: "",
        curatorialNote: "",
        curatorialNote_en: "",
        bullets: [],
      },
    ]);
  };

  const handleUpdateEditorialBlock = (
    index: number,
    field: keyof EditorialBlockData,
    value: any,
  ) => {
    setEditorialBlocks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveEditorialBlock = (index: number) => {
    setEditorialBlocks((prev) => prev.filter((_, i) => i !== index));
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
            2560,
            0.85,
          );
          const supabase = createClient();
          const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9_-]/g, "");
          const filePath = `collections/${cleanSlug}/cover-${Date.now()}.webp`;

          const { error: uploadError } = await supabase.storage
            .from("materials")
            .upload(filePath, optimizedCover, {
              contentType: "image/webp",
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

    const validEditorialBlocks = editorialBlocks
      .map((b) => ({
        ...b,
        title: b.title || "",
        title_en: b.title_en || "",
        subtitle: b.subtitle || "",
        subtitle_en: b.subtitle_en || "",
        content: b.content || "",
        content_en: b.content_en || "",
        curatorialNote: b.curatorialNote || "",
        curatorialNote_en: b.curatorialNote_en || "",
      }))
      .filter((b) => b.title.trim() !== "" || b.content.trim() !== "");

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
      gallery_images: galleryImages,
      editorial_blocks: validEditorialBlocks,
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
        isSubmitting || uploadingGallery || uploadingVideo || isTranslating
      }
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: "general", label: "1. Portadilla, Logo & Medios" },
        {
          id: "editorial",
          label: "2. Ensayos",
          badgeCount: editorialBlocks.length,
        },
        {
          id: "media_inventory",
          label: "3. Materiales & Galería",
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
                  <span className="font-mono text-maya-label text-accent-ink animate-pulse">
                    Subiendo...
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

      {/* TAB 2: EDITORIAL */}
      {activeTab === "editorial" && (
        <div className="space-y-6 sm:space-y-8 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4">
            <div>
              <h3 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
                Ensayos Editoriales & Geológicos ({editorialBlocks.length})
              </h3>
              <p className="font-mono text-maya-label text-black-neutral/60 mt-0.5">
                Redacta los textos curatoriales en ambos idiomas para la
                narrativa visual.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddEditorialBlock}
              className="px-4 py-2 bg-black-neutral text-white font-mono text-maya-label uppercase tracking-data hover:bg-black-pure transition-colors cursor-pointer self-start sm:self-auto rounded-3xs shrink-0"
            >
              + Agregar Nuevo Ensayo
            </button>
          </div>

          {editorialBlocks.length === 0 ? (
            <div className="p-8 sm:p-12 text-center border-2 border-dashed border-border-strong rounded-2xs space-y-3 bg-surface">
              <p className="font-mono text-maya-small text-black-neutral/50 uppercase">
                No hay bloques o ensayos agregados a esta colección.
              </p>
              <button
                type="button"
                onClick={handleAddEditorialBlock}
                className="text-accent-ink font-mono text-maya-small uppercase underline cursor-pointer"
              >
                Agregar el primer ensayo (Ej. Génesis y Extracción)
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {editorialBlocks.map((block, bIdx) => (
                <div
                  key={block.id || `block-${bIdx}`}
                  className="p-4 sm:p-6 bg-surface border border-border-light space-y-4 rounded-2xs relative shadow-2xs"
                >
                  <div className="flex justify-between items-center border-b border-border-light pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-maya-small text-accent-ink uppercase font-bold tracking-data">
                        Ensayo #{bIdx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={isTranslating}
                        onClick={() => handleAutoTranslateBlock(bIdx)}
                        className="px-2.5 py-1 bg-surface border border-accent/30 text-accent-ink font-mono text-maya-label uppercase font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer"
                      >
                        ✦ Traducir Ensayo
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEditorialBlock(bIdx)}
                      className="text-red-600 hover:text-red-800 font-mono text-maya-label uppercase cursor-pointer"
                    >
                      Eliminar Ensayo ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Título (Español) *
                      </label>
                      <input
                        type="text"
                        required
                        value={block.title}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "title",
                            e.target.value,
                          )
                        }
                        placeholder="Ej. Génesis y Extracción"
                        className="w-full px-3.5 py-2 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral font-medium rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Título (Inglés)
                      </label>
                      <input
                        type="text"
                        value={block.title_en || ""}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "title_en",
                            e.target.value,
                          )
                        }
                        placeholder="Ej. Genesis & Extraction"
                        className="w-full px-3.5 py-2 border border-accent/25 text-maya-body bg-accent-soft text-black-neutral font-medium rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Subtítulo (Español)
                      </label>
                      <input
                        type="text"
                        value={block.subtitle || ""}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "subtitle",
                            e.target.value,
                          )
                        }
                        placeholder="Ej. ORIGEN & PROCESO GEOLÓGICO"
                        className="w-full px-3.5 py-2 border border-accent/25 font-mono text-maya-small bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Subtítulo (Inglés)
                      </label>
                      <input
                        type="text"
                        value={block.subtitle_en || ""}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "subtitle_en",
                            e.target.value,
                          )
                        }
                        placeholder="Ej. GEOLOGICAL ORIGIN & PROCESS"
                        className="w-full px-3.5 py-2 border border-accent/25 font-mono text-maya-small bg-accent-soft text-black-neutral rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Cuerpo del Ensayo (Español) *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={block.content}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "content",
                            e.target.value,
                          )
                        }
                        placeholder="Redacta la explicación en español..."
                        className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-y font-sans leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Cuerpo del Ensayo (Inglés)
                      </label>
                      <textarea
                        rows={4}
                        value={block.content_en || ""}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "content_en",
                            e.target.value,
                          )
                        }
                        placeholder="Essay body in English..."
                        className="w-full px-3.5 py-2.5 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral resize-y font-sans leading-relaxed rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Nota Curatorial (Español)
                      </label>
                      <input
                        type="text"
                        value={block.curatorialNote || ""}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "curatorialNote",
                            e.target.value,
                          )
                        }
                        placeholder='Ej. "Cada estrato visible representa una estación mineral."'
                        className="w-full px-3.5 py-2 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral font-serif italic rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                        Nota Curatorial (Inglés)
                      </label>
                      <input
                        type="text"
                        value={block.curatorialNote_en || ""}
                        onChange={(e) =>
                          handleUpdateEditorialBlock(
                            bIdx,
                            "curatorialNote_en",
                            e.target.value,
                          )
                        }
                        placeholder='Ej. "Each visible layer represents a mineral season."'
                        className="w-full px-3.5 py-2 border border-accent/25 text-maya-small bg-accent-soft text-black-neutral font-serif italic rounded-3xs focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATERIALES & GALERÍA */}
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

          <div className="space-y-4 pt-6 border-t border-border-light">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-sans text-maya-h4 uppercase tracking-editorial text-black-neutral font-medium">
                Galería Editorial / Moodboard ({galleryImages.length})
              </h3>
              {uploadingGallery && (
                <span className="font-mono text-maya-label text-accent-ink animate-pulse">
                  {uploadProgressText || "Subiendo lote..."}
                </span>
              )}
            </div>

            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm"
              onChange={handleAddGalleryMedia}
              disabled={uploadingGallery}
              className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
            />

            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {galleryImages.map((mediaUrl, idx) => {
                  const isVid = isVideoUrl(mediaUrl);
                  return (
                    <div
                      key={idx}
                      className="relative aspect-square border border-border-light group overflow-hidden bg-black-pure rounded-2xs shadow-2xs"
                    >
                      {isVid ? (
                        <video
                          src={mediaUrl}
                          muted
                          loop
                          playsInline
                          autoPlay
                          className="w-full h-full object-cover opacity-80"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`Galería ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryImages((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </FullscreenModal>
  );
}
