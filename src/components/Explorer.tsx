import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, entityMap, eventsInYear, MAX_YEAR, MIN_YEAR, pathToGroup, storyBeats } from "../lib/bankGraph";
import { explorerHref, guideKey, parseExplorerQuery, writeExplorerQuery } from "../lib/deepLinks";
import type { RegionCollection } from "../lib/geo";
import { nearestPlayableYear, nextPlayableYear } from "../lib/timelineUtils";
import {
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
import { BankRail } from "./BankRail";
import { GenealogyStats } from "./GenealogyStats";
import { GuideStrip } from "./GuideStrip";
import { IntroSection } from "./IntroSection";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SiteHeader } from "./SiteHeader";
import { SpainMap } from "./SpainMap";
import { StillHappening } from "./StillHappening";
import { Timeline } from "./Timeline";

export type GroupFilter = string | "surviving" | null;

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
  const mapSectionRef = useRef<HTMLElement>(null);

  const pausePlay = () => setPlaying(false);

  const setYearFromUser = (next: number) => {
    pausePlay();
    setYear(next);
  };

  const clearSelection = () => {
    pausePlay();
    setSelectedId(null);
    setGroupFilter(null);
  };

  const select = (id: string) => {
    pausePlay();
    setSelectedId(id);
    setYear(MAX_YEAR);
    const group = currentGroupOf(dataset, id);
    if (FEATURED_GROUPS.includes(group as FeaturedGroup) || OTHER_SURVIVORS.includes(group as (typeof OTHER_SURVIVORS)[number])) {
      setGroupFilter(group);
    }
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
    if (!ready || !linked) return;
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ready, linked]);

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
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, dataset.events, contextEvents, layer]);

  const currentGuide = stories.find((story) => story.locale === locale && guideKey(story.slug) === guide);
  const beats = useMemo(
    () =>
      currentGuide
        ? storyBeats(currentGuide.body, { entityId: currentGuide.entityId, year: currentGuide.year }, dataset)
        : [],
    [currentGuide, dataset],
  );

  useEffect(() => {
    const beat = beats[guideStep];
    if (!beat || !guide) return;
    setSelectedId(beat.entityId);
    setYear(beat.year);
    setPlaying(false);
  }, [guide, guideStep, beats]);

  const highlight = useMemo(
    () => (selectedId ? pathToGroup(dataset, selectedId, year) : []),
    [dataset, selectedId, year],
  );
  const selected = selectedId ? entityMap(dataset).get(selectedId) ?? null : null;
  const yearEvents = useMemo(() => eventsInYear(dataset.events, year, layer), [dataset.events, year, layer]);
  const caption =
    yearEvents.length > 0
      ? yearEvents
          .slice(0, 2)
          .map((event) => {
            const from = entityMap(dataset).get(event.from);
            const to = entityMap(dataset).get(event.to);
            return `${from?.name ?? event.from} → ${to?.name ?? event.to}`;
          })
          .join(" · ")
      : interpolate(t.yearEventsEmpty, { year });

  const layerBanner =
    layer === "ownership"
      ? t.layerBannerOwnership
      : layer === "asset"
        ? t.layerBannerAsset
        : layer === "context"
          ? t.layerBannerContext
          : t.layerBannerBusiness;

  const openGuide = (key: string) => {
    setGuide(key);
    setGuideStep(0);
    setGuidesOpen(false);
    setPlaying(false);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const exitGuide = () => {
    setGuide(null);
    setGuidesOpen(false);
    setGuideStep(0);
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

  const guideBeatText = guide && beats[guideStep] ? beats[guideStep].text : null;
  const panelEntity = guide && beats[guideStep] ? entityMap(dataset).get(beats[guideStep].entityId) ?? selected : selected;

  return (
    <div className="min-h-screen">
      <SiteHeader current={guide || guidesOpen ? "stories" : "explore"} />
      <main className="explorer-scroll">
        <IntroSection
          entityCount={dataset.entities.length}
          onContinue={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
        />

        <section ref={mapSectionRef} className="explorer-section mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <p className="text-[11px] text-accent">{t.heroKicker}</p>
            <button type="button" onClick={copyLink} className="text-[11px] text-muted hover:text-accent">
              {copied ? t.copied : t.copyLink}
            </button>
          </div>

          <Timeline
            year={year}
            playing={playing}
            caption={caption}
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

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(200px,0.55fr)_minmax(0,1.2fr)_minmax(280px,0.75fr)]">
            <BankRail
              dataset={dataset}
              year={year}
              selectedId={selectedId}
              groupFilter={groupFilter}
              onSelectBank={select}
              onSelectGroup={(group) => setGroupFilter(group as GroupFilter)}
            />
            <div className="relative rounded-xl border border-line bg-panel p-4">
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
                banner={layerBanner}
                emptyMessage={yearEvents.length === 0 && layer !== "context" ? t.layerEmpty : undefined}
                onSelect={select}
                onClear={clearSelection}
                onLayer={(next) => {
                  setLayer(next);
                  if (next !== "context") setContextNote(null);
                  setYear((current) => nearestPlayableYear(dataset.events, contextEvents, current, next));
                }}
              />
              {contextNote && layer === "context" && (
                <div className="mt-3 rounded-xl border border-line bg-panel-2 px-4 py-3">
                  <p className="text-[11px] text-accent">{contextNote.year}</p>
                  <h3 className="mt-1 text-lg text-heading">
                    {locale === "es" ? contextNote.name_es : contextNote.name}
                  </h3>
                  <p className="mt-2 text-sm text-fog">
                    {locale === "es" ? contextNote.description_es : contextNote.description}
                  </p>
                </div>
              )}
              <GuideStrip
                dataset={dataset}
                stories={stories}
                guide={guide}
                pickerOpen={guidesOpen}
                step={guideStep}
                onPick={openGuide}
                onClose={exitGuide}
                onStep={setGuideStep}
              />
            </div>
            <BankDetails
              dataset={dataset}
              sources={sources}
              stories={stories}
              entity={panelEntity}
              year={year}
              yearEvents={yearEvents}
              layer={layer}
              onSelect={select}
              onGuide={openGuide}
              guideBeat={guideBeatText}
            />
          </div>
        </section>

        <section className="explorer-section mx-auto max-w-6xl px-5 py-12 md:px-8">
          <h2 className="text-2xl text-heading">{t.sectionFacts}</h2>
          <div className="mt-6">
            <GenealogyStats dataset={dataset} year={year} />
          </div>
          <div className="mt-6">
            <StillHappening sources={sources} />
          </div>
        </section>
      </main>
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
