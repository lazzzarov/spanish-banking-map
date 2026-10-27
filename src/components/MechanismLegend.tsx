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
  "intervention",
  "rebrand",
  "minority_equity_investment",
  "failed_acquisition_attempt",
  "asset_transfer",
  "divestment",
];

export function MechanismLegend() {
  const { t } = useLocale();
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
        {t.legendTitle}
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {ITEMS.map((id) => (
          <span key={id} className="flex items-center gap-2 text-xs text-fog/80">
            <svg width="28" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="28"
                y2="4"
                stroke={
                  id === "failed_acquisition_attempt" ||
                  id === "minority_equity_investment" ||
                  id === "asset_transfer" ||
                  id === "divestment"
                    ? "#94a3b8"
                    : "#7dd3fc"
                }
                strokeWidth="1.4"
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
