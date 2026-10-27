import { useEffect } from "react";
import { explorerHref } from "../lib/deepLinks";
import type { Locale } from "../lib/types";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

interface Props {
  title: string;
  year: number;
  entityId: string;
  html: string;
  locale: Locale;
}

function Inner({ title, year, entityId, html, locale: storyLocale }: Props) {
  const { t, setLocale } = useLocale();
  useEffect(() => {
    setLocale(storyLocale);
  }, [setLocale, storyLocale]);

  return (
    <div className="min-h-screen">
      <SiteHeader current="stories" />
      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{year}</p>
        <h1 className="mt-3 text-3xl text-white md:text-4xl">{title}</h1>
        <div
          className="mt-8 space-y-4 text-sm leading-7 text-fog/90"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <a
          href={explorerHref({ entity: entityId, year, lang: storyLocale })}
          className="mt-8 inline-block text-sm text-accent"
        >
          {t.openOnMap}
        </a>
      </main>
    </div>
  );
}

export default function StoryPage(props: Props) {
  return (
    <LocaleProvider>
      <Inner {...props} />
    </LocaleProvider>
  );
}
