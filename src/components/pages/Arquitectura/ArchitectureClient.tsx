"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ArchitectureHero from "@/components/pages/Arquitectura/ArchitectureHero";
import ArchitectureFilter from "@/components/pages/Arquitectura/ArchitectureFilter";
import ProjectEditorialSpread, {
  ProjectItem,
} from "@/components/pages/Arquitectura/ProjectEditorialSpread";
import ProjectGalleryModal from "@/components/pages/Arquitectura/ProjectGalleryModal";
import { ROUTES } from "@/lib/i18n/routes";

interface ArchitectureClientProps {
  projects: ProjectItem[];
  lang: "es" | "en";
  dict: {
    hero: {
      badge: string;
      title: string;
      subtitle: string;
    };
    filter_dock_label: string;
    categories: Record<string, string>;
    card_action: string;
    material_label: string;
    empty_state: string;
    modal: {
      close: string;
      statement_title: string;
      materials_title: string;
      gallery_title: string;
      no_photo: string;
      default_location: string;
    };
  };
}

function ArchitectureContent({
  projects,
  lang,
  dict,
}: ArchitectureClientProps) {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(
    null,
  );
  const scrollPositionRef = useRef<number>(0);

  const categoryKeys = [
    "all",
    "Hospitality",
    "Residencial",
    "Comercial",
    "Usos Mixtos",
  ];

  // 1. Apertura manual del modal guardando el scroll actual[cite: 50]
  const handleOpenDossier = (project: ProjectItem) => {
    scrollPositionRef.current = window.scrollY;
    setSelectedProject(project);

    if (project.slug) {
      const parentSlug = ROUTES.arquitectura[lang];
      window.history.pushState(
        { modalOpen: true, projectSlug: project.slug },
        "",
        `/${parentSlug}/${project.slug}`,
      );
    }
  };

  // 2. Cierre manual del modal conservando la posición exacta del proyecto[cite: 50]
  const handleCloseModal = () => {
    const targetSlug = selectedProject?.slug || selectedProject?.id;
    const savedY = scrollPositionRef.current;

    setSelectedProject(null);
    const parentSlug = ROUTES.arquitectura[lang];
    window.history.replaceState({}, "", `/${parentSlug}`);

    // Restaurar posición y enfocar la tarjeta correspondiente
    requestAnimationFrame(() => {
      if (targetSlug) {
        const el = document.getElementById(targetSlug);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "center" });
          return;
        }
      }
      window.scrollTo({ top: savedY, behavior: "instant" });
    });
  };

  // 3. Sincronización con el botón Atrás / Adelante del navegador (popstate)[cite: 50]
  useEffect(() => {
    const handlePopState = () => {
      const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, "");
      const segments = cleanPath.split("/").filter(Boolean);
      const parentSlug = ROUTES.arquitectura[lang];

      if (segments.length <= 1 || segments[0] !== parentSlug) {
        setSelectedProject((prev) => {
          if (prev) {
            const targetSlug = prev.slug || prev.id;
            requestAnimationFrame(() => {
              if (targetSlug) {
                const el = document.getElementById(targetSlug);
                if (el) {
                  el.scrollIntoView({ behavior: "instant", block: "center" });
                  return;
                }
              }
              window.scrollTo({
                top: scrollPositionRef.current,
                behavior: "instant",
              });
            });
          }
          return null;
        });
      } else {
        const projectSlug = segments[1];
        const matched = projects.find(
          (p) => p.slug === projectSlug || p.id === projectSlug,
        );
        if (matched) {
          scrollPositionRef.current = window.scrollY;
          setSelectedProject(matched);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [projects, lang]);

  // 4. Soporte para parámetro URL legacy (?project=...)[cite: 50]
  useEffect(() => {
    const projectQuery = searchParams.get("project");
    if (!projectQuery || projects.length === 0) return;

    const matchedProject = projects.find(
      (p) => p.slug === projectQuery || p.id === projectQuery,
    );

    if (matchedProject) {
      handleOpenDossier(matchedProject);

      setTimeout(() => {
        const targetId = matchedProject.slug || matchedProject.id;
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [searchParams, projects]);

  const filteredProjects = projects.filter(
    (p) => activeCategory === "all" || p.category === activeCategory,
  );

  return (
    <div className="min-h-screen bg-background text-black-neutral font-sans selection:bg-accent selection:text-white">
      <ArchitectureHero dict={dict.hero} />

      <ArchitectureFilter
        categories={dict.categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categoryKeys={categoryKeys}
        dockLabel={dict.filter_dock_label}
      />

      <main id="archive-grid" className="py-12 md:py-16">
        {filteredProjects.length === 0 ? (
          <div className="py-32 text-center font-mono text-xs text-black-neutral/40 uppercase tracking-widest">
            {dict.empty_state}
          </div>
        ) : (
          filteredProjects.map((project, index) => (
            <ProjectEditorialSpread
              key={project.id}
              project={project}
              index={index}
              lang={lang}
              cardActionText={dict.card_action}
              materialLabel={dict.material_label}
              categoriesDict={dict.categories}
              onOpenDossier={handleOpenDossier}
            />
          ))
        )}
      </main>

      <ProjectGalleryModal
        project={selectedProject}
        lang={lang}
        onClose={handleCloseModal}
        dict={dict.modal}
        categoriesDict={dict.categories}
      />
    </div>
  );
}

export default function ArchitectureClient(props: ArchitectureClientProps) {
  return (
    <Suspense fallback={null}>
      <ArchitectureContent {...props} />
    </Suspense>
  );
}
