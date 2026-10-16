import type { Metadata } from "next";
import SectionLabel from "@/components/ui/SectionLabel";
import { getDictionary } from "@/app/dictionaries";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import BackButton from "@/components/ui/BackButton";
import FormattedLegalText from "@/components/ui/FormattedLegalText";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://www.gpomaya.com";

interface Props {
  params: Promise<{ lang: "es" | "en" }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isEs = lang === "es";
  const dict = await getDictionary(lang);
  const currentSlug = ROUTES.privacidad[lang];

  return {
    // Sin " | MAYA" al final para evitar duplicación
    title:
      dict.privacy_page?.title ||
      (isEs ? "Aviso de Privacidad" : "Privacy Policy"),
    description:
      dict.privacy_page?.sections?.[0]?.content || "Aviso de Privacidad MAYA",
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${ROUTES.privacidad.es}`,
        "en-US": `${SITE_URL}/${ROUTES.privacidad.en}`,
        "x-default": `${SITE_URL}/${ROUTES.privacidad.es}`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const dict = await getDictionary(currentLocale);
  const pDict = dict.privacy_page;
  const isEs = currentLocale === "es";

  const sections: Array<{
    title: string;
    content: string;
    bullets?: string[];
  }> = pDict?.sections || [];

  return (
    <main className="min-h-screen bg-background text-black-neutral pt-24 sm:pt-28 md:pt-36 pb-16 sm:pb-24 font-sans selection:bg-accent selection:text-white">
      <div className="editorial-container space-y-10 sm:space-y-14 max-w-4xl">
        <header className="border-b border-border-light pb-6 sm:pb-8 space-y-3">
          <SectionLabel variant="minimal" theme="accent">
            {pDict?.meta ||
              (isEs
                ? "CUMPLIMIENTO LEGAL & PRIVACIDAD"
                : "LEGAL COMPLIANCE & PRIVACY")}
          </SectionLabel>
          <h1 className="font-sans font-light tracking-editorial text-maya-h1 sm:text-maya-display uppercase text-black-neutral">
            {pDict?.title ||
              (isEs
                ? "Aviso de Privacidad Integral"
                : "Comprehensive Privacy Notice")}
          </h1>
          <p className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50">
            {pDict?.last_updated}
          </p>
        </header>

        <div className="space-y-8 text-maya-body font-light text-black-neutral/80 leading-relaxed">
          {sections.map((section, idx) => (
            <section key={idx} className="space-y-2.5">
              <h2 className="font-sans text-maya-h4 font-medium uppercase tracking-wide text-black-neutral">
                {section.title}
              </h2>
              <p className="text-maya-body font-light text-black-neutral/80 leading-relaxed">
                <FormattedLegalText
                  content={section.content}
                  lang={currentLocale}
                />
              </p>

              {section.bullets && Array.isArray(section.bullets) && (
                <ul className="list-disc pl-5 space-y-1.5 pt-1">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="border-t border-border-light pt-6">
          <BackButton
            label={
              pDict?.back_button ||
              (isEs
                ? "Volver a la página anterior"
                : "Go back to previous page")
            }
          />
        </div>
      </div>
    </main>
  );
}
