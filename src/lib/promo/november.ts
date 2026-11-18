/**
 * PROMOCIÓN "NOVEMBER AT MAYA" (noviembre 2026)
 * -----------------------------------------------------------------------------
 * Cuándo se muestra:
 *   · Automático: del 1 al 30 de noviembre de 2026 (hora del centro de México).
 *     El 1 de diciembre deja de aparecer sola, sin tocar nada.
 *   · Apagado manual: en Vercel → Environment Variables, crea
 *     NEXT_PUBLIC_PROMO_NOVEMBER = off   (tipo Config) y haz Redeploy.
 *     Para volver a encenderla, borra la variable o ponle "on" y Redeploy.
 *
 * Para una promoción futura: copia este archivo, cambia fechas, PDF e imágenes.
 */

export const NOVEMBER_PROMO = {
  id: "november-at-maya-2026",
  /** Se guarda como interés del suscriptor en el admin */
  subscriberSource: "promo_noviembre_2026",
  startsAt: Date.parse("2026-11-01T00:00:00-06:00"),
  endsAt: Date.parse("2026-12-01T00:00:00-06:00"),
  pdfUrl: "/catalogos/november-at-maya-2026.pdf",
  pdfFileName: "November-at-MAYA-2026.pdf",
  imageVertical: "/images/promo/november-marmol-vertical.webp",
  imageHorizontal: "/images/promo/november-marmol-horizontal.webp",
  discount: 30,
  materialsCount: 13,
} as const;

export function isNovemberPromoActive(now = Date.now()): boolean {
  if (process.env.NEXT_PUBLIC_PROMO_NOVEMBER === "off") return false;
  return now >= NOVEMBER_PROMO.startsAt && now < NOVEMBER_PROMO.endsAt;
}
