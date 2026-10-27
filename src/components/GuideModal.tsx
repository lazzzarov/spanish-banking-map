import { storyBeats } from "../lib/bankGraph";
import { guideKey } from "../lib/deepLinks";
import type { StoryLink } from "./Explorer";
import { useLocale } from "./LocaleContext";

interface Props {
  stories: StoryLink[];
  guide: string | null;
  pickerOpen: boolean;
  step: number;
  onPick: (key: string) => void;
  onClose: () => void;
  onStep: (step: number) => void;
}

export function GuideModal({ stories, guide, pickerOpen, step, onPick, onClose, onStep }: Props) {
  const { t, locale } = useLocale();
  const visible = stories.filter((story) => story.locale === locale);
  const current = visible.find((story) => guideKey(story.slug) === guide) ?? null;
  const beats = current ? storyBeats(current.body, { entityId: current.entityId, year: current.year }) : [];
  const beat = beats[step];

  if (!pickerOpen && !current) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-heading/30 p-4 md:items-center">
      <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        {!current && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">{t.navStories}</p>
                <h2 className="mt-2 text-2xl text-heading">{t.guidesTitle}</h2>
                <p className="mt-2 text-sm text-muted">{t.guidesLead}</p>
              </div>
              <button type="button" onClick={onClose} className="font-mono text-[11px] text-muted">
                {t.guideClose}
              </button>
            </div>
            <ul className="mt-6 space-y-2">
              {visible.map((story) => (
                <li key={story.slug}>
                  <button
                    type="button"
                    onClick={() => onPick(guideKey(story.slug))}
                    className="w-full rounded-xl border border-line px-4 py-3 text-left hover:border-accent"
                  >
                    <p className="font-mono text-[11px] text-accent">{story.year}</p>
                    <p className="mt-1 text-sm text-fog">{story.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {current && beat && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">{current.year}</p>
                <h2 className="mt-2 text-2xl text-heading">{current.title}</h2>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {step + 1} / {beats.length}
                </p>
              </div>
              <button type="button" onClick={onClose} className="font-mono text-[11px] text-muted">
                {t.guideClose}
              </button>
            </div>
            <p className="mt-5 text-sm leading-7 text-fog">{beat.text}</p>
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => onStep(step - 1)}
                className="font-mono text-[11px] text-muted disabled:opacity-40"
              >
                {t.guideBack}
              </button>
              {step < beats.length - 1 ? (
                <button type="button" onClick={() => onStep(step + 1)} className="font-mono text-[11px] text-accent">
                  {t.guideNext}
                </button>
              ) : (
                <button type="button" onClick={onClose} className="font-mono text-[11px] text-accent">
                  {t.guideClose}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
