import { useEffect, useMemo, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, groupColor, markerPresence, MAX_YEAR, searchEntities } from "../lib/bankGraph";
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

/** Groups first, largest to smallest; a group opens to its banks and filters the map. */
export function BankRail({ dataset, year, selectedId, groupFilter, onSelectBank, onSelectGroup }: Props) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState("");
  // undefined: open the filtered or selected bank's group; null: everything collapsed.
  const [openOverride, setOpenOverride] = useState<string | null | undefined>(undefined);

  useEffect(() => setOpenOverride(undefined), [selectedId]);

  const onMap = useMemo(
    () => dataset.entities.filter((entity) => markerPresence(dataset, entity, year) !== "hidden"),
    [dataset, year],
  );
  // Foreign institutions without a Spanish headquarters, once they enter the story.
  const unplaced = dataset.entities.filter(
    (entity) =>
      !entity.hq &&
      dataset.events.some((event) => (event.from === entity.id || event.to === entity.id) && event.year <= year),
  );

  const byGroup = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const group of FEATURED_GROUPS) map.set(group, []);
    map.set("other", []);
    for (const entity of onMap) {
      const group = currentGroupOf(dataset, entity.id, year);
      map.get(FEATURED_GROUPS.includes(group as FeaturedGroup) ? group : "other")!.push(entity);
    }
    for (const list of map.values()) list.sort((a, b) => labelOf(a, locale).localeCompare(labelOf(b, locale)));
    return map;
  }, [dataset, onMap, year, locale]);

  const sections = [
    ...FEATURED_GROUPS.map((id) => ({ id, title: GROUP_LABELS[id] ?? id, color: groupColor(id) })),
    { id: "other", title: t.filterOther, color: "var(--muted)" },
  ]
    .map((section) => ({ ...section, banks: byGroup.get(section.id) ?? [] }))
    .filter((section) => section.banks.length > 0)
    .sort((a, b) => (a.id === "other" ? 1 : b.id === "other" ? -1 : b.banks.length - a.banks.length));

  const selectedGroup = selectedId ? currentGroupOf(dataset, selectedId, year) : null;
  const openId =
    openOverride !== undefined
      ? openOverride
      : (groupFilter ?? (selectedGroup && byGroup.has(selectedGroup) ? selectedGroup : null));
  const matches = query.trim() ? searchEntities(onMap, query) : null;

  const bankButton = (entity: Entity) => (
    <li key={entity.id}>
      <button
        type="button"
        onClick={() => onSelectBank(entity.id)}
        aria-current={selectedId === entity.id ? "true" : undefined}
        className={`w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] ${
          selectedId === entity.id ? "bg-panel-2 font-semibold text-heading" : "text-fog hover:bg-panel-2/60"
        }`}
      >
        {labelOf(entity, locale)}
      </button>
    </li>
  );

  return (
    <aside
      aria-label={t.banksTitle}
      className="flex h-full flex-col gap-3 rounded-xl border border-line bg-panel p-4 lg:max-h-[min(860px,85vh)]"
    >
      <label htmlFor="bank-rail-search" className="text-xs font-semibold text-muted">
        {t.railSearch}
      </label>
      <input
        id="bank-rail-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.searchPlaceholder}
        className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fog outline-none focus:border-accent"
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {matches ? (
          matches.length === 0 ? (
            <p className="px-2 text-sm text-muted">{t.searchEmpty}</p>
          ) : (
            <ul className="space-y-0.5">{matches.map(bankButton)}</ul>
          )
        ) : (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                {year >= MAX_YEAR ? t.currentGroup : interpolate(t.groupInYear, { year })}
              </p>
              {openId ? (
                <button
                  type="button"
                  onClick={() => setOpenOverride(null)}
                  className="rounded-md px-2 py-1 text-xs text-muted hover:bg-panel-2 hover:text-fog"
                >
                  {t.railCollapseAll}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpenOverride(null);
                onSelectGroup(null);
              }}
              aria-pressed={groupFilter === null}
              className={`mb-1 flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm ${
                groupFilter === null ? "bg-panel-2 font-semibold text-heading" : "text-fog hover:bg-panel-2/60"
              }`}
            >
              <span>{t.railAll}</span>
              <span className="font-mono text-xs text-muted">{onMap.length}</span>
            </button>
            <ul className="space-y-0.5">
              {sections.map((section) => {
                const open = openId === section.id;
                const filtering = groupFilter === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-pressed={filtering}
                      onClick={() => {
                        setOpenOverride(open ? null : section.id);
                        // "Other survivors" is not a map filter; it only lists its banks.
                        if (section.id !== "other") onSelectGroup(filtering ? null : section.id);
                      }}
                      className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${
                        filtering ? "bg-accent/10 font-semibold text-heading ring-1 ring-accent/30" : "text-fog hover:bg-panel-2/60"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: section.color }} />
                        {section.title}
                      </span>
                      <span className="font-mono text-xs text-muted">{section.banks.length}</span>
                    </button>
                    {open && <ul className="mt-0.5 mb-2 ml-4 space-y-0.5 border-l border-line pl-2">{section.banks.map(bankButton)}</ul>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {unplaced.length > 0 && (
        <p className="text-xs leading-relaxed text-muted">
          {interpolate(t.railUnplaced, { names: unplaced.map((entity) => labelOf(entity, locale)).join(", ") })}
        </p>
      )}
    </aside>
  );
}
