"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/analytics/attribution";

/** Guarda el origen de campaña (UTM / fbclid) en cada página que lo traiga. */
export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    captureAttribution();
  }, [pathname, searchParams]);
  return null;
}
