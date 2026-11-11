import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface AboutCTAProps {
  lang: string;
  dict: {
    label: string;
    title: string;
    button: string;
    button_secondary: string;
  };
}

export default function AboutCTA({ lang, dict }: AboutCTAProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  return (
    <section className="w-full bg-background maya-section overflow-hidden border-t border-border-light font-sans">
      <div className="editorial-container flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
        <SectionLabel variant="minimal" theme="accent" align="center">
          {dict.label}
        </SectionLabel>

        <h2 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 uppercase text-black-neutral max-w-3xl leading-tight">
          {dict.title}
        </h2>

        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Button
            href={`/${ROUTES.coleccion[currentLocale]}`}
            variant="dark"
            size="md"
            icon={<span>→</span>}
            iconPosition="right"
          >
            {dict.button}
          </Button>
          <Button
            href={`/${ROUTES.contacto[currentLocale]}?reason=quote`}
            variant="outline-dark"
            size="md"
          >
            {dict.button_secondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
