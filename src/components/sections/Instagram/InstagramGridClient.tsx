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
  cta_tag?: string;
  cta_title?: string;
}

interface InstagramGridClientProps {
  posts: InstagramPost[];
  profile?: InstagramProfile | null;
  dict: InstagramDictionary;
}

/** Foto de perfil real de Instagram; si no hay, el ícono de MAYA. */
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

/** Slides que se muestran en el modal (carrusel = varios, resto = uno). */
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
  const scrollYRef = useRef<number>(0);

  const openPost = (post: InstagramPost) => {
    setSlideIdx(0);
    setSelectedPost(post);
  };

  // Bloquear scroll del fondo mientras el modal está abierto
  useEffect(() => {
    if (selectedPost) {
      scrollYRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (scrollYRef.current > 0) {
        window.scrollTo({
          top: scrollYRef.current,
          behavior: "instant" as ScrollBehavior,
        });
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPost]);

  const slides = selectedPost ? slidesOf(selectedPost) : [];
  const currentSlide = slides[slideIdx];
  const hasMultipleSlides = slides.length > 1;

  // Teclado: Esc cierra, flechas cambian de slide
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

  const isModalVideo = currentSlide?.type === "VIDEO" && !!currentSlide.videoUrl;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 sm:space-y-8">
      {/* CABECERA PERFIL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5 p-3.5 sm:p-5 bg-surface border border-border-light rounded-2xs shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-accent via-[#c4975f] to-accent-soft shrink-0">
            <div className="rounded-full border-2 border-surface">
              <Avatar src={profile?.pictureUrl} size="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
          </div>

          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-maya-body font-semibold text-black-neutral tracking-tight">
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

            <p className="font-sans text-maya-small text-black-neutral/70 font-light leading-snug">
              {dict.bio}
            </p>
            {(postsCount || followersCount) && (
              <p className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                {postsCount && (
                  <span>
                    {postsCount} {dict.posts_label}
                  </span>
                )}
                {postsCount && followersCount && <span className="mx-1.5">·</span>}
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
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-black-neutral text-gray-warm hover:bg-black-neutral/85 transition-all font-sans text-maya-label uppercase tracking-nav font-medium rounded-2xs self-start sm:self-center shrink-0"
        >
          <span>{dict.cta_follow}</span>
          <span className="text-accent-ink">↗</span>
        </a>
      </div>

      {/* PESTAÑA */}
      <div className="flex justify-center border-t border-black-neutral/15 font-mono text-maya-label tracking-nav uppercase text-black-neutral/50">
        <div className="flex items-center gap-2 pt-2.5 border-t-2 border-black-neutral text-black-neutral font-medium">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zm-11 0h7v7H3v-7z" />
          </svg>
          <span>{dict.tab_posts}</span>
        </div>
      </div>

      {/* RETÍCULA — proporción 3:4 (1080×1440), como el perfil actual de Instagram */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
        {posts.map((post) => {
          const isVideo = post.type === "VIDEO";
          const isCarousel = post.type === "CAROUSEL_ALBUM";

          return (
            <button
              type="button"
              key={post.id}
              onClick={() => openPost(post)}
              aria-label={isVideo ? dict.view_reel : dict.view_post}
              className="group relative aspect-[3/4] w-full overflow-hidden bg-black-neutral/5 cursor-pointer block rounded-2xs text-left"
            >
              {/* Las URLs de Instagram son firmadas y caducan: se sirven tal cual */}
              <Image
                src={post.imageUrl}
                alt={post.caption?.slice(0, 120) || dict.post_alt}
                fill
                unoptimized
                sizes="(max-width: 1024px) 33vw, 340px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />

              {(isVideo || isCarousel) && (
                <div className="absolute top-2 right-2 z-10 text-white drop-shadow-md pointer-events-none">
                  {isVideo ? (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
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

      {/* VER MÁS → perfil de Instagram */}
      <div className="flex justify-center pt-1">
        <a
          href={`https://www.instagram.com/${username}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 border border-black-neutral/30 hover:border-black-neutral hover:bg-black-neutral/5 transition-colors font-sans text-maya-small uppercase tracking-nav text-black-neutral"
        >
          <span>{dict.load_more}</span>
          <span className="text-accent-ink">↗</span>
        </a>
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedPost && currentSlide && (
        <div
          onClick={() => setSelectedPost(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black-pure/90 backdrop-blur-md p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black-neutral text-gray-warm border border-gray-warm/20 overflow-hidden flex flex-col md:flex-row max-h-[90vh] rounded-2xs shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-30 text-gray-warm/70 hover:text-gray-warm font-mono text-maya-label tracking-data uppercase bg-black-pure/80 px-2.5 py-1 border border-gray-warm/20 cursor-pointer"
            >
              {dict.close}
            </button>

            {/* MEDIA */}
            <div className="md:w-3/5 bg-black-pure relative flex items-center justify-center min-h-[260px] md:min-h-[460px]">
              {isModalVideo ? (
                <video
                  key={currentSlide.id}
                  src={currentSlide.videoUrl}
                  poster={currentSlide.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full max-h-[60vh] md:max-h-[75vh] object-contain"
                />
              ) : (
                <Image
                  key={currentSlide.id}
                  src={currentSlide.imageUrl}
                  alt={selectedPost.caption?.slice(0, 120) || dict.post_alt}
                  fill
                  unoptimized
                  className="object-contain"
                />
              )}

              {hasMultipleSlides && (
                <>
                  <button
                    type="button"
                    onClick={() => setSlideIdx((i) => Math.max(i - 1, 0))}
                    disabled={slideIdx === 0}
                    aria-label={dict.prev_slide ?? "‹"}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center bg-black-pure/60 text-gray-warm border border-gray-warm/20 disabled:opacity-0 transition-opacity cursor-pointer"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIdx((i) => Math.min(i + 1, slides.length - 1))
                    }
                    disabled={slideIdx === slides.length - 1}
                    aria-label={dict.next_slide ?? "›"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center bg-black-pure/60 text-gray-warm border border-gray-warm/20 disabled:opacity-0 transition-opacity cursor-pointer"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
                    {slides.map((s, i) => (
                      <span
                        key={s.id}
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          i === slideIdx ? "bg-gray-warm" : "bg-gray-warm/30"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* TEXTO */}
            <div className="md:w-2/5 p-4 sm:p-6 md:p-8 flex flex-col justify-between space-y-4 overflow-y-auto">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 border-b border-gray-warm/15 pb-2.5">
                  <Avatar src={profile?.pictureUrl} size="h-6 w-6" />
                  <span className="font-mono text-maya-body font-semibold text-gray-warm">
                    {username}
                  </span>
                </div>

                <p className="font-sans text-maya-small text-gray-warm/80 leading-relaxed font-light whitespace-pre-line">
                  {selectedPost.caption || dict.empty_caption}
                </p>
              </div>

              {selectedPost.permalink && (
                <div className="pt-2.5 border-t border-gray-warm/15">
                  <a
                    href={selectedPost.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between w-full bg-gray-warm text-black-neutral font-sans text-maya-label tracking-data uppercase py-2 px-3.5 hover:bg-white transition-colors"
                  >
                    <span>
                      {selectedPost.type === "VIDEO"
                        ? dict.view_reel
                        : dict.view_post_ig}
                    </span>
                    <span className="text-accent-ink">↗</span>
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
