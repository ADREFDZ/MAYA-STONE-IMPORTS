import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";

interface AboutHeroProps {
  dict: {
    title: string;
    subtitle: string;
  };
}

export default function AboutHero({ dict }: AboutHeroProps) {
  return (
    <section className="relative w-full h-[100svh] min-h-[520px] bg-black-neutral text-gray-warm overflow-hidden font-sans border-b border-gray-warm/15 select-none flex flex-col justify-between">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/estudio1.jpg"
          alt={dict.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-[0.85] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black-pure/90 via-black-pure/40 to-black-pure/60" />
      </div>

      <div className="editorial-container relative z-20 w-full h-full flex flex-col justify-between pt-28 sm:pt-36 pb-[calc(1.75rem+env(safe-area-inset-bottom))] sm:pb-12 pointer-events-none">
        <div className="h-4" />

        <div className="w-full text-center max-w-4xl sm:max-w-5xl mx-auto space-y-3 sm:space-y-4 pointer-events-auto">
          <h1 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 lg:text-maya-display text-gray-warm uppercase text-balance leading-tight">
            {dict.title}
          </h1>
        </div>

        <div className="w-full flex justify-start pointer-events-auto">
          <SectionLabel variant="minimal" theme="accent">
            {dict.subtitle}
          </SectionLabel>
        </div>
      </div>
    </section>
  );
}
