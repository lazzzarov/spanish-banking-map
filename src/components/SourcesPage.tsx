import type { SourceRecord } from "../lib/types";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

function Inner({ sources }: { sources: SourceRecord[] }) {
  const { t, locale } = useLocale();
  return (
    <div className="min-h-screen">
      <SiteHeader current="sources" />
      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.navSources}</p>
        <h1 className="mt-3 text-3xl text-white md:text-4xl">{t.sourcesTitle}</h1>
        <p className="mt-4 text-sm text-muted">{t.scopeCaveat}</p>
        <ul className="mt-8 space-y-4">
          {sources.map((source) => (
            <li key={source.id} className="rounded-xl border border-line bg-panel px-5 py-4">
              <p className="font-mono text-[11px] text-accent">{source.id}</p>
              <p className="mt-1 text-fog">{locale === "es" ? source.title_es : source.title}</p>
              <p className="mt-1 text-xs text-muted">
                {source.publisher}
                {source.verification_status ? ` · ${source.verification_status}` : ""}
              </p>
              {source.note && <p className="mt-2 text-xs text-muted">{source.note}</p>}
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent">
                  {source.url}
                </a>
              ) : (
                <p className="mt-3 text-sm text-warn">{t.unverifiedNote}</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default function SourcesPage({ sources }: { sources: SourceRecord[] }) {
  return (
    <LocaleProvider>
      <Inner sources={sources} />
    </LocaleProvider>
  );
}
