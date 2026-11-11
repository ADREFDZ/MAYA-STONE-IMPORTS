"use client";

import { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  src: string;
  /** Versión ligera opcional para celular (≤ 768px) */
  mobileSrc?: string;
  poster?: string;
  className?: string;
  /** Margen para empezar a cargar antes de que entre en pantalla */
  rootMargin?: string;
  /** Avisa el tamaño real del video (para respetar su proporción sin recortes) */
  onDimensions?: (width: number, height: number) => void;
}

/**
 * VIDEO DIFERIDO EN LOOP (silenciado, decorativo)
 * ---------------------------------------------------------------------------
 * · No descarga nada hasta que el video está cerca de la pantalla.
 * · Se pausa al salir de pantalla (ahorra batería/datos) y reanuda al volver.
 * · Respeta "reducir movimiento": muestra el poster/primer cuadro sin reproducir.
 * Los MP4 deben tener "faststart" (el compresor del admin ya lo aplica) para
 * empezar a reproducirse sin esperar la descarga completa.
 */
export default function LazyVideo({
  src,
  mobileSrc,
  poster,
  className = "",
  rootMargin = "300px 0px",
  onDimensions,
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const visibleRef = useRef(false);
  const [near, setNear] = useState(false);

  const canPlay = () =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setNear(true);
          if (el.currentSrc && canPlay()) el.play().catch(() => {});
        } else if (!el.paused) {
          el.pause();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  // Al insertar las <source> hay que pedir al navegador que las cargue
  useEffect(() => {
    const el = ref.current;
    if (!near || !el) return;
    el.load();
    if (visibleRef.current && canPlay()) el.play().catch(() => {});
  }, [near, src, mobileSrc]);

  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      preload={near ? "auto" : "none"}
      poster={poster}
      aria-hidden="true"
      className={className}
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (onDimensions && v.videoWidth && v.videoHeight) {
          onDimensions(v.videoWidth, v.videoHeight);
        }
      }}
    >
      {near && mobileSrc && (
        <source src={mobileSrc} type="video/mp4" media="(max-width: 768px)" />
      )}
      {near && <source src={src} type="video/mp4" />}
    </video>
  );
}
