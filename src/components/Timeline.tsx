import { MAX_YEAR, MIN_YEAR } from "../lib/bankGraph";
import { YEAR_MARKS } from "../lib/timelineUtils";
import { useLocale } from "./LocaleContext";

interface Props {
  year: number;
  playing: boolean;
  onYear: (year: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

export function Timeline({ year, playing, onYear, onToggle, onReset }: Props) {
  const { t } = useLocale();

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
    </section>
  );
}
