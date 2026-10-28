import { useMemo, useState } from "react";
import { currentGroupOf, markerPresence, searchEntities } from "../lib/bankGraph";
import { FEATURED_GROUPS, type BankDataset, type Entity, type FeaturedGroup } from "../lib/types";
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

interface Props {
  dataset: BankDataset;
  year: number;
  selectedId: string | null;
  groupFilter: string | null;
  onSelectBank: (id: string) => void;
  onSelectGroup: (group: string | null) => void;
}

function labelOf(entity: Entity, locale: "en" | "es") {
  return locale === "es" && entity.name_es ? entity.name_es : entity.name;
}

export function BankRail({ dataset, year, selectedId, groupFilter, onSelectBank, onSelectGroup }: Props) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries([...FEATURED_GROUPS, "surviving", "other"].map((id) => [id, true])),
  );

  const visible = useMemo(
    () =>
      dataset.entities.filter(
        (entity) => entity.hq && markerPresence(dataset, entity, year) !== "hidden",
      ),
    [dataset, year],
  );

  const matches = query.trim() ? searchEntities(visible, query) : visible;

  const byGroup = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const group of FEATURED_GROUPS) map.set(group, []);
    map.set("surviving", []);
    map.set("other", []);

    for (const entity of matches) {
      const group = currentGroupOf(dataset, entity.id, year);
      if (FEATURED_GROUPS.includes(group as FeaturedGroup)) {
        map.get(group)!.push(entity);
      } else if (entity.group_role === "independent_caja") {
        map.get("surviving")!.push(entity);
      } else {
        map.get("other")!.push(entity);
      }
    }

    for (const list of map.values()) {
      list.sort((a, b) => labelOf(a, locale).localeCompare(labelOf(b, locale)));
    }
    return map;
  }, [dataset, matches, year, locale]);

  const sections = [
    ...FEATURED_GROUPS.map((id) => ({ id, title: GROUP_LABELS[id] ?? id })),
    { id: "surviving", title: t.filterSurviving },
    { id: "other", title: t.filterOther },
  ];

  return (
    <aside className="flex max-h-[min(720px,70vh)] flex-col rounded-xl border border-line bg-panel p-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.railSearch}
        className="mb-2 w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm text-fog outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={() => onSelectGroup(null)}
        className={`mb-2 rounded-lg px-2 py-1.5 text-left text-sm ${
          groupFilter === null ? "bg-panel-2 text-accent" : "text-muted hover:text-fog"
        }`}
      >
        {t.railAll}
      </button>
      <div className="flex-1 overflow-y-auto pr-1">
        {sections.map((section) => {
          const banks = byGroup.get(section.id) ?? [];
          if (banks.length === 0) return null;
          const expanded = open[section.id] ?? true;
          return (
            <div key={section.id} className="mb-2">
              <button
                type="button"
                onClick={() => {
                  setOpen((value) => ({ ...value, [section.id]: !expanded }));
                  if (FEATURED_GROUPS.includes(section.id as FeaturedGroup) || section.id === "surviving") {
                    onSelectGroup(section.id === "surviving" ? "surviving" : section.id);
                  }
                }}
                className="flex w-full items-center justify-between rounded px-1 py-1 text-left text-xs font-medium text-heading"
              >
                <span>{section.title}</span>
                <span className="font-mono text-[10px] text-muted">{banks.length}</span>
              </button>
              {expanded && (
                <ul className="mt-1 space-y-0.5 border-l border-line pl-2">
                  {banks.map((entity) => (
                    <li key={entity.id}>
                      <button
                        type="button"
                        onClick={() => onSelectBank(entity.id)}
                        className={`w-full truncate rounded px-1 py-1 text-left text-xs ${
                          selectedId === entity.id ? "bg-panel-2 text-accent" : "text-fog hover:bg-panel-2/60"
                        }`}
                      >
                        {labelOf(entity, locale)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
