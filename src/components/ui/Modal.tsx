"use client";

import React, { useEffect, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "max-w-xl",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black-pure/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 font-sans animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-surface border border-border-light w-full max-h-[90vh] flex flex-col shadow-2xl rounded-2xs overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        {title && (
          <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-surface shrink-0">
            <h3 className="font-sans font-medium text-maya-h4 tracking-editorial uppercase text-black-neutral">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-black-neutral/50 hover:text-black-neutral font-mono text-sm cursor-pointer p-1"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contenido con Scroll Interno */}
        <div className="p-6 overflow-y-auto flex-1 font-sans">{children}</div>
      </div>
    </div>
  );
}
