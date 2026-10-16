import type React from "react";

interface CollectionLogoTitleProps {
  title: string;
  /** Isotipo/logotipo de la colección (admin → Colecciones → Logotipo/Isotipo) */
  logoUrl?: string | null;
  as?: "h1" | "h2" | "h3";
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}

/**
 * Título de colección: si hay isotipo se muestra la imagen; si no, el texto.
 * El texto siempre queda en el HTML (oculto visualmente) para SEO y lectores
 * de pantalla.
 */
export default function CollectionLogoTitle({
  title,
  logoUrl,
  as: Tag = "h2",
  className = "",
  imgClassName = "",
  style,
}: CollectionLogoTitleProps) {
  if (!logoUrl) {
    return (
      <Tag className={className} style={style}>
        {title}
      </Tag>
    );
  }

  return (
    <Tag className={className} style={style}>
      <span className="sr-only">{title}</span>
      {/* <img> nativo: los isotipos pueden ser SVG y no requieren optimización */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className={`block w-auto max-w-full object-contain object-left ${imgClassName}`}
      />
    </Tag>
  );
}
