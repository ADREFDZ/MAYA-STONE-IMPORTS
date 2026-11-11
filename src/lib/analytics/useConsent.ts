"use client";

import { useEffect, useState } from "react";

/** true si la persona aceptó cookies de analítica/marketing (banner MAYA). */
export function useAnalyticsConsent(): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("maya_cookie_consent");
        if (!raw) return false;
        if (raw.startsWith("{")) {
          const p = JSON.parse(raw);
          return p.decision === "granted" && Date.now() < p.expiry;
        }
        return raw === "granted";
      } catch {
        return false;
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGranted(read());
    const onChange = (e: Event) =>
      setGranted((e as CustomEvent).detail === "granted");
    window.addEventListener("maya_consent_updated", onChange);
    return () => window.removeEventListener("maya_consent_updated", onChange);
  }, []);

  return granted;
}
