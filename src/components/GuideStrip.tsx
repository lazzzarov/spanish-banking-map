import { guideKey } from "../lib/deepLinks";
import type { StoryLink } from "./Explorer";
import { useLocale } from "./LocaleContext";

interface Props {
  stories: StoryLink[];
  guide: string | null;
  step: number;
  beatCount: number;
  onClose: () => void;
  onStep: (step: number) => void;
  /** Top bar is sticky and prominent; bottom is a slim duplicate. */
  placement?: "top" | "bottom";
}

export function GuideStrip({
  stories,
  guide,
  step,
  beatCount,
  onClose,
  onStep,
  placement = "bottom",
}: Props) {
  const { t, locale } = useLocale();
  const current = stories.find((story) => story.locale === locale && guideKey(story.slug) === guide) ?? null;
  if (!current || beatCount === 0) return null;

  if (placement === "top") {
    return (
      <div className="sticky top-0 z-20 mb-3 rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              {step + 1}/{beatCount}
            </p>
            <p className="truncate text-sm font-medium text-heading">{current.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => onStep(step - 1)}
              className="min-h-11 rounded-lg border border-line bg-panel px-4 text-sm text-muted disabled:opacity-40"
            >
              {t.guideBack}
            </button>
            {step < beatCount - 1 ? (
              <button
                type="button"
                onClick={() => onStep(step + 1)}
                className="min-h-11 rounded-lg bg-accent px-5 text-sm font-medium text-white hover:opacity-90"
              >
                {t.guideNext}
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="min-h-11 px-3 text-sm text-muted hover:text-accent">
              {t.guideExit}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel-2 px-4 py-2">
      <p className="font-mono text-[10px] text-accent">
        {current.title} · {step + 1}/{beatCount}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => onStep(step - 1)}
          className="text-xs text-muted disabled:opacity-40"
        >
          {t.guideBack}
        </button>
        {step < beatCount - 1 ? (
          <button type="button" onClick={() => onStep(step + 1)} className="text-xs text-accent">
            {t.guideNext}
          </button>
        ) : null}
        <button type="button" onClick={onClose} className="text-xs text-muted">
          {t.guideExit}
        </button>
      </div>
    </div>
  );
}
