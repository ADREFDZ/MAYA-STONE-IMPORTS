"use client";

import { ReactNode } from "react";

export interface ModalTabItem {
  id: string;
  label: string;
  badgeCount?: number;
}

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  isSubmitting?: boolean;
  tabs?: ModalTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: any) => void;
  children: ReactNode;
}

export default function FullscreenModal({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle = "ESTUDIO & CURADURÍA",
  isSubmitting = false,
  tabs = [],
  activeTab,
  onTabChange,
  children,
}: FullscreenModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black-pure/90 backdrop-blur-xs flex flex-col font-sans">
      {/* ─── HEADER FIJO SUPERIOR ─── */}
      <header className="h-16 px-4 sm:px-6 md:px-10 border-b border-border-light bg-surface flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="h-7 w-1 bg-accent rounded-full shrink-0" />
          <div className="truncate">
            <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink block font-semibold">
              {subtitle}
            </span>
            <h2 className="font-sans font-light text-maya-h4 uppercase tracking-editorial text-black-neutral truncate">
              {title}
            </h2>
          </div>
        </div>

        {/* TABS DE ESCRITORIO (>= md) */}
        {tabs.length > 0 && onTabChange && (
          <nav className="hidden md:flex items-center gap-1.5 bg-surface p-1 border border-border-light rounded-2xs font-mono text-maya-label uppercase tracking-data">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-3xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-black-neutral text-gray-warm font-bold shadow-xs"
                      : "text-black-neutral/70 hover:text-black-neutral hover:bg-accent-soft"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badgeCount !== undefined && (
                    <span
                      className={`px-1.5 py-px rounded-full text-[9px] font-bold ${
                        isActive
                          ? "bg-accent text-white"
                          : "bg-accent-soft text-accent-ink"
                      }`}
                    >
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* ACCIONES */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-mono text-maya-label uppercase tracking-data">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 text-black-neutral/70 hover:text-black-neutral hover:bg-accent-soft transition-colors cursor-pointer border border-border-light rounded-3xs bg-surface"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="px-4 sm:px-6 py-2 bg-black-neutral text-gray-warm hover:bg-black-pure transition-colors disabled:opacity-50 cursor-pointer font-bold rounded-3xs shadow-xs"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </header>

      {/* ─── TABS MÓVILES (< md) ─── */}
      {tabs.length > 0 && onTabChange && (
        <nav className="flex md:hidden bg-surface border-b border-border-light px-4 py-2 overflow-x-auto gap-2 shrink-0 font-mono text-maya-label uppercase tracking-data no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 whitespace-nowrap rounded-3xs cursor-pointer border flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-black-neutral text-gray-warm font-bold border-black-neutral shadow-xs"
                    : "bg-surface text-black-neutral/70 border-border-light hover:bg-accent-soft"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badgeCount !== undefined && (
                  <span
                    className={`px-1 py-px rounded-full text-[9px] font-bold ${
                      isActive
                        ? "bg-accent text-white"
                        : "bg-accent-soft text-accent-ink"
                    }`}
                  >
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* ─── CONTENIDO CON FONDO WARM MINERAL ─── */}
      <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 md:p-10 lg:p-12">
        <div className="max-w-5xl mx-auto bg-surface border border-border-light rounded-2xs p-5 sm:p-8 md:p-12 shadow-sm space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
