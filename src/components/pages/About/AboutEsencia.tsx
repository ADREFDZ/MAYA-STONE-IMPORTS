import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";

interface AboutEsenciaProps {
  dict: {
    label: string;
    block1: { text: string };
    block2: { text: string };
  };
}

export default function AboutEsencia({ dict }: AboutEsenciaProps) {
  return (
    <section className="w-full bg-background text-text-primary maya-section overflow-hidden border-b border-border-light font-sans">
      <div className="editorial-container space-y-8 sm:space-y-12">
        <div className="border-b border-border-light pb-4">
          <SectionLabel variant="minimal" theme="accent">
            {dict.label}
          </SectionLabel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            <p className="font-sans font-light text-maya-body sm:text-maya-body-lg leading-relaxed text-text-primary/90">
              {dict.block1.text}
            </p>

            <div className="w-8 h-px bg-border-strong/20" />

            <p className="font-sans font-light text-maya-body sm:text-maya-body-lg leading-relaxed text-text-primary/90">
              {dict.block2.text}
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
            <div className="relative w-full aspect-4/3 sm:aspect-3/2 overflow-hidden rounded-2xs group bg-black-neutral/5 border border-border-light shadow-xs">
              <Image
                src="/images/ArquitectureNature.jpg"
                alt={dict.label}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-103"
              />
            </div>

            <div className="relative w-full aspect-4/3 sm:aspect-3/2 overflow-hidden rounded-2xs group bg-black-neutral/5 border border-border-light shadow-xs">
              <Image
                src="/images/Proyecto.jpg"
                alt={dict.label}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-103"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
