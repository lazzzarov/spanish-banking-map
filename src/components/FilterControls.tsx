import { FEATURED_GROUPS, OTHER_SURVIVORS, type GraphLayer } from "../lib/types";
import { useLocale } from "./LocaleContext";

const GROUP_LABELS: Record<string, string> = {
  caixabank: "CaixaBank",
  santander: "Santander",
  bbva: "BBVA",
  sabadell: "Sabadell",
  unicaja: "Unicaja",
  ibercaja: "Ibercaja",
  kutxabank: "Kutxabank",
  abanca: "Abanca",
  cajamar: "Cajamar",
  "banca-march": "Banca March",
  "grupo-caja-rural": "Grupo Caja Rural",
  "caja-almendralejo": "Caja Almendralejo",
  "banca-pueyo": "Banca Pueyo",
  arquia: "Arquia Banca",
};

export type GroupFilter = string | "surviving" | null;

interface Props {
  selected: GroupFilter;
  onChange: (group: GroupFilter) => void;
  layer: GraphLayer;
  onLayer: (layer: GraphLayer) => void;
}

const LAYERS: GraphLayer[] = ["business", "ownership", "asset", "context"];

export function FilterControls({ selected, onChange, layer, onLayer }: Props) {
  const { t } = useLocale();
  const layerLabel: Record<GraphLayer, string> = {
    business: t.layerBusiness,
    ownership: t.layerOwnership,
    asset: t.layerAsset,
    context: t.layerContext,
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <label className="flex-1">
        <span className="mb-1 block font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          {t.groupsTitle}
        </span>
        <select
          value={selected ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "") onChange(null);
            else if (value === "surviving") onChange("surviving");
            else onChange(value);
          }}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fog outline-none focus:border-accent"
        >
          <option value="">{t.filterAll}</option>
          {FEATURED_GROUPS.map((group) => (
            <option key={group} value={group}>
              {GROUP_LABELS[group]}
            </option>
          ))}
          <option value="surviving">{t.filterSurviving}</option>
          <optgroup label={t.filterOther}>
            {OTHER_SURVIVORS.map((group) => (
              <option key={group} value={group}>
                {GROUP_LABELS[group]}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="flex-1">
        <span className="mb-1 block font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
          {t.layerTitle}
        </span>
        <select
          value={layer}
          onChange={(event) => onLayer(event.target.value as GraphLayer)}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-fog outline-none focus:border-accent"
        >
          {LAYERS.map((item) => (
            <option key={item} value={item}>
              {layerLabel[item]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
