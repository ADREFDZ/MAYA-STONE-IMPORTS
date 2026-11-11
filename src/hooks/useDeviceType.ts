// src/hooks/useDeviceType.ts
"use client";

import { useSyncExternalStore } from "react";

export type DeviceCategory = "mobile" | "tablet" | "desktop";

export interface DeviceState {
  device: DeviceCategory;
  hasHover: boolean;
  isTouch: boolean;
  isLandscape: boolean;
}

/**
 * DETECCIÓN DE DISPOSITIVO (por capacidades, no por user-agent)
 * ---------------------------------------------------------------------------
 *  · desktop → puntero fino con hover real (mouse / trackpad, incluido iPad
 *              con trackpad).
 *  · tablet  → táctil y ≥ 768px de ancho.
 *  · mobile  → táctil y < 768px.
 *
 * Un solo "store" compartido para toda la página: escucha media queries
 * (no el evento resize), así no re-renderiza en cada píxel al redimensionar
 * y solo avisa a los componentes cuando la categoría realmente cambia.
 *
 * En servidor (SSR) se asume desktop. Para LAYOUT usa preferentemente las
 * variantes de Tailwind (`pointer-coarse:`, `pointer-fine:`, `md:`), que se
 * resuelven por CSS sin parpadeo; este hook es para COMPORTAMIENTO
 * (tap vs hover, abrir directo, etc.).
 */

const QUERIES = {
  hover: "(hover: hover) and (pointer: fine)",
  coarse: "(pointer: coarse)",
  landscape: "(orientation: landscape)",
  wide: "(min-width: 768px)",
} as const;

const SERVER_STATE: DeviceState = {
  device: "desktop",
  hasHover: true,
  isTouch: false,
  isLandscape: true,
};

let cachedKey = "";
let cachedState: DeviceState = SERVER_STATE;

function readState(): DeviceState {
  const hasHover = window.matchMedia(QUERIES.hover).matches;
  const isTouch = window.matchMedia(QUERIES.coarse).matches;
  const isLandscape = window.matchMedia(QUERIES.landscape).matches;
  const wide = window.matchMedia(QUERIES.wide).matches;

  const device: DeviceCategory =
    hasHover && !isTouch ? "desktop" : wide ? "tablet" : "mobile";

  // Misma referencia mientras nada cambie (requisito de useSyncExternalStore)
  const key = `${device}|${hasHover}|${isTouch}|${isLandscape}`;
  if (key !== cachedKey) {
    cachedKey = key;
    cachedState = { device, hasHover, isTouch, isLandscape };
  }
  return cachedState;
}

function subscribe(onChange: () => void) {
  const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
  lists.forEach((mq) => mq.addEventListener("change", onChange));
  return () => lists.forEach((mq) => mq.removeEventListener("change", onChange));
}

export function useDeviceType(): DeviceState {
  return useSyncExternalStore(subscribe, readState, () => SERVER_STATE);
}
