import SectionLabel from "@/components/ui/SectionLabel";

interface AboutManifiestoProps {
  dict: {
    label1: string;
    p1: string;
    label2: string;
    p2: string;
  };
  videoUrl?: string;
}

export default function AboutManifiesto({
  dict,
  videoUrl = "/videos/MAYA_Hero2-720.mp4",
}: AboutManifiestoProps) {
  return (
    <section className="w-full bg-black-neutral text-gray-warm maya-section overflow-hidden border-b border-gray-warm/15 font-sans">
      <div className="editorial-container">
        {videoUrl ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            <div className="lg:col-span-6 w-full flex justify-center lg:justify-start">
              <div className="relative w-full aspect-16/10 overflow-hidden rounded-2xs bg-black-pure shadow-2xl border border-gray-warm/15">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  key={videoUrl}
                  className="w-full h-full object-cover block border-0 outline-none"
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 sm:space-y-8">
              <div className="space-y-2.5">
                <SectionLabel variant="minimal" theme="accent">
                  {dict.label1}
                </SectionLabel>
                <p className="font-sans font-light text-maya-body sm:text-maya-body-lg leading-relaxed text-gray-warm/85 max-w-xl">
                  {dict.p1}
                </p>
              </div>

              <div className="w-8 h-px bg-gray-warm/20" />

              <div className="space-y-2.5">
                <SectionLabel variant="minimal" theme="accent">
                  {dict.label2}
                </SectionLabel>
                <p className="font-sans font-light text-maya-body sm:text-maya-body-lg leading-relaxed text-gray-warm/85 max-w-xl">
                  {dict.p2}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            <div className="space-y-3">
              <SectionLabel variant="minimal" theme="accent">
                {dict.label1}
              </SectionLabel>
              <p className="font-sans font-light text-maya-body sm:text-maya-body-lg leading-relaxed text-gray-warm/85 max-w-xl">
                {dict.p1}
              </p>
            </div>

            <div className="space-y-3">
              <SectionLabel variant="minimal" theme="accent">
                {dict.label2}
              </SectionLabel>
              <p className="font-sans font-light text-maya-body sm:text-maya-body-lg leading-relaxed text-gray-warm/85 max-w-xl">
                {dict.p2}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
