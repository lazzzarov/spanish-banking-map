import { FEATURED_GROUPS, GROUP_COLORS, type FeaturedGroup, type GraphLayer } from "../lib/types";
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
  survivingOnly: boolean;
  onSurviving: (value: boolean) => void;
  layer: GraphLayer;
  onLayer: (layer: GraphLayer) => void;
}

const LAYERS: GraphLayer[] = ["business", "ownership", "asset", "context"];

export function FilterControls({ selected, onChange, survivingOnly, onSurviving, layer, onLayer }: Props) {
  const { t } = useLocale();
  const layerLabel: Record<GraphLayer, string> = {
    business: t.layerBusiness,
    ownership: t.layerOwnership,
    asset: t.layerAsset,
    context: t.layerContext,
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`rounded-full border px-3 py-1 font-mono text-[11px] ${
            selected === null && !survivingOnly ? "border-accent text-accent" : "border-line text-muted"
          }`}
        >
          {t.filterAll}
        </button>
        {FEATURED_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => {
              onSurviving(false);
              onChange(selected === group ? null : group);
            }}
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
        <button
          type="button"
          onClick={() => {
            onChange(null);
            onSurviving(!survivingOnly);
          }}
          className={`rounded-full border px-3 py-1 font-mono text-[11px] ${
            survivingOnly ? "border-accent text-accent" : "border-line text-muted"
          }`}
        >
          {t.filterSurviving}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {LAYERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onLayer(item)}
            className={`rounded border px-2 py-1 font-mono text-[10px] ${
              layer === item ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {layerLabel[item]}
          </button>
        ))}
      </div>
    </div>
  );
}
