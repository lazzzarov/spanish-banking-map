import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, entityMap, eventsInYear, MAX_YEAR, MIN_YEAR, pathToGroup, storyBeats } from "../lib/bankGraph";
import { explorerHref, guideKey, parseExplorerQuery, writeExplorerQuery } from "../lib/deepLinks";
import type { RegionCollection } from "../lib/geo";
import { nextPlayableYear } from "../lib/timelineUtils";
import {
  ERAS,
  FEATURED_GROUPS,
  OTHER_SURVIVORS,
  type BankDataset,
  type ContextEvent,
  type FeaturedGroup,
  type GraphLayer,
  type Locale,
  type SourceRecord,
} from "../lib/types";
import { BankDetails } from "./BankDetails";
import { FilterControls, type GroupFilter } from "./FilterControls";
import { GenealogyStats } from "./GenealogyStats";
import { GuideModal } from "./GuideModal";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SearchBar } from "./SearchBar";
import { SiteHeader } from "./SiteHeader";
import { SpainMap } from "./SpainMap";
import { StillHappening } from "./StillHappening";
import { Timeline } from "./Timeline";

export interface StoryLink {
  slug: string;
  entityId: string;
  groupId: string;
  year: number;
  locale: Locale;
  title: string;
  body: string;
}

interface Props {
  dataset: BankDataset;
  sources: SourceRecord[];
  regions: RegionCollection;
  stories: StoryLink[];
  contextEvents?: ContextEvent[];
  initialSearch?: string;
}

function readQuery(dataset: BankDataset, search: string) {
  const ids = new Set(dataset.entities.map((entity) => entity.id));
  const query = parseExplorerQuery(search, ids);
  const group = query.entity ? currentGroupOf(dataset, query.entity) : null;
  return {
    query,
    groupFilter: FEATURED_GROUPS.includes(group as FeaturedGroup) ? (group as FeaturedGroup) : null,
  };
}

