import { geoMercator, geoPath } from "d3";
import { useMemo } from "react";
import { currentGroupOf, groupColor } from "../lib/bankGraph";
import { projectHq, shiftCanaries, type RegionCollection } from "../lib/geo";
import { dashFor, type BankDataset, type Entity, type Event, type GraphLayer } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  regions: RegionCollection;
  year: number;
  selectedId: string | null;
  highlight: string[];
  groupFilter: string | null;
  survivingOnly?: boolean;
  yearEvents: Event[];
  layer: GraphLayer;
  emptyMessage?: string;
  onSelect: (id: string) => void;
}

export function SpainMap({
  dataset,
  regions,
  year,
  selectedId,
  highlight,
  groupFilter,
  survivingOnly = false,
  yearEvents,
  layer,
  emptyMessage,
  onSelect,
}: Props) {
  const { t, locale } = useLocale();
  const byId = useMemo(() => new Map(dataset.entities.map((entity) => [entity.id, entity])), [dataset.entities]);

  const prepared = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: regions.features.map(shiftCanaries),
    }),
    [regions],
  );

  const projection = useMemo(() => {
    const proj = geoMercator();
    proj.fitExtent(
      [
        [16, 12],
        [624, 448],
      ],
      prepared as GeoJSON.FeatureCollection,
    );
    return proj;
  }, [prepared]);

  const path = useMemo(() => geoPath(projection), [projection]);

  const regionGroup = useMemo(() => {
    const counts = new Map<string, Map<string, number>>();
    for (const entity of dataset.entities) {
      if (!entity.region) continue;
      const group = currentGroupOf(dataset, entity.id, year);
      const bucket = counts.get(entity.region) ?? new Map<string, number>();
      bucket.set(group, (bucket.get(group) ?? 0) + 1);
      counts.set(entity.region, bucket);
    }
    const winner = new Map<string, string>();
    for (const [region, bucket] of counts) {
      let best = "";
      let n = -1;
      for (const [group, count] of bucket) {
        if (count > n) {
          best = group;
          n = count;
        }
      }
      winner.set(region, best);
    }
    return winner;
  }, [dataset, year]);

  const markers = dataset.entities.filter((entity): entity is Entity & { hq: [number, number] } => {
    if (!entity.hq) return false;
    if (survivingOnly && entity.group_role !== "independent_caja") return false;
    if (groupFilter && currentGroupOf(dataset, entity.id) !== groupFilter) return false;
    return true;
  });

  const activeIds = new Set(yearEvents.flatMap((event) => [event.from, event.to]));

  const regionById = (regionId: string) => {
    const match = dataset.entities.find((entity) => entity.region === regionId);
    return match?.id;
  };

  const pointOf = (id: string) => {
    const entity = byId.get(id);
    if (!entity?.hq) return null;
    return projection(projectHq(entity.hq, entity.region));
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="mb-3">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">{t.mapTitle}</h2>
        <p className="mt-1 text-xs text-muted">{t.mapHint}</p>
      </div>
      <svg viewBox="0 0 640 500" className="h-full w-full">
        {prepared.features.map((feature) => {
          const group = regionGroup.get(feature.properties.id);
          const faded = Boolean(groupFilter && group && group !== groupFilter);
          const empty = !group;
          return (
            <path
              key={feature.properties.id}
              d={path(feature as GeoJSON.Feature) ?? ""}
              fill={empty ? "var(--map-empty)" : groupColor(group)}
              fillOpacity={faded ? 0.07 : empty ? 0.7 : 0.2}
              stroke="var(--map-stroke)"
              strokeWidth={0.8}
              className="cursor-pointer"
              onClick={() => {
                const first = regionById(feature.properties.id);
                if (first) onSelect(first);
              }}
            >
              <title>{locale === "es" ? feature.properties.name_es : feature.properties.name}</title>
            </path>
          );
        })}
        {layer !== "context" &&
          yearEvents.map((event) => {
            const from = pointOf(event.from);
            const to = pointOf(event.to);
            if (!from || !to) return null;
            return (
              <line
                key={event.id}
                x1={from[0]}
                y1={from[1]}
                x2={to[0]}
                y2={to[1]}
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeDasharray={dashFor(event.mechanism)}
                opacity="0.85"
              />
            );
          })}
        {markers.map((entity) => {
          const point = projection(projectHq(entity.hq, entity.region));
          if (!point) return null;
          const group = currentGroupOf(dataset, entity.id, year);
          const onPath = highlight.includes(entity.id);
          const selected = selectedId === entity.id;
          const active = activeIds.has(entity.id);
          return (
            <g key={entity.id} transform={`translate(${point[0]}, ${point[1]})`}>
              {active && <circle r="8" fill="var(--accent)" className="hq-pulse" />}
              <circle
                r={selected ? 6 : onPath || active ? 5 : 3.2}
                fill={groupColor(group)}
                stroke={selected || onPath ? "var(--heading)" : "var(--dot-stroke)"}
                strokeWidth={selected ? 2 : 1}
                className="cursor-pointer"
                onClick={() => onSelect(entity.id)}
              >
                <title>{locale === "es" && entity.name_es ? entity.name_es : entity.name}</title>
              </circle>
            </g>
          );
        })}
        <text x="78" y="456" fill="var(--muted)" fontSize="10" fontFamily="IBM Plex Mono, monospace">
          CN
        </text>
      </svg>
      {emptyMessage && <p className="mt-2 text-sm text-muted">{emptyMessage}</p>}
      <p className="mt-auto pt-2 font-mono text-[10px] text-muted">{t.noRegion}: BPCE</p>
    </div>
  );
}
