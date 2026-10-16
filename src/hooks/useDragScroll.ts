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
export function useDragScroll<T extends HTMLElement>(speed = 1.5) {
  const ref = useRef<T>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    startScroll.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!isDragging.current || !el) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = startScroll.current - (x - startX.current) * speed;
    },
    [speed],
  );

  const stop = useCallback(() => {
    isDragging.current = false;
  }, []);

  return {
    ref,
    handlers: { onMouseDown, onMouseMove, onMouseUp: stop, onMouseLeave: stop },
  };
}
