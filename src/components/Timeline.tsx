import { MAX_YEAR, MIN_YEAR } from "../lib/bankGraph";
import { YEAR_MARKS } from "../lib/timelineUtils";
import { ERAS, type ContextEvent } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  year: number;
  playing: boolean;
  onYear: (year: number) => void;
  onToggle: () => void;
  onReset: () => void;
  context?: ContextEvent[];
  onContext?: (event: ContextEvent) => void;
}

export function Timeline({ year, playing, onYear, onToggle, onReset, context = [], onContext }: Props) {
  const { t, locale } = useLocale();
  const nearby = context.filter((item) => Math.abs(item.year - year) <= 2);

  return (
    <section className="rounded-xl border border-line bg-panel px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          {t.timelineTitle}
        </h2>
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
      <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{t.eraLabel}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ERAS.map((era) => (
          <button
            key={era.id}
            type="button"
            onClick={() => onYear(era.to)}
            className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
              year >= era.from && year <= era.to ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {era.label}
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
      {nearby.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{t.contextTitle}</p>
          <ul className="space-y-1.5">
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
        </div>
      )}
    </section>
  );
}
