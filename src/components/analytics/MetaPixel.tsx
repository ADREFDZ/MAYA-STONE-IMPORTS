"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface MetaPixelProps {
  pixelId?: string;
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    const checkStorage = () => {
      try {
        const raw = localStorage.getItem("maya_cookie_consent");
        if (!raw) return;

        // Formato nuevo con JSON
        if (raw.startsWith("{")) {
          const parsed = JSON.parse(raw);
          if (parsed.decision === "granted" && Date.now() < parsed.expiry) {
            setConsentGranted(true);
          }
        } else if (raw === "granted") {
          setConsentGranted(true);
        }
      } catch {
        // Fallback silencioso
      }
    };

    checkStorage();

    const handleConsentChange = (e: CustomEvent) => {
      setConsentGranted(e.detail === "granted");
    };

    window.addEventListener(
      "maya_consent_updated",
      handleConsentChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "maya_consent_updated",
        handleConsentChange as EventListener,
      );
    };
  }, []);

  if (!pixelId || !consentGranted) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.track='PageView';n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
        `,
      }}
    />
  );
}
