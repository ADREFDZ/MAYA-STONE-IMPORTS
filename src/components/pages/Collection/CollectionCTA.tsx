import Button from "@/components/ui/Button";
import { ROUTES, type Locale } from "@/lib/i18n/routes";

interface CollectionCTAProps {
  dict?: any;
  lang?: string;
}

export default function CollectionCTA({
  dict,
  lang = "es",
}: CollectionCTAProps) {
  const cta = dict?.collection_page?.cta;
  const currentLocale: Locale = lang === "en" ? "en" : "es";

  return (
    <section className="bg-gray-warm text-black-neutral maya-section border-t border-border-light font-sans selection:bg-accent selection:text-white overflow-hidden">
      <div className="editorial-container text-center flex flex-col items-center">
        <span className="font-mono text-maya-label uppercase tracking-data text-accent-ink font-medium mb-2.5 sm:mb-3">
          {cta?.label}
        </span>

        <h2 className="font-sans font-light tracking-editorial text-maya-h2 sm:text-maya-h1 uppercase text-black-neutral max-w-3xl">
          {cta?.title}
        </h2>

        <p className="mt-3 sm:mt-4 text-black-neutral/75 font-light text-maya-body sm:text-maya-body-lg max-w-xl mx-auto leading-relaxed">
          {cta?.description}
        </p>

        <div className="mt-6 sm:mt-8">
          <Button
            href={`/${ROUTES.contacto[currentLocale]}?reason=consulting`}
            variant="dark"
            size="md"
            icon={<span>→</span>}
            iconPosition="right"
          >
            {cta?.button}
          </Button>
        </div>
      </div>
    </section>
  );
}
