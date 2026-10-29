import { useMemo } from "react";
import { interpolate } from "../i18n";
import { MAX_YEAR, MIN_YEAR } from "../lib/bankGraph";
import { decadeBriefing } from "../lib/decadeBriefings";
import { decadeContaining } from "../lib/decades";
import { clampYear } from "../lib/timelineUtils";
import type { ContextEvent } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  year: number;
  playing: boolean;
  /** Completed lineage deals per year; drawn as ticks and used for previous/next deal. */
  dealCounts: Map<number, number>;
  caption: string;
  onYear: (year: number) => void;
  onToggle: () => void;
  context?: ContextEvent[];
}

/**
 * Shaded periods on the bar; years are inclusive. Labels sit on their own rows so they never
 * overlap at narrow widths; late eras end their label at the band's end instead of running off the bar.
 */
const ERAS = [
  { from: 1921, to: 1923, key: "eraCambo", row: 0, align: "start" },
  { from: 1977, to: 1985, key: "eraCrisis", row: 1, align: "start" },
  { from: 1988, to: 1999, key: "eraMergers", row: 2, align: "end" },
  { from: 2009, to: 2013, key: "eraCajas", row: 3, align: "end" },
  { from: 2017, to: 2021, key: "eraPopularBankia", row: 0, align: "end" },
] as const;

const LABEL_ROW = 13;
const BAND_TOP = LABEL_ROW * 4 + 4;

const AXIS = [1920, 1940, 1960, 1980, 2000, MAX_YEAR];

const pct = (year: number) => ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

export function Timeline({ year, playing, dealCounts, caption, onYear, onToggle, context = [] }: Props) {
  const { t, locale } = useLocale();
  const dealYears = useMemo(() => [...dealCounts.keys()].sort((a, b) => a - b), [dealCounts]);
  const maxCount = Math.max(1, ...dealCounts.values());
  const prevDeal = [...dealYears].reverse().find((item) => item < year);
  const nextDeal = dealYears.find((item) => item > year);
  const briefing = decadeBriefing(decadeContaining(year).from, locale);

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4" aria-label={t.timelineTitle}>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? t.pause : t.play}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:opacity-90"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            {playing ? (
              <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
            ) : (
              <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
            )}
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-3xl leading-none text-heading">{year}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{caption}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={prevDeal == null}
            onClick={() => prevDeal != null && onYear(prevDeal)}
            className="h-9 rounded-lg border border-line bg-panel px-3 text-[13px] text-fog hover:border-accent/50 disabled:opacity-40"
          >
            {t.timelinePrevDeal}
          </button>
          <button
            type="button"
            disabled={nextDeal == null}
            onClick={() => nextDeal != null && onYear(nextDeal)}
            className="h-9 rounded-lg border border-line bg-panel px-3 text-[13px] text-fog hover:border-accent/50 disabled:opacity-40"
          >
            {t.timelineNextDeal}
          </button>
        </div>
      </div>

      <div className="relative h-32">
        {/* Inset by the range thumb's half-width so years line up with the handle. */}
        <div className="pointer-events-none absolute inset-x-2 top-0 bottom-5">
          {ERAS.map((era) => (
            <div key={era.key}>
              <p
                className="absolute m-0 whitespace-nowrap text-[11px] text-muted"
                style={{
                  ...(era.align === "start" ? { left: `${pct(era.from)}%` } : { right: `${100 - pct(era.to)}%` }),
                  top: era.row * LABEL_ROW,
                  lineHeight: `${LABEL_ROW}px`,
                }}
              >
                {t[era.key]}
              </p>
              <div
                className="absolute bottom-0 rounded-md bg-panel-2"
                style={{
                  left: `${pct(era.from)}%`,
                  width: `${Math.max(pct(era.to) - pct(era.from), 1.2)}%`,
                  top: BAND_TOP,
                }}
              />
            </div>
          ))}
          {dealYears.map((dealYear) => {
            const count = dealCounts.get(dealYear) ?? 0;
            return (
              <div
                key={dealYear}
                title={interpolate(t.timelineDealCount, { count, year: dealYear })}
                className="absolute bottom-0 w-[3px] -translate-x-1/2 rounded-sm bg-[var(--deal)]"
                style={{ left: `${pct(dealYear)}%`, height: 6 + (count / maxCount) * 34 }}
              />
            );
          })}
          {context.map((item) => (
            <button
              key={item.id}
              type="button"
              title={`${item.year} · ${locale === "es" ? item.name_es : item.name}`}
              aria-label={`${item.year} · ${locale === "es" ? item.name_es : item.name}`}
              onClick={() => onYear(item.year)}
              className="pointer-events-auto absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-accent bg-panel hover:bg-accent"
              style={{ left: `${pct(item.year)}%`, top: BAND_TOP - 5 }}
            />
          ))}
        </div>
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={year}
          aria-label={t.yearLabel}
          onChange={(event) => onYear(clampYear(Number(event.target.value)))}
          className="absolute inset-x-0 bottom-0 w-full"
        />
      </div>
      <div className="flex justify-between px-2 font-mono text-[11px] text-muted">
        {AXIS.map((mark) => (
          <button key={mark} type="button" onClick={() => onYear(mark)} className="hover:text-fog">
            {mark}
          </button>
        ))}
      </div>
      {briefing && <p className="text-xs leading-relaxed text-muted">{briefing}</p>}
    </section>
  );
}
