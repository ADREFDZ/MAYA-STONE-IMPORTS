/**
 * BLOQUEO DE SCROLL DE LA PÁGINA (modales, menú móvil, panel de colección)
 * ---------------------------------------------------------------------------
 * Antes se usaba `document.body.style.overflow = "hidden"`, pero en este sitio
 * <html> tiene `overflow-x: clip` (globals.css). Con eso el navegador NO pasa
 * el overflow del <body> a la ventana, así que la página seguía haciendo
 * scroll detrás del panel (muy visible en celulares reales).
 *
 * Aquí se bloquea <html> y <body>, y se lleva un contador para que varios
 * bloqueos simultáneos (p. ej. menú + modal) no se liberen entre sí.
 *
 * Uso: `const unlock = lockScroll();` … `unlock();`
 */

let locks = 0;
let saved: { html: string; body: string; overscroll: string } | null = null;

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  const html = document.documentElement;
  const body = document.body;

  if (locks === 0) {
    saved = {
      html: html.style.overflow,
      body: body.style.overflow,
      overscroll: html.style.overscrollBehavior,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    // Evita el "rebote" que arrastra la página en Android/iOS
    html.style.overscrollBehavior = "none";
  }
  locks++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0 && saved) {
      html.style.overflow = saved.html;
      body.style.overflow = saved.body;
      html.style.overscrollBehavior = saved.overscroll;
      saved = null;
    }
  };
}
