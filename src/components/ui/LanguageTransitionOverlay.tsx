"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function LanguageTransitionOverlay() {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const pendingTransition = sessionStorage.getItem("maya_lang_transition");
    if (pendingTransition === "true") {
      setIsActive(true);

      const savedScroll = sessionStorage.getItem("maya_saved_scroll");
      if (savedScroll) {
        const targetY = parseInt(savedScroll, 10);
        if (!isNaN(targetY)) {
          window.scrollTo({
            top: targetY,
            behavior: "instant" as ScrollBehavior,
          });
        }
      }

      // Tiempo suficiente (580ms) para que componentes pesados terminen su render/layout
      const timer = setTimeout(() => {
        const injected = document.getElementById("maya-fallback-overlay");
        if (injected) injected.remove();

        setIsFadingOut(true);

        const cleanup = setTimeout(() => {
          setIsActive(false);
          setIsFadingOut(false);
          sessionStorage.removeItem("maya_lang_transition");
          sessionStorage.removeItem("maya_saved_scroll");
        }, 500);

        return () => clearTimeout(cleanup);
      }, 320);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isActive) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black-neutral text-gray-warm pointer-events-auto select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-radial from-accent/15 via-transparent to-transparent opacity-60 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <Image
          src="/images/MAYA_LOGOTIPO_LIGHT.png"
          alt="MAYA"
          width={110}
          height={28}
          priority
          className="h-4 w-auto object-contain opacity-90"
        />

        {/* LÍNEA DE CARGA EDITORIAL MINIMALISTA */}
        <div className="relative w-20 h-0.5 bg-gray-warm/15 overflow-hidden rounded-full">
          <div className="absolute inset-y-0 w-1/2 bg-accent rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}
