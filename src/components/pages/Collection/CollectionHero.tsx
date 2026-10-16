import SectionLabel from "@/components/ui/SectionLabel";

interface CollectionHeroProps {
  dict: any;
  videoUrl?: string;
}

export default function CollectionHero({
  dict,
  videoUrl = "/videos/MAYA_Hero.mp4",
}: CollectionHeroProps) {
  const t = dict?.collection_page;

  return (
    <section className="relative w-full h-[100svh] min-h-[520px] bg-black-neutral text-gray-warm overflow-hidden font-sans select-none flex flex-col justify-end">
      {/* VIDEO DE FONDO Y GRADIENTE */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-100 bg-black-neutral"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black-pure/90 via-black-pure/40 to-black-pure/55 pointer-events-none" />
      </div>

      {/* CONTENIDO EDITORIAL AJUSTADO AL ÁREA VISIBLE */}
      <div className="relative z-20 editorial-container w-full pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-16 lg:pb-20 pointer-events-none">
        <div className="max-w-4xl space-y-3.5 sm:space-y-6 pointer-events-auto">
          {t?.meta && (
            <SectionLabel variant="minimal" theme="accent">
              {t.meta}
            </SectionLabel>
          )}

          {t?.title && (
            <h1 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 lg:text-maya-display uppercase text-gray-warm text-balance">
              {t.title}
            </h1>
          )}

          {t?.subtitle && (
            <div className="border-l border-gray-warm/25 pl-3.5 sm:pl-6 max-w-2xl pt-0.5">
              <p className="font-sans font-light text-maya-small sm:text-maya-body lg:text-maya-body-lg text-gray-warm/80 leading-relaxed">
                {t.subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
