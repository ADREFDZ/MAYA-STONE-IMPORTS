import { useCallback, useRef } from "react";
import type React from "react";

/**
 * Permite desplazar un carrusel horizontal arrastrando con el mouse
 * (en touch el scroll nativo ya funciona).
 *
 * Uso:
 *   const { ref, handlers } = useDragScroll<HTMLDivElement>();
 *   <div ref={ref} {...handlers} className="overflow-x-auto no-scrollbar">…</div>
 */
/** Píxeles de desplazamiento a partir de los cuales se considera arrastre. */
const DRAG_THRESHOLD = 5;

export function useDragScroll<T extends HTMLElement>(speed = 1.5) {
  const ref = useRef<T>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - el.offsetLeft;
    startScroll.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!isDragging.current || !el) return;
      const x = e.pageX - el.offsetLeft;
      const delta = x - startX.current;
      if (!hasDragged.current && Math.abs(delta) < DRAG_THRESHOLD) return;
      hasDragged.current = true;
      e.preventDefault(); // evita seleccionar texto mientras se arrastra
      el.scrollLeft = startScroll.current - delta * speed;
    },
    [speed],
  );

  const stop = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Si hubo arrastre, cancela el clic que se dispara al soltar, para no
  // abrir por accidente la tarjeta/enlace sobre el que terminó el gesto.
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
    }
  }, []);

  return {
    ref,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: stop,
      onMouseLeave: stop,
      onClickCapture,
    },
  };
}
