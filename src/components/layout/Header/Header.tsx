"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ROUTES, getCleanPath, type Locale } from "@/lib/i18n/routes";
import { startLanguageTransition } from "@/components/ui/LanguageTransitionOverlay";
import { lockScroll } from "@/lib/utils/scrollLock";

interface HeaderProps {
  dict: {
    coleccion: string;
    arquitectura: string;
    about: string;
    contacto: string;
    home_aria: string;
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

  // Bloqueo de scroll de fondo con menú móvil abierto
  useEffect(() => {
    if (!isOpen) return;
    return lockScroll();
  }, [isOpen]);

  // Cerrar menú al cambiar de ruta
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

  const handleLangTransition = (
    e: React.MouseEvent<HTMLAnchorElement>,
    newLocale: Locale,
    href: string,
  ) => {
    e.preventDefault();
    if (newLocale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    startLanguageTransition(href);
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

  const isSolidBar = scrolled || !isHome || isOpen;

  // Barra sólida = clara (fondo gray-warm de marca, texto neutral black).
  // Transparente sobre el hero del home = texto claro.
  const ink = isSolidBar ? "text-text-primary" : "text-gray-warm";
  const divider = isSolidBar ? "bg-black-neutral/20" : "bg-gray-warm/25";

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-colors duration-300 ease-in-out border-b ${
        isSolidBar
          ? "header-light bg-background/95 backdrop-blur-md border-border-light shadow-sm"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="w-full px-4 sm:px-7 md:px-10 lg:px-14">
        {/* Barra superior con altura estrictamente ceñida en móvil (h-14 / 56px) */}
        <div className="flex items-center justify-between h-14 sm:h-[58px] md:h-[72px] w-full">
          {/* COLUMNA 1: LOGOTIPO */}
          <div className="flex items-center justify-start shrink-0">
            <Link
              href={currentLocale === "en" ? "/en" : "/"}
              scroll={false}
              className="block transition-opacity duration-300 hover:opacity-80"
              aria-label={dict.home_aria}
            >
              <Image
                src={
                  isSolidBar
                    ? "/images/MAYA_LOGOTIPO.png"
                    : "/images/MAYA_LOGOTIPO_LIGHT.png"
                }
                alt="MAYA Stone Imports"
                width={120}
                height={30}
                priority
                className="h-3 sm:h-3.5 md:h-[14.5px] w-auto object-contain"
              />
            </Link>
          </div>

          {/* COLUMNA 2: NAVEGACIÓN DESKTOP */}
          <nav className="hidden md:flex items-center justify-center gap-7 lg:gap-10 h-full">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={`/${item.path}`}
                className={`group relative py-1 font-sans text-maya-label font-normal tracking-nav uppercase transition-colors duration-300 hover:opacity-70 whitespace-nowrap ${ink}`}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 h-px w-0 transition-all duration-300 group-hover:w-full bg-accent" />
              </Link>
            ))}
          </nav>

          {/* COLUMNA 3: ACCIONES DERECHA */}
          <div className="flex items-center justify-end gap-3 sm:gap-5">
            {/* SELECTOR DE IDIOMA DESKTOP */}
            <div
              className={`hidden md:flex items-center gap-1.5 font-sans text-maya-label tracking-data transition-colors duration-300 ${ink}`}
            >
              <Link
                href={targetPathEs}
                scroll={false}
                onClick={(e) => handleLangTransition(e, "es", targetPathEs)}
                className={`transition-opacity duration-200 cursor-pointer ${
                  currentLocale === "es"
                    ? "opacity-100 font-semibold text-accent-ink pointer-events-none"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                ES
              </Link>

              <span className={`h-2 w-px ${divider}`} />

              <Link
                href={targetPathEn}
                scroll={false}
                onClick={(e) => handleLangTransition(e, "en", targetPathEn)}
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
                <span className={`hidden md:block h-3 w-px ${divider}`} />
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
              className={`flex md:hidden p-1.5 focus:outline-none hover:text-accent-ink transition-colors duration-200 cursor-pointer ${ink}`}
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

      {/* MENÚ MÓVIL RESPONSIVE EN CUALQUIER ROTACIÓN (0px de altura en reposo) */}
      <div
        id="mobile-menu"
        // Cerrado: fuera del orden de Tab y oculto a lectores de pantalla
        inert={!isOpen}
        className={`md:hidden w-full bg-background/98 backdrop-blur-2xl transition-[max-height,opacity] duration-300 ease-out overflow-hidden ${
          isOpen
            ? "max-h-[calc(100svh-3.5rem)] opacity-100 border-t border-border-light overflow-y-auto overscroll-contain"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col space-y-4 sm:space-y-5 px-6 py-5 sm:py-7">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={`/${item.path}`}
              onClick={() => setIsOpen(false)}
              className="font-sans text-maya-body uppercase tracking-editorial font-light text-text-primary opacity-85 hover:opacity-100 hover:text-accent-ink transition-all"
            >
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setIsOpen(false)}
              className="font-mono text-maya-small tracking-data text-accent-ink opacity-90 hover:opacity-100 transition-opacity uppercase pt-2 border-t border-border-light"
            >
              {dict.admin_panel ?? "Admin"}
            </Link>
          )}

          {/* SELECTOR IDIOMA EN MÓVIL */}
          <div className="flex items-center gap-4 pt-3.5 border-t border-border-light font-mono text-maya-label tracking-data text-text-muted">
            <Link
              href={targetPathEs}
              scroll={false}
              onClick={(e) => {
                setIsOpen(false);
                handleLangTransition(e, "es", targetPathEs);
              }}
              className={`transition-colors duration-200 cursor-pointer ${
                currentLocale === "es"
                  ? "text-accent-ink font-semibold pointer-events-none"
                  : "hover:text-text-primary"
              }`}
            >
              ES
            </Link>

            <span>/</span>

            <Link
              href={targetPathEn}
              scroll={false}
              onClick={(e) => {
                setIsOpen(false);
                handleLangTransition(e, "en", targetPathEn);
              }}
              className={`transition-colors duration-200 cursor-pointer ${
                currentLocale === "en"
                  ? "text-accent-ink font-semibold pointer-events-none"
                  : "hover:text-text-primary"
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
