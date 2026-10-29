import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, entityMap, eventsInYear, MAX_YEAR, pathToGroup, storyBeats } from "../lib/bankGraph";
import { explorerHref, guideKey, parseExplorerQuery, writeExplorerQuery } from "../lib/deepLinks";
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
  initialSearch?: string;
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

function ExplorerInner({ dataset, sources, regions, stories, contextEvents = [], initialSearch = "" }: Props) {
  const { t, locale, setLocale } = useLocale();
  const initial = useMemo(() => readQuery(dataset, initialSearch), [dataset, initialSearch]);
  const linked = Boolean(
    initial.query.entity || initial.query.year != null || initial.query.guide || initial.query.guides,
  );
  const [year, setYear] = useState(initial.query.year ?? MAX_YEAR);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initial.query.entity);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>(linked ? initial.groupFilter : null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [guide, setGuide] = useState<string | null>(initial.query.guide);
  const [guideStep, setGuideStep] = useState(0);
  const [decadePromptOpen, setDecadePromptOpen] = useState(!linked);
  const introSectionRef = useRef<HTMLElement>(null);
  const mapSectionRef = useRef<HTMLElement>(null);

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

  const select = (id: string) => {
    pausePlay();
    setSelectedId(id);
  };

  useLayoutEffect(() => {
    const fromWindow = readQuery(dataset, window.location.search || initialSearch);
    const windowLinked = Boolean(
      fromWindow.query.entity || fromWindow.query.year != null || fromWindow.query.guide || fromWindow.query.guides,
    );
    setSelectedId(fromWindow.query.entity);
    setGroupFilter(windowLinked ? fromWindow.groupFilter : null);
    setYear(fromWindow.query.year ?? MAX_YEAR);
    setPlaying(false);
    setGuide(fromWindow.query.guide);
    setDecadePromptOpen(!windowLinked);
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
      guides: false,
    });
  }, [ready, selectedId, year, locale, guide]);

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
              <div className="relative rounded-xl border border-line bg-panel p-4">
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
