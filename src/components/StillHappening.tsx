import type { SourceRecord } from "../lib/types";
import { useLocale } from "./LocaleContext";

export function StillHappening({ sources }: { sources: SourceRecord[] }) {
  const { t } = useLocale();
  const bid = sources.find((source) => source.id === "bbva2025");
  const stake = sources.find((source) => source.id === "reuters2026");

  return (
    <section className="grid gap-3 md:grid-cols-[auto_1fr]">
      <div className="flex items-center">
        <span className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
          {t.stillHappening}
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <a
          href={bid?.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line bg-panel px-4 py-3 text-sm text-fog/90 hover:border-accent/40"
        >
          <span className="mb-1 block font-mono text-[10px] text-muted">2025 · bid_failed</span>
          {t.stillBid}
        </a>
        <a
          href={stake?.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line bg-panel px-4 py-3 text-sm text-fog/90 hover:border-accent/40"
        >
          <span className="mb-1 block font-mono text-[10px] text-muted">2026 · minority_stake</span>
          {t.stillStake}
        </a>
      </div>
    </section>
  );
}
