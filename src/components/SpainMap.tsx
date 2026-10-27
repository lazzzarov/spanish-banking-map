import { geoMercator, geoPath } from "d3";
import { useMemo } from "react";
import {
  currentGroupOf,
  entityMap,
  groupColor,
} from "../lib/bankGraph";
import type { BankDataset, Entity } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface GeoFeature {
  type: "Feature";
  properties: { id: string; name: string; name_es: string };
  geometry: GeoJSON.Polygon;
}

interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface Props {
  dataset: BankDataset;
  regions: GeoCollection;
  year: number;
  selectedId: string | null;
  highlight: string[];
  groupFilter: string | null;
  onSelect: (id: string) => void;
}

function canaryShift(coords: number[][]): number[][] {
  return coords.map(([lon, lat]) => [lon + 14.5, lat + 8.2]);
}

function shiftedFeature(feature: GeoFeature): GeoFeature {
  if (feature.properties.id !== "CN") return feature;
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: feature.geometry.coordinates.map(canaryShift),
    },
  };
}

export function SpainMap({
  dataset,
  regions,
  year,
  selectedId,
  highlight,
  groupFilter,
  onSelect,
}: Props) {
  const { t, locale } = useLocale();
  const byId = entityMap(dataset);

  const prepared = useMemo(
    () => ({
      ...regions,
      features: regions.features.map(shiftedFeature),
    }),
    [regions],
  );

  const projection = useMemo(() => {
    const proj = geoMercator();
    proj.fitSize([640, 460], prepared as GeoJSON.FeatureCollection);
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
    if (groupFilter && currentGroupOf(dataset, entity.id) !== groupFilter) return false;
    return true;
  });

  const regionById = (regionId: string) => {
    const match = dataset.entities.find((entity) => entity.region === regionId);
    return match?.id;
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
          const faded = groupFilter && group !== groupFilter;
          return (
            <path
              key={feature.properties.id}
              d={path(feature) ?? ""}
              fill={groupColor(group)}
              fillOpacity={faded ? 0.08 : 0.18}
              stroke="#2a3344"
              strokeWidth={1}
              className="cursor-pointer"
              onClick={() => {
                const first = regionById(feature.properties.id);
                if (first) onSelect(first);
              }}
            >
              <title>
                {locale === "es" ? feature.properties.name_es : feature.properties.name}
              </title>
            </path>
          );
        })}
        {markers.map((entity) => {
          const point = projection(
            entity.region === "CN"
              ? [entity.hq[0] + 14.5, entity.hq[1] + 8.2]
              : entity.hq,
          );
          if (!point) return null;
          const group = currentGroupOf(dataset, entity.id, year);
          const onPath = highlight.includes(entity.id);
          const selected = selectedId === entity.id;
          return (
            <circle
              key={entity.id}
              cx={point[0]}
              cy={point[1]}
              r={selected ? 6 : onPath ? 5 : 3.2}
              fill={groupColor(group)}
              stroke={selected || onPath ? "#f8fafc" : "#07080b"}
              strokeWidth={selected ? 2 : 1}
              className="cursor-pointer"
              onClick={() => onSelect(entity.id)}
            >
              <title>{locale === "es" && entity.name_es ? entity.name_es : entity.name}</title>
            </circle>
          );
        })}
        <text x="92" y="478" fill="#8b93a7" fontSize="10" fontFamily="IBM Plex Mono, monospace">
          CN
        </text>
      </svg>
      <p className="mt-auto pt-2 font-mono text-[10px] text-muted">{t.noRegion}: BPCE</p>
    </div>
  );
}
