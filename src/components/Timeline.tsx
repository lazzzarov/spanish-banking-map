import { useMemo, useState } from "react";
import { MAX_YEAR, MIN_YEAR } from "../lib/bankGraph";
import { decadeBriefing } from "../lib/decadeBriefings";
import {
  clampToDecade,
  decadeContaining,
  DECADES,
  nextDecade,
  prevDecade,
} from "../lib/decades";
import { clampYear } from "../lib/timelineUtils";
import type { ContextEvent } from "../lib/types";
import { MechanismLegend } from "./MechanismLegend";
import { useLocale } from "./LocaleContext";

interface Props {
  year: number;
  playing: boolean;
  caption: string;
  onYear: (year: number) => void;
  onToggle: () => void;
  onReset: () => void;
  context?: ContextEvent[];
  onContext?: (event: ContextEvent) => void;
  onDecadeChange?: (from: number) => void;
}

export function Timeline({
  year,
  playing,
  caption,
  onYear,
  onToggle,
  onReset,
  context = [],
  onContext,
  onDecadeChange,
}: Props) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const decade = useMemo(() => decadeContaining(year), [year]);
  const briefing = decadeBriefing(decade.from, locale);
  const decadeContext = useMemo(
    () => context.filter((item) => item.year >= decade.from && item.year <= decade.to).sort((a, b) => a.year - b.year),
    [context, decade.from, decade.to],
  );

  const goDecade = (next: typeof decade) => {
    onDecadeChange?.(next.from);
    onYear(clampToDecade(next.from, next));
  };

  return (
    <section className="rounded-xl border border-line bg-panel px-4 py-3 decade-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-heading">{t.timelineTitle}</h2>
          <p className="mt-1 truncate text-xs text-muted">
            {year}
            {` · ${decade.label}`}
            {caption ? ` · ${caption}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded border border-line px-3 py-1 font-mono text-[11px] text-fog hover:border-accent/50"
          >
            {playing ? t.pause : t.play}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-line px-3 py-1 font-mono text-[11px] text-muted hover:text-fog"
          >
            {t.reset}
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded border border-line px-3 py-1 font-mono text-[11px] text-muted hover:text-fog"
          >
            {open ? t.collapseTimeline : t.expandTimeline}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!prevDecade(decade)}
          onClick={() => {
            const prev = prevDecade(decade);
            if (prev) goDecade(prev);
          }}
          className="rounded border border-line px-2 py-1 font-mono text-[11px] text-muted hover:text-fog disabled:opacity-30"
        >
          {t.decadePrev}
        </button>
        <div className="flex flex-wrap gap-1">
          {DECADES.map((item) => (
            <button
              key={item.from}
              type="button"
              onClick={() => goDecade(item)}
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] transition-colors ${
                item.from === decade.from ? "border-accent text-accent" : "border-line text-muted hover:text-fog"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!nextDecade(decade)}
          onClick={() => {
            const next = nextDecade(decade);
            if (next) goDecade(next);
          }}
          className="rounded border border-line px-2 py-1 font-mono text-[11px] text-muted hover:text-fog disabled:opacity-30"
        >
          {t.decadeNext}
        </button>
      </div>

      {briefing && <p className="decade-briefing mt-3 text-xs leading-relaxed text-fog">{briefing}</p>}

      <input
        type="range"
        min={decade.from}
        max={decade.to}
        value={clampToDecade(year, decade)}
        onChange={(event) => onYear(clampYear(Number(event.target.value)))}
        className="mt-3 w-full"
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>{decade.from}</span>
        <span>{decade.to}</span>
      </div>

      {decadeContext.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-line pt-3">
          {decadeContext.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  onYear(item.year);
                  onContext?.(item);
                }}
                className="text-left text-xs text-accent hover:underline"
              >
                {item.year} · {locale === "es" ? item.name_es : item.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex justify-between font-mono text-[10px] text-muted">
            {[MIN_YEAR, 1988, 2010, 2017, 2021, MAX_YEAR].map((mark) => (
              <button key={mark} type="button" onClick={() => onYear(mark)} className="hover:text-fog">
                {mark}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <p className="mb-1 text-[10px] text-muted">{t.legendTitle}</p>
            <MechanismLegend compact />
          </div>
        </div>
      )}
    </section>
  );
}
