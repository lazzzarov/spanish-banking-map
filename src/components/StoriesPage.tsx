import { explorerHref } from "../lib/deepLinks";
import type { Locale } from "../lib/types";
import type { StoryLink } from "./Explorer";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

function Inner({ stories }: { stories: StoryLink[] }) {
  const { t, locale } = useLocale();
  const visible = stories.filter((story) => story.locale === locale);
  return (
    <div className="min-h-screen">
      <SiteHeader current="stories" />
      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navStories}</p>
        <h1 className="mt-3 text-3xl text-white md:text-4xl">{t.storiesTitle}</h1>
        <p className="mt-4 text-sm text-muted">{t.storiesLead}</p>
        <ul className="mt-8 space-y-4">
          {visible.map((story) => (
            <li key={story.slug} className="rounded-xl border border-line bg-panel px-5 py-4">
              <p className="font-mono text-[11px] text-accent">{story.year}</p>
              <a href={`/stories/${story.slug}`} className="mt-1 block text-lg text-fog hover:text-accent">
                {story.title}
              </a>
              <a
                href={explorerHref({ entity: story.entityId, year: story.year, lang: story.locale })}
                className="mt-3 inline-block text-sm text-accent"
              >
                {t.openOnMap}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default function StoriesPage({ stories }: { stories: StoryLink[] }) {
  return (
    <LocaleProvider>
      <Inner stories={stories} />
    </LocaleProvider>
  );
}

export type { Locale };
