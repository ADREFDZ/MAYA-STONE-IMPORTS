"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type {
  InstagramPost,
  InstagramProfile,
  InstagramSlide,
} from "@/lib/instagram/feed";

export interface InstagramDictionary {
  section_label: string;
  title: string;
  bio: string;
  tab_posts: string;
  cta_follow: string;
  view_post: string;
  view_reel: string;
  view_post_ig: string;
  close: string;
  empty_caption: string;
  post_alt: string;
  load_more?: string;
  posts_label?: string;
  followers_label?: string;
  prev_slide?: string;
  next_slide?: string;
  official_label: string;
}

interface InstagramGridClientProps {
  posts: InstagramPost[];
  profile?: InstagramProfile | null;
  dict: InstagramDictionary;
}

function Avatar({ src, size }: { src?: string; size: string }) {
  return (
    <div
      className={`relative ${size} rounded-full overflow-hidden bg-black-neutral shrink-0`}
    >
      <Image
        src={src || "/icon.png"}
        alt=""
        fill
        unoptimized={!!src}
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}

const formatCount = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-MX", { notation: "compact" }).format(n)
    : null;

function slidesOf(post: InstagramPost): InstagramSlide[] {
  if (post.slides && post.slides.length > 0) return post.slides;
  return [
    {
      id: post.id,
      type: post.type === "VIDEO" ? "VIDEO" : "IMAGE",
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
    },
  ];
}

export default function InstagramGridClient({
  posts,
  profile,
  dict,
}: InstagramGridClientProps) {
  const username = profile?.username || "gpomaya";
  const postsCount = formatCount(profile?.mediaCount);
  const followersCount = formatCount(profile?.followers);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const openPost = (post: InstagramPost) => {
    setSlideIdx(0);
    setIsCaptionExpanded(false);
    setSelectedPost(post);
  };

  // =========================================================================
  // BLOQUEO DE SCROLL EN MÓVIL Y DESKTOP (ELIMINA EL SCROLL TRASERO EN SAFARI/CHROME)
  // =========================================================================
  useEffect(() => {
    if (selectedPost) {
      const currentScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = Math.abs(parseInt(document.body.style.top || "0", 10));
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo({ top: scrollY, behavior: "instant" });
      }
    }

    return () => {
      const scrollY = Math.abs(parseInt(document.body.style.top || "0", 10));
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo({ top: scrollY, behavior: "instant" });
      }
    };
  }, [selectedPost]);

  const slides = selectedPost ? slidesOf(selectedPost) : [];
  const currentSlide = slides[slideIdx];
  const hasMultipleSlides = slides.length > 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPost(null);
      if (!hasMultipleSlides) return;
      if (e.key === "ArrowRight")
        setSlideIdx((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setSlideIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleSlides, slides.length]);

  const isModalVideo =
    currentSlide?.type === "VIDEO" && !!currentSlide.videoUrl;

  return (
    <div className="w-full max-w-[820px] mx-auto space-y-4 sm:space-y-6">
      {/* 1. TARJETA DE PERFIL OFICIAL */}
      <div className="flex flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-surface border border-border-light rounded-2xs shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative p-[1.5px] rounded-full bg-gradient-to-tr from-accent via-[#c4975f] to-accent-soft shrink-0">
            <div className="rounded-full border border-surface">
              <Avatar
                src={profile?.pictureUrl}
                size="h-9 w-9 sm:h-11 sm:w-11"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-maya-small sm:text-maya-body font-semibold text-black-neutral tracking-tight truncate">
                {username}
              </span>
              <svg
                className="w-3.5 h-3.5 text-accent-ink fill-current shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <p className="font-sans text-[11px] sm:text-maya-small text-black-neutral/70 font-light leading-tight truncate">
              {dict.bio}
            </p>
            {(postsCount || followersCount) && (
              <p className="font-mono text-[10px] sm:text-maya-label uppercase tracking-data text-black-neutral/60">
                {postsCount && (
                  <span>
                    {postsCount} {dict.posts_label}
                  </span>
                )}
                {postsCount && followersCount && (
                  <span className="mx-1">·</span>
                )}
                {followersCount && (
                  <span>
                    {followersCount} {dict.followers_label}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        <a
          href={`https://www.instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-black-neutral text-gray-warm hover:bg-black-neutral/85 transition-all font-sans text-[10px] sm:text-maya-label uppercase tracking-nav font-medium rounded-2xs shrink-0 self-center"
        >
          <span>{dict.cta_follow}</span>
          <span className="text-accent-ink text-xs">↗</span>
        </a>
      </div>

      {/* 2. PESTAÑA CENTRAL */}
      <div className="flex justify-center border-t border-black-neutral/15 font-mono text-[10px] sm:text-maya-label tracking-nav uppercase text-black-neutral/50">
        <div className="flex items-center gap-1.5 pt-2 border-t-2 border-black-neutral text-black-neutral font-medium">
          <svg
            className="w-2.5 h-2.5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z" />
          </svg>
          <span>{dict.tab_posts}</span>
        </div>
      </div>

      {/* 3. REJILLA RESPONSIVE */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((post) => {
          const isVideo = post.type === "VIDEO";
          const isCarousel = post.type === "CAROUSEL_ALBUM";
          return (
            <button
              type="button"
              key={post.id}
              onClick={() => openPost(post)}
              aria-label={isVideo ? dict.view_reel : dict.view_post}
              className="group relative aspect-[3/4] w-full overflow-hidden bg-black-neutral/5 cursor-pointer block rounded-3xs sm:rounded-2xs text-left"
            >
              <Image
                src={post.imageUrl}
                alt={post.caption?.slice(0, 120) || dict.post_alt}
                fill
                unoptimized
                sizes="(max-width: 640px) 33vw, 270px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
              {(isVideo || isCarousel) && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 text-white drop-shadow-md pointer-events-none">
                  {isVideo ? (
                    <svg
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                    </svg>
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-black-pure/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white z-20">
                <span className="hidden sm:inline font-mono text-maya-label uppercase tracking-nav">
                  {isVideo ? dict.view_reel : dict.view_post}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4. VER MÁS */}
      <div className="flex justify-center pt-1">
        <a
          href={`https://www.instagram.com/${username}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 border border-black-neutral/30 hover:border-black-neutral hover:bg-black-neutral/5 transition-colors font-sans text-maya-small uppercase tracking-nav text-black-neutral"
        >
          <span>{dict.load_more}</span>
          <span className="text-accent-ink">↗</span>
        </a>
      </div>

      {/* =========================================================
          5. MODAL LIGHTBOX EDITORIAL (CON AISLAMIENTO DE SCROLL)
          ========================================================= */}
      {selectedPost && currentSlide && (
        <div
          onClick={() => setSelectedPost(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black-pure/95 backdrop-blur-xl p-0 sm:p-4 md:p-6 overscroll-contain select-none"
          role="dialog"
          aria-modal="true"
          style={{ touchAction: "none" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: "auto" }}
            className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-black-neutral text-gray-warm sm:border sm:border-white/15 overflow-hidden flex flex-col md:flex-row sm:rounded-2xs shadow-2xl overscroll-contain"
          >
            {/* =========================================================
                A. BARRA SUPERIOR MÓVIL (HEADER DEDICADO)
                ========================================================= */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black-pure/80 backdrop-blur-md shrink-0 z-30">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={profile?.pictureUrl} size="h-7 w-7" />
                <span className="font-mono text-maya-small font-semibold text-gray-warm truncate">
                  {username}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedPost.permalink && (
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-warm/75 hover:text-white font-mono text-[11px] uppercase tracking-data"
                  >
                    IG ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  aria-label={dict.close}
                  className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white font-mono text-xs cursor-pointer active:scale-90"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BOTÓN CERRAR EN DESKTOP */}
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="hidden md:flex absolute top-3 right-3 z-30 text-gray-warm/70 hover:text-white font-mono text-maya-label tracking-data uppercase bg-black-pure/80 px-2.5 py-1 border border-white/20 cursor-pointer items-center gap-1.5"
            >
              <span>{dict.close}</span>
              <span className="text-xs">✕</span>
            </button>

            {/* =========================================================
                B. MULTIMEDIA (FOTO O VIDEO)
                ========================================================= */}
            <div className="relative flex-1 md:w-3/5 bg-black-pure flex items-center justify-center min-h-0 overflow-hidden">
              {isModalVideo ? (
                <video
                  key={currentSlide.id}
                  src={currentSlide.videoUrl}
                  poster={currentSlide.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full max-h-[70vh] md:max-h-[85vh] object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                  <Image
                    key={currentSlide.id}
                    src={currentSlide.imageUrl}
                    alt={selectedPost.caption?.slice(0, 120) || dict.post_alt}
                    fill
                    unoptimized
                    priority
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-contain"
                  />
                </div>
              )}

              {/* CONTROLES DEL CARRUSEL */}
              {hasMultipleSlides && (
                <>
                  <button
                    type="button"
                    onClick={() => setSlideIdx((i) => Math.max(i - 1, 0))}
                    disabled={slideIdx === 0}
                    aria-label={dict.prev_slide ?? "Anterior"}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full flex items-center justify-center bg-black-pure/75 text-gray-warm border border-white/20 disabled:opacity-0 transition-opacity cursor-pointer text-sm shadow-md"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIdx((i) => Math.min(i + 1, slides.length - 1))
                    }
                    disabled={slideIdx === slides.length - 1}
                    aria-label={dict.next_slide ?? "Siguiente"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full flex items-center justify-center bg-black-pure/75 text-gray-warm border border-white/20 disabled:opacity-0 transition-opacity cursor-pointer text-sm shadow-md"
                  >
                    →
                  </button>
                  <div className="absolute bottom-2.5 inset-x-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                    {slides.map((s, i) => (
                      <span
                        key={s.id}
                        className={`h-1.5 rounded-full transition-all ${
                          i === slideIdx
                            ? "w-4 bg-accent"
                            : "w-1.5 bg-gray-warm/35"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* =========================================================
                C. DOSSIER EDITORIAL (TEXTO Y PIE DE ACCIÓN)
                ========================================================= */}
            <div className="shrink-0 md:w-2/5 p-4 sm:p-6 md:p-7 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 bg-black-neutral max-h-[38vh] md:max-h-none overflow-y-auto no-scrollbar overscroll-contain">
              <div className="space-y-3">
                {/* Perfil en desktop */}
                <div className="hidden md:flex items-center gap-2.5 border-b border-white/10 pb-3">
                  <Avatar src={profile?.pictureUrl} size="h-7 w-7" />
                  <div className="min-w-0">
                    <span className="font-mono text-maya-small font-semibold text-gray-warm block leading-none truncate">
                      {username}
                    </span>
                    <span className="font-mono text-[9px] text-gray-warm/50 uppercase tracking-widest">
                      {dict.official_label}
                    </span>
                  </div>
                </div>

                {/* Leyenda del Post */}
                <div className="space-y-1.5">
                  <p
                    className={`font-sans text-maya-small text-gray-warm/85 font-light leading-relaxed whitespace-pre-line ${
                      !isCaptionExpanded
                        ? "line-clamp-3 md:line-clamp-none"
                        : ""
                    }`}
                  >
                    {selectedPost.caption || dict.empty_caption}
                  </p>

                  {/* Toggle "más" en móvil si el texto es largo */}
                  {selectedPost.caption &&
                    selectedPost.caption.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                        className="md:hidden font-mono text-[10px] text-accent-ink uppercase tracking-wider block pt-0.5"
                      >
                        {isCaptionExpanded ? "Menos" : "Más"}
                      </button>
                    )}
                </div>
              </div>

              {/* Botón directo a Instagram */}
              {selectedPost.permalink && (
                <div className="pt-3 border-t border-white/10 mt-3">
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full bg-gray-warm text-black-neutral hover:bg-white font-mono text-maya-label tracking-data uppercase py-2.5 px-4 transition-colors rounded-3xs shadow-sm"
                  >
                    <span>
                      {selectedPost.type === "VIDEO"
                        ? dict.view_reel
                        : dict.view_post_ig}
                    </span>
                    <span className="text-accent-ink text-sm">↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
