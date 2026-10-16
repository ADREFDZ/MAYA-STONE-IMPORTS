"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface CookieConsentBannerProps {
  lang: Locale;
  dict: {
    message: string;
    accept: string;
    decline: string;
    privacy_link: string;
    title?: string;
    aria_label?: string;
  };
}

interface StoredConsent {
  decision: "granted" | "denied";
  expiry: number; // Timestamp en milisegundos
}

const STORAGE_KEY = "maya_cookie_consent";
const DAYS_DENIED = 60; // Vuelve a consultar tras 60 días si rechazó
const DAYS_GRANTED = 180; // Consulta tras 6 meses si aceptó

export default function CookieConsentBanner({
  lang,
  dict,
}: CookieConsentBannerProps) {
  const [show, setShow] = useState(false);

  const checkConsentStatus = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setShow(true);
        return;
      }

      const parsed: StoredConsent = JSON.parse(raw);
      const now = Date.now();

      // Si ya expiró el plazo, removemos y volvemos a preguntar
      if (!parsed.expiry || now > parsed.expiry) {
        localStorage.removeItem(STORAGE_KEY);
        setShow(true);
      }
    } catch {
      // Si el formato anterior era solo un string plano ('granted'/'denied')
      const legacy = localStorage.getItem(STORAGE_KEY);
      if (!legacy) setShow(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkConsentStatus, 1000);

    // Permite reabrir el banner desde el Footer o la página de Privacidad
    const handleReopen = () => setShow(true);
    window.addEventListener("maya_open_cookie_banner", handleReopen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("maya_open_cookie_banner", handleReopen);
    };
  }, [checkConsentStatus]);

  const handleChoice = (decision: "granted" | "denied") => {
    const days = decision === "granted" ? DAYS_GRANTED : DAYS_DENIED;
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;

    const payload: StoredConsent = { decision, expiry };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    window.dispatchEvent(
      new CustomEvent("maya_consent_updated", { detail: decision }),
    );
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label={dict.aria_label ?? "Cookies"}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-black-neutral/95 text-gray-warm border border-white/15 p-5 sm:p-6 rounded-2xs shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-500 font-sans"
    >
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 font-mono text-maya-label uppercase tracking-data text-accent-ink font-semibold">
          <span>{dict.title}</span>
        </div>

        <p className="font-sans text-maya-small font-light text-gray-warm/80 leading-relaxed">
          {dict.message}{" "}
          <Link
            href={`/${ROUTES.privacidad[lang]}`}
            className="text-accent-ink underline underline-offset-2 hover:text-white transition-colors"
          >
            {dict.privacy_link}
          </Link>
          .
        </p>

        <div className="flex items-center gap-2.5 pt-1 font-mono text-maya-label uppercase tracking-data">
          <button
            type="button"
            onClick={() => handleChoice("granted")}
            className="flex-1 bg-gray-warm text-black-neutral hover:bg-white px-4 py-2 rounded-3xs font-semibold transition-colors cursor-pointer"
          >
            {dict.accept}
          </button>
          <button
            type="button"
            onClick={() => handleChoice("denied")}
            className="bg-transparent border border-gray-warm/30 hover:border-gray-warm text-gray-warm/80 hover:text-white px-3.5 py-2 rounded-3xs transition-colors cursor-pointer"
          >
            {dict.decline}
          </button>
        </div>
      </div>
    </aside>
  );
}
