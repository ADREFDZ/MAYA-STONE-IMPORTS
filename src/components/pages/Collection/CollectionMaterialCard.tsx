"use client";

import Image from "next/image";
import { MaterialItem } from "@/app/[lang]/coleccion/actions";

interface CollectionMaterialCardProps {
  material: MaterialItem;
  collectionCover?: string | null;
  isSelected?: boolean;
  onSelect: () => void;
  /** Al pasar el cursor o enfocar: precarga la foto de la ficha */
  onPreview?: () => void;
  dict?: any;
}

/**
 * Muestra del muestrario: foto cuadrada + nombre. El material elegido se marca
 * con el acento de la colección (marco y punto), sin cambiar de tamaño para que
 * la rejilla no "salte".
 */
export default function CollectionMaterialCard({
  material,
  collectionCover,
  isSelected = false,
  onSelect,
  onPreview,
  dict,
}: CollectionMaterialCardProps) {
  const displayImage = material.image || collectionCover || null;
  const displayName = material.aka || material.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerEnter={onPreview}
      onFocus={onPreview}
      aria-pressed={isSelected}
      className="group flex flex-col gap-2 text-left text-col-text cursor-pointer select-none focus:outline-none"
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-col-card border transition-[border-color,box-shadow] duration-300 ${
          isSelected
            ? "border-col-accent ring-1 ring-col-accent"
            : "border-col-media group-hover:border-col-accent/60"
        }`}
      >
        {displayImage ? (
          <Image
            src={displayImage}
            alt={displayName}
            fill
            sizes="(max-width: 1024px) 160px, 240px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="text-col-muted w-full h-full flex items-center justify-center font-mono text-maya-label uppercase tracking-data">
            {dict?.collection_page?.no_photo}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 px-0.5">
        <span
          className={`font-sans text-maya-small uppercase tracking-wide leading-snug line-clamp-2 transition-colors duration-300 ${
            isSelected ? "text-col-text" : "text-col-muted group-hover:text-col-text"
          }`}
        >
          {displayName}
        </span>
        <span
          aria-hidden="true"
          className={`mt-1.5 h-1.5 w-1.5 rounded-full bg-col-accent shrink-0 transition-opacity duration-300 ${
            isSelected ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </button>
  );
}
