"use client";

import { useMemo, useState } from "react";
import { slugify } from "@/lib/utils/strings";
import CollectionHero from "./CollectionHero";
import CollectionTabsNav from "./CollectionTabsNav";
import CollectionSection from "./CollectionSection";
import CollectionCTA from "./CollectionCTA";
import { CollectionItem } from "@/app/[lang]/coleccion/actions";

interface CollectionCatalogProps {
  collections: CollectionItem[];
  lang: string;
  dict?: any;
}

// Orden curatorial estricto
const TARGET_ORDER = ["reserve", "essentials", "travertino", "dune"];

function getCollectionOrderIndex(slug: string): number {
  const clean = slug.toLowerCase();
  const index = TARGET_ORDER.findIndex((key) => clean.includes(key));
  return index !== -1 ? index : 999;
}

export default function CollectionCatalog({
  collections = [],
  lang,
  dict,
}: CollectionCatalogProps) {
  // Ordena las colecciones: Reserve, Essentials, Travertino y Dune
  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      const slugA = slugify(a.slug || a.title || a.id);
      const slugB = slugify(b.slug || b.title || b.id);
      return getCollectionOrderIndex(slugA) - getCollectionOrderIndex(slugB);
    });
  }, [collections]);

  const [activeTab, setActiveTab] = useState<string>(
    sortedCollections[0]?.slug || sortedCollections[0]?.id || "",
  );

  return (
    <main className="min-h-screen bg-background text-black-neutral selection:bg-accent selection:text-white overflow-x-clip">
      {/* 1. HERO KINÉTICO EDITORIAL */}
      <CollectionHero dict={dict} lang={lang as "es" | "en"} />

      {/* 2. DOCK DE NAVEGACIÓN EN EL ORDEN ESPECIFICADO */}
      {sortedCollections.length > 0 && (
        <CollectionTabsNav
          collections={sortedCollections}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lang={lang}
          dict={dict}
        />
      )}

      {/* 3. SECCIONES TEMÁTICAS POR COLECCIÓN */}
      <div className="w-full space-y-0">
        {sortedCollections.map((collection, index) => {
          const rawSlug = collection.slug || collection.title || collection.id;
          const sectionId = slugify(rawSlug);
          const themeClass = `theme-collection-${sectionId}`;

          return (
            <section
              key={collection.id}
              id={sectionId}
              className={`collection-surface w-full maya-section scroll-mt-20 transition-colors duration-700 ${themeClass}`}
            >
              {/* CollectionSection maneja sus propios anchos */}
              <CollectionSection
                collection={collection}
                index={index}
                lang={lang}
                dict={dict}
              />
            </section>
          );
        })}
      </div>

      <CollectionCTA dict={dict} lang={lang} />
    </main>
  );
}
