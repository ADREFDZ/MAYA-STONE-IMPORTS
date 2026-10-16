"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import GalleryUploader from "./GalleryUploader";
import { deleteGalleryPhoto, updateGalleryPhoto } from "./actions";

interface Photo {
  id: string;
  title: string;
  description: string | null;
  project_type: string | null;
  image_url: string;
  storage_path: string;
  created_at: string;
}

interface GalleryManagerClientProps {
  initialPhotos: Photo[];
  lang: string;
}

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "proyectos", label: "Proyectos" },
  { id: "sucursales", label: "Sucursales" },
  { id: "inspiracion", label: "Inspiración" },
  { id: "test", label: "Pruebas" },
];

export default function GalleryManagerClient({
  initialPhotos,
  lang,
}: GalleryManagerClientProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch =
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.storage_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.description &&
        photo.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeFolder === "all") return matchesSearch;

    if (!photo.storage_path) return false;

    const photoFolder = photo.storage_path.includes("/")
      ? photo.storage_path.split("/")[0]
      : "sin-carpeta";

    return (
      matchesSearch && photoFolder.toLowerCase() === activeFolder.toLowerCase()
    );
  });

  const getFolderCount = (folderId: string) => {
    if (folderId === "all") return photos.length;
    return photos.filter((p) =>
      p.storage_path?.toLowerCase().startsWith(`${folderId}/`),
    ).length;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPhoto) return;
    setLoading(true);

    const res = await deleteGalleryPhoto(
      deletingPhoto.id,
      deletingPhoto.storage_path,
      lang,
    );

    if (res.success) {
      setPhotos((prev) => prev.filter((p) => p.id !== deletingPhoto.id));
      setDeletingPhoto(null);
    } else {
      alert(res.message || "No se pudo eliminar la imagen.");
    }
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPhoto) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      title: formData.get("title") as string,
      project_type: formData.get("project_type") as string,
      description: formData.get("description") as string,
    };

    const res = await updateGalleryPhoto(editingPhoto.id, updatedData, lang);

    if (res.success) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === editingPhoto.id ? { ...p, ...updatedData } : p,
        ),
      );
      setEditingPhoto(null);
    } else {
      alert(res.message || "Error al actualizar la foto.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface p-4 border border-border-light rounded-2xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count = getFolderCount(cat.id);
            const isActive = activeFolder === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveFolder(cat.id)}
                className={`px-3.5 py-1.5 font-mono text-maya-label uppercase tracking-data transition-colors cursor-pointer border rounded-3xs ${
                  isActive
                    ? "bg-black-neutral text-gray-warm border-black-neutral font-bold shadow-xs"
                    : "bg-surface text-black-neutral/70 border-border-light hover:border-black-neutral"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por título o reseña..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 border border-accent/25 text-maya-small font-sans focus:outline-none focus:border-accent bg-accent-soft text-black-neutral w-full md:w-56 rounded-3xs placeholder:text-black-neutral/40"
          />

          <button
            type="button"
            onClick={() => setIsUploaderOpen(true)}
            className="bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data px-4 py-2 hover:bg-black-pure transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer font-bold rounded-3xs shadow-xs"
          >
            <span className="text-accent-ink font-bold">+</span> Nueva Foto
          </button>
        </div>
      </div>

      {/* REJILLA EDITORIAL */}
      {filteredPhotos.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border-strong bg-surface rounded-2xs">
          <p className="font-mono text-maya-small uppercase tracking-data text-black-neutral/40">
            [ No se encontraron fotografías en esta selección ]
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredPhotos.map((photo) => {
            const folderName = photo.storage_path.split("/")[0];

            return (
              <div
                key={photo.id}
                className="group border border-border-light bg-surface p-3.5 flex flex-col justify-between relative hover:border-border-strong transition-all shadow-2xs rounded-2xs"
              >
                <div className="space-y-3">
                  {/* Vista Previa */}
                  <div className="relative aspect-4/3 w-full bg-surface border border-border-light overflow-hidden group rounded-3xs">
                    <Image
                      src={photo.image_url}
                      alt={photo.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(photo)}
                      className="absolute inset-0 bg-black-pure/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-maya-label uppercase tracking-widest cursor-pointer"
                    >
                      Ampliar Inspección ↗
                    </button>

                    <span className="absolute top-2 left-2 bg-black-neutral/85 text-white font-mono text-[8px] px-2 py-0.5 uppercase tracking-wider rounded-3xs">
                      {folderName}
                    </span>
                  </div>

                  {/* Metadatos */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-maya-small font-medium text-black-neutral uppercase tracking-editorial leading-tight">
                        {photo.title}
                      </h4>
                      {photo.project_type && (
                        <span className="shrink-0 font-mono text-[8px] text-accent-ink border border-accent/30 bg-accent/5 px-1.5 py-0.5 uppercase rounded-3xs font-semibold">
                          {photo.project_type}
                        </span>
                      )}
                    </div>

                    {photo.description ? (
                      <p className="text-maya-small text-black-neutral/75 font-sans line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    ) : (
                      <p className="font-mono text-maya-label text-black-neutral/30 italic">
                        Sin descripción editorial
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-3 mt-3 border-t border-border-light flex items-center justify-between font-mono text-maya-label uppercase tracking-data">
                  <button
                    type="button"
                    onClick={() => setEditingPhoto(photo)}
                    className="text-black-neutral/70 hover:text-black-neutral underline cursor-pointer"
                  >
                    Editar Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingPhoto(photo)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SUBIR FOTO */}
      {isUploaderOpen && (
        <div className="fixed inset-0 bg-black-pure/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface border border-border-light w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto font-sans shadow-2xl rounded-2xs">
            <div className="flex justify-between items-center border-b border-border-light pb-3">
              <div>
                <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink block font-semibold">
                  SUBIDA DE ARCHIVO
                </span>
                <h3 className="font-sans font-light text-maya-h4 uppercase tracking-editorial text-black-neutral">
                  NUEVA FOTOGRAFÍA EDITORIAL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploaderOpen(false)}
                className="text-black-neutral/40 hover:text-black-neutral font-mono text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <GalleryUploader onUploadSuccess={() => setIsUploaderOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR INFO FOTO */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black-pure/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface border border-border-light w-full max-w-md p-6 space-y-4 font-sans shadow-2xl rounded-2xs">
            <div className="flex justify-between items-center border-b border-border-light pb-3">
              <h3 className="font-sans font-light text-maya-h4 uppercase tracking-editorial text-black-neutral">
                Editar Información
              </h3>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="text-black-neutral/40 hover:text-black-neutral font-mono text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="space-y-4 text-maya-small"
            >
              <div className="space-y-1">
                <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
                  Título del Proyecto *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingPhoto.title}
                  required
                  className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-body text-black-neutral focus:outline-none focus:border-accent rounded-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
                  Categoría
                </label>
                <select
                  name="project_type"
                  defaultValue={editingPhoto.project_type || "Residencial"}
                  className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-small text-black-neutral focus:outline-none focus:border-accent cursor-pointer font-sans rounded-3xs"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Fachadas">Fachadas</option>
                  <option value="Inspiración">Inspiración / Texturas</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-maya-label text-black-neutral/60 uppercase tracking-data font-semibold">
                  Descripción / Reseña
                </label>
                <textarea
                  name="description"
                  defaultValue={editingPhoto.description || ""}
                  rows={3}
                  className="w-full bg-accent-soft border border-accent/25 p-2.5 text-maya-small text-black-neutral focus:outline-none focus:border-accent resize-none rounded-3xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-light font-mono text-maya-label uppercase tracking-data">
                <button
                  type="button"
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 border border-border-light text-black-neutral/70 hover:bg-surface-secondary cursor-pointer rounded-3xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-black-neutral text-gray-warm hover:bg-black-pure cursor-pointer disabled:opacity-50 rounded-3xs font-bold shadow-xs"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LIGHTBOX */}
      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black-pure/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewPhoto.image_url}
              alt={previewPhoto.title}
              className="max-h-[70vh] w-auto object-contain border border-white/10 rounded-2xs"
            />
            <div className="text-center pt-4 space-y-1 max-w-xl">
              <h3 className="text-white font-sans text-maya-h4 uppercase tracking-editorial">
                {previewPhoto.title}
              </h3>
              {previewPhoto.description && (
                <p className="text-white/70 font-sans text-maya-small font-light leading-relaxed">
                  {previewPhoto.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white font-mono text-maya-label cursor-pointer uppercase tracking-widest"
            >
              ✕ Cerrar [ESC]
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRMAR ELIMINACIÓN */}
      {deletingPhoto && (
        <div className="fixed inset-0 bg-black-pure/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-surface border border-border-light max-w-sm w-full p-6 space-y-4 shadow-2xl rounded-2xs">
            <h3 className="text-maya-small uppercase tracking-editorial text-black-neutral font-medium border-b border-border-light pb-2">
              Confirmar Eliminación
            </h3>
            <p className="text-maya-small text-black-neutral/70 leading-relaxed font-sans font-light">
              ¿Deseas eliminar permanentemente{" "}
              <strong className="text-black-neutral font-bold">
                &ldquo;{deletingPhoto.title}&rdquo;
              </strong>{" "}
              de la galería?
            </p>
            <div className="flex gap-3 pt-2 font-mono text-maya-label uppercase tracking-data">
              <button
                type="button"
                onClick={() => setDeletingPhoto(null)}
                className="w-1/2 py-2.5 border border-border-light text-black-neutral/70 hover:bg-surface-secondary cursor-pointer rounded-3xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="w-1/2 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 rounded-3xs font-bold shadow-xs"
              >
                {loading ? "Borrando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
