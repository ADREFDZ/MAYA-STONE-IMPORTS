"use client";

import { useEffect } from "react";
import { recordCatalogDownloadAction } from "@/lib/analytics/catalogDownloadAction";

/**
 * Cuenta las descargas de catálogos para el dashboard del admin.
 * Cualquier enlace con data-catalog="<slug>" (y data-catalog-source) se
 * registra al hacer clic. Es anónimo, por eso no depende de las cookies.
 */
export default function CatalogDownloadCounter({ lang }: { lang: string }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-catalog]",
      ) as HTMLElement | null;
      if (!el) return;
      const catalog = el.dataset.catalog || "";
      const source = el.dataset.catalogSource || "otro";
      recordCatalogDownloadAction(catalog, source, lang).catch(() => {});
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [lang]);

  return null;
}
