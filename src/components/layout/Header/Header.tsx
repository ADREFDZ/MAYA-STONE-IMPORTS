"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ROUTES, getCleanPath, type Locale } from "@/lib/i18n/routes";

interface HeaderProps {
  dict: {
    coleccion: string;
    arquitectura: string;
    bespoke: string;
    estudio: string;
    about: string;
    contacto: string;
    menu_open?: string;
    menu_close?: string;
    admin_panel?: string;
  };
  lang: Locale;
}

export default function Header({ dict, lang }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const supabase = createClient();

  const currentLocale = lang;
  const isHome = pathname === "/" || pathname === "/es" || pathname === "/en";

  // ==========================================================================
  // SCROLL OBSERVER & SESIÓN ADMIN
  // ==========================================================================
  useEffect(() => {
    const checkScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });

    const checkAdminSession = async () => {
      // getSession() lee la sesión local (sin red). Solo si existe una sesión
      // se valida contra Supabase; así los visitantes anónimos no generan
      // peticiones a Supabase en cada página.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAdmin(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(profile?.role === "admin");
    };

    checkAdminSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdminSession();
    });

    return () => {
      window.removeEventListener("scroll", checkScroll);
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Ocultar Header en Login o Admin
  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  // Activa la cortina y almacena la coordenada de scroll
  const handleLangTransition = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;
    sessionStorage.setItem("maya_saved_scroll", window.scrollY.toString());
    sessionStorage.setItem("maya_lang_transition", "true");
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    if (
      typeof document !== "undefined" &&
      !document.getElementById("maya-fallback-overlay")
    ) {
      const overlay = document.createElement("div");
      overlay.id = "maya-fallback-overlay";
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        background-color: #252525;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.4s ease;
      `;
      overlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 24px;">
          <img src="/images/MAYA_LOGOTIPO_LIGHT.png" alt="MAYA" style="height: 16px; width: auto; opacity: 0.9;" />
          <div style="position: relative; width: 80px; height: 2px; background-color: rgba(255,255,255,0.15); overflow: hidden; border-radius: 9999px;">
            <div style="position: absolute; inset-block: 0; width: 50%; background-color: #8c7355; border-radius: 9999px; animation: maya-slide 1.2s infinite ease-in-out;"></div>
          </div>
        </div>
        <style>
          @keyframes maya-slide {
            0% { left: -50%; }
            100% { left: 100%; }
          }
        </style>
      `;
      document.body.appendChild(overlay);
    }
  };

  const navItems = [
    {
      path: ROUTES.coleccion[currentLocale],
      label: dict.coleccion,
    },
    {
      path: ROUTES.arquitectura[currentLocale],
      label: dict.arquitectura,
    },
    {
      path: ROUTES.about[currentLocale],
      label: dict.about,
    },
    {
      path: ROUTES.contacto[currentLocale],
      label: dict.contacto,
    },
  ];

  const targetPathEs = getCleanPath(pathname, "es", searchParams);
  const targetPathEn = getCleanPath(pathname, "en", searchParams);

  // En barra de lado a lado cuadrada, mantenemos visibilidad nítida en todo scroll
  const isSolidBar = scrolled || !isHome;

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-colors duration-300 ease-in-out border-b ${
        isSolidBar
          ? "bg-black-neutral/95 backdrop-blur-md border-gray-warm/15 shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 w-full">
          {/* COLUMNA 1: LOGOTIPO */}
          <div className="flex items-center justify-start shrink-0">
            <Link
              href={currentLocale === "en" ? "/en" : "/"}
              scroll={false}
              className="block transition-opacity duration-300 hover:opacity-80"
              aria-label={currentLocale === "en" ? "MAYA Home" : "MAYA Inicio"}
            >
              <Image
                src="/images/MAYA_LOGOTIPO_LIGHT.png"
                alt="MAYA Stone Imports"
                width={120}
                height={30}
                priority
                className="h-3 sm:h-3.5 md:h-4 w-auto object-contain"
              />
            </Link>
          </div>

          {/* COLUMNA 2: NAVEGACIÓN DESKTOP */}
          <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-12 h-full">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={`/${item.path}`}
                className="group relative py-1 font-sans text-maya-label font-normal tracking-nav uppercase transition-colors duration-300 hover:opacity-70 whitespace-nowrap text-gray-warm"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 group-hover:w-full bg-accent" />
              </Link>
            ))}
          </nav>

          {/* COLUMNA 3: ACCIONES DERECHA (Idioma, Admin, Mobile Toggle) */}
          <div className="flex items-center justify-end gap-4 sm:gap-6">
            {/* SELECTOR DE IDIOMA */}
            <div className="hidden md:flex items-center gap-1.5 font-sans text-maya-label tracking-data text-gray-warm">
              <Link
                href={targetPathEs}
                scroll={false}
                onClick={() => handleLangTransition("es")}
                className={`transition-opacity duration-200 cursor-pointer ${
                  currentLocale === "es"
                    ? "opacity-100 font-semibold text-accent-ink pointer-events-none"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                ES
              </Link>

              <span className="h-2 w-px bg-gray-warm/25" />

              <Link
                href={targetPathEn}
                scroll={false}
                onClick={() => handleLangTransition("en")}
                className={`transition-opacity duration-200 cursor-pointer ${
                  currentLocale === "en"
                    ? "opacity-100 font-semibold text-accent-ink pointer-events-none"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                EN
              </Link>
            </div>

            {/* ENLACE ADMIN */}
            {isAdmin && (
              <>
                <span className="hidden md:block h-3 w-px bg-gray-warm/20" />
                <Link
                  href="/admin/dashboard"
                  className="hidden md:block font-mono text-maya-label font-normal tracking-nav uppercase transition-opacity duration-300 hover:opacity-70 text-accent-ink whitespace-nowrap"
                >
                  Admin
                </Link>
              </>
            )}

            {/* BOTÓN MENÚ MÓVIL */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="flex md:hidden p-1.5 focus:outline-none text-gray-warm hover:text-accent-ink transition-colors duration-200 cursor-pointer"
              aria-label={isOpen ? dict.menu_close : dict.menu_open}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="h-6 w-6 stroke-current stroke-[1.25]"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL DESPLEGABLE FULL-WIDTH CUADRADO */}
      <div
        id="mobile-menu"
        className={`md:hidden w-full border-b border-gray-warm/15 bg-black-neutral/98 backdrop-blur-xl px-6 py-8 transition-all duration-300 ease-out ${
          isOpen
            ? "max-h-[85vh] opacity-100 visible border-t border-gray-warm/10"
            : "max-h-0 opacity-0 invisible overflow-hidden py-0 border-transparent"
        }`}
      >
        <div className="flex flex-col space-y-5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={`/${item.path}`}
              onClick={() => setIsOpen(false)}
              className="font-sans text-maya-body uppercase tracking-editorial font-light text-gray-warm opacity-85 hover:opacity-100 hover:text-accent-ink transition-all"
            >
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setIsOpen(false)}
              className="font-mono text-maya-small tracking-data text-accent-ink opacity-90 hover:opacity-100 transition-opacity uppercase pt-2 border-t border-gray-warm/10"
            >
              {dict.admin_panel ?? "Admin"}
            </Link>
          )}

          {/* IDIOMA EN MÓVIL */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-warm/10 font-mono text-maya-label tracking-data text-gray-warm/60">
            <Link
              href={targetPathEs}
              scroll={false}
              onClick={() => {
                handleLangTransition("es");
                setIsOpen(false);
              }}
              className={`transition-colors duration-200 cursor-pointer ${
                currentLocale === "es"
                  ? "text-accent-ink font-semibold pointer-events-none"
                  : "hover:text-gray-warm"
              }`}
            >
              ES
            </Link>

            <span>/</span>

            <Link
              href={targetPathEn}
              scroll={false}
              onClick={() => {
                handleLangTransition("en");
                setIsOpen(false);
              }}
              className={`transition-colors duration-200 cursor-pointer ${
                currentLocale === "en"
                  ? "text-accent-ink font-semibold pointer-events-none"
                  : "hover:text-gray-warm"
              }`}
            >
              EN
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
