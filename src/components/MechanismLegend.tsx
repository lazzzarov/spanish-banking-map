import type { Mechanism } from "../lib/types";
import { dashFor } from "../lib/types";
import { useLocale } from "./LocaleContext";

const ITEMS: Mechanism[] = [
  "sip_formation",
  "merger",
  "absorption",
  "banking_business_transfer",
  "acquisition",
  "resolution_sale",
  "rebrand",
  "minority_equity_investment",
  "failed_acquisition_attempt",
  "asset_transfer",
  "divestment",
];

export function MechanismLegend({ compact = false }: { compact?: boolean }) {
  const { t } = useLocale();
  return (
    <div>
      {!compact && (
        <p className="mb-2 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          {t.legendTitle}
        </p>
      )}
      <div className={`flex flex-wrap ${compact ? "gap-x-3 gap-y-1" : "gap-x-5 gap-y-2"}`}>
        {ITEMS.map((id) => (
          <span key={id} className="flex items-center gap-1.5 text-[11px] text-fog">
            <svg width="22" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="22"
                y2="4"
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeDasharray={dashFor(id)}
              />
            </svg>
            {t[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
