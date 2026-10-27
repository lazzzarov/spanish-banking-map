import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, entityMap, MAX_YEAR, MIN_YEAR, pathToGroup } from "../lib/bankGraph";
import { explorerHref, parseExplorerQuery, writeExplorerQuery } from "../lib/deepLinks";
import type { RegionCollection } from "../lib/geo";
import { nextYear } from "../lib/timelineUtils";
import {
  FEATURED_GROUPS,
  type BankDataset,
  type ContextEvent,
  type FeaturedGroup,
  type GraphLayer,
  type Locale,
  type SourceRecord,
} from "../lib/types";
import { BankDetails } from "./BankDetails";
import { BankingTree } from "./BankingTree";
import { FilterControls } from "./FilterControls";
import { GenealogyStats } from "./GenealogyStats";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { MechanismLegend } from "./MechanismLegend";
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
  const [year, setYear] = useState(initial.query.year);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initial.query.entity);
  const [groupFilter, setGroupFilter] = useState<FeaturedGroup | null>(initial.groupFilter);
  const [survivingOnly, setSurvivingOnly] = useState(false);
  const [layer, setLayer] = useState<GraphLayer>("business");
  const [contextNote, setContextNote] = useState<ContextEvent | null>(null);
  const [mobileTab, setMobileTab] = useState<"map" | "tree">("map");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const fromWindow = readQuery(dataset, window.location.search || initialSearch);
    setSelectedId(fromWindow.query.entity);
    setGroupFilter(fromWindow.groupFilter);
    setYear(fromWindow.query.year);
    if (fromWindow.query.lang) setLocale(fromWindow.query.lang);
    else if (initial.query.lang) setLocale(initial.query.lang);
    setReady(true);
  }, [dataset, initial.query.lang, initialSearch, setLocale]);

  useEffect(() => {
    if (!ready) return;
    writeExplorerQuery({ entity: selectedId, year, lang: locale });
  }, [ready, selectedId, year, locale]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setYear((current) => {
        const next = nextYear(current);
        if (next >= MAX_YEAR) setPlaying(false);
        return next;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing]);

  const highlight = useMemo(
    () => (selectedId ? pathToGroup(dataset, selectedId, year) : []),
    [dataset, selectedId, year],
  );
  const selected = selectedId ? entityMap(dataset).get(selectedId) ?? null : null;
  const select = (id: string) => {
    setSelectedId(id);
    const group = currentGroupOf(dataset, id);
    if (FEATURED_GROUPS.includes(group as FeaturedGroup)) {
      setGroupFilter(group as FeaturedGroup);
    }
  };
  const selectFromSearch = (id: string) => {
    select(id);
    setMobileTab("tree");
  };

  const copyLink = async () => {
    const href = `${window.location.origin}${explorerHref({ entity: selectedId, year, lang: locale })}`;
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
      <SiteHeader current="explore" />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.heroKicker}</p>
          <button
            type="button"
            onClick={copyLink}
            className="font-mono text-[11px] text-muted hover:text-accent"
          >
            {copied ? t.copied : t.copyLink}
          </button>
        </div>
        <h1 className="mt-3 text-3xl leading-none tracking-tight text-white md:whitespace-nowrap md:text-4xl lg:text-5xl">
          {t.heroTitle}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">
          {interpolate(t.heroLead, { count: dataset.entities.length })}
        </p>
        <p className="mt-3 max-w-2xl text-xs text-muted">{t.scopeCaveat}</p>

        <div className="mt-8">
          <StillHappening sources={sources} />
        </div>

        <div className="mt-8">
          <SearchBar entities={dataset.entities} onSelect={selectFromSearch} />
        </div>

        <div className="mt-6">
          <FilterControls
            selected={groupFilter}
            onChange={(group) => {
              setSurvivingOnly(false);
              setGroupFilter(group);
            }}
            survivingOnly={survivingOnly}
            onSurviving={setSurvivingOnly}
            layer={layer}
            onLayer={(next) => {
              setLayer(next);
              if (next !== "context") setContextNote(null);
            }}
          />
        </div>

        <div className="mt-4 flex gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("map")}
            className={`flex-1 rounded-lg border px-3 py-2 font-mono text-[11px] ${
              mobileTab === "map" ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {t.tabMap}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("tree")}
            className={`flex-1 rounded-lg border px-3 py-2 font-mono text-[11px] ${
              mobileTab === "tree" ? "border-accent text-accent" : "border-line text-muted"
            }`}
          >
            {t.tabTree}
          </button>
        </div>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={`rounded-xl border border-line bg-panel p-4 ${mobileTab === "map" ? "block" : "hidden"} md:block`}>
            <SpainMap
              dataset={dataset}
              regions={regions}
              year={year}
              selectedId={selectedId}
              highlight={highlight}
              groupFilter={groupFilter}
              survivingOnly={survivingOnly}
              onSelect={select}
            />
          </div>
          <div className={`rounded-xl border border-line bg-panel p-4 ${mobileTab === "tree" ? "block" : "hidden"} md:block`}>
            <BankingTree
              dataset={dataset}
              year={year}
              selectedId={selectedId}
              highlight={highlight}
              groupFilter={groupFilter}
              onSelect={select}
              onSelectGroup={setGroupFilter}
            />
          </div>
        </section>

        <div className="mt-4">
          <GenealogyStats dataset={dataset} year={year} />
        </div>

        <div className="mt-4">
          <Timeline
            year={year}
            playing={playing}
            onYear={setYear}
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
            }}
          />
        {contextNote && (
          <div className="mt-3 rounded-xl border border-line bg-panel px-5 py-4">
            <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">{contextNote.year}</p>
            <h3 className="mt-1 text-lg text-white">{locale === "es" ? contextNote.name_es : contextNote.name}</h3>
            <p className="mt-2 text-sm text-fog/90">
              {locale === "es" ? contextNote.description_es : contextNote.description}
            </p>
          </div>
        )}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-panel px-5 py-4">
          <MechanismLegend />
        </div>
      </main>

      <BankDetails
        dataset={dataset}
        sources={sources}
        stories={stories}
        entity={selected}
        year={year}
        onClose={() => setSelectedId(null)}
        onSelect={select}
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
