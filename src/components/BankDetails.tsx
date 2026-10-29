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
import { downloadSvgAsPng, downloadText, familyPathSvg } from "../lib/pathExport";
import {
  ERAS,
  FEATURED_GROUPS,
  MECHANISM_LINEAGE,
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
  stories: StoryLink[];
  entity: Entity | null;
  year: number;
  yearEvents: Event[];
  onSelect: (id: string) => void;
  onGuide?: (key: string) => void;
  guideBeat?: string | null;
}

export function BankDetails({
  dataset,
  sources,
  stories,
  entity,
  year,
  yearEvents,
  onSelect,
  onGuide,
  guideBeat,
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
    <li key={event.id} className="rounded-lg bg-panel-2 px-3 py-2 text-sm text-fog">
      <span className="font-mono text-[10px] text-muted">{event.year}</span>
      <span className="mx-1 text-muted">·</span>
      {label(event.from)} → {label(event.to)}
      <span className="mx-1 text-muted">·</span>
      <span className="text-muted">{t[event.mechanism]}</span>
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
              <ul className="space-y-2">{eraEvents.map(renderEvent)}</ul>
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

  return (
    <aside className="flex h-full max-h-[min(720px,70vh)] flex-col overflow-y-auto rounded-xl border border-line bg-panel p-5">
      {guideBeat && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
          <p className="text-[11px] text-accent">{t.guideBeatTitle}</p>
          <p className="mt-1 text-sm text-fog">{guideBeat}</p>
        </div>
      )}

      <div className="flex items-start gap-3">
        <LogoBadge id={entity.id} name={displayName} groupId={groupId} />
        <div>
          <p className="text-[11px] text-muted">{entity.id}</p>
          <h2 className="mt-1 text-xl text-heading">{displayName}</h2>
        </div>
      </div>

      {summary && <p className="mt-3 text-sm leading-6 text-fog">{summary}</p>}

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
          <dd>
            {entity.status === "active" && t.statusActive}
            {entity.status === "absorbed" && t.statusAbsorbed}
            {entity.status === "rebranded" && t.statusRebranded}
            {entity.status === "resolved" && t.statusResolved}
            {entity.status === "historical_nonbank" && t.statusHistorical}
          </dd>
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
        <div>
          <dt className="text-[11px] text-muted">{t.bankingBusiness}</dt>
          <dd>
            {entity.banking_business_status === "transferred" ? t.businessTransferred : t.businessActive}
          </dd>
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
            className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-left hover:border-accent"
          >
            <p className="font-mono text-[10px] text-accent">{story.year}</p>
            <p className="mt-1 text-sm text-accent">
              {t.storyLink}: {story.title}
            </p>
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
                {t.sectionConsolidation}
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
            <h3 className="text-sm font-medium text-heading">{t.sectionConsolidation}</h3>
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
