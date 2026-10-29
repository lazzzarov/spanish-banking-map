import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, entityMap, eventsInYear, MAX_YEAR, pathToGroup, storyBeats } from "../lib/bankGraph";
import { explorerHref, guideKey, isLinkedQuery, parseExplorerQuery, writeExplorerQuery } from "../lib/deepLinks";
import type { RegionCollection } from "../lib/geo";
import { nextPlayableYear } from "../lib/timelineUtils";
import {
  FEATURED_GROUPS,
  type BankDataset,
  type ContextEvent,
  type FeaturedGroup,
  type Locale,
  type SourceRecord,
} from "../lib/types";
import { BankDetails } from "./BankDetails";
import { BankRail } from "./BankRail";
import { DecadePrompt } from "./DecadePrompt";
import { GuideStrip } from "./GuideStrip";
import { IntroSection } from "./IntroSection";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { SectionChevron } from "./SectionChevron";
import { SiteHeader } from "./SiteHeader";
import { SpainMap } from "./SpainMap";
import { StillHappening } from "./StillHappening";
import { Timeline } from "./Timeline";

export type GroupFilter = string | null;

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
}

function readQuery(dataset: BankDataset, search: string) {
  const ids = new Set(dataset.entities.map((entity) => entity.id));
  const query = parseExplorerQuery(search, ids);
  const group = query.entity ? currentGroupOf(dataset, query.entity, query.year ?? MAX_YEAR) : null;
  return {
    query,
    groupFilter: FEATURED_GROUPS.includes(group as FeaturedGroup) ? (group as FeaturedGroup) : null,
  };
}

