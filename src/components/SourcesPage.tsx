import { useMemo, useState } from "react";
import type { SourceRecord } from "../lib/types";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";

type FolderId = "bde" | "supervisor" | "banks" | "press" | "unverified";

const BANK_PUBLISHERS = [
  "bbva",
  "banco santander",
  "unicaja",
  "kutxabank",
  "ibercaja",
  "caixabank",
  "cajamar",
  "banca march",
  "grupo caja rural",
  "caja rural de almendralejo",
  "banca pueyo",
  "arquia banca",
];

function folderOf(source: SourceRecord): FolderId {
  if (source.verification_status === "Unverified" || !source.url) return "unverified";
  const publisher = source.publisher.toLowerCase();
  if (publisher.includes("banco de españa") || publisher.includes("banco de espana")) return "bde";
  if (
    publisher.includes("frob") ||
    publisher.includes("cnmv") ||
    publisher.includes("cnmc") ||
    publisher.includes("single resolution")
  ) {
    return "supervisor";
  }
  if (BANK_PUBLISHERS.some((name) => publisher.includes(name))) return "banks";
  return "press";
}

function Inner({ sources }: { sources: SourceRecord[] }) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const folders: { id: FolderId; label: string }[] = [
    { id: "bde", label: t.sourceFolderBde },
    { id: "supervisor", label: t.sourceFolderSupervisor },
    { id: "banks", label: t.sourceFolderBanks },
    { id: "press", label: t.sourceFolderPress },
    { id: "unverified", label: t.sourceFolderUnverified },
  ];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sources.filter((source) => {
      if (!needle) return true;
      const title = locale === "es" ? source.title_es : source.title;
      return (
        source.id.toLowerCase().includes(needle) ||
        title.toLowerCase().includes(needle) ||
        source.publisher.toLowerCase().includes(needle)
      );
    });
  }, [locale, query, sources]);

  return (
    <div className="min-h-screen">
      <SiteHeader current="sources" />
      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8">
        <p className="font-mono text-[11px] text-accent">{t.navSources}</p>
        <h1 className="mt-5 text-3xl text-heading md:text-4xl">{t.sourcesTitle}</h1>
        <p className="mt-4 text-sm text-muted">{t.scopeCaveat}</p>
        <label className="mt-6 block">
          <span className="sr-only">{t.sourceSearch}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.sourceSearch}
            className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fog outline-none focus:border-accent"
          />
        </label>
        <div className="mt-6 space-y-3">
          {folders.map((folder) => {
            const items = filtered.filter((source) => folderOf(source) === folder.id);
            if (items.length === 0) return null;
            return (
              <details key={folder.id} open={Boolean(query.trim())} className="rounded-xl border border-line bg-panel">
                <summary className="cursor-pointer px-5 py-4 text-heading">
                  {folder.label}
                  <span className="ml-2 font-mono text-[11px] text-muted">{items.length}</span>
                </summary>
                <ul className="space-y-3 border-t border-line px-5 py-4">
                  {items.map((source) => (
                    <li key={source.id}>
                      <p className="font-mono text-[11px] text-accent">{source.id}</p>
                      <p className="mt-1 text-fog">{locale === "es" ? source.title_es : source.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {source.verification_status ?? source.publisher}
                      </p>
                      {source.note && <p className="mt-2 text-xs text-muted">{source.note}</p>}
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block break-all text-sm text-accent"
                        >
                          {source.url}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-warn">{t.unverifiedNote}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
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
