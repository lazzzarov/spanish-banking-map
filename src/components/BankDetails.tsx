import {
  currentGroupOf,
  entityMap,
  eventsForEntity,
  pathToGroup,
} from "../lib/bankGraph";
import type { BankDataset, Entity, SourceRecord } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  sources: SourceRecord[];
  entity: Entity | null;
  year: number;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function BankDetails({ dataset, sources, entity, year, onClose, onSelect }: Props) {
  const { t, locale } = useLocale();
  if (!entity) return null;

  const byId = entityMap(dataset);
  const groupId = currentGroupOf(dataset, entity.id, year);
  const group = byId.get(groupId);
  const path = pathToGroup(dataset, entity.id, year);
  const related = eventsForEntity(dataset.events, entity.id).filter((event) => event.year <= year);
  const source = sources.find((item) => item.id === entity.src);

  const label = (id: string) => {
    const found = byId.get(id);
    if (!found) return id;
    return locale === "es" && found.name_es ? found.name_es : found.name;
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto border-t border-line bg-panel p-5 md:inset-auto md:right-6 md:bottom-6 md:w-[380px] md:rounded-xl md:border">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{entity.id}</p>
          <h2 className="mt-1 text-xl text-fog">
            {locale === "es" && entity.name_es ? entity.name_es : entity.name}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="font-mono text-[11px] text-muted">
          {t.drawerClose}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">{t.founded}</dt>
          <dd>{entity.founded ?? t.none}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">{t.status}</dt>
          <dd>
            {entity.status === "active" && t.statusActive}
            {entity.status === "absorbed" && t.statusAbsorbed}
            {entity.status === "rebranded" && t.statusRebranded}
            {entity.status === "resolved" && t.statusResolved}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">{t.type}</dt>
          <dd>{entity.type === "caja" ? t.typeCaja : t.typeBank}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">{t.currentGroup}</dt>
          <dd>{group ? label(group.id) : groupId}</dd>
        </div>
      </dl>

      {entity.group_role === "foreign_shareholder" && (
        <p className="mt-3 font-mono text-[11px] text-accent">{t.foreign}</p>
      )}

      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] text-muted uppercase">{t.pathToGroup}</p>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {path.map((id, index) => (
            <span key={id} className="flex items-center gap-1">
              <button type="button" className="text-accent hover:underline" onClick={() => onSelect(id)}>
                {label(id)}
              </button>
              {index < path.length - 1 && <span className="text-muted">→</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] text-muted uppercase">{t.events}</p>
        <ul className="space-y-2">
          {related.map((event) => {
            const eventSource = sources.find((item) => item.id === event.src);
            return (
              <li key={event.id} className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted">
                  <span>
                    {event.year} · {t[event.mechanism]}
                  </span>
                  {event.src === "check" && (
                    <span className="rounded bg-warn/15 px-1.5 text-warn">{t.unverified}</span>
                  )}
                </div>
                <p className="mt-1">
                  {label(event.from)} → {label(event.to)}
                  {event.ownership_pct != null ? ` · ${event.ownership_pct}%` : ""}
                </p>
                {event.note && <p className="mt-1 text-xs text-muted">{event.note}</p>}
                {eventSource?.url && (
                  <a
                    href={eventSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-accent"
                  >
                    {locale === "es" ? eventSource.title_es : eventSource.title}
                  </a>
                )}
                {event.src === "check" && !eventSource?.url && (
                  <p className="mt-1 text-xs text-warn/80">{t.unverifiedNote}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {source && (
        <div className="mt-5">
          <p className="mb-1 font-mono text-[10px] text-muted uppercase">{t.sources}</p>
          {source.url ? (
            <a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-accent">
              {locale === "es" ? source.title_es : source.title}
            </a>
          ) : (
            <p className="text-sm text-warn">{t.unverifiedNote}</p>
          )}
        </div>
      )}
    </aside>
  );
}
