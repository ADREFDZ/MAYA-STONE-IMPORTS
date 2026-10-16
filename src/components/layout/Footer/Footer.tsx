"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface FooterProps {
  lang?: "es" | "en" | Locale | string;
  dict: {
    brand_desc: string;
    contact_title: string;
    contact_address: string;
    contact_phone: string;
    contact_email: string;
    legal_terms?: string;
    legal_privacy?: string;
    legal_cookies?: string;
    legal_cookie_preferences?: string;
    legal_rights?: string;
    social_instagram?: string;
    social_facebook?: string;
  };
}

export default function Footer({ dict, lang = "es" }: FooterProps) {
  const pathname = usePathname();

  const isAuthOrAdmin =
    pathname?.includes("/login") || pathname?.includes("/admin");

  if (isAuthOrAdmin) {
    return null;
  }

  const currentLocale: Locale = lang === "en" ? "en" : "es";

  const handleOpenCookies = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("maya_open_cookie_banner"));
    }
  };

  return (
    <footer className="w-full bg-black-neutral text-gray-warm border-t border-gray-warm/15 font-sans selection:bg-accent selection:text-white py-12 sm:py-16 md:py-20">
      <div className="editorial-container">
        {/* BLOQUE PRINCIPAL DE INFORMACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-gray-warm/15 items-start">
          {/* Columna 1: Identidad y Manifiesto */}
          <div className="md:col-span-5 lg:col-span-4 space-y-3.5 sm:space-y-4">
            <div className="font-sans text-maya-small tracking-[0.25em] font-medium uppercase text-gray-warm select-none">
              M A Y A
            </div>
            <p className="font-sans text-maya-label font-light tracking-data text-gray-warm/70 max-w-sm leading-relaxed uppercase">
              {dict.brand_desc}
            </p>
          </div>

          <div className="hidden lg:block lg:col-span-1" />

          {/* Columna 2: Sub-marca y Redes Sociales con Iconos */}
          <div className="md:col-span-3 space-y-3.5 sm:space-y-4">
            <div className="font-mono text-maya-label tracking-data font-semibold uppercase text-accent-ink select-none">
              STONE IMPORTS
            </div>

            <div className="flex flex-col space-y-2.5 font-mono text-maya-label uppercase tracking-data text-gray-warm/75">
              <a
                href="https://www.instagram.com/gpomaya"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-gray-warm/25 w-fit"
                aria-label="Instagram @GPOMAYA"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current shrink-0 transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>{dict.social_instagram || "@GPOMAYA"}</span>
              </a>

              <a
                href="https://www.facebook.com/profile.php?id=61591719244133"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-gray-warm/25 w-fit"
                aria-label="Facebook MAYA Stone Imports"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current shrink-0 transition-transform duration-200 group-hover:scale-110"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>{dict.social_facebook || "@MAYA Stone Imports"}</span>
              </a>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1" />

          {/* Columna 3: Datos de Contacto Directo */}
          <div className="md:col-span-4 lg:col-span-3 space-y-3.5 sm:space-y-4">
            <span className="block font-mono text-maya-label font-semibold tracking-data text-accent-ink uppercase select-none">
              {dict.contact_title}
            </span>

            <div className="space-y-3 font-sans text-maya-small text-gray-warm/75 leading-relaxed font-light">
              <p className="whitespace-pre-line text-gray-warm/60 select-none uppercase tracking-data text-maya-label font-mono">
                {dict.contact_address}
              </p>

              <div className="pt-1 space-y-1.5 font-mono text-maya-label uppercase tracking-data">
                <p className="block text-gray-warm/80">{dict.contact_phone}</p>
                <a
                  href={`mailto:${dict.contact_email}`}
                  className="block text-gray-warm hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-gray-warm/25 w-fit"
                >
                  {dict.contact_email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE INFERIOR: DERECHOS Y DOCUMENTOS LEGALES */}
        <div className="pt-6 sm:pt-8 flex flex-col lg:flex-row justify-between items-center gap-4 font-mono text-maya-label tracking-data text-gray-warm/40 uppercase">
          <div className="text-center lg:text-left select-none">
            {dict.legal_rights ||
              `© ${new Date().getFullYear()} MAYA. Todos los derechos reservados.`}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-6 gap-y-2 text-center">
            <Link
              href={`/${ROUTES.privacidad[currentLocale]}`}
              className="text-gray-warm/60 hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-gray-warm/25"
            >
              {dict.legal_privacy ||
                (currentLocale === "es"
                  ? "Aviso de Privacidad"
                  : "Privacy Policy")}
            </Link>

            <Link
              href={`/${ROUTES.terminos[currentLocale]}`}
              className="text-gray-warm/60 hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-gray-warm/25"
            >
              {dict.legal_terms ||
                (currentLocale === "es"
                  ? "Términos y Condiciones"
                  : "Terms & Conditions")}
            </Link>

            <Link
              href={`/${ROUTES.cookies[currentLocale]}`}
              className="text-gray-warm/60 hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-gray-warm/25"
            >
              {dict.legal_cookies ||
                (currentLocale === "es"
                  ? "Política de Cookies"
                  : "Cookie Policy")}
            </Link>

            {/* BOTÓN DISPARADOR DE CONFIGURACIÓN DE COOKIES */}
            <button
              type="button"
              onClick={handleOpenCookies}
              className="text-accent-ink/90 hover:text-accent-ink transition-colors duration-200 underline underline-offset-4 decoration-accent/40 cursor-pointer"
            >
              {dict.legal_cookie_preferences ||
                (currentLocale === "es"
                  ? "Preferencias de Cookies"
                  : "Cookie Preferences")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
