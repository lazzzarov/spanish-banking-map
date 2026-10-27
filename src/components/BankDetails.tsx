import { useState } from "react";
import {
  currentGroupOf,
  entityMap,
  eventsForEntity,
  pathToGroup,
} from "../lib/bankGraph";
import { interpolate } from "../i18n";
import { downloadSvgAsPng, downloadText, familyPathSvg } from "../lib/pathExport";
import { FEATURED_GROUPS, isOverlayMechanism, type BankDataset, type Entity, type Event, type GraphLayer, type SourceRecord } from "../lib/types";
import { BankingTree } from "./BankingTree";
import type { StoryLink } from "./Explorer";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  sources: SourceRecord[];
  stories: StoryLink[];
  entity: Entity | null;
  year: number;
  yearEvents: Event[];
  layer: GraphLayer;
  groupFilter: string | null;
  highlight: string[];
  onSelect: (id: string) => void;
  onGuide?: (key: string) => void;
}

export function BankDetails({
  dataset,
  sources,
  stories,
  entity,
  year,
  yearEvents,
  layer,
  groupFilter,
  highlight,
  onSelect,
  onGuide,
}: Props) {
  const { t, locale } = useLocale();
  const [familyOpen, setFamilyOpen] = useState(false);
  const byId = entityMap(dataset);

  const label = (id: string) => {
    const found = byId.get(id);
    if (!found) return id;
    return locale === "es" && found.name_es ? found.name_es : found.name;
  };

  const renderEvent = (event: Event) => {
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
        <p className="mt-1 text-fog">
          {label(event.from)} → {label(event.to)}
          {event.ownership_pct != null ? ` · ${event.ownership_pct}%` : ""}
        </p>
        {event.note && <p className="mt-1 text-xs text-muted">{event.note}</p>}
        {eventSource?.url && (
          <a href={eventSource.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent">
            {locale === "es" ? eventSource.title_es : eventSource.title}
          </a>
        )}
      </li>
    );
  };

  if (!entity) {
    return (
      <aside className="flex h-full flex-col rounded-xl border border-line bg-panel p-5">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">{t.historyTitle}</p>
        <p className="mt-3 text-sm text-muted">{t.historyIdle}</p>
        <p className="mt-6 font-mono text-[10px] text-muted uppercase">{t.thisYear}</p>
        {yearEvents.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{interpolate(t.yearEventsEmpty, { year })}</p>
        ) : (
          <ul className="mt-2 space-y-2 overflow-y-auto">{yearEvents.map(renderEvent)}</ul>
        )}
      </aside>
    );
  }

  const groupId = currentGroupOf(dataset, entity.id, year);
  const group = byId.get(groupId);
  const path = pathToGroup(dataset, entity.id, year);
  const related = eventsForEntity(dataset.events, entity.id).filter((event) => {
    if (event.year > year) return false;
    if (layer === "context") return false;
    return isOverlayMechanism(event.mechanism, layer);
  });
  const source = sources.find((item) => item.id === entity.src);
  const canOpenFamily = FEATURED_GROUPS.includes(groupId as (typeof FEATURED_GROUPS)[number]);

  return (
    <aside className="flex h-full max-h-[720px] flex-col overflow-y-auto rounded-xl border border-line bg-panel p-5">
      <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">{entity.id}</p>
      <h2 className="mt-1 text-xl text-heading">
        {locale === "es" && entity.name_es ? entity.name_es : entity.name}
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
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
            {entity.status === "historical_nonbank" && t.statusHistorical}
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
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">{t.legalStatus}</dt>
          <dd>
            {entity.status === "active" && t.statusActive}
            {entity.status === "absorbed" && t.statusAbsorbed}
            {entity.status === "rebranded" && t.statusRebranded}
            {entity.status === "resolved" && t.statusResolved}
            {entity.status === "historical_nonbank" && t.statusHistorical}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] text-muted uppercase">{t.bankingBusiness}</dt>
          <dd>
            {entity.banking_business_status === "transferred" ? t.businessTransferred : t.businessActive}
          </dd>
        </div>
      </dl>

      {entity.group_role === "foreign_shareholder" && (
        <p className="mt-3 font-mono text-[11px] text-accent">{t.foreign}</p>
      )}
      {entity.group_role === "independent_caja" && (
        <p className="mt-3 font-mono text-[11px] text-accent">{t.independentCaja}</p>
      )}
      {entity.group_role === "independent_bank" && (
        <p className="mt-3 font-mono text-[11px] text-accent">{t.independentBank}</p>
      )}
      {entity.group_role === "cooperative_head" && (
        <p className="mt-3 font-mono text-[11px] text-accent">{t.cooperativeHead}</p>
      )}

      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] text-muted uppercase">{t.pathToGroup}</p>
        <ol className="space-y-1.5 text-sm">
          {path.map((id, index) => (
            <li key={id} className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-muted">{index + 1}</span>
              <button type="button" className="text-left text-accent hover:underline" onClick={() => onSelect(id)}>
                {label(id)}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5">
        <p className="mb-2 font-mono text-[10px] text-muted uppercase">{t.events}</p>
        {related.length === 0 ? (
          <p className="text-sm text-muted">{interpolate(t.yearEventsEmpty, { year })}</p>
        ) : (
          <ul className="space-y-2">{related.map(renderEvent)}</ul>
        )}
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

      {stories
        .filter(
          (story) =>
            story.locale === locale &&
            (story.entityId === entity.id || story.groupId === entity.id || path.includes(story.entityId)),
        )
        .slice(0, 1)
        .map((story) => (
          <button
            key={story.slug}
            type="button"
            onClick={() => onGuide?.(story.slug.replace(/-en$|-es$/, ""))}
            className="mt-5 text-left text-sm text-accent"
          >
            {t.storyLink}: {story.title}
          </button>
        ))}

      {canOpenFamily && (
        <button
          type="button"
          className="mt-5 font-mono text-[11px] text-muted hover:text-accent"
          onClick={() => setFamilyOpen((value) => !value)}
        >
          {familyOpen ? t.hideFamily : t.openFamily}
        </button>
      )}
      {familyOpen && canOpenFamily && (
        <div className="mt-3 min-h-[240px] rounded-lg border border-line bg-panel-2 p-2">
          <BankingTree
            dataset={dataset}
            year={year}
            selectedId={entity.id}
            highlight={highlight}
            groupFilter={groupFilter && groupFilter !== "surviving" ? (groupFilter as never) : (groupId as never)}
            onSelect={onSelect}
            onSelectGroup={() => undefined}
          />
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          className="font-mono text-[11px] text-muted hover:text-accent"
          onClick={() => {
            const labels = Object.fromEntries(
              dataset.entities.map((item) => [item.id, locale === "es" && item.name_es ? item.name_es : item.name]),
            );
            downloadText(`${entity.id}-path.svg`, familyPathSvg(dataset, entity.id, year, labels), "image/svg+xml");
          }}
        >
          {t.exportSvg}
        </button>
        <button
          type="button"
          className="font-mono text-[11px] text-muted hover:text-accent"
          onClick={() => {
            const labels = Object.fromEntries(
              dataset.entities.map((item) => [item.id, locale === "es" && item.name_es ? item.name_es : item.name]),
            );
            void downloadSvgAsPng(`${entity.id}-path.png`, familyPathSvg(dataset, entity.id, year, labels));
          }}
        >
          {t.exportPng}
        </button>
      </div>
    </aside>
  );
}
