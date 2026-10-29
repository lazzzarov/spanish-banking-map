import { interpolate } from "../i18n";
import { useLocale } from "./LocaleContext";

export interface StoryBeat {
  text: string;
  entityId: string;
  year: number;
}

/** Dark bar above the map while a story runs; the way out is always one click. */
export function StoryBanner({ title, onExit }: { title: string; onExit: () => void }) {
  const { t } = useLocale();
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-heading py-2.5 pr-2.5 pl-4 text-panel">
      <p className="m-0 min-w-0 text-sm">
        <span className="mr-2 font-mono text-[11px] tracking-[0.1em] uppercase opacity-70">{t.storyKicker}</span>
        <span className="font-medium">{title}</span>
      </p>
      <button
        type="button"
        onClick={onExit}
        className="min-h-10 rounded-lg bg-panel px-4 text-[13px] font-semibold text-heading hover:opacity-90"
      >
        {t.storyExit}
      </button>
    </div>
  );
}

interface CardProps {
  title: string;
  beats: StoryBeat[];
  step: number;
  onStep: (step: number) => void;
  onExit: () => void;
}

/** The current step of a story, in place of the bank details panel. */
export function StoryCard({ title, beats, step, onStep, onExit }: CardProps) {
  const { t } = useLocale();
  const beat = beats[step];
  if (!beat) return null;
  const next = beats[step + 1];
  return (
    <aside
      aria-label={t.storyKicker}
      className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-6 lg:max-h-[min(780px,80vh)] lg:overflow-y-auto"
    >
      <p className="font-mono text-xs text-accent uppercase">
        {interpolate(t.storyStep, { current: step + 1, total: beats.length, year: beat.year })}
      </p>
      <h2 className="text-2xl leading-tight font-bold text-heading">{title}</h2>
      <p className="text-[15px] leading-relaxed text-fog">{beat.text}</p>
      <div className="mt-auto flex gap-2 pt-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => onStep(step - 1)}
          className="min-h-12 flex-1 rounded-lg border border-line bg-panel text-sm text-fog disabled:opacity-40"
        >
          {t.storyPrev}
        </button>
        {next ? (
          <button
            type="button"
            onClick={() => onStep(step + 1)}
            className="min-h-12 flex-[2] rounded-lg bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            {interpolate(t.storyNextTo, { year: next.year })}
          </button>
        ) : (
          <button
            type="button"
            onClick={onExit}
            className="min-h-12 flex-[2] rounded-lg bg-accent text-sm font-semibold text-white hover:opacity-90"
          >
            {t.storyFinish}
          </button>
        )}
      </div>
      <p className="hidden text-center text-xs text-muted md:block">{t.storyKeys}</p>
    </aside>
  );
}

/** Replaces the full-range time bar during a story: only the story's own steps. */
export function StoryStepper({ beats, step, onStep }: { beats: StoryBeat[]; step: number; onStep: (step: number) => void }) {
  const { t } = useLocale();
  const last = Math.max(beats.length - 1, 1);
  return (
    <section className="flex flex-col gap-2 border-t border-line pt-4" aria-label={t.storyTimeline}>
      <p className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{t.storyTimeline}</p>
      <div className="relative mx-4 h-16">
        <div className="absolute inset-x-0 top-[18px] h-1 rounded bg-line" />
        <div className="absolute left-0 top-[18px] h-1 rounded bg-accent" style={{ width: `${(step / last) * 100}%` }} />
        {beats.map((beat, index) => {
          const left = beats.length === 1 ? 0 : (index / last) * 100;
          const current = index === step;
          const done = index < step;
          return (
            <div key={index} className="absolute top-1.5" style={{ left: `${left}%` }}>
              <button
                type="button"
                onClick={() => onStep(index)}
                aria-label={interpolate(t.storyStep, { current: index + 1, total: beats.length, year: beat.year })}
                aria-current={current ? "step" : undefined}
                className={`-ml-3.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  current
                    ? "bg-accent text-white ring-4 ring-accent/20"
                    : done
                      ? "bg-accent text-white"
                      : "border-2 border-line bg-panel text-muted"
                }`}
              >
                {index + 1}
              </button>
              <span
                className={`absolute top-9 text-[11px] whitespace-nowrap ${current ? "font-semibold text-heading" : "text-muted"} ${
                  index === 0 ? "-left-3.5" : index === beats.length - 1 ? "right-0" : "left-0 -translate-x-1/2"
                }`}
              >
                {beat.year}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
