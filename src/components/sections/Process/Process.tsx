import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface ProcessStep {
  num: string;
  title: string;
  desc: string;
}

interface ProcessProps {
  lang?: string;
  dict: {
    section_label: string;
    title: string;
    steps: ProcessStep[];
    cta: string;
  };
}

/**
 * COTIZAR CON MAYA ES SIMPLE (StoryBrand: el plan)
 * Tres pasos numerados (una columna en celular, tres en tablet/desktop) y un
 * solo CTA que abre el formulario de contacto con "cotización" seleccionado.
 */
export default function Process({ dict, lang = "es" }: ProcessProps) {
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  return (
    <section className="relative w-full bg-background text-black-neutral border-t border-border-light maya-section font-sans overflow-hidden">
      <div className="editorial-container space-y-8 sm:space-y-10 lg:space-y-12">
        {/* CABECERA */}
        <div className="max-w-3xl space-y-3.5 border-b border-border-light pb-6 sm:pb-8">
          {dict.section_label && (
            <SectionLabel variant="minimal" theme="accent">
              {dict.section_label}
            </SectionLabel>
          )}
          <h2 className="font-sans font-light tracking-editorial text-maya-h2 uppercase text-black-neutral leading-tight">
            {dict.title}
          </h2>
        </div>

        {/* PASOS */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {dict.steps.map((step) => (
            <li
              key={step.num}
              className="group flex flex-col bg-surface border border-border-light rounded-2xs p-6 sm:p-7 shadow-2xs transition-colors duration-500 hover:border-accent"
            >
              <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                <span className="font-mono text-maya-label tracking-data text-accent-ink font-semibold">
                  {step.num}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-border-light group-hover:bg-accent transition-colors duration-500"
                />
              </div>
              <h3 className="font-sans font-medium tracking-wide text-maya-h4 uppercase text-black-neutral">
                {step.title}
              </h3>
              <p className="mt-2 sm:mt-3 font-sans font-light text-maya-small sm:text-maya-body text-black-neutral/75 leading-relaxed">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <div className="flex justify-center md:justify-start">
          <Button
            href={`/${ROUTES.contacto[currentLocale]}?reason=quote`}
            variant="dark"
            size="md"
            icon={<span className="text-xs text-accent-ink">→</span>}
            iconPosition="right"
          >
            {dict.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
