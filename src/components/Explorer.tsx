import { useEffect, useMemo, useState } from "react";
import { interpolate } from "../i18n";
import { entityMap, MAX_YEAR, MIN_YEAR, pathToGroup } from "../lib/bankGraph";
import { nextYear } from "../lib/timelineUtils";
import type { BankDataset, FeaturedGroup, SourceRecord } from "../lib/types";
import { BankDetails } from "./BankDetails";
import { BankingTree } from "./BankingTree";
import { FilterControls } from "./FilterControls";
import { LocaleProvider, useLocale } from "./LocaleContext";
import { MechanismLegend } from "./MechanismLegend";
import { SearchBar } from "./SearchBar";
import { SiteHeader } from "./SiteHeader";
import { SpainMap } from "./SpainMap";
import { StillHappening } from "./StillHappening";
import { Timeline } from "./Timeline";

interface GeoCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: { id: string; name: string; name_es: string };
    geometry: GeoJSON.Polygon;
  }[];
}

interface Props {
  dataset: BankDataset;
  sources: SourceRecord[];
  regions: GeoCollection;
}

function ExplorerInner({ dataset, sources, regions }: Props) {
  const { t } = useLocale();
  const [year, setYear] = useState(MAX_YEAR);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<FeaturedGroup | null>(null);
  const [mobileTab, setMobileTab] = useState<"map" | "tree">("map");

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
  };

  return (
    <div className="min-h-screen">
      <SiteHeader current="explore" />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{t.heroKicker}</p>
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight text-white md:text-5xl">
          {interpolate(t.heroTitle, { count: dataset.entities.length })}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted md:text-base">{t.heroLead}</p>
        <p className="mt-3 max-w-2xl text-xs text-muted">{t.scopeCaveat}</p>

        <div className="mt-8">
          <StillHappening sources={sources} />
        </div>

        <div className="mt-8">
          <SearchBar entities={dataset.entities} onSelect={select} />
        </div>

        <div className="mt-6">
          <FilterControls selected={groupFilter} onChange={setGroupFilter} />
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
            />
          </div>
        </section>

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
          />
        </div>

        <div className="mt-6 rounded-xl border border-line bg-panel px-5 py-4">
          <MechanismLegend />
        </div>
      </main>

      <BankDetails
        dataset={dataset}
        sources={sources}
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
