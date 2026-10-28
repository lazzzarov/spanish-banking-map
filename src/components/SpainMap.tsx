import { geoMercator, geoPath } from "d3";
import { useMemo } from "react";
import {
  currentGroupOf,
  groupColor,
  markerPresence,
  type MarkerPresence,
} from "../lib/bankGraph";
import { projectHq, shiftCanaries, type RegionCollection } from "../lib/geo";
import {
  dashFor,
  type BankDataset,
  type Entity,
  type Event,
  type GraphLayer,
} from "../lib/types";
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
  banner?: string;
  emptyMessage?: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  onLayer?: (layer: GraphLayer) => void;
}

const LAYERS: GraphLayer[] = ["business", "ownership", "asset", "context"];

function isCrossCanary(from: Entity, to: Entity): boolean {
  return (from.region === "CN") !== (to.region === "CN");
}

function arcPath(from: [number, number], to: [number, number]): string {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const cx = mx - dy * 0.12;
  const cy = my + dx * 0.12;
  return `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`;
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
  banner,
  emptyMessage,
  onSelect,
  onClear,
  onLayer,
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

  const presenceOf = (id: string): MarkerPresence => {
    const entity = byId.get(id);
    if (!entity) return "hidden";
    return markerPresence(dataset, entity, year);
  };

  const markers = dataset.entities.filter((entity): entity is Entity & { hq: [number, number] } => {
    if (!entity.hq) return false;
    if (markerPresence(dataset, entity, year) === "hidden") return false;
    if (survivingOnly && entity.group_role !== "independent_caja") return false;
    if (groupFilter && currentGroupOf(dataset, entity.id, year) !== groupFilter) return false;
    return true;
  });

  const activeIds = new Set(yearEvents.flatMap((event) => [event.from, event.to]));

  const pointOf = (id: string) => {
    const entity = byId.get(id);
    if (!entity?.hq) return null;
    return projection(projectHq(entity.hq, entity.region));
  };

  const labelOf = (id: string) => {
    const entity = byId.get(id);
    if (!entity) return id;
    return locale === "es" && entity.name_es ? entity.name_es : entity.name;
  };

  const drawableEvents: Event[] = [];
  const calloutEvents: Event[] = [];

  if (layer !== "context") {
    for (const event of yearEvents) {
      const fromEntity = byId.get(event.from);
      const toEntity = byId.get(event.to);
      if (!fromEntity || !toEntity) {
        calloutEvents.push(event);
        continue;
      }
      if (isCrossCanary(fromEntity, toEntity)) {
        calloutEvents.push(event);
        continue;
      }
      const from = pointOf(event.from);
      const to = pointOf(event.to);
      if (!from || !to) {
        calloutEvents.push(event);
        continue;
      }
      if (presenceOf(event.from) === "hidden" || presenceOf(event.to) === "hidden") continue;
      drawableEvents.push(event);
    }
  }

  const layerLabel: Record<GraphLayer, string> = {
    business: t.layerBusiness,
    ownership: t.layerOwnership,
    asset: t.layerAsset,
    context: t.layerContext,
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-heading">{t.mapTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.mapHint}</p>
        </div>
        {onLayer && (
          <label className="text-xs text-muted">
            <span className="mr-2">{t.mapLayerLabel}</span>
            <select
              value={layer}
              onChange={(event) => onLayer(event.target.value as GraphLayer)}
              className="rounded border border-line bg-panel px-2 py-1 text-sm text-fog"
            >
              {LAYERS.map((item) => (
                <option key={item} value={item}>
                  {layerLabel[item]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {banner && (
        <p className="mb-3 rounded-lg bg-accent/10 px-3 py-2 text-xs text-heading">{banner}</p>
      )}
      <svg viewBox="0 0 640 500" className="h-full w-full">
        <defs>
          <marker id="arc-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
          </marker>
        </defs>
        {prepared.features.map((feature) => (
          <path
            key={feature.properties.id}
            d={path(feature as GeoJSON.Feature) ?? ""}
            fill="var(--map-empty)"
            fillOpacity="0.9"
            stroke="var(--map-stroke)"
            strokeWidth={0.8}
            className="cursor-pointer"
            onClick={onClear}
          >
            <title>{locale === "es" ? feature.properties.name_es : feature.properties.name}</title>
          </path>
        ))}
        {drawableEvents.map((event) => {
          const from = pointOf(event.from)!;
          const to = pointOf(event.to)!;
          return (
            <path
              key={event.id}
              d={arcPath(from, to)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={layer === "business" ? 2.2 : 3}
              strokeDasharray={dashFor(event.mechanism)}
              opacity="0.85"
              markerEnd="url(#arc-arrow)"
            />
          );
        })}
        {markers.map((entity) => {
          const point = projection(projectHq(entity.hq, entity.region));
          if (!point) return null;
          const group = currentGroupOf(dataset, entity.id, year);
          const presence = markerPresence(dataset, entity, year);
          const onPath = highlight.includes(entity.id);
          const selected = selectedId === entity.id;
          const active = activeIds.has(entity.id);
          const faded = layer !== "context" && yearEvents.length > 0 && !active && !selected && !onPath;
          const historical = presence === "historical";
          return (
            <g
              key={entity.id}
              transform={`translate(${point[0]}, ${point[1]})`}
              opacity={faded ? 0.35 : historical ? 0.55 : 1}
            >
              {active && !historical && <circle r="9" fill="var(--accent)" className="hq-pulse" />}
              <circle
                r={selected ? 7 : onPath || active ? 5.5 : historical ? 3 : 3.4}
                fill={historical ? "var(--panel)" : groupColor(group)}
                stroke={historical ? groupColor(group) : selected || onPath ? "var(--heading)" : "var(--dot-stroke)"}
                strokeWidth={selected ? 2 : historical ? 1.4 : 1}
                className="cursor-pointer"
                onClick={(click) => {
                  click.stopPropagation();
                  onSelect(entity.id);
                }}
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
      {yearEvents.length > 0 && layer !== "context" && (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {yearEvents.slice(0, 4).map((event) => (
            <li key={event.id}>
              {labelOf(event.from)} → {labelOf(event.to)} · {t[event.mechanism]}
            </li>
          ))}
        </ul>
      )}
      {calloutEvents.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-accent">
          {calloutEvents.map((event) => (
            <li key={event.id}>
              {t.canaryCallout}: {labelOf(event.from)} → {labelOf(event.to)}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto pt-2 font-mono text-[10px] text-muted">{t.noRegion}: BPCE, TSB</p>
    </div>
  );
}
