import SectionLabel from "@/components/ui/SectionLabel";
import { getInstagramPage, getInstagramProfile } from "@/lib/instagram/feed";
import InstagramGridClient, {
  type InstagramDictionary,
} from "./InstagramGridClient";

interface InstagramFeedProps {
  dict: InstagramDictionary;
}

export default async function InstagramFeed({ dict }: InstagramFeedProps) {
  const [{ posts }, profile] = await Promise.all([
    getInstagramPage(),
    getInstagramProfile(),
  ]);
  const username = profile?.username || "gpomaya";
  if (posts.length === 0) return null;

  return (
    <section className="relative w-full bg-gray-cool text-black-neutral overflow-hidden maya-section border-t border-border-light">
      <div className="editorial-container space-y-6 sm:space-y-8 md:space-y-10">
        {/* CABECERA EDITORIAL */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 border-b border-black-neutral/15 pb-3.5 sm:pb-4">
          <div className="space-y-1 max-w-2xl">
            <SectionLabel variant="minimal" theme="accent">
              {dict.section_label}
            </SectionLabel>
            <h2 className="font-sans font-light tracking-editorial text-maya-h2 text-black-neutral uppercase">
              {dict.title}
            </h2>
          </div>

          <a
            href={`https://www.instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-maya-small tracking-data uppercase font-medium text-black-neutral/70 hover:text-black-neutral transition-colors border-b border-black-neutral/30 hover:border-black-neutral pb-0.5 self-start md:self-auto flex items-center gap-1.5"
          >
            <span>@{username}</span>
            <span className="text-accent-ink">↗</span>
          </a>
        </div>

        {/* FEED CLIENT CON PROPORCIONES REDUCIDAS UN 20% */}
        <InstagramGridClient posts={posts} profile={profile} dict={dict} />
      </div>
    </section>
  );
}
