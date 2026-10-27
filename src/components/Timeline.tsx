import { MAX_YEAR, MIN_YEAR } from "../lib/bankGraph";
import { YEAR_MARKS } from "../lib/timelineUtils";
import { ERAS, type ContextEvent } from "../lib/types";
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
}: Props) {
  const { t, locale } = useLocale();
  const era = ERAS.find((item) => year >= item.from && year <= item.to);
  const nearby = context.filter((item) => Math.abs(item.year - year) <= 2);

  return (
    <section className="rounded-xl border border-line bg-panel px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            {t.timelineTitle}
          </h2>
          {era && <p className="mt-1 text-xs text-muted">{era.label}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg text-accent">{year}</span>
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
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ERAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onYear(item.from)}
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
              year >= item.from && year <= item.to ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={MIN_YEAR}
        max={MAX_YEAR}
        value={year}
        onChange={(event) => onYear(Number(event.target.value))}
        className="w-full"
      />
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
        {YEAR_MARKS.map((mark) => (
          <button key={mark} type="button" onClick={() => onYear(mark)} className="hover:text-fog">
            {mark}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-fog">{caption}</p>
      {nearby.length > 0 && (
        <ul className="mt-2 space-y-1">
          {nearby.map((item) => (
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
      <div className="mt-4 border-t border-line pt-3">
        <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{t.legendTitle}</p>
        <MechanismLegend compact />
      </div>
    </section>
  );
}
