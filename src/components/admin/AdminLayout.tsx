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

  // Menú agrupado (iconos de trazo fino)
  const navGroups: {
    title: string;
    items: { label: string; href: string; icon: string }[];
  }[] = [
    {
      title: "General",
      items: [
        { label: "Resumen", href: `/${lang}/admin/dashboard`, icon: "M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" },
        { label: "Solicitudes", href: `/${lang}/admin/leads`, icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
      ],
    },
    {
      title: "Catálogo",
      items: [
        { label: "Inventario", href: `/${lang}/admin/inventory`, icon: "M4 7l8-4 8 4-8 4zM4 7v10l8 4 8-4V7M12 11v10" },
        { label: "Colecciones", href: `/${lang}/admin/colecciones`, icon: "M5 4h14v16H5zM9 4v16" },
        { label: "Proyectos", href: `/${lang}/admin/projects`, icon: "M3 21h18M5 21V8l7-5 7 5v13M10 21v-6h4v6" },
        { label: "Galería", href: `/${lang}/admin/gallery`, icon: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15 9h.01" },
      ],
    },
    {
      title: "Ajustes",
      items: [
        { label: "Usuarios", href: `/${lang}/admin/users`, icon: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20a6 6 0 0112 0M16 4.5a3.5 3.5 0 010 6.5M21 20a6 6 0 00-4-5.6" },
      ],
    },
  ];
  const allItems = navGroups.flatMap((g) => g.items);
  const current = allItems.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "A";

  const NavIcon = ({ d }: { d: string }) => (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  /** Contenido del menú (se usa en escritorio y en el cajón móvil) */
  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Marca */}
      <div className="px-3 pt-2 pb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/MAYA_LOGOTIPO.png" alt="MAYA" className="h-[14px] w-auto" />
        <p className="mt-2 text-[11px] text-text-muted">Panel de administración</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto space-y-6 pr-1" aria-label="Administración">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-[11px] text-text-muted">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = current?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[14px] transition-colors ${
                        active
                          ? "bg-black-neutral text-gray-warm shadow-[0_8px_20px_-12px_rgba(37,37,37,0.7)]"
                          : "text-black-neutral/70 hover:text-black-neutral hover:bg-white/70"
                      }`}
                    >
                      <NavIcon d={item.icon} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sitio público + usuario */}
      <div className="pt-4 space-y-3">
        <Link
          href={`/${lang}`}
          target="_blank"
          className="flex items-center justify-between rounded-[14px] px-3 py-2.5 text-[13px] text-black-neutral/70 hover:text-black-neutral hover:bg-white/70 transition-colors"
        >
          <span className="flex items-center gap-3">
            <NavIcon d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
            Ver sitio web
          </span>
          <span aria-hidden="true">↗</span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            className="w-full flex items-center gap-3 rounded-[16px] bg-white/70 border border-white px-2.5 py-2.5 text-left hover:bg-white transition-colors cursor-pointer"
          >
            <span className="h-9 w-9 rounded-full bg-black-neutral text-gray-warm flex items-center justify-center text-[13px] shrink-0">
              {userInitial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-black-neutral truncate">{userName || "Administrador"}</span>
              <span className="block text-[11px] text-text-muted truncate">{userEmail || "Admin"}</span>
            </span>
            <svg viewBox="0 0 24 24" className={`h-4 w-4 text-text-muted transition-transform ${isMenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
              <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-[16px] bg-white border border-black-neutral/10 shadow-xl p-2 z-50">
              <p className="px-3 pt-1.5 pb-2 text-[11px] text-text-muted">Rol: administrador</p>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between rounded-[10px] px-3 py-2 text-[13px] text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <span>Cerrar sesión</span>
                <NavIcon d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-ui min-h-screen bg-background text-black-neutral font-sans selection:bg-accent selection:text-white lg:flex">
      {/* ─── SIDEBAR ESCRITORIO ─── */}
      <aside className="hidden lg:block w-[264px] shrink-0 sticky top-0 h-screen p-4">
        <div className="h-full rounded-[24px] bg-white/45 border border-white/70 backdrop-blur-sm shadow-[0_1px_2px_rgba(37,37,37,0.05),0_18px_40px_-24px_rgba(37,37,37,0.35)] p-4">
          {sidebarContent}
        </div>
      </aside>

      {/* ─── BARRA SUPERIOR MÓVIL ─── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 bg-background/90 backdrop-blur-md border-b border-black-neutral/10">
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="h-9 w-9 rounded-full bg-white/70 border border-black-neutral/10 flex items-center justify-center cursor-pointer"
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-[14px] truncate">{current?.label || "Administración"}</span>
        <span className="h-9 w-9 rounded-full bg-black-neutral text-gray-warm flex items-center justify-center text-[13px]">
          {userInitial}
        </span>
      </header>

      {/* ─── CAJÓN MÓVIL ─── */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black-pure/50 backdrop-blur-xs" onClick={() => setIsMobileNavOpen(false)} />
          <div className="absolute inset-y-3 left-3 w-[280px] max-w-[85vw] rounded-[24px] bg-background shadow-2xl p-4">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-text-secondary hover:text-black-neutral cursor-pointer z-10"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ─── CONTENIDO ─── */}
      <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:pl-2 lg:pr-6 lg:py-4">
        <div className="max-w-[1320px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
