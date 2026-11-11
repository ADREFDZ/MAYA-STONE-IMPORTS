import type { Metadata } from "next";
import SectionLabel from "@/components/ui/SectionLabel";
import { getDictionary } from "@/app/dictionaries";
import { ROUTES, type Locale } from "@/lib/i18n/routes";
import CookieReopenButton from "./CookieReopenButton";
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
  const currentSlug = ROUTES.cookies[lang];
  const dict = await getDictionary(lang);

  return {
    // Sin " | MAYA" al final para evitar duplicación
    title:
      dict.cookies_page?.title,
    description: dict.seo.cookies.description,
    alternates: {
      canonical: `${SITE_URL}/${currentSlug}`,
      languages: {
        "es-MX": `${SITE_URL}/${ROUTES.cookies.es}`,
        "en-US": `${SITE_URL}/${ROUTES.cookies.en}`,
        "x-default": `${SITE_URL}/${ROUTES.cookies.es}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function CookiesPage({ params }: Props) {
  const { lang } = await params;
  const currentLocale: Locale = lang === "en" ? "en" : "es";
  const dict = await getDictionary(currentLocale);
  const cDict = dict.cookies_page;

  const sections: Array<{ title: string; content: string }> =
    cDict?.sections || [];

  return (
    <main className="min-h-screen bg-background text-black-neutral pt-24 sm:pt-28 md:pt-36 pb-16 sm:pb-24 font-sans selection:bg-accent selection:text-white">
      <div className="editorial-container space-y-10 sm:space-y-14 max-w-4xl">
        <header className="border-b border-border-light pb-6 sm:pb-8 space-y-3">
          <SectionLabel variant="minimal" theme="accent">
            {cDict?.meta}
          </SectionLabel>
          <h1 className="font-sans font-light tracking-editorial text-maya-h1 sm:text-maya-display uppercase text-black-neutral">
            {cDict?.title}
          </h1>
          <p className="font-mono text-maya-label uppercase tracking-data text-black-neutral/50">
            {cDict?.last_updated}
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
            </section>
          ))}

          <div className="p-6 bg-surface border border-border-light rounded-2xs space-y-3">
            <h3 className="font-sans text-maya-small font-medium uppercase tracking-wider text-black-neutral">
              {cDict.settings_title}
            </h3>
            <p className="text-maya-small text-black-neutral/70">
              {cDict.settings_text}
            </p>
            <CookieReopenButton
              label={cDict.settings_button}
            />
          </div>
        </div>

        <div className="border-t border-border-light pt-6">
          <BackButton
            label={
              cDict?.back_button
            }
          />
        </div>
      </div>
    </main>
  );
}
