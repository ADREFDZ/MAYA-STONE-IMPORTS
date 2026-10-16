"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectModal from "./ProjectModal";
import {
  deleteProjectAction,
  toggleProjectHomeAction,
  ProjectFormData,
} from "./actions";

export default function ProjectsManagerClient({
  initialProjects = [],
}: {
  initialProjects: ProjectFormData[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectFormData[]>(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectFormData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const filtered = projects.filter(
    (p) => categoryFilter === "all" || p.category === categoryFilter,
  );

  const handleEdit = (proj: ProjectFormData) => {
    setSelectedProject(proj);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`¿Eliminar definitivamente el proyecto "${title}"?`)) {
      const res = await deleteProjectAction(id);
      if (res.success) router.refresh();
      else alert("Error: " + res.error);
    }
  };

  const handleToggleHome = async (id: string, current: boolean) => {
    const res = await toggleProjectHomeAction(id, !current);
    if (res.success) router.refresh();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface p-4 border border-border-light rounded-2xs shadow-2xs">
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 border border-border-light font-mono text-maya-small bg-surface rounded-3xs cursor-pointer uppercase text-black-neutral focus:outline-none"
          >
            <option value="all">
              Todas las tipologías ({projects.length})
            </option>
            <option value="Hospitality">Hospitality</option>
            <option value="Residencial">Residencial</option>
            <option value="Comercial">Comercial</option>
            <option value="Usos Mixtos">Usos Mixtos</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="bg-black-neutral text-gray-warm font-mono text-maya-label uppercase tracking-data px-5 py-2.5 hover:bg-black-pure transition-colors cursor-pointer rounded-3xs font-bold shadow-xs shrink-0"
        >
          + Nuevo Proyecto
        </button>
      </div>

      {/* REJILLA DE TARJETAS BLANCAS (SURFACE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="bg-surface border border-border-light flex flex-col justify-between hover:border-border-strong transition-all shadow-2xs rounded-2xs overflow-hidden"
          >
            <div className="bg-surface">
              <div className="h-48 bg-surface p-2.5 overflow-hidden relative border-b border-border-light">
                <div className="w-full h-full relative overflow-hidden rounded-3xs border border-border-light">
                  {proj.cover_image ? (
                    <img
                      src={proj.cover_image}
                      alt={proj.title_es}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-maya-label text-black-neutral/30">
                      SIN PORTADA
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-black-neutral/85 text-white font-mono text-[8px] uppercase px-2 py-0.5 rounded-3xs">
                    {proj.category}
                  </span>
                  {proj.show_in_home && (
                    <span className="absolute top-2 right-2 bg-accent text-white font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-3xs shadow-xs">
                      ★ EN HOME
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-2 bg-surface">
                <div className="flex justify-between items-start">
                  <h3 className="font-sans font-medium text-maya-h4 tracking-editorial uppercase text-black-neutral">
                    {proj.title_es}
                  </h3>
                  <span className="font-mono text-maya-label text-black-neutral/40">
                    #{proj.sort_order ?? 0}
                  </span>
                </div>
                {proj.location && (
                  <p className="font-mono text-maya-label text-accent-ink tracking-wide">
                    {proj.location}
                  </p>
                )}
                {proj.short_description_es && (
                  <p className="font-sans text-maya-small text-black-neutral/70 line-clamp-2 leading-relaxed">
                    {proj.short_description_es}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border-light bg-surface flex items-center justify-between font-mono text-maya-label uppercase tracking-data">
              <button
                type="button"
                onClick={() => handleToggleHome(proj.id!, proj.show_in_home)}
                className={`px-3 py-1.5 border rounded-3xs cursor-pointer transition-colors ${
                  proj.show_in_home
                    ? "bg-accent-soft text-accent-ink border-accent/40 font-bold"
                    : "bg-surface text-black-neutral/50 border-border-light hover:text-black-neutral"
                }`}
              >
                {proj.show_in_home ? "En Home ✓" : "+ Poner en Home"}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(proj)}
                  className="px-3 py-1.5 text-black-neutral bg-surface border border-border-light hover:border-black-neutral hover:bg-surface-secondary rounded-3xs cursor-pointer"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(proj.id!, proj.title_es)}
                  className="px-2.5 py-1.5 text-red-600 bg-surface border border-red-200 hover:bg-red-50 rounded-3xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedProject}
      />
    </div>
  );
}