function ExplorerInner({ dataset, sources, regions, stories, contextEvents = [], initialSearch = "" }: Props) {
  const { t, locale, setLocale } = useLocale();
  const initial = useMemo(() => readQuery(dataset, initialSearch), [dataset, initialSearch]);
  const linked = Boolean(
    initial.query.entity || initial.query.year != null || initial.query.guide || initial.query.guides,
  );
  const [year, setYear] = useState(initial.query.year ?? (linked ? MAX_YEAR : MIN_YEAR));
  const [playing, setPlaying] = useState(!linked);
  const [selectedId, setSelectedId] = useState<string | null>(initial.query.entity);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(initial.groupFilter);
  const [layer, setLayer] = useState<GraphLayer>("business");
  const [contextNote, setContextNote] = useState<ContextEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [guide, setGuide] = useState<string | null>(initial.query.guide);
  const [guidesOpen, setGuidesOpen] = useState(initial.query.guides && !initial.query.guide);
  const [guideStep, setGuideStep] = useState(0);

  const pausePlay = () => setPlaying(false);

  const setYearFromUser = (next: number) => {
    pausePlay();
    setYear(next);
  };

  useLayoutEffect(() => {
    const fromWindow = readQuery(dataset, window.location.search || initialSearch);
    const windowLinked = Boolean(
      fromWindow.query.entity || fromWindow.query.year != null || fromWindow.query.guide || fromWindow.query.guides,
    );
    setSelectedId(fromWindow.query.entity);
    setGroupFilter(fromWindow.groupFilter);
    setYear(fromWindow.query.year ?? (windowLinked ? MAX_YEAR : MIN_YEAR));
    setPlaying(!windowLinked);
    setGuide(fromWindow.query.guide);
    setGuidesOpen(fromWindow.query.guides && !fromWindow.query.guide);
    if (fromWindow.query.lang) setLocale(fromWindow.query.lang);
    else if (initial.query.lang) setLocale(initial.query.lang);
    setReady(true);
  }, [dataset, initial.query.lang, initialSearch, setLocale]);

  useEffect(() => {
    if (!ready) return;
    writeExplorerQuery({
      entity: selectedId,
      year,
      lang: locale,
      guide,
      guides: guidesOpen && !guide,
    });
  }, [ready, selectedId, year, locale, guide, guidesOpen]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setYear((current) => {
        const next = nextPlayableYear(dataset.events, contextEvents, current, layer);
        if (next >= MAX_YEAR) setPlaying(false);
        return next;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing, dataset.events, contextEvents, layer]);

  const currentGuide = stories.find((story) => story.locale === locale && guideKey(story.slug) === guide);
  const beats = currentGuide
    ? storyBeats(currentGuide.body, { entityId: currentGuide.entityId, year: currentGuide.year })
    : [];

  useEffect(() => {
    const beat = beats[guideStep];
    if (!beat) return;
    setSelectedId(beat.entityId);
    setYear(beat.year);
    setPlaying(false);
  }, [guide, guideStep, currentGuide?.slug]);

  const highlight = useMemo(
    () => (selectedId ? pathToGroup(dataset, selectedId, year) : []),
    [dataset, selectedId, year],
  );
  const selected = selectedId ? entityMap(dataset).get(selectedId) ?? null : null;
  const yearEvents = useMemo(() => eventsInYear(dataset.events, year, layer), [dataset.events, year, layer]);
  const era = ERAS.find((item) => year >= item.from && year <= item.to);
  const caption =
    yearEvents.length > 0
      ? yearEvents
          .slice(0, 3)
          .map((event) => {
            const from = entityMap(dataset).get(event.from);
            const to = entityMap(dataset).get(event.to);
            return `${from?.name ?? event.from} → ${to?.name ?? event.to}`;
          })
          .join(" · ")
      : interpolate(t.yearEventsEmpty, { year });

  const select = (id: string) => {
    pausePlay();
    setSelectedId(id);
    const group = currentGroupOf(dataset, id);
    if (FEATURED_GROUPS.includes(group as FeaturedGroup) || OTHER_SURVIVORS.includes(group as (typeof OTHER_SURVIVORS)[number])) {
      setGroupFilter(group);
    }
  };

  const openGuide = (key: string) => {
    setGuide(key);
    setGuideStep(0);
    setGuidesOpen(false);
    setPlaying(false);
  };

  const copyLink = async () => {
    const href = `${window.location.origin}${explorerHref({
      entity: selectedId,
      year,
      lang: locale,
      guide,
    })}`;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Address bar already holds the same deep link. */
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader current={guide || guidesOpen ? "stories" : "explore"} />
      <main className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.heroKicker}</p>
          <button type="button" onClick={copyLink} className="font-mono text-[11px] text-muted hover:text-accent">
            {copied ? t.copied : t.copyLink}
          </button>
        </div>
        <h1 className="mt-3 text-3xl leading-none tracking-tight text-heading md:text-4xl lg:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted md:text-base">
          {interpolate(t.heroLead, { count: dataset.entities.length })}
        </p>
        <p className="mt-2 max-w-2xl text-xs text-muted">{t.scopeCaveat}</p>

        <div className="mt-6">
          <Timeline
            year={year}
            playing={playing}
            caption={era ? `${era.label}. ${caption}` : caption}
            onYear={setYearFromUser}
            onToggle={() => {
              if (!playing && year >= MAX_YEAR) setYear(MIN_YEAR);
              setPlaying((value) => !value);
            }}
            onReset={() => {
              setPlaying(false);
              setYear(MAX_YEAR);
            }}
            context={layer === "context" || layer === "business" ? contextEvents : []}
            onContext={(item) => {
              setLayer("context");
              setContextNote(item);
              setYearFromUser(item.year);
            }}
          />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SearchBar entities={dataset.entities} onSelect={select} />
          <FilterControls
            selected={groupFilter}
            onChange={(group) => setGroupFilter(group)}
            layer={layer}
            onLayer={(next) => {
              setLayer(next);
              if (next !== "context") setContextNote(null);
            }}
          />
        </div>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <div className="rounded-xl border border-line bg-panel p-4">
            <SpainMap
              dataset={dataset}
              regions={regions}
              year={year}
              selectedId={selectedId}
              highlight={highlight}
              groupFilter={groupFilter === "surviving" ? null : groupFilter}
              survivingOnly={groupFilter === "surviving"}
              yearEvents={yearEvents}
              layer={layer}
              emptyMessage={yearEvents.length === 0 && layer !== "context" ? t.layerEmpty : undefined}
              onSelect={select}
            />
            {contextNote && layer === "context" && (
              <div className="mt-3 rounded-xl border border-line bg-panel-2 px-4 py-3">
                <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">{contextNote.year}</p>
                <h3 className="mt-1 text-lg text-heading">
                  {locale === "es" ? contextNote.name_es : contextNote.name}
                </h3>
                <p className="mt-2 text-sm text-fog">
                  {locale === "es" ? contextNote.description_es : contextNote.description}
                </p>
              </div>
            )}
          </div>
          <BankDetails
            dataset={dataset}
            sources={sources}
            stories={stories}
            entity={selected}
            year={year}
            yearEvents={yearEvents}
            layer={layer}
            groupFilter={groupFilter}
            highlight={highlight}
            onSelect={select}
            onGuide={openGuide}
          />
        </section>

        <div className="mt-4">
          <GenealogyStats dataset={dataset} year={year} />
        </div>

        {year >= 2025 && (
          <div className="mt-4">
            <StillHappening sources={sources} />
          </div>
        )}
      </main>

      <GuideModal
        stories={stories}
        guide={guide}
        pickerOpen={guidesOpen}
        step={guideStep}
        onPick={openGuide}
        onClose={() => {
          setGuide(null);
          setGuidesOpen(false);
          setGuideStep(0);
        }}
        onStep={setGuideStep}
      />
    </div>
  );
}

export default function Explorer(props: Props) {
  return (
    <LocaleProvider>
      <ExplorerInner {...props} />
    </LocaleProvider>
  );
}
