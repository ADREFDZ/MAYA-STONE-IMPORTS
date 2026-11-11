"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useAnalyticsConsent } from "@/lib/analytics/useConsent";
import { track, type TrackEvent } from "@/lib/analytics/track";

interface AnalyticsProps {
  /** Google Analytics 4 (G-XXXXXXX) */
  gaId?: string;
  /** Microsoft Clarity (mapas de calor y grabaciones) */
  clarityId?: string;
}

/**
 * ANALÍTICA (solo con consentimiento de cookies)
 * · GA4: visitas, fuentes de tráfico, conversiones (eventos de `track`).
 * · Clarity: mapas de calor, scroll y grabaciones anónimas (campos de
 *   formulario enmascarados por defecto).
 * · Cambios de página en la app (sin recarga): se reportan a GA4 y Meta Pixel.
 */
export default function Analytics({ gaId, clarityId }: AnalyticsProps) {
  const consent = useAnalyticsConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  // Page view en cada navegación interna (la primera ya la envían los scripts)
  useEffect(() => {
    if (!consent) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    window.gtag?.("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
    window.fbq?.("track", "PageView");
  }, [consent, pathname, searchParams]);

  // Clics medidos automáticamente en todo el sitio:
  //   · enlaces a WhatsApp (wa.me)       → whatsapp_click
  //   · descargas de PDF / [download]    → catalog_download
  //   · cualquier elemento con data-track="evento" (+ data-track-label)
  useEffect(() => {
    if (!consent) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        "a, button, [data-track]",
      ) as HTMLElement | null;
      if (!el) return;
      const explicit = el.getAttribute("data-track") as TrackEvent | null;
      const label =
        el.getAttribute("data-track-label") ||
        el.textContent?.trim().slice(0, 80) ||
        undefined;
      const href = el.getAttribute("href") || "";
      const page = window.location.pathname;
      if (explicit) track(explicit, { label, page });
      else if (href.includes("wa.me/")) track("whatsapp_click", { page });
      else if (el.hasAttribute("download") || /\.pdf(\?|$)/i.test(href))
        track("catalog_download", { label, page });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, [consent]);

  if (!consent) return null;

  return (
    <>
      {gaId && (
        <>
          <Script
            id="ga4-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`,
            }}
          />
        </>
      )}
      {clarityId && (
        <Script
          id="ms-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`,
          }}
        />
      )}
    </>
  );
}
