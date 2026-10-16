"use client";

import { useDragScroll } from "@/hooks/useDragScroll";
import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";

interface Pilar {
  title: string;
  desc: string;
}

interface AboutPilaresProps {
  dict: {
    label: string;
    items: Pilar[];
  };
}

export default function AboutPilares({ dict }: AboutPilaresProps) {
  const { ref: sliderRef, handlers: dragScroll } = useDragScroll<HTMLDivElement>();

  return (
    <section className="w-full bg-surface text-black-neutral maya-section overflow-hidden font-sans border-b border-border-light">
      <div className="editorial-container space-y-8 sm:space-y-12">
        <div className="border-b border-border-light pb-4">
          <SectionLabel variant="minimal" theme="accent">
            {dict.label}
          </SectionLabel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-stretch">
          {/* IMAGEN DE PILARES */}
          <div className="lg:col-span-5 relative w-full aspect-square sm:aspect-4/3 lg:aspect-auto min-h-[260px] sm:min-h-[360px] lg:min-h-full overflow-hidden rounded-2xs lg:rounded-r-none border border-border-light lg:border-r-0 shadow-xs group">
            <Image
              src="/images/estudio-pilares.jpg"
              alt={dict.label}
              fill
              className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          {/* CUADRÍCULA DE PILARES: CARRUSEL 1 A 1 EN MÓVIL / RETÍCULA 2X2 EN TABLET Y DESKTOP */}
          <div
            ref={sliderRef}
            {...dragScroll}
            className="lg:col-span-7 flex sm:grid sm:grid-cols-2 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none gap-0 border-t border-l border-border-light rounded-2xs lg:rounded-l-none overflow-hidden bg-background cursor-grab active:cursor-grabbing select-none no-scrollbar"
          >
            {dict.items.map((pilar, index) => {
              const formattedIndex = String(index + 1).padStart(2, "0");

              return (
                <article
                  key={index}
                  className="group flex flex-col justify-start w-full shrink-0 snap-start sm:w-auto sm:shrink sm:snap-none p-6 sm:p-8 lg:p-10 border-r border-b border-border-light transition-colors duration-500 hover:bg-surface/50 min-h-[220px] sm:min-h-[260px]"
                >
                  <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                    <span className="font-mono text-maya-label tracking-data text-accent-ink font-semibold">
                      {formattedIndex}
                    </span>
                    <span className="h-px flex-1 bg-border-light group-hover:bg-accent transition-colors duration-500" />
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="font-sans font-medium tracking-wide text-maya-h4 uppercase text-black-neutral">
                      {pilar.title}
                    </h3>
                    <p className="font-sans font-normal text-maya-small text-text-secondary leading-relaxed">
                      {pilar.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
