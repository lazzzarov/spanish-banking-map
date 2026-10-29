import { DECADES } from "../lib/decades";
import { MAX_YEAR } from "../lib/bankGraph";
import { useLocale } from "./LocaleContext";

interface Props {
  onPick: (year: number) => void;
  onStayPresent: () => void;
}

export function DecadePrompt({ onPick, onStayPresent }: Props) {
  const { t } = useLocale();
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-panel/85 p-4 backdrop-blur-sm">
      <div className="max-w-lg rounded-2xl border border-line bg-panel px-6 py-6 shadow-xl">
        <p className="font-mono text-[11px] text-accent">{t.decadePromptKicker}</p>
        <h3 className="mt-2 text-lg text-heading">{t.decadePromptTitle}</h3>
        <p className="mt-2 text-sm text-muted">{t.decadePromptLead}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {DECADES.map((decade) => (
            <button
              key={decade.from}
              type="button"
              onClick={() => onPick(decade.from)}
              className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-fog hover:border-accent hover:text-accent"
            >
              {decade.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onStayPresent}
          className="mt-4 w-full rounded-lg border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/15"
        >
          {t.decadePromptStay} ({MAX_YEAR})
        </button>
      </div>
    </div>
  );
}
