"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cargar usuario y perfil
  useEffect(() => {
    let isMounted = true;

    const getUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted && user) {
        setUserEmail(user.email || null);

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();

        if (isMounted) {
          setUserName(
            profile?.name || user.user_metadata?.name || user.email || null,
          );
        }
      }
    };

    getUserData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Cerrar menú usuario click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_PORTAL_KEY || "";
    const loginUrl = adminKey
      ? `/${lang}/login?key=${adminKey}`
      : `/${lang}/login`;
    router.push(loginUrl);
  };

  const navItems = [
    { num: "01", label: "Dashboard", href: `/${lang}/admin/dashboard` },
    {
      num: "02",
      label: "Inventario & Stock",
      href: `/${lang}/admin/inventory`,
    },
    {
      num: "03",
      label: "Colecciones Curadas",
      href: `/${lang}/admin/colecciones`,
    },
    {
      num: "04",
      label: "Proyectos & Arquitectura",
      href: `/${lang}/admin/projects`,
    },
    { num: "05", label: "Gestión de Usuarios", href: `/${lang}/admin/users` },
    { num: "06", label: "Solicitudes B2B", href: `/${lang}/admin/leads` },
    { num: "07", label: "Galería Editorial", href: `/${lang}/admin/gallery` },
  ];

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-background text-black-neutral flex flex-col lg:flex-row font-sans selection:bg-accent selection:text-white">
      {/* ─── SIDEBAR ESCRITORIO ─── */}
      <aside className="hidden lg:flex w-72 border-r border-border-light bg-surface p-6 md:p-8 flex-col justify-between shrink-0 sticky top-0 h-screen z-30">
        <div className="space-y-10">
          <div className="space-y-2 border-b border-border-light pb-6">
            <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
              MAYA STONE IMPORT
            </span>
            <h1 className="font-sans font-light text-maya-small tracking-editorial text-black-neutral uppercase">
              PANEL DE CONTROL
            </h1>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3.5 py-3 font-mono text-maya-label uppercase tracking-data transition-all duration-300 border-l-2 rounded-r-3xs ${
                    isActive
                      ? "border-accent bg-accent-soft text-black-neutral font-bold shadow-2xs"
                      : "border-transparent text-black-neutral/60 hover:text-black-neutral hover:bg-accent-soft/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono ${
                        isActive
                          ? "text-accent-ink"
                          : "text-black-neutral/40 group-hover:text-black-neutral/70"
                      }`}
                    >
                      {item.num}.
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-xs transition-transform duration-300 ${
                      isActive
                        ? "text-accent-ink translate-x-0.5"
                        : "opacity-0 group-hover:opacity-100 text-black-neutral/40"
                    }`}
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-border-light">
          <Link
            href={`/${lang}`}
            target="_blank"
            className="flex items-center justify-between font-mono text-maya-label uppercase tracking-data text-black-neutral/50 hover:text-black-neutral transition-colors px-1"
          >
            <span>Sitio Público MAYA</span>
            <span>↗</span>
          </Link>
        </div>
      </aside>

      {/* ─── SIDEBAR / DRAWER MÓVIL ─── */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black-pure/60 backdrop-blur-xs"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-surface h-full p-6 flex flex-col justify-between shadow-2xl z-10">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <div>
                  <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                    MAYA STONE IMPORT
                  </span>
                  <span className="font-mono text-maya-small font-medium uppercase tracking-wider text-black-neutral">
                    PANEL DE CONTROL
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1 font-mono text-sm text-black-neutral/50 hover:text-black-neutral cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 font-mono text-maya-label uppercase tracking-data border-l-2 rounded-r-3xs ${
                        isActive
                          ? "border-accent bg-accent-soft text-black-neutral font-bold"
                          : "border-transparent text-black-neutral/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-accent-ink">
                          {item.num}.
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <span>→</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-border-light">
              <Link
                href={`/${lang}`}
                target="_blank"
                className="font-mono text-maya-label uppercase text-black-neutral/50 flex justify-between"
              >
                <span>Ir a la web pública</span>
                <span>↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── ÁREA DE CONTENIDO PRINCIPAL ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border-light bg-surface/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Botón Hamburguesa Móvil */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 text-black-neutral/70 hover:text-black-neutral border border-border-light rounded-2xs cursor-pointer bg-surface"
              aria-label="Abrir menú de navegación"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
              <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60 truncate">
                SESIÓN ACTIVA
              </span>
            </div>
          </div>

          {/* Menú Desplegable de Usuario */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-full hover:bg-accent-soft/50 transition-colors border border-border-light cursor-pointer bg-surface"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black-neutral text-gray-warm flex items-center justify-center font-mono text-xs font-medium">
                {userInitial}
              </div>
              <span className="font-mono text-maya-small text-black-neutral/80 hidden sm:inline-block pr-2 truncate max-w-[140px]">
                {userName || userEmail || "Admin"}
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-light shadow-2xl p-4 space-y-4 z-50 rounded-2xs">
                <div className="border-b border-border-light pb-3">
                  <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold block">
                    CUENTA ACTIVA
                  </span>
                  <p className="font-mono text-maya-small text-black-neutral font-medium truncate mt-0.5">
                    {userName || "Administrador"}
                  </p>
                  {userEmail && (
                    <p className="font-mono text-[10px] text-black-neutral/50 truncate">
                      {userEmail}
                    </p>
                  )}
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[9px] uppercase font-bold rounded-3xs">
                    ROL: ADMINISTRADOR
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-2 py-1.5 font-mono text-maya-label uppercase tracking-data text-red-600 hover:bg-red-50/50 transition-colors text-left cursor-pointer rounded-3xs"
                >
                  <span>Cerrar Sesión</span>
                  <span>✕</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Contenedor principal */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
