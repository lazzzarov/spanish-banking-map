import { useState } from "react";
import { ERAS } from "../lib/types";
import { ERA_ART } from "./EraArt";
import { useLocale } from "./LocaleContext";

interface Props {
  year: number;
  playing: boolean;
  /** Jump the time bar to the start of an era. */
  onEra: (year: number) => void;
  /** Play the time bar from 1920 so the panels advance with it. */
  onWatch: () => void;
}

const ERA_KEYS = ["era1", "era2", "era3", "era4", "era5", "era6", "era7"] as const;

/** Seven illustrated panels that tell the century in short; the panel for the current year is highlighted. */
export function EraStory({ year, playing, onEra, onWatch }: Props) {
  const { t } = useLocale();
  const [hidden, setHidden] = useState(false);
  const current = ERAS.findIndex((era) => year >= era.from && year <= era.to);

  return (
    <section aria-label={t.eraStoryTitle} className="mb-4 rounded-xl border border-line bg-panel p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.1em] text-accent uppercase">{t.eraStoryKicker}</p>
          <h2 className="mt-1 text-lg font-bold text-heading md:text-xl">{t.eraStoryTitle}</h2>
        </div>
        <div className="flex gap-2">
          {!hidden && (
            <button
              type="button"
              onClick={onWatch}
              className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16">
                {playing ? (
                  <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
                ) : (
                  <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
                )}
              </svg>
              {playing ? t.pause : t.eraStoryWatch}
            </button>
          )}
          <button
            type="button"
            onClick={() => setHidden((value) => !value)}
            aria-expanded={!hidden}
            className="h-10 rounded-lg border border-line bg-panel px-3 text-[13px] text-muted hover:text-fog"
          >
            {hidden ? t.eraStoryShow : t.eraStoryHide}
          </button>
        </div>
      </div>

      {!hidden && (
        <ol className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {ERAS.map((era, index) => {
            const Art = ERA_ART[era.id];
            const key = ERA_KEYS[index];
            const isCurrent = index === current;
            return (
              <li key={era.id}>
                <button
                  type="button"
                  onClick={() => onEra(era.from)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex h-full w-full flex-col overflow-hidden rounded-xl border bg-panel text-left transition-shadow ${
                    isCurrent ? "border-2 border-accent ring-4 ring-accent/15" : "border-line hover:border-accent/50"
                  }`}
                >
                  {Art ? <Art /> : null}
                  <span className="block px-3 pt-2.5 pb-3">
                    <span className={`block font-mono text-[11px] ${isCurrent ? "font-medium text-accent" : "text-muted"}`}>
                      {index + 1} · {era.label}
                      {isCurrent ? ` · ${t.eraHere}` : ""}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-heading">{t[`${key}Title`]}</span>
                    <span className="mt-1 block text-xs leading-snug text-fog">{t[`${key}Text`]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
