"use client";

import { slugify } from "@/lib/utils/strings";
import { useState } from "react";
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

export default function CollectionCatalog({
  collections = [],
  lang,
  dict,
}: CollectionCatalogProps) {
  const [activeTab, setActiveTab] = useState<string>(
    collections[0]?.slug || collections[0]?.id || "",
  );

  return (
    <main className="min-h-screen bg-background text-black-neutral selection:bg-accent selection:text-white overflow-x-clip">
      <CollectionHero dict={dict} />

      {collections.length > 0 && (
        <CollectionTabsNav
          collections={collections}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lang={lang}
          dict={dict}
        />
      )}

      {/* RENDERIZADO POR SECCIONES TEMÁTICAS */}
      <div className="w-full space-y-0">
        {collections.map((collection, index) => {
          const rawSlug = collection.slug || collection.title || collection.id;
          const sectionId = slugify(rawSlug);
          const themeClass = `theme-collection-${sectionId}`;

          return (
            <section
              key={collection.id}
              id={sectionId}
              className={`w-full maya-section scroll-mt-20 transition-colors duration-700 ${themeClass}`}
              style={{
                backgroundColor: "var(--col-bg, var(--color-surface))",
                color: "var(--col-text, #252525)",
              }}
            >
              <div className="editorial-container">
                <CollectionSection
                  collection={collection}
                  index={index}
                  lang={lang}
                  dict={dict}
                />
              </div>
            </section>
          );
        })}
      </div>

      <CollectionCTA dict={dict} lang={lang} />
    </main>
  );
}
