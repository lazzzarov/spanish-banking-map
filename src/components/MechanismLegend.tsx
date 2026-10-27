import type { Mechanism } from "../lib/types";
import { useLocale } from "./LocaleContext";

const ITEMS: { id: Mechanism; dash?: string; mark?: string }[] = [
  { id: "sip", dash: "6 4" },
  { id: "merger" },
  { id: "absorption" },
  { id: "activity_transfer", dash: "2 3" },
  { id: "resolution" },
  { id: "rebrand", dash: "1 4" },
  { id: "minority_stake", dash: "2 6" },
  { id: "bid_failed", dash: "8 3 2 3" },
];

export function MechanismLegend() {
  const { t } = useLocale();
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
        {t.legendTitle}
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {ITEMS.map((item) => (
          <span key={item.id} className="flex items-center gap-2 text-xs text-fog/80">
            <svg width="28" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke={item.id === "bid_failed" || item.id === "minority_stake" ? "#94a3b8" : "#7dd3fc"}
                strokeWidth="1.4"
                strokeDasharray={item.dash}
              />
            </svg>
            {t[item.id]}
          </span>
        ))}
      </div>
    </div>
  );
}
