"use client";

import { useState, useEffect, useRef } from "react";

export interface DockNavItem {
  key: string;
  label: string;
  count?: number | string;
}

interface AtelierDockNavProps {
  items?: DockNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  headerLabel?: string;
  scrollTarget?: "item-key" | string;
  scrollOffset?: number;
}

export default function AtelierDockNav({
  items = [],
  activeKey = "",
  onSelect,
  headerLabel,
  scrollTarget = "item-key",
  scrollOffset = -80,
}: AtelierDockNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "-80px 0px 0px 0px",
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!items || items.length === 0) return null;

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleSelect = (key: string) => {
    onSelect?.(key);
    setIsOpen(false);

    if (scrollTarget) {
      setTimeout(() => {
        let targetElement: HTMLElement | null = null;

        if (scrollTarget === "item-key") {
          targetElement =
            document.getElementById(key) ||
            document.getElementById(`collection-${key}`) ||
            document.getElementById(`section-${key}`) ||
            document.getElementById(`categoria-${key}`);
        } else {
          targetElement = document.getElementById(scrollTarget);
        }

        if (targetElement) {
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.scrollY + scrollOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
        }
      }, 50);
    }
  };

  const activeIndex = items.findIndex((i) => i.key === activeKey);
  const activeItem = items[activeIndex >= 0 ? activeIndex : 0];

  return (
    <>
      <div ref={sentinelRef} className="w-full h-px pointer-events-none" />

      {/* DOCK FLOTANTE */}
      <aside
        ref={dockRef}
        aria-label={headerLabel || "Navegación de Colecciones"}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 select-none transition-all duration-500 ease-out pointer-events-auto ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* BANDEJA DE ETIQUETAS */}
        <div
          className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 sm:w-72 bg-black-neutral/95 backdrop-blur-2xl border border-white/15 rounded-2xs shadow-2xl p-1.5 transition-all duration-300 origin-bottom z-50 before:absolute before:-bottom-4 before:left-0 before:right-0 before:h-5 before:content-[''] ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-1 max-h-[45vh] overflow-y-auto no-scrollbar">
            {items.map((item, idx) => {
              const isSelected = activeKey === item.key;
              const romanIdx =
                ["I", "II", "III", "IV", "V", "VI", "VII"][idx] ||
                String(idx + 1).padStart(2, "0");

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelect(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-3xs font-mono text-maya-small uppercase tracking-data transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? "bg-accent text-white font-bold shadow-xs"
                      : "bg-surface-secondary/5 text-gray-warm/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? "text-white" : "text-accent-ink"
                      }`}
                    >
                      {romanIdx}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] text-white font-bold">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PESTAÑA PRINCIPAL */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black-neutral/90 backdrop-blur-xl text-gray-warm border border-white/15 hover:border-accent shadow-2xl rounded-full px-4 py-2 sm:px-5 sm:py-2.5 flex items-center gap-3 transition-all duration-300 cursor-pointer group"
        >
          {headerLabel && (
            <>
              <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
                {headerLabel}
              </span>
              <span className="h-3 w-px bg-white/20" />
            </>
          )}

          <span className="font-mono text-maya-small uppercase tracking-data text-gray-warm font-medium max-w-[160px] sm:max-w-[220px] truncate">
            {activeItem?.label}
          </span>

          <span
            className={`font-mono text-[9px] text-accent-ink transition-transform duration-300 ml-0.5 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            ▲
          </span>
        </button>
      </aside>
    </>
  );
}
