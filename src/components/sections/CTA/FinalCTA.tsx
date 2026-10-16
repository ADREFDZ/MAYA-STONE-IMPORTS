import Image from "next/image";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface FinalCTADict {
  title: string;
  description: string;
  cta_primary: string;
  cta_secondary: string;
  availability?: string;
}

interface FinalCTAProps {
  lang?: string;
  dict: FinalCTADict;
}

export default function FinalCTA({ lang = "es", dict }: FinalCTAProps) {
  if (!dict) return null;
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  return (
    <section className="relative w-full bg-gray-cool text-black-neutral maya-section lg:py-0 lg:min-h-screen lg:h-screen flex flex-col justify-center items-center overflow-hidden border-t border-border-light">
      {/* IMAGEN DE FONDO */}
      <Image
        src="/images/Textura2.jpg"
        alt="Textura MAYA"
        fill
        sizes="100vw"
        priority={false}
        className="object-cover object-center opacity-30 mix-blend-multiply select-none pointer-events-none"
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0 bg-gray-cool/85 backdrop-blur-[1px] z-10 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-15 bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* CONTENIDO */}
      <div className="editorial-container relative z-20 flex flex-col items-center justify-center text-center my-auto w-full">
        <div className="max-w-xl sm:max-w-2xl xl:max-w-3xl mx-auto space-y-4 sm:space-y-6 xl:space-y-8">
          <h2 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 text-black-neutral uppercase">
            {dict.title}
          </h2>

          <p className="font-sans text-maya-body sm:text-maya-body-lg text-black-neutral/75 font-light leading-relaxed max-w-lg xl:max-w-xl mx-auto">
            {dict.description}
          </p>

          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
            <Button
              href={`/${ROUTES.contacto[currentLocale]}?reason=quote`}
              variant="dark"
              size="md"
              icon={<span className="text-xs">→</span>}
              iconPosition="right"
              className="w-full sm:w-auto"
            >
              {dict.cta_primary}
            </Button>

            <Button
              href={`/${ROUTES.contacto[currentLocale]}?reason=samples`}
              variant="outline-dark"
              size="md"
              className="w-full sm:w-auto"
            >
              {dict.cta_secondary}
            </Button>
          </div>

          {dict.availability && (
            <div className="pt-4 sm:pt-6 border-t border-black-neutral/15 w-full max-w-xs mx-auto flex items-center justify-center">
              <span className="font-mono text-maya-label uppercase tracking-data text-black-neutral/60">
                {dict.availability}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
