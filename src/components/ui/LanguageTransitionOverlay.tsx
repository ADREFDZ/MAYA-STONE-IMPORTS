"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";

/**
 * CORTINA DE CAMBIO DE IDIOMA
 * ---------------------------------------------------------------------------
 *   1. covering  → la cortina sube desde abajo hasta cubrir la pantalla.
 *   2. covered   → ya cubierta, se carga la página en el otro idioma con una
 *                  navegación COMPLETA (window.location). Así el servidor
 *                  siempre lee la preferencia nueva (cookie NEXT_LOCALE) y no
 *                  se reutiliza nada precargado con el idioma anterior (eso
 *                  dejaba la cortina pegada al regresar al home en español).
 *   3. revealing → la página nueva monta esta cortina ya cubierta (lo sabe por
 *                  sessionStorage), restaura el scroll y la retira hacia arriba.
 *
 * Mientras la página nueva carga, un velo de CSS (html.lang-transition, ver
 * layout y globals.css) mantiene la pantalla cubierta para que no "parpadee".
 *
 * Redes de seguridad (la cortina nunca puede quedarse puesta):
 *   · Si la navegación no ocurre en NAV_TIMEOUT ms, se retira sola.
 *   · Al volver con "atrás" (página restaurada de memoria), se retira.
 *   · El velo de CSS se desvanece solo a los 4 s aunque falle el JavaScript.
 *
 * El Header solo llama a `startLanguageTransition(href)`.
 */

const EVENT = "maya:lang-transition";
const FLAG = "maya_lang_transition";
const SCROLL = "maya_saved_scroll";
const DURATION = 280; // ms de cada barrido (rápido: se siente inmediato)
const NAV_TIMEOUT = 8000; // ms máximos con la cortina puesta antes de retirarla
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

type Phase = "idle" | "enter" | "covering" | "covered" | "revealing";

export function startLanguageTransition(href: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { href } }));
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// sessionStorage puede fallar (modo privado estricto, almacenamiento lleno)
const store = {
  get(key: string) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* sin almacenamiento: la cortina igual se retira por tiempo */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(FLAG);
      sessionStorage.removeItem(SCROLL);
    } catch {
      /* ignorar */
    }
  },
};

/** Quita el velo de CSS que cubre la página mientras carga. */
const removeVeil = () =>
  document.documentElement.classList.remove("lang-transition");

export default function LanguageTransitionOverlay() {
  const [phase, setPhase] = useState<Phase>("idle");

  // Retirar la cortina: restaurar scroll, esperar a que pinte y revelar
  const reveal = useCallback(() => {
    const saved = Number(store.get(SCROLL));
    if (saved > 0) {
      window.scrollTo({ top: saved, behavior: "instant" as ScrollBehavior });
    }
    store.clear();
    // Dos frames + margen para que imágenes/fuentes de la página nueva se asienten
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        removeVeil();
        window.setTimeout(() => setPhase("revealing"), 180);
        window.setTimeout(() => setPhase("idle"), 180 + DURATION);
      }),
    );
  }, []);

  // 1) Inicio: el Header pide la transición
  useEffect(() => {
    let navTimer = 0;
    const onStart = (e: Event) => {
      const href = (e as CustomEvent<{ href: string }>).detail?.href;
      if (!href) return;
      store.set(SCROLL, String(window.scrollY));
      store.set(FLAG, "true");

      const navigate = () => {
        setPhase("covered");
        // Red de seguridad: si por algo la página no cambia, retirar la cortina
        navTimer = window.setTimeout(() => {
          store.clear();
          setPhase("revealing");
          window.setTimeout(() => setPhase("idle"), DURATION);
        }, NAV_TIMEOUT);
        window.location.assign(href);
      };

      if (prefersReducedMotion()) return navigate();

      // "enter" pinta la cortina fuera de pantalla; el siguiente frame la sube
      setPhase("enter");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("covering")),
      );
      window.setTimeout(navigate, DURATION);
    };
    window.addEventListener(EVENT, onStart);
    return () => {
      window.removeEventListener(EVENT, onStart);
      window.clearTimeout(navTimer);
    };
  }, []);

  // 2) Llegada a la página nueva: cubrir ANTES del primer pintado y revelar
  useLayoutEffect(() => {
    if (store.get(FLAG) === "true") {
      // Intencional: debe cubrir antes del primer pintado (sessionStorage solo
      // existe en el cliente, así que no puede ir en el estado inicial).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("covered");
      reveal();
    } else {
      removeVeil();
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Volver con "atrás": el navegador puede restaurar la página tal como se
  //    quedó (con la cortina puesta). En ese caso se retira de inmediato.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      store.clear();
      removeVeil();
      setPhase("idle");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (phase === "idle") return null;

  const reduced = prefersReducedMotion();
  const clip =
    phase === "enter"
      ? "inset(100% 0 0 0)" // fuera, abajo
      : phase === "revealing"
        ? "inset(0 0 100% 0)" // sale por arriba
        : "inset(0 0 0 0)"; // cubriendo

  const contentVisible = phase === "covering" || phase === "covered";

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black-neutral text-gray-warm select-none"
      style={{
        clipPath: clip,
        opacity: reduced ? (phase === "revealing" ? 0 : 1) : 1,
        transition: reduced
          ? "opacity 200ms ease"
          : phase === "enter"
            ? "none"
            : `clip-path ${DURATION}ms ${EASE}`,
        pointerEvents: phase === "revealing" ? "none" : "auto",
      }}
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(12px)",
          transition: `opacity 400ms ease ${contentVisible ? 250 : 0}ms, transform 600ms ${EASE} ${contentVisible ? 250 : 0}ms`,
        }}
      >
        <Image
          src="/images/MAYA_LOGOTIPO_LIGHT.png"
          alt="MAYA"
          width={135}
          height={20}
          priority
          className="h-4 sm:h-[18px] w-auto object-contain"
        />
        <div className="relative w-20 h-px bg-gray-warm/15 overflow-hidden">
          <div className="absolute inset-y-0 w-1/2 bg-accent animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}
