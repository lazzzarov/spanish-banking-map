import { useState } from "react";
import {
  currentGroupOf,
  entityMap,
  eventsForEntity,
  firstSeenYear,
  MAX_YEAR,
  MIN_YEAR,
  pathToGroup,
} from "../lib/bankGraph";
import { interpolate } from "../i18n";
import { eventSentence, fateEvent, fateSentence } from "../lib/eventText";
import { formatEuroBn } from "../lib/format";
import { downloadSvgAsPng, downloadText, familyPathSvg } from "../lib/pathExport";
import {
  ERAS,
  FEATURED_GROUPS,
  MECHANISM_LINEAGE,
  type AssetRecord,
  type BankDataset,
  type Entity,
  type Event,
  type SourceRecord,
} from "../lib/types";
import { FamilyOverlay } from "./FamilyOverlay";
import type { StoryLink } from "./Explorer";
import { LogoBadge } from "./LogoBadge";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  sources: SourceRecord[];
  assets: Map<string, AssetRecord>;
  stories: StoryLink[];
  entity: Entity | null;
  year: number;
  yearEvents: Event[];
  onSelect: (id: string) => void;
  onGuide?: (key: string) => void;
}

export function BankDetails({
  dataset,
  sources,
  assets,
  stories,
  entity,
  year,
  yearEvents,
  onSelect,
  onGuide,
}: Props) {
  const { t, locale } = useLocale();
  const [familyOpen, setFamilyOpen] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const byId = entityMap(dataset);

  const label = (id: string) => {
    const found = byId.get(id);
    if (!found) return id;
    return locale === "es" && found.name_es ? found.name_es : found.name;
  };

  const renderEvent = (event: Event) => (
    <li key={event.id} className="flex gap-3 text-[13px] leading-snug">
      <span className="min-w-9 font-mono text-accent">{event.year}</span>
      <span className="text-fog">{eventSentence(t, event, label)}</span>
    </li>
  );

  const renderByEra = (items: Event[]) => {
    const eras = ERAS.filter((era) => items.some((event) => event.year >= era.from && event.year <= era.to));
    return (
      <div className="space-y-4">
        {eras.map((era) => {
          const eraEvents = items.filter((event) => event.year >= era.from && event.year <= era.to);
          if (eraEvents.length === 0) return null;
          return (
            <div key={era.id}>
              <p className="mb-1 font-mono text-[10px] text-accent">{era.label}</p>
              <ol className="space-y-2.5">{eraEvents.map(renderEvent)}</ol>
            </div>
          );
        })}
      </div>
    );
  };

  if (!entity) {
    const preview = yearEvents.slice(0, 4);
    return (
      <aside className="flex h-full flex-col rounded-xl border border-line bg-panel p-5">
        <p className="text-sm font-medium text-heading">{t.historyTitle}</p>
        <p className="mt-3 text-sm text-muted">{t.historyIdle}</p>
        <p className="mt-6 text-[11px] text-muted">{t.thisYear}</p>
        {preview.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{interpolate(t.yearEventsEmpty, { year })}</p>
        ) : (
          <div className="mt-2">{renderByEra(preview)}</div>
        )}
      </aside>
    );
  }

  const groupId = currentGroupOf(dataset, entity.id, year);
  const presentGroupId = currentGroupOf(dataset, entity.id, MAX_YEAR);
  const group = byId.get(groupId);
  const presentGroup = byId.get(presentGroupId);
  const path = pathToGroup(dataset, entity.id, year);
  const allRelated = eventsForEntity(dataset.events, entity.id);
  const related = allRelated.filter(
    (event) => event.lineage && event.outcome === "completed" && MECHANISM_LINEAGE[event.mechanism],
  );
  const sideEvents = allRelated.filter(
    (event) => !(event.lineage && event.outcome === "completed" && MECHANISM_LINEAGE[event.mechanism]),
  );
  const visibleEvents = showAllEvents ? related : related.slice(-6);
  const hiddenCount = Math.max(0, related.length - visibleEvents.length);
  const visibleSide = showAllEvents ? sideEvents : sideEvents.slice(-4);
  const showPresentGroupFootnote = year < MAX_YEAR && presentGroupId !== groupId;
  const source = sources.find((item) => item.id === entity.src);
  const eventSources = [
    ...new Set(related.map((event) => event.src).filter((id) => id && id !== "check")),
  ]
    .map((id) => sources.find((item) => item.id === id))
    .filter(Boolean) as SourceRecord[];
  const canOpenFamily = FEATURED_GROUPS.includes(groupId as (typeof FEATURED_GROUPS)[number]);
  const displayName = locale === "es" && entity.name_es ? entity.name_es : entity.name;
  const summary = locale === "es" && entity.summary_es ? entity.summary_es : entity.summary;
  const seen = firstSeenYear(dataset, entity.id);
  const fate = entity.status === "active" ? null : fateEvent(dataset, entity.id);
  const fateText = fate ? fateSentence(t, fate, label) : null;
  const statusLabel = {
    active: t.statusActive,
    absorbed: t.statusAbsorbed,
    rebranded: t.statusRebranded,
    resolved: t.statusResolved,
    historical_nonbank: t.statusHistorical,
  }[entity.status];
  const isHead = canOpenFamily && groupId === entity.id;
  const assetRecord = assets.get(entity.id) ?? null;
  const assetSource = assetRecord ? sources.find((item) => item.id === assetRecord.src) : undefined;
  const familySize = isHead
    ? dataset.entities.filter((item) => currentGroupOf(dataset, item.id, MAX_YEAR) === entity.id).length
    : 0;

  return (
    <aside className="flex h-full flex-col overflow-y-auto rounded-xl border border-line bg-panel p-5 lg:max-h-[min(860px,85vh)]">
      <div className="flex items-center gap-3">
        <LogoBadge id={entity.id} name={displayName} groupId={groupId} />
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-heading">{displayName}</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {fateText ?? [statusLabel, entity.founded ? `${t.founded} ${entity.founded}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {entity.status === "historical_nonbank" && (
        <div className="mt-3 rounded-lg bg-panel-2 px-3 py-2">
          <p className="text-xs font-semibold text-heading">{t.statusHistorical}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t.statusHistoricalHelp}</p>
        </div>
      )}

      {summary && <p className="mt-3 text-sm leading-6 text-fog">{summary}</p>}

      {assetRecord && (
        <div className="mt-4 rounded-lg border border-[var(--deal)]/40 bg-[var(--deal)]/10 px-3 py-2.5">
          <p className="font-mono text-xl text-heading">
            {formatEuroBn(assetRecord.total_assets_eur_bn, locale)}
            <span className="ml-2 font-sans text-xs text-muted">
              {interpolate(t.assetsLabel, { year: assetRecord.year })}
              {assetSource?.url ? (
                <>
                  {" · "}
                  <a href={assetSource.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {assetSource.publisher}
                  </a>
                </>
              ) : null}
            </span>
          </p>
          <p className="mt-1 text-xs font-semibold text-fog">
            {assetRecord.basis === "group" ? t.assetsGroupNote : t.assetsEntityNote}
          </p>
          {assetRecord.note ? <p className="mt-1 text-xs text-muted">{assetRecord.note}</p> : null}
        </div>
      )}

      {isHead && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-panel-2 px-3 py-2.5">
            <p className="font-mono text-xl text-heading">{familySize}</p>
            <p className="mt-0.5 text-xs text-muted">{t.detailFamily}</p>
          </div>
          <div className="rounded-lg bg-panel-2 px-3 py-2.5">
            <p className="font-mono text-xl text-heading">{related.length}</p>
            <p className="mt-0.5 text-xs text-muted">{t.detailDeals}</p>
          </div>
        </div>
      )}

      {(entity.founded == null || seen !== entity.founded) && seen > MIN_YEAR && (
        <p className="mt-2 text-xs text-muted">{interpolate(t.appearsInYear, { year: seen })}</p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] text-muted">{t.founded}</dt>
          <dd>{entity.founded ?? t.none}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted">{t.status}</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[11px] text-muted">{interpolate(t.groupInYear, { year })}</dt>
          <dd>{group ? label(group.id) : groupId}</dd>
          {showPresentGroupFootnote && (
            <dd className="mt-1 text-xs text-accent">
              {interpolate(t.presentDayGroup, {
                group: presentGroup ? label(presentGroup.id) : presentGroupId,
              })}
            </dd>
          )}
        </div>
      </dl>

      {entity.group_role === "independent_caja" && (
        <p className="mt-3 text-[11px] text-accent">{t.independentCaja}</p>
      )}
      {entity.group_role === "independent_bank" && (
        <p className="mt-3 text-[11px] text-accent">{t.independentBank}</p>
      )}
      {entity.group_role === "cooperative_head" && (
        <p className="mt-3 text-[11px] text-accent">{t.cooperativeHead}</p>
      )}

      {stories
        .filter(
          (story) =>
            story.locale === locale &&
            (story.entityId === entity.id || story.groupId === entity.id || path.includes(story.entityId)),
        )
        .map((story) => (
          <button
            key={story.slug}
            type="button"
            onClick={() => onGuide?.(story.slug.replace(/-en$|-es$/, ""))}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg bg-accent/10 px-3.5 py-3 text-left text-sm font-semibold text-accent hover:bg-accent/15"
          >
            <span>
              {t.storyKicker}: {story.title}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        ))}

      <section className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-medium text-heading">{t.pathToGroup}</h3>
        <ol className="mt-3 space-y-0">
          {path.map((id, index) => {
            const isCurrent = id === entity.id;
            return (
              <li key={id} className="relative flex gap-3 pb-3 last:pb-0">
                {index < path.length - 1 ? (
                  <span className="absolute left-[11px] top-7 bottom-0 w-px bg-line" aria-hidden />
                ) : null}
                <span
                  className={`relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                    isCurrent ? "bg-accent text-white" : "bg-panel-2 text-muted"
                  }`}
                >
                  {index + 1}
                </span>
                <button
                  type="button"
                  className={`pt-0.5 text-left text-sm ${isCurrent ? "font-medium text-heading" : "text-accent hover:underline"}`}
                  onClick={() => onSelect(id)}
                >
                  {label(id)}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-6 border-t border-line pt-5">
        {related.length > 6 ? (
          <details className="group">
            <summary className="cursor-pointer list-none text-sm font-medium text-heading marker:content-none">
              <span className="flex items-center justify-between gap-2">
                {t.detailTimeline}
                <span className="font-mono text-[10px] font-normal text-muted">{related.length}</span>
              </span>
            </summary>
            <div className="mt-3">
              {related.length === 0 ? (
                <p className="text-sm text-muted">{t.noConsolidationEvents}</p>
              ) : (
                <>
                  {renderByEra(visibleEvents)}
                  {hiddenCount > 0 && (
                    <button type="button" className="mt-2 text-xs text-accent" onClick={() => setShowAllEvents(true)}>
                      {interpolate(t.eventsMore, { count: hiddenCount })}
                    </button>
                  )}
                  {showAllEvents && related.length > 6 && (
                    <button type="button" className="mt-2 block text-xs text-muted" onClick={() => setShowAllEvents(false)}>
                      {t.eventsFewer}
                    </button>
                  )}
                </>
              )}
            </div>
          </details>
        ) : (
          <>
            <h3 className="text-sm font-medium text-heading">{t.detailTimeline}</h3>
            <div className="mt-3">
              {related.length === 0 ? (
                <p className="text-sm text-muted">{t.noConsolidationEvents}</p>
              ) : (
                renderByEra(visibleEvents)
              )}
            </div>
          </>
        )}
      </section>

      {sideEvents.length > 0 && (
        <details className="mt-6 border-t border-line pt-5">
          <summary className="cursor-pointer text-sm font-medium text-heading">{t.sectionOtherMoves}</summary>
          <p className="mt-2 text-xs text-muted">{t.sideEventsHint}</p>
          <div className="mt-3">{renderByEra(visibleSide)}</div>
        </details>
      )}

      <details className="mt-6 border-t border-line pt-5">
        <summary className="cursor-pointer text-sm font-medium text-heading">{t.sourcesToggle}</summary>
        <ul className="mt-2 space-y-2 text-sm">
          {source && (
            <li>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className="text-accent">
                  {locale === "es" ? source.title_es : source.title}
                </a>
              ) : (
                <span className="text-warn">{t.unverifiedNote}</span>
              )}
            </li>
          )}
          {eventSources
            .filter((item) => item.id !== source?.id)
            .map((item) => (
              <li key={item.id}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-accent">
                    {locale === "es" ? item.title_es : item.title}
                  </a>
                ) : (
                  item.id
                )}
              </li>
            ))}
        </ul>
      </details>

      {canOpenFamily && (
        <button type="button" className="mt-6 text-sm text-accent" onClick={() => setFamilyOpen(true)}>
          {t.openFamily}
        </button>
      )}

      <div className="mt-4 flex gap-3 border-t border-line pt-4">
        <button
          type="button"
          className="text-[11px] text-muted hover:text-accent"
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
          className="text-[11px] text-muted hover:text-accent"
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

      {familyOpen && (
        <FamilyOverlay
          dataset={dataset}
          groupId={groupId}
          year={year}
          selectedId={entity.id}
          onSelect={onSelect}
          onClose={() => setFamilyOpen(false)}
        />
      )}
    </aside>
  );
}
