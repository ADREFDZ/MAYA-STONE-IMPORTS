"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { autoTranslateAction } from "@/app/[lang]/admin/actions/translate";
import {
  uploadMaterialRenderAction,
  deleteMaterialRenderAction,
  updateFeaturedMaterialDetailsAction,
} from "./actions";

interface RenderItem {
  id: string;
  product_sku: string;
  render_url: string;
  application: string;
}

interface FeaturedHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    sku: string;
    product_name: string;
    category: string;
    description?: string | null;
    description_en?: string | null;
    image_url?: string | null;
    uses?: string[] | null;
    uses_en?: string[] | null;
    material_renders?: RenderItem[] | null;
    is_featured?: boolean;
  } | null;
}

async function optimizeAndConvertToWebP(
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

export default function FeaturedHomeModal({
  isOpen,
  onClose,
  product,
}: FeaturedHomeModalProps) {
  const router = useRouter();

  const [descriptionEs, setDescriptionEs] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  const [usesEs, setUsesEs] = useState<string[]>([]);
  const [usesEn, setUsesEn] = useState<string[]>([]);
  const [useInputEs, setUseInputEs] = useState("");
  const [useInputEn, setUseInputEn] = useState("");

  const [renders, setRenders] = useState<RenderItem[]>([]);
  const [applicationName, setApplicationName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [originalSizeText, setOriginalSizeText] = useState<string>("");
  const [uploadingRender, setUploadingRender] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setDescriptionEs(product.description || "");
      setDescriptionEn(product.description_en || "");

      setUsesEs(Array.isArray(product.uses) ? [...product.uses] : []);
      setUsesEn(Array.isArray(product.uses_en) ? [...product.uses_en] : []);

      setRenders(
        Array.isArray(product.material_renders)
          ? [...product.material_renders]
          : [],
      );
      setSelectedFile(null);
      setFilePreview(null);
      setOriginalSizeText("");
      setApplicationName("");
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleAddUseEs = () => {
    const val = useInputEs.trim();
    if (val && !usesEs.includes(val)) {
      setUsesEs([...usesEs, val]);
      setUseInputEs("");
    }
  };

  const handleRemoveUseEs = (idx: number) => {
    setUsesEs(usesEs.filter((_, i) => i !== idx));
  };

  const handleAddUseEn = () => {
    const val = useInputEn.trim();
    if (val && !usesEn.includes(val)) {
      setUsesEn([...usesEn, val]);
      setUseInputEn("");
    }
  };

  const handleRemoveUseEn = (idx: number) => {
    setUsesEn(usesEn.filter((_, i) => i !== idx));
  };

  const handleAutoTranslateAll = async () => {
    if (!descriptionEs && usesEs.length === 0) {
      alert("Ingresa la reseña o usos en español primero.");
      return;
    }

    setIsTranslating(true);

    const usesTextToTranslate = usesEs.join(" | ");

    const res = await autoTranslateAction({
      description: descriptionEs,
      subtitle: usesTextToTranslate,
    });

    setIsTranslating(false);

    if (res.success && res.data) {
      if (res.data.description) {
        setDescriptionEn(res.data.description);
      }
      if (res.data.subtitle) {
        const translatedUses = res.data.subtitle
          .split("|")
          .map((u) => u.trim())
          .filter(Boolean);
        setUsesEn(translatedUses);
      }
    } else {
      alert("Error al traducir: " + res.error);
    }
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setOriginalSizeText(`${sizeInMB} MB`);
  };

  const handleUploadRender = async () => {
    if (!selectedFile) {
      alert("Por favor selecciona una imagen de render.");
      return;
    }

    setUploadingRender(true);
    try {
      const optimizedFile = await optimizeAndConvertToWebP(selectedFile);

      const formData = new FormData();
      formData.append("file", optimizedFile);
      formData.append("sku", product.sku);
      formData.append(
        "application",
        applicationName.trim() || "Aplicación Arquitectónica",
      );

      const res = await uploadMaterialRenderAction(formData);

      if (res.success) {
        setSelectedFile(null);
        setFilePreview(null);
        setApplicationName("");
        setOriginalSizeText("");
        router.refresh();
      } else {
        alert("Error al subir render: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error procesando y optimizando la imagen.");
    } finally {
      setUploadingRender(false);
    }
  };

  const handleDeleteRender = async (renderId: string, url: string) => {
    if (!confirm("¿Deseas eliminar este render de aplicación?")) return;

    const res = await deleteMaterialRenderAction(renderId, url);
    if (res.success) {
      setRenders((prev) => prev.filter((r) => r.id !== renderId));
      router.refresh();
    } else {
      alert("Error al eliminar: " + res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Guarda exactamente lo que el usuario especificó, permitiendo arreglos vacíos sin forzar español
    const res = await updateFeaturedMaterialDetailsAction({
      sku: product.sku,
      description: descriptionEs,
      description_en: descriptionEn,
      uses: usesEs,
      uses_en: usesEn,
      is_featured: true,
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
      router.refresh();
    } else {
      alert("Error al guardar detalles: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black-pure/80 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-surface border border-border-light w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl rounded-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-surface-secondary shrink-0">
          <div>
            <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink block font-semibold">
              GESTIÓN DE RENDERS Y DETALLES DEL MATERIAL
            </span>
            <h3 className="font-sans font-light text-maya-h4 tracking-editorial uppercase text-black-neutral">
              {product.product_name} ({product.sku})
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

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1 text-maya-small font-sans"
        >
          {/* Cabecera de Traducción Global */}
          <div className="flex justify-between items-center pb-2 border-b border-border-light">
            <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
              Especificación Editorial & Aplicaciones (Bilingüe)
            </span>
            <button
              type="button"
              disabled={isTranslating}
              onClick={handleAutoTranslateAll}
              className="px-3 py-1 bg-accent/10 border border-accent/30 text-accent-ink font-mono text-maya-label uppercase tracking-data font-semibold rounded-3xs hover:bg-accent hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>
                {isTranslating
                  ? "✦ Traduciendo todo..."
                  : "✦ Auto-traducir con IA"}
              </span>
            </button>
          </div>

          {/* Reseña Editorial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-maya-label font-mono uppercase tracking-data text-black-neutral/60">
                Descripción para la Home (Español)
              </label>
              <textarea
                rows={3}
                value={descriptionEs}
                onChange={(e) => setDescriptionEs(e.target.value)}
                placeholder="Escribe una breve reseña de esta pieza natural..."
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-small font-sans focus:outline-none bg-surface resize-none rounded-3xs leading-relaxed"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-maya-label font-mono uppercase tracking-data text-black-neutral/60">
                Descripción para la Home (Inglés)
              </label>
              <textarea
                rows={3}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Write a short editorial statement for the cover..."
                className="w-full px-3.5 py-2.5 border border-border-light text-maya-small font-sans focus:outline-none bg-surface resize-none rounded-3xs leading-relaxed"
              />
            </div>
          </div>

          {/* Usos y Aplicaciones en Español e Inglés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-light pt-4">
            {/* Columna ES */}
            <div className="space-y-2">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Aplicaciones (Español)
              </label>

              <div className="flex flex-wrap gap-1 pb-1">
                {[
                  "Interiores",
                  "Exteriores",
                  "Cubiertas y Cocinas",
                  "Muros y Fachadas",
                  "Pisos de Alto Tráfico",
                  "Baños & Zonas Húmedas",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (!usesEs.includes(preset)) {
                        setUsesEs([...usesEs, preset]);
                      }
                    }}
                    className="px-2 py-0.5 bg-accent/10 hover:bg-accent hover:text-white border border-accent/20 text-accent-ink font-mono text-[9px] uppercase rounded-3xs transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Muros y Fachadas..."
                  value={useInputEs}
                  onChange={(e) => setUseInputEs(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddUseEs();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border border-border-light text-maya-small font-sans focus:outline-none bg-surface rounded-3xs"
                />
                <button
                  type="button"
                  onClick={handleAddUseEs}
                  className="px-3 py-1.5 bg-surface-secondary border border-border-light text-maya-label font-mono uppercase hover:bg-black-neutral hover:text-white rounded-3xs cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {usesEs.map((u, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-secondary border border-border-light text-maya-label font-mono uppercase text-black-neutral rounded-3xs"
                  >
                    {u}
                    <button
                      type="button"
                      onClick={() => handleRemoveUseEs(idx)}
                      className="text-black-neutral/40 hover:text-red-600 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Columna EN */}
            <div className="space-y-2">
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Applications (Inglés)
              </label>

              <div className="flex flex-wrap gap-1 pb-1">
                {[
                  "Interiors",
                  "Exteriors",
                  "Countertops & Kitchens",
                  "Walls & Cladding",
                  "High-Traffic Flooring",
                  "Bathrooms & Wet Areas",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (!usesEn.includes(preset)) {
                        setUsesEn([...usesEn, preset]);
                      }
                    }}
                    className="px-2 py-0.5 bg-accent/10 hover:bg-accent hover:text-white border border-accent/20 text-accent-ink font-mono text-[9px] uppercase rounded-3xs transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex. Walls & Cladding..."
                  value={useInputEn}
                  onChange={(e) => setUseInputEn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddUseEn();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border border-border-light text-maya-small font-sans focus:outline-none bg-surface rounded-3xs"
                />
                <button
                  type="button"
                  onClick={handleAddUseEn}
                  className="px-3 py-1.5 bg-surface-secondary border border-border-light text-maya-label font-mono uppercase hover:bg-black-neutral hover:text-white rounded-3xs cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {usesEn.map((u, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-secondary border border-border-light text-maya-label font-mono uppercase text-black-neutral rounded-3xs"
                  >
                    {u}
                    <button
                      type="button"
                      onClick={() => handleRemoveUseEn(idx)}
                      className="text-black-neutral/40 hover:text-red-600 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subida de Renders */}
          <div className="space-y-4 border-t border-border-light pt-4">
            <div>
              <label className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/70 font-semibold">
                Subir Render de Aplicación (Optimización WebP Automática)
              </label>
              <p className="text-maya-label text-black-neutral/50 mt-0.5">
                Las imágenes se escalan a máx. 2560px y se comprimen a WebP.
              </p>
            </div>

            <div className="p-4 bg-surface-secondary border border-border-light space-y-3 rounded-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileChange(e.target.files[0])
                    }
                    className="font-mono text-maya-small text-black-neutral/70 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-maya-label file:font-mono file:uppercase file:bg-black-neutral file:text-gray-warm file:rounded-3xs cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Aplicación (ej. Barra Principal)"
                    value={applicationName}
                    onChange={(e) => setApplicationName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-light text-maya-small font-sans focus:outline-none bg-surface rounded-3xs placeholder:text-black-neutral/35"
                  />
                </div>
              </div>

              {filePreview && (
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border-light">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-surface border border-border-light overflow-hidden shrink-0 rounded-3xs shadow-2xs">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-mono text-maya-label">
                      <span className="text-black-neutral font-medium block">
                        Archivo seleccionado
                      </span>
                      <span className="text-black-neutral/50">
                        Peso original: {originalSizeText} ➔ WebP
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={uploadingRender}
                    onClick={handleUploadRender}
                    className="px-5 py-2 bg-emerald-800 text-white font-mono text-maya-label uppercase tracking-data hover:bg-emerald-900 transition-colors disabled:opacity-50 cursor-pointer font-bold rounded-3xs shadow-xs"
                  >
                    {uploadingRender
                      ? "Procesando..."
                      : "✦ Optimizar y Subir Render"}
                  </button>
                </div>
              )}
            </div>

            {/* Muestrario de Renders */}
            <div>
              <span className="block font-mono text-maya-label uppercase tracking-data text-black-neutral/60 mb-2 font-semibold">
                Renders Asignados a este SKU ({renders.length})
              </span>

              {renders.length === 0 ? (
                <p className="font-mono text-maya-label text-black-neutral/40 italic">
                  No se han subido renders para este material.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {renders.map((rnd) => (
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
                        <span className="font-sans text-maya-label font-medium text-black-neutral truncate">
                          {rnd.application}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteRender(rnd.id, rnd.render_url)
                          }
                          className="text-red-600 hover:text-red-800 font-mono text-maya-label cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border-light pt-4 font-mono text-maya-label uppercase tracking-data">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-light text-black-neutral/70 hover:bg-surface-secondary cursor-pointer rounded-3xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isTranslating}
              className="px-6 py-2 bg-black-neutral text-gray-warm hover:bg-black-pure transition-colors disabled:opacity-50 cursor-pointer rounded-3xs shadow-xs font-bold"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
