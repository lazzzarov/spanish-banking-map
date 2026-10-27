import { useMemo, useState } from "react";
import { searchEntities } from "../lib/bankGraph";
import type { Entity } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  entities: Entity[];
  onSelect: (id: string) => void;
}

export function SearchBar({ entities, onSelect }: Props) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchEntities(entities, query), [entities, query]);

  return (
    <div className="relative">
      <label className="mb-2 block font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
        {t.searchHint}
      </label>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.searchPlaceholder}
        className="w-full rounded-lg border border-line bg-panel px-4 py-3 text-sm text-fog outline-none placeholder:text-muted/70 focus:border-accent/50"
      />
      {query && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel-2 shadow-2xl">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">{t.searchEmpty}</li>
          )}
          {results.map((entity) => (
            <li key={entity.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-panel"
                onClick={() => {
                  onSelect(entity.id);
                  setQuery("");
                }}
              >
                <span>{locale === "es" && entity.name_es ? entity.name_es : entity.name}</span>
                <span className="font-mono text-[10px] text-muted">{entity.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
