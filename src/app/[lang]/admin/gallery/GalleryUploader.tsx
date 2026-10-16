"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { convertToWebP } from "@/lib/utils/media";

interface GalleryUploaderProps {
  onUploadSuccess?: () => void;
  lang?: string;
}

export default function GalleryUploader({
  onUploadSuccess,
}: GalleryUploaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("proyectos");
  const [projectType, setProjectType] = useState("Residencial");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected || !selected.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Por favor selecciona un archivo de imagen válido.",
      });
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setMessage(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setMessage({
        type: "error",
        text: "Selecciona una imagen e ingresa un título.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const compressedFile = await convertToWebP(file, 2560, 0.92);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
      const storagePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("editorial_gallery")
        .upload(storagePath, compressedFile, { contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("editorial_gallery")
        .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;

      const { error: dbError } = await supabase.from("gallery_photos").insert([
        {
          title,
          description,
          project_type: projectType,
          image_url: imageUrl,
          storage_path: storagePath,
        },
      ]);

      if (dbError) throw dbError;

      setMessage({
        type: "success",
        text: `Fotografía agregada a "${folder}".`,
      });

      setFile(null);
      setPreviewUrl(null);
      setTitle("");
      setDescription("");

      router.refresh();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error: any) {
      console.error("Error al subir:", error);
      setMessage({
        type: "error",
        text: error.message || "Error al subir la imagen.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-border-light p-6 font-sans space-y-5 rounded-2xs shadow-2xs">
      {message && (
        <div
          className={`p-3.5 text-maya-small font-mono rounded-3xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <ImageUploadField
          label="Fotografía Principal *"
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onRemove={() => {
            setFile(null);
            setPreviewUrl(null);
          }}
          aspect="square"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
              Carpeta Destino (Storage) *
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-small text-black-neutral font-mono focus:outline-none focus:border-accent cursor-pointer rounded-3xs"
            >
              <option value="proyectos">
                Proyectos (Residencial / Comercial)
              </option>
              <option value="sucursales">Sucursales / Ateliers</option>
              <option value="inspiracion">Inspiración / Texturas</option>
              <option value="test">Test / Pruebas Temporales</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
              Categoría del Proyecto
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-small text-black-neutral font-sans focus:outline-none focus:border-accent cursor-pointer rounded-3xs"
            >
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Fachadas">Fachadas</option>
              <option value="Inspiración">Inspiración / Canteras</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
            Título del Proyecto / Obra *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ej. Residencia Bosques de las Lomas"
            className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-body text-black-neutral focus:outline-none focus:border-accent rounded-3xs"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
            Descripción Editorial (Opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles sobre las piezas o aplicaciones..."
            rows={3}
            className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-small text-black-neutral focus:outline-none focus:border-accent resize-none rounded-3xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full mt-2 bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data py-3 font-bold hover:bg-black-pure transition-colors disabled:opacity-50 cursor-pointer rounded-3xs shadow-xs"
        >
          {loading ? "Optimizando y Guardando..." : "Subir a Galería Editorial"}
        </button>
      </form>
    </div>
  );
}
