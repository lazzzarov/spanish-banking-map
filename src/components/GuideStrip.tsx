import { useMemo } from "react";
import { storyBeats } from "../lib/bankGraph";
import { guideKey } from "../lib/deepLinks";
import type { BankDataset } from "../lib/types";
import type { StoryLink } from "./Explorer";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  stories: StoryLink[];
  guide: string | null;
  pickerOpen: boolean;
  step: number;
  onPick: (key: string) => void;
  onClose: () => void;
  onStep: (step: number) => void;
}

export function GuideStrip({ dataset, stories, guide, pickerOpen, step, onPick, onClose, onStep }: Props) {
  const { t, locale } = useLocale();
  const visible = useMemo(
    () =>
      stories
        .filter((story) => story.locale === locale)
        .sort((a, b) => a.year - b.year || a.title.localeCompare(b.title)),
    [locale, stories],
  );
  const current = visible.find((story) => guideKey(story.slug) === guide) ?? null;
  const beats = current
    ? storyBeats(current.body, { entityId: current.entityId, year: current.year }, dataset)
    : [];
  const beat = beats[step];

  if (!pickerOpen && !current) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 md:inset-x-5">
      <div className="pointer-events-auto max-h-[45vh] overflow-y-auto rounded-2xl border border-line bg-panel/95 p-4 shadow-xl backdrop-blur">
        {!current && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-heading">{t.guidesTitle}</p>
                <p className="mt-1 text-xs text-muted">{t.guidesLead}</p>
              </div>
              <button type="button" onClick={onClose} className="text-xs text-muted">
                {t.guideClose}
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {visible.map((story) => (
                <li key={story.slug}>
                  <button
                    type="button"
                    onClick={() => onPick(guideKey(story.slug))}
                    className="w-full rounded-xl border border-line px-3 py-2 text-left hover:border-accent"
                  >
                    <p className="font-mono text-[10px] text-accent">{story.year}</p>
                    <p className="mt-1 text-xs text-fog">{story.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {current && beat && (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] text-accent">
                  {current.title} · {step + 1}/{beats.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-fog">{beat.text}</p>
              </div>
              <button type="button" onClick={onClose} className="shrink-0 text-xs text-muted">
                {t.guideExit}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => onStep(step - 1)}
                className="text-xs text-muted disabled:opacity-40"
              >
                {t.guideBack}
              </button>
              {step < beats.length - 1 ? (
                <button type="button" onClick={() => onStep(step + 1)} className="text-xs text-accent">
                  {t.guideNext}
                </button>
              ) : (
                <button type="button" onClick={onClose} className="text-xs text-accent">
                  {t.guideExit}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
