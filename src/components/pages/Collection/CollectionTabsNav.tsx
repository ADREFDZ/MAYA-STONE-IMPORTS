"use client";

import { slugify } from "@/lib/utils/strings";
import AtelierDockNav, { DockNavItem } from "@/components/ui/AtelierDockNav";
import { CollectionItem } from "@/app/[lang]/coleccion/actions";

interface CollectionWithLogo extends CollectionItem {
  logo_url?: string | null;
}

interface CollectionTabsNavProps {
  collections?: CollectionWithLogo[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  lang?: string;
  dict?: any;
}


export default function CollectionTabsNav({
  collections = [],
  activeTab = "",
  onTabChange,
  dict,
}: CollectionTabsNavProps) {
  if (!collections || collections.length === 0) return null;

  const dockLabel = dict?.collection_page?.dock_label || "Colecciones";

  const dockItems: DockNavItem[] = collections.map((col) => {
    const key = slugify(col.slug || col.title || col.id);
    const hasLogo = Boolean(col.logo_url);

    return {
      key,
      // Si tiene logo, inyecta la miniatura vectorizada; de lo contrario, el texto editorial
      label: hasLogo ? (
        <span className="inline-flex items-center justify-center h-4 max-w-[90px] sm:max-w-[120px] overflow-hidden">
          <img
            src={col.logo_url!}
            alt={col.title || dockLabel}
            className="h-full w-auto max-w-full object-contain brightness-0 invert opacity-90 transition-opacity hover:opacity-100"
          />
        </span>
      ) : (
        col.title || dockLabel
      ),
    };
  });

  return (
    <AtelierDockNav
      items={dockItems}
      activeKey={activeTab}
      onSelect={onTabChange || (() => {})}
      headerLabel={dockLabel}
      scrollOffset={-80}
    />
  );
}