function ExplorerInner({ dataset, sources, regions, stories, contextEvents = [] }: Props) {
  const { t, locale, setLocale } = useLocale();
  // The page is prerendered without a query; the address bar is read after hydration.
  const [year, setYear] = useState(MAX_YEAR);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  const [decadePromptOpen, setDecadePromptOpen] = useState(true);
  const [viewResetToken, setViewResetToken] = useState(0);
  const introSectionRef = useRef<HTMLElement>(null);
  const mapSectionRef = useRef<HTMLElement>(null);
  /** What the address bar last reflected, to tell navigation (push) from tweaks (replace). */
  const lastWritten = useRef<{ entity: string | null; guide: string | null } | null>(null);

  const pausePlay = () => setPlaying(false);

  const setYearFromUser = (next: number) => {
    pausePlay();
    setYear(next);
    setDecadePromptOpen(false);
  };

  const clearSelection = () => {
    pausePlay();
    setSelectedId(null);
  };

  /** Back to the whole map: no selection or group filter, zoom fitted. */
  const resetView = () => {
    pausePlay();
    setSelectedId(null);
    setGroupFilter(null);
    setViewResetToken((token) => token + 1);
  };

  const select = (id: string) => {
    pausePlay();
    setSelectedId(id);
  };

  /** Sets explorer state from the address bar: on load, and on Back/Forward. */
  const applyLocation = useCallback(() => {
    const { query, groupFilter: linkedGroup } = readQuery(dataset, window.location.search);
    const linked = isLinkedQuery(query);
    setSelectedId(query.entity);
    setGroupFilter(linked ? linkedGroup : null);
    setYear(query.year ?? MAX_YEAR);
    setPlaying(false);
    setGuide(query.guide);
    setGuideStep(0);
    setDecadePromptOpen(!linked);
    lastWritten.current = { entity: query.entity, guide: query.guide };
    return query;
  }, [dataset]);

  useLayoutEffect(() => {
    const query = applyLocation();
    if (query.lang) setLocale(query.lang);
    setReady(true);
    if (isLinkedQuery(query)) {
      // Jump rather than animate, and only after load so the browser's own scroll restore can't undo it.
      const jump = () => mapSectionRef.current?.scrollIntoView();
      if (document.readyState === "complete") jump();
      else window.addEventListener("load", jump, { once: true });
    }
  }, [applyLocation, setLocale]);

  useEffect(() => {
    window.addEventListener("popstate", applyLocation);
    return () => window.removeEventListener("popstate", applyLocation);
  }, [applyLocation]);

  useEffect(() => {
    if (!ready) return;
    const previous = lastWritten.current;
    // Opening or leaving a story, or picking a bank outside one, gets its own history entry.
    // Scrubbing the year and stepping through a story only update the current entry.
    const navigated =
      previous != null && (previous.guide !== guide || (!guide && previous.entity !== selectedId));
    writeExplorerQuery({ entity: selectedId, year, guide }, navigated ? "push" : "replace");
    lastWritten.current = { entity: selectedId, guide };
  }, [ready, selectedId, year, guide]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setYear((current) => {
        const next = nextPlayableYear(dataset.events, contextEvents, current, "business");
        if (next >= MAX_YEAR) setPlaying(false);
        return next;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, dataset.events, contextEvents]);

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
    setDecadePromptOpen(false);
  }, [guide, guideStep, beats]);

  const highlight = useMemo(
    () => (selectedId ? pathToGroup(dataset, selectedId, year) : []),
    [dataset, selectedId, year],
  );
  const selected = selectedId ? entityMap(dataset).get(selectedId) ?? null : null;
  const yearEvents = useMemo(() => eventsInYear(dataset.events, year, "business"), [dataset.events, year]);
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

  const openGuide = (key: string) => {
    setGuide(key);
    setGuideStep(0);
    setPlaying(false);
    setDecadePromptOpen(false);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const exitGuide = () => {
    setGuide(null);
    setGuideStep(0);
    setYear(MAX_YEAR);
    resetView();
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
  const showStillHappening = year >= 2020;

  return (
    <div className="min-h-screen">
      <SiteHeader current={guide ? "explore" : "explore"} />
      <main className="explorer-scroll">
        <section ref={introSectionRef}>
          <IntroSection
            entityCount={dataset.entities.length}
            onContinue={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
          />
        </section>

        <section ref={mapSectionRef} className="explorer-section relative mx-auto max-w-7xl px-5 py-8 md:px-8">
          <SectionChevron
            direction="prev"
            label={t.sectionBackIntro}
            onClick={() => introSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 md:flex"
          />

          <div className="mb-4 flex items-start justify-between gap-4 md:mx-8">
            <p className="text-[11px] text-accent">{t.heroKicker}</p>
            <button type="button" onClick={copyLink} className="text-[11px] text-muted hover:text-accent">
              {copied ? t.copied : t.copyLink}
            </button>
          </div>

          <div className="md:mx-8">
            <Timeline
              year={year}
              playing={playing}
              caption={caption}
              onYear={setYearFromUser}
              onToggle={() => {
                setPlaying((value) => !value);
              }}
              onReset={() => {
                setPlaying(false);
                setYear(MAX_YEAR);
                setDecadePromptOpen(false);
              }}
              context={contextEvents}
              onContext={(item) => setYearFromUser(item.year)}
            />
            {showStillHappening && (
              <div className="mt-4">
                <StillHappening sources={sources} />
              </div>
            )}

            <div className="relative mt-4 grid gap-4 lg:grid-cols-[minmax(200px,0.55fr)_minmax(0,1.2fr)_minmax(280px,0.75fr)]">
              <BankRail
                dataset={dataset}
                year={year}
                selectedId={selectedId}
                groupFilter={groupFilter}
                onSelectBank={select}
                onSelectGroup={(group) => setGroupFilter(group as GroupFilter)}
              />
              <div className="relative flex flex-col rounded-xl border border-line bg-panel p-4">
                {decadePromptOpen && (
                  <DecadePrompt
                    onPick={(startYear) => {
                      setYearFromUser(startYear);
                      setDecadePromptOpen(false);
                    }}
                    onStayPresent={() => {
                      setYear(MAX_YEAR);
                      setDecadePromptOpen(false);
                    }}
                  />
                )}
                {guide ? (
                  <GuideStrip
                    stories={stories}
                    guide={guide}
                    step={guideStep}
                    beatCount={beats.length}
                    onClose={exitGuide}
                    onStep={setGuideStep}
                    placement="top"
                  />
                ) : null}
                <SpainMap
                  dataset={dataset}
                  regions={regions}
                  year={year}
                  selectedId={selectedId}
                  highlight={highlight}
                  groupFilter={groupFilter}
                  yearEvents={yearEvents}
                  onSelect={select}
                  onClear={clearSelection}
                  onResetView={resetView}
                  viewResetToken={viewResetToken}
                />
                {guide ? (
                  <GuideStrip
                    stories={stories}
                    guide={guide}
                    step={guideStep}
                    beatCount={beats.length}
                    onClose={exitGuide}
                    onStep={setGuideStep}
                    placement="bottom"
                  />
                ) : null}
              </div>
              <BankDetails
                dataset={dataset}
                sources={sources}
                stories={stories}
                entity={panelEntity}
                year={year}
                yearEvents={yearEvents}
                onSelect={select}
                onGuide={openGuide}
                guideBeat={guideBeatText}
              />
            </div>
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
