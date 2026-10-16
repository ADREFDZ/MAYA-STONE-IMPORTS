import React from "react";

export type SectionLabelTheme = "light" | "dark" | "accent";
export type SectionLabelAlign = "left" | "center" | "right";

// ✦ Nueva propiedad para seleccionar el estilo visual de la etiqueta
export type SectionLabelVariant = "minimal" | "lined" | "bullet";

interface SectionLabelProps {
  /** Texto principal de la etiqueta */
  children: React.ReactNode;
  /** Estilo visual: 'minimal' (Capítulo X), 'lined' (Líneas) o 'bullet' (Punto) */
  variant?: SectionLabelVariant;
  /** Tema de color: 'light' (Gris oscuro), 'dark' (Gris claro) o 'accent' (Bronce) */
  theme?: SectionLabelTheme;
  /** Alineación del bloque */
  align?: SectionLabelAlign;
  /** Clases adicionales de Tailwind */
  className?: string;
}

export default function SectionLabel({
  children,
  variant = "minimal", // ✦ Favorito por defecto: El estilo limpio de Capítulo X
  theme = "accent",
  align = "left",
  className = "",
}: SectionLabelProps) {
  // Configuración estricta de colores según la paleta de MAYA
  const themeStyles = {
    light: { text: "text-black-neutral/60", decoration: "bg-black-neutral/40" },
    dark: { text: "text-gray-warm/60", decoration: "bg-gray-warm/40" },
    accent: { text: "text-accent-ink", decoration: "bg-accent/60" },
  };

  const currentTheme = themeStyles[theme];

  // Alineaciones para contenedores Flex
  const alignClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  // Alineaciones para textos en bloque (solo texto)
  const textAlignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  /* =========================================================
     VARIANTE 1: MINIMAL (El estilo exacto de CAPÍTULO X)
     ========================================================= */
  if (variant === "minimal") {
    return (
      <span
        className={`block font-mono text-maya-label uppercase tracking-label font-medium transition-colors duration-500 ${currentTheme.text} ${textAlignClasses[align]} ${className}`}
      >
        {children}
      </span>
    );
  }

  /* =========================================================
     VARIANTE 2: BULLET (Punto editorial diminuto)
     ========================================================= */
  if (variant === "bullet") {
    return (
      <div
        className={`flex items-center gap-2.5 font-mono text-maya-label uppercase tracking-label font-medium transition-colors duration-500 ${currentTheme.text} ${alignClasses[align]} ${className}`}
      >
        <span
          className={`h-[3px] w-[3px] rounded-full shrink-0 ${currentTheme.decoration}`}
          aria-hidden="true"
        />
        <span className="translate-y-[1px]">{children}</span>
      </div>
    );
  }

  /* =========================================================
     VARIANTE 3: LINED (Línea arquitectónica lateral)
     ========================================================= */
  const lineElement = (
    <span
      className={`block h-[1px] w-8 sm:w-12 shrink-0 transition-colors duration-500 ${currentTheme.decoration}`}
      aria-hidden="true"
    />
  );

  return (
    <div
      className={`flex items-center gap-3 font-mono text-maya-label tracking-label font-medium uppercase select-none w-full transition-colors duration-500 ${currentTheme.text} ${alignClasses[align]} ${className}`}
    >
      {(align === "right" || align === "center") && lineElement}
      <span className="translate-y-[1px]">{children}</span>
      {(align === "left" || align === "center") && lineElement}
    </div>
  );
}
