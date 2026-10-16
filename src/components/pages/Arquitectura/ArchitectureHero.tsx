import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";

interface ArchitectureHeroProps {
  dict: {
    badge: string;
    title: string;
    subtitle: string;
  };
  heroImage?: string;
}

export default function ArchitectureHero({
  dict,
  heroImage = "/images/Project.jpeg",
}: ArchitectureHeroProps) {
  return (
    <header className="relative w-full h-[100svh] min-h-[520px] bg-black-neutral text-gray-warm overflow-hidden font-sans border-b border-gray-warm/15 select-none flex flex-col justify-between">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={heroImage}
          alt={dict.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-[0.88] contrast-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black-pure/75 via-transparent to-black-pure/90" />
      </div>

      {/* CABECERA TOP */}
      <div className="relative z-20 editorial-container w-full pt-28 sm:pt-36 pointer-events-none">
        <div className="space-y-3.5 sm:space-y-4 max-w-3xl sm:max-w-4xl pointer-events-auto">
          {dict.badge && (
            <SectionLabel variant="minimal" theme="accent">
              {dict.badge}
            </SectionLabel>
          )}

          {dict.title && (
            <h1 className="font-sans font-light tracking-editorial text-maya-h1 sm:text-maya-display uppercase text-gray-warm text-balance">
              {dict.title}
            </h1>
          )}
        </div>
      </div>

      {/* SUBTÍTULO BOTTOM CON SAFE AREA */}
      {dict.subtitle && (
        <div className="relative z-20 editorial-container w-full pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-16 flex justify-start lg:justify-end pointer-events-none">
          <div className="max-w-md lg:max-w-lg border-l border-gray-warm/25 pl-4 sm:pl-6 pointer-events-auto">
            <p className="font-sans font-light text-maya-small sm:text-maya-body text-gray-warm/85 leading-relaxed">
              {dict.subtitle}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
