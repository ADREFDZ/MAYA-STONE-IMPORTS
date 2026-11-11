"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

/**
 * CORTINA DE CAMBIO DE IDIOMA
 * ---------------------------------------------------------------------------
 * Todo el ciclo vive en React (antes el Header inyectaba un <div> con
 * innerHTML y la animación se cortaba):
 *
 *   1. covering  → la cortina sube desde abajo hasta cubrir la pantalla.
 *   2. covered   → ya cubierta, se navega al idioma nuevo (router.push).
 *   3. revealing → con la página nueva pintada y el scroll restaurado,
 *                  la cortina sale hacia arriba.
 *
 * El Header solo llama a `startLanguageTransition(href)`.
 * Si el layout se vuelve a montar al cambiar de idioma, la nueva instancia
 * retoma el ciclo desde sessionStorage (sin parpadeo: useLayoutEffect).
 */

const EVENT = "maya:lang-transition";
const FLAG = "maya_lang_transition";
const SCROLL = "maya_saved_scroll";
const DURATION = 280; // ms de cada barrido (rápido: se siente inmediato)
const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

type Phase = "idle" | "enter" | "covering" | "covered" | "revealing";

export function startLanguageTransition(href: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { href } }));
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function LanguageTransitionOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");

  // Al llegar a la página nueva: restaurar scroll, esperar a que pinte y revelar
  const reveal = useCallback(() => {
    const saved = Number(sessionStorage.getItem(SCROLL));
    if (!Number.isNaN(saved)) {
      window.scrollTo({ top: saved, behavior: "instant" as ScrollBehavior });
    }
    // Dos frames + margen para que imágenes/fuentes de la página nueva se asienten
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.setTimeout(() => setPhase("revealing"), 180);
        window.setTimeout(() => {
          setPhase("idle");
          sessionStorage.removeItem(FLAG);
          sessionStorage.removeItem(SCROLL);
        }, 180 + DURATION);
      }),
    );
  }, []);

  // 1) Inicio: el Header pide la transición
  useEffect(() => {
    const onStart = (e: Event) => {
      const href = (e as CustomEvent<{ href: string }>).detail?.href;
      if (!href) return;
      sessionStorage.setItem(SCROLL, String(window.scrollY));
      sessionStorage.setItem(FLAG, "true");

      const navigate = () => {
        setPhase("covered");
        router.push(href, { scroll: false });
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
    return () => window.removeEventListener(EVENT, onStart);
  }, [router]);

  // 2) Llegada (misma instancia): cambió la ruta con la cortina puesta
  useEffect(() => {
    if (phase === "covered" && sessionStorage.getItem(FLAG) === "true") {
      reveal();
    }
    // Solo reaccionar al cambio de ruta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 3) Llegada (instancia nueva tras remontar el layout): cubrir antes de pintar
  useLayoutEffect(() => {
    if (sessionStorage.getItem(FLAG) === "true") {
      // Intencional: debe cubrir ANTES del primer pintado (sessionStorage solo
      // existe en el cliente, así que no puede ir en el estado inicial).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("covered");
      reveal();
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          alt=""
          width={110}
          height={28}
          priority
          className="h-4 w-auto object-contain opacity-90"
        />
        <div className="relative w-20 h-px bg-gray-warm/15 overflow-hidden">
          <div className="absolute inset-y-0 w-1/2 bg-accent animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}
