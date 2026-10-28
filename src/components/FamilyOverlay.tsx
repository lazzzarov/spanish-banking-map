import { childrenByParent, entityMap, firstSeenYear, lineageParentAtYear } from "../lib/bankGraph";
import { FEATURED_GROUPS, type BankDataset, type FeaturedGroup } from "../lib/types";
import { LogoBadge } from "./LogoBadge";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  groupId: string;
  year: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function familyRows(dataset: BankDataset, group: string) {
  const children = childrenByParent(dataset.events);
  const rows: { id: string; depth: number }[] = [];
  const walk = (id: string, depth: number) => {
    const kids = [...(children.get(id) ?? [])].sort(
      (a, b) => (children.get(b)?.length ?? 0) - (children.get(a)?.length ?? 0),
    );
    rows.push({ id, depth });
    for (const kid of kids) walk(kid, depth + 1);
  };
  walk(group, 0);
  return rows;
}

export function FamilyOverlay({ dataset, groupId, year, selectedId, onSelect, onClose }: Props) {
  const { t, locale } = useLocale();
  if (!FEATURED_GROUPS.includes(groupId as FeaturedGroup)) return null;
  const byId = entityMap(dataset);
  const label = (id: string) => {
    const found = byId.get(id);
    if (!found) return id;
    return locale === "es" && found.name_es ? found.name_es : found.name;
  };
  const rows = familyRows(dataset, groupId);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-heading/25 p-4 md:items-center">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <p className="text-sm text-muted">{t.treeTitle}</p>
            <h2 className="mt-1 text-xl text-heading">{label(groupId)}</h2>
            <p className="mt-1 text-xs text-muted">{t.treeHint}</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-muted hover:text-fog">
            {t.drawerClose}
          </button>
        </div>
        <ol className="overflow-y-auto px-5 py-4">
          {rows.map((row, index) => {
            const entity = byId.get(row.id);
            if (!entity || firstSeenYear(dataset, row.id) > year) return null;
            const parent = lineageParentAtYear(dataset, row.id, year);
            return (
              <li key={row.id} className="relative" style={{ paddingLeft: row.depth * 20 }}>
                {row.depth > 0 && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-px bg-line"
                    style={{ marginLeft: row.depth * 20 - 10 }}
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSelect(row.id);
                    onClose();
                  }}
                  className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-2 py-2 text-left hover:bg-panel-2 ${
                    selectedId === row.id ? "bg-panel-2" : ""
                  }`}
                >
                  <span className="flex w-full items-center gap-3">
                    <span className="w-6 font-mono text-[10px] text-muted">{index + 1}</span>
                    <LogoBadge id={row.id} name={label(row.id)} groupId={groupId} size={28} />
                    <span className="text-sm text-heading">{label(row.id)}</span>
                  </span>
                  {parent && (
                    <span className="ml-9 text-[11px] text-muted">
                      → {label(parent)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
