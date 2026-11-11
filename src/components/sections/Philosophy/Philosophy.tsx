import Image from "next/image";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface PhilosophyProps {
  lang?: string;
  dict: {
    section_label: string;
    title: string;
    description: string;
    cta_studio: string;
  };
}

export default function Philosophy({ dict, lang = "es" }: PhilosophyProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  return (
    <section className="relative w-full bg-background text-text-primary overflow-hidden border-t border-border-light maya-section font-sans">
      <div className="editorial-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* COLUMNA DE TEXTO */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-6">
            {dict.section_label && (
              <div>
                <SectionLabel variant="minimal" theme="accent">
                  {dict.section_label}
                </SectionLabel>
              </div>
            )}

            <h2 className="font-sans font-light tracking-editorial text-maya-h2 text-text-primary uppercase leading-tight">
              {dict.title}
            </h2>

            <p className="font-sans font-light text-maya-body text-text-secondary leading-relaxed">
              {dict.description}
            </p>

            <div className="pt-2">
              <Button
                href={`/${ROUTES.about[currentLocale]}`}
                variant="ghost"
                size="sm"
                icon={<span className="text-xs text-accent-ink">→</span>}
                iconPosition="right"
                className="text-maya-small tracking-nav uppercase text-text-primary hover:text-accent-ink"
              >
                {dict.cta_studio}
              </Button>
            </div>
          </div>

          {/* MOSAICO FOTOGRÁFICO */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 w-full max-w-[640px] lg:ml-auto items-stretch">
            {/* FOTOGRAFÍA PRINCIPAL */}
            <div className="sm:col-span-7 relative w-full aspect-4/3 sm:aspect-[4/5] rounded-2xs overflow-hidden border border-border-light shadow-2xs group bg-surface">
              <Image
                src="/images/Draw.jpg"
                alt={dict.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-104 pointer-events-none"
              />
              <div className="absolute inset-0 bg-black-pure/5 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />
            </div>

            {/* DUPLA LATERAL */}
            <div className="sm:col-span-5 flex flex-row sm:flex-col gap-4 sm:gap-5 justify-between">
              <div className="relative w-1/2 sm:w-full aspect-square rounded-2xs overflow-hidden border border-border-light shadow-2xs group bg-surface">
                <Image
                  src="/images/MayaPlanos2.jpg"
                  alt={dict.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                />
              </div>

              <div className="relative w-1/2 sm:w-full aspect-square rounded-2xs overflow-hidden border border-border-light shadow-2xs group bg-surface">
                <Image
                  src="/images/MacroRiva.jpg"
                  alt={dict.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
