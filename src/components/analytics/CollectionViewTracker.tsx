"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import { hasMarketingConsent } from "@/lib/analytics/attribution";

/**
 * ViewContent de Meta al abrir la página de una colección
 * (content_name = nombre de la colección).
 * El Pixel se carga unos instantes después de la página, así que se espera
 * a que esté listo (máx. ~6 s). Sin cookies aceptadas solo cuenta Vercel.
 */
export default function CollectionViewTracker({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  useEffect(() => {
    let tries = 0;
    let timer = 0;
    const send = () =>
      track("collection_view", {
        content_name: name,
        content_category: "coleccion",
        coleccion: slug,
      });
    const attempt = () => {
      if (!hasMarketingConsent() || window.fbq || tries >= 12) {
        send();
        return;
      }
      tries += 1;
      timer = window.setTimeout(attempt, 500);
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [slug, name]);

  return null;
}
