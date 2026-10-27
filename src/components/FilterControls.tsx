import { FEATURED_GROUPS, GROUP_COLORS, type FeaturedGroup } from "../lib/types";
import { useLocale } from "./LocaleContext";

const LABELS: Record<FeaturedGroup, string> = {
  caixabank: "CaixaBank",
  santander: "Santander",
  bbva: "BBVA",
  sabadell: "Sabadell",
  unicaja: "Unicaja",
  ibercaja: "Ibercaja",
  kutxabank: "Kutxabank",
  abanca: "Abanca",
};

interface Props {
  selected: FeaturedGroup | null;
  onChange: (group: FeaturedGroup | null) => void;
}

export function FilterControls({ selected, onChange }: Props) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`rounded-full border px-3 py-1 font-mono text-[11px] ${
          selected === null ? "border-accent text-accent" : "border-line text-muted"
        }`}
      >
        {t.filterAll}
      </button>
      {FEATURED_GROUPS.map((group) => (
        <button
          key={group}
          type="button"
          onClick={() => onChange(selected === group ? null : group)}
          className={`rounded-full border px-3 py-1 font-mono text-[11px] ${
            selected === group ? "border-current text-fog" : "border-line text-muted"
          }`}
          style={{ color: selected === group ? GROUP_COLORS[group] : undefined }}
        >
          <span
            className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: GROUP_COLORS[group] }}
          />
          {LABELS[group]}
        </button>
      ))}
    </div>
  );
}
