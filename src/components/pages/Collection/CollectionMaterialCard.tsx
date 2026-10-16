"use client";

import Image from "next/image";
import { MaterialItem } from "@/app/[lang]/coleccion/actions";

interface CollectionMaterialCardProps {
  material: MaterialItem;
  collectionCover?: string | null;
  isSelected?: boolean;
  onSelect: () => void;
  dict?: any;
}

export default function CollectionMaterialCard({
  material,
  collectionCover,
  isSelected = false,
  onSelect,
  dict,
}: CollectionMaterialCardProps) {
  const displayImage = material.image || collectionCover || null;
  const translatedCategory =
    dict?.collection?.terms?.[material.category] ||
    dict?.terms?.[material.category] ||
    material.category;

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        backgroundColor: isSelected
          ? "var(--col-card-bg, #FFFFFF)"
          : "rgba(0,0,0,0.12)",
        borderColor: isSelected
          ? "var(--col-accent, #FFFFFF)"
          : "var(--col-card-border, rgba(255,255,255,0.15))",
        color: "var(--col-text, #FFFFFF)",
      }}
      className={`group text-left p-2.5 sm:p-3 border transition-all duration-300 rounded-2xs cursor-pointer flex flex-col justify-between focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        isSelected
          ? "shadow-xl ring-1 ring-white/30 opacity-100 scale-[1.02]"
          : "opacity-80 hover:opacity-100 hover:shadow-md"
      }`}
    >
      <div
        className="relative aspect-square w-full overflow-hidden mb-2 sm:mb-2.5 rounded-2xs border"
        style={{
          borderColor: "rgba(255,255,255,0.12)",
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={material.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-maya-label opacity-40 uppercase">
            {dict?.collection_page?.no_photo || "Sin registro"}
          </div>
        )}

        {isSelected && (
          <div
            style={{
              backgroundColor: "var(--col-accent, #FFFFFF)",
              color: "var(--col-bg, #101820)",
            }}
            className="absolute top-1.5 right-1.5 rounded-full w-4 h-4 flex items-center justify-center font-mono text-maya-label font-bold shadow-xs"
          >
            ✓
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <h4 className="font-sans text-maya-small font-medium uppercase tracking-wide truncate">
          {material.name}
        </h4>
        <p
          style={{ color: "var(--col-text-muted, rgba(255,255,255,0.65))" }}
          className="font-mono text-maya-label uppercase tracking-data truncate opacity-80"
        >
          {translatedCategory}
        </p>
      </div>
    </button>
  );
}
