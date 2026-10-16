"use client";

import AtelierDockNav, { DockNavItem } from "@/components/ui/AtelierDockNav";

interface ArchitectureFilterProps {
  categories: Record<string, string>;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryKeys: string[];
  dockLabel: string;
}

export default function ArchitectureFilter({
  categories,
  activeCategory,
  onSelectCategory,
  categoryKeys = [],
  dockLabel,
}: ArchitectureFilterProps) {
  const dockItems: DockNavItem[] = categoryKeys.map((catKey) => ({
    key: catKey,
    label: categories[catKey] || catKey,
  }));

  return (
    <AtelierDockNav
      items={dockItems}
      activeKey={activeCategory}
      onSelect={onSelectCategory}
      headerLabel={dockLabel}
      scrollTarget="archive-grid"
      scrollOffset={-80}
    />
  );
}
