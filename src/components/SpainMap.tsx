import { geoMercator, geoPath, select, zoom, zoomIdentity, type ZoomTransform } from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  currentGroupOf,
  groupColor,
  markerPresence,
  type MarkerPresence,
} from "../lib/bankGraph";
import { projectHq, shiftCanaries, type RegionCollection } from "../lib/geo";
import { dashFor, type BankDataset, type Entity, type Event } from "../lib/types";
import { MapMarkerTooltip, type MapTooltipPayload } from "./MapMarkerTooltip";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  regions: RegionCollection;
  year: number;
  selectedId: string | null;
  highlight: string[];
  groupFilter: string | null;
  yearEvents: Event[];
  onSelect: (id: string) => void;
  onClear: () => void;
  /** Clears selection and filters; the map also refits its zoom. */
  onResetView: () => void;
  /** Bumped by the parent to refit the zoom without a click here. */
  viewResetToken: number;
}

function isCrossCanary(from: Entity, to: Entity): boolean {
  return (from.region === "CN") !== (to.region === "CN");
}

function arcGeometry(from: [number, number], to: [number, number], offset = 0) {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * offset;
  const ny = (dx / len) * offset;
  const cx = mx - dy * 0.12 + nx;
  const cy = my + dx * 0.12 + ny;
  const d = `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`;
  return { d, cx, cy };
}

function quadAt(t: number, from: [number, number], cx: number, cy: number, to: [number, number]): [number, number] {
  const u = 1 - t;
  return [u * u * from[0] + 2 * u * t * cx + t * t * to[0], u * u * from[1] + 2 * u * t * cy + t * t * to[1]];
}

function quadTangent(t: number, from: [number, number], cx: number, cy: number, to: [number, number]): [number, number] {
  const u = 1 - t;
  return [2 * u * (cx - from[0]) + 2 * t * (to[0] - cx), 2 * u * (cy - from[1]) + 2 * t * (to[1] - cy)];
}

function hqKey(entity: Entity): string {
  const hq = projectHq(entity.hq!, entity.region);
  return `${hq[0].toFixed(3)},${hq[1].toFixed(3)}`;
}

interface StackMenu {
  left: number;
  top: number;
  entities: Entity[];
}

export function SpainMap({
  dataset,
  regions,
  year,
  selectedId,
  highlight,
  groupFilter,
  yearEvents,
  onSelect,
  onClear,
  onResetView,
  viewResetToken,
}: Props) {
  const { t, locale } = useLocale();
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ReturnType<typeof zoom<SVGSVGElement>> | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [tooltip, setTooltip] = useState<MapTooltipPayload | null>(null);
  const [stackMenu, setStackMenu] = useState<StackMenu | null>(null);
  const hoverTimer = useRef<number | null>(null);

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

  const canaryInset = useMemo(() => {
    const feature = prepared.features.find((item) => item.properties.id === "CN");
    if (!feature) return null;
    const [[x0, y0], [x1, y1]] = path.bounds(feature as GeoJSON.Feature);
    return { feature, x: x0 - 10, y: y0 - 20, width: x1 - x0 + 20, height: y1 - y0 + 30 };
  }, [prepared, path]);

  const presenceOf = (id: string): MarkerPresence => {
    const entity = byId.get(id);
    if (!entity) return "hidden";
    return markerPresence(dataset, entity, year);
  };

  const markers = dataset.entities.filter((entity): entity is Entity & { hq: [number, number] } => {
    if (!entity.hq) return false;
    if (markerPresence(dataset, entity, year) === "hidden") return false;
    if (groupFilter && currentGroupOf(dataset, entity.id, year) !== groupFilter) return false;
    return true;
  });

  const stacks = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const entity of markers) {
      const key = hqKey(entity);
      const list = map.get(key) ?? [];
      list.push(entity);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [markers]);

  const activeIds = new Set(yearEvents.flatMap((event) => [event.from, event.to]));
  const pathIds = new Set(highlight);

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

  const statusOf = (entity: Entity) => {
    if (entity.status === "active") return t.statusActive;
    if (entity.status === "absorbed") return t.statusAbsorbed;
    if (entity.status === "rebranded") return t.statusRebranded;
    if (entity.status === "resolved") return t.statusResolved;
    if (entity.status === "historical_nonbank") return t.statusHistorical;
    return entity.status;
  };

  const drawableEvents: Event[] = [];
  const calloutEvents: Event[] = [];

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

  const pairCount = new Map<string, number>();
  const arcList = drawableEvents.map((event) => {
    const from = pointOf(event.from)!;
    const to = pointOf(event.to)!;
    const key = [event.from, event.to].sort().join("|");
    const index = pairCount.get(key) ?? 0;
    pairCount.set(key, index + 1);
    const total = pairCount.get(key)!;
    const offset = (index - (total - 1) / 2) * 14;
    const geom = arcGeometry(from, to, offset);
    const emphasized =
      selectedId != null &&
      (event.from === selectedId || event.to === selectedId || pathIds.has(event.from) || pathIds.has(event.to));
    const faded = selectedId != null && !emphasized && yearEvents.length > 0;
    const stroke = groupColor(currentGroupOf(dataset, event.to, year));
    return { event, from, to, ...geom, emphasized, faded, stroke };
  });

  const renderedStacks = [...stacks.entries()];

  useEffect(() => {
    const svg = svgRef.current;
    const layer = zoomLayerRef.current;
    if (!svg || !layer) return;

    const behavior = zoom<SVGSVGElement>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [640, 500],
      ])
      .on("zoom", (event) => {
        select(layer).attr("transform", event.transform.toString());
        setTransform(event.transform);
      });

    zoomRef.current = behavior;
    select(svg).call(behavior).on("dblclick.zoom", null);

    return () => {
      select(svg).on(".zoom", null);
    };
  }, []);

  const applyTransform = (next: ZoomTransform) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).call(zoomRef.current.transform, next);
  };

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    select(svg).call(zoomRef.current.scaleBy, factor);
  };

  const resetZoom = () => applyTransform(zoomIdentity);

  useEffect(() => {
    if (viewResetToken === 0) return;
    setStackMenu(null);
    resetZoom();
  }, [viewResetToken]);

  const zoomToSelection = useCallback(() => {
    if (!selectedId) return;
    const entity = byId.get(selectedId);
    if (!entity?.hq) return;
    const pt = projection(projectHq(entity.hq, entity.region));
    if (!pt) return;
    const k = 3;
    const tx = 320 - pt[0] * k;
    const ty = 250 - pt[1] * k;
    applyTransform(zoomIdentity.translate(tx, ty).scale(k));
  }, [selectedId, byId, projection]);

  const showTooltip = (clientX: number, clientY: number, entities: Entity[]) => {
    setTooltip({
      x: clientX,
      y: clientY,
      lines: entities.map((entity) => ({
        name: labelOf(entity.id),
        group: labelOf(currentGroupOf(dataset, entity.id, year)),
        status: statusOf(entity),
      })),
    });
  };

  const scheduleTooltip = (clientX: number, clientY: number, entities: Entity[]) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => showTooltip(clientX, clientY, entities), 200);
  };

  const clearTooltip = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setTooltip(null);
  };

  const openStackMenu = (entities: Entity[], evt: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setStackMenu({
      left: evt.clientX - rect.left,
      top: evt.clientY - rect.top,
      entities,
    });
  };

  return (
    <div className="relative flex min-h-[320px] flex-1 flex-col">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-heading">{t.mapTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.mapHint}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <button type="button" className="map-zoom-btn" onClick={() => zoomBy(1.35)} aria-label={t.mapZoomIn}>
            +
          </button>
          <button type="button" className="map-zoom-btn" onClick={() => zoomBy(1 / 1.35)} aria-label={t.mapZoomOut}>
            −
          </button>
          <button type="button" className="map-zoom-btn px-2 text-[11px]" onClick={onResetView}>
            {t.mapZoomReset}
          </button>
          {selectedId ? (
            <button type="button" className="map-zoom-btn px-2 text-[11px]" onClick={zoomToSelection}>
              {t.mapZoomToSelection}
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative min-h-[280px] flex-1">
        <svg
          ref={svgRef}
          viewBox="0 0 640 500"
          className="map-svg h-full w-full touch-none"
          data-year={year}
          onClick={() => setStackMenu(null)}
        >
          <g ref={zoomLayerRef}>
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
              />
            ))}
            {canaryInset && (
              <g className="pointer-events-none">
                <rect
                  x={canaryInset.x}
                  y={canaryInset.y}
                  width={canaryInset.width}
                  height={canaryInset.height}
                  rx={6}
                  fill="none"
                  stroke="var(--map-stroke)"
                  strokeDasharray="3 3"
                />
                <text
                  x={canaryInset.x + 6}
                  y={canaryInset.y + 12}
                  fill="var(--muted)"
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {locale === "es" ? canaryInset.feature.properties.name_es : canaryInset.feature.properties.name}
                </text>
              </g>
            )}
            {arcList.map(({ event, from, to, d, cx, cy, emphasized, faded, stroke }) => {
              const tip = quadAt(0.88, from, cx, cy, to);
              const tan = quadTangent(0.88, from, cx, cy, to);
              const angle = (Math.atan2(tan[1], tan[0]) * 180) / Math.PI;
              const shortD = `${d.split(" Q")[0]} Q ${cx} ${cy} ${tip[0]} ${tip[1]}`;
              return (
                <g key={event.id} opacity={faded ? 0.25 : emphasized ? 1 : 0.55}>
                  <path
                    d={shortD}
                    fill="none"
                    stroke={emphasized ? "var(--accent)" : stroke}
                    strokeWidth={emphasized ? 2 : 1.5}
                    strokeDasharray={dashFor(event.mechanism)}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${tip[0] - 4} ${tip[1]} L ${tip[0]} ${tip[1]} L ${tip[0] - 4} ${tip[1] + 4}`}
                    transform={`rotate(${angle}, ${tip[0]}, ${tip[1]})`}
                    fill="none"
                    stroke={emphasized ? "var(--accent)" : stroke}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
            {renderedStacks.map(([key, entities]) => {
              const sample = entities[0];
              const point = projection(projectHq(sample.hq, sample.region));
              if (!point) return null;
              const count = entities.length;
              const primary =
                entities.find((e) => e.id === selectedId) ??
                entities.find((e) => highlight.includes(e.id)) ??
                entities.find((e) => activeIds.has(e.id)) ??
                sample;
              const group = currentGroupOf(dataset, primary.id, year);
              const presence = markerPresence(dataset, primary, year);
              const onPath = entities.some((e) => highlight.includes(e.id));
              const selected = entities.some((e) => e.id === selectedId);
              const active = entities.some((e) => activeIds.has(e.id));
              const faded = yearEvents.length > 0 && !active && !selected && !onPath;
              const historical = presence === "historical";
              const r = selected ? 8 : onPath || active ? 6.5 : historical ? 4.5 : 5.5;
              return (
                <g
                  key={key}
                  transform={`translate(${point[0]}, ${point[1]})`}
                  opacity={faded ? 0.4 : historical ? 0.65 : 1}
                  className="map-marker-group"
                >
                  {active && !historical && <circle r="11" fill="var(--accent)" className="hq-pulse" />}
                  <g className="map-dot-inner">
                    <circle r={r + 1.5} fill="none" stroke="var(--dot-halo)" strokeWidth={2} />
                    <circle
                      r={r}
                      fill={historical ? "var(--panel)" : groupColor(group)}
                      stroke={
                        historical ? groupColor(group) : selected || onPath ? "var(--heading)" : "var(--dot-stroke)"
                      }
                      strokeWidth={selected ? 2.2 : historical ? 1.6 : 1.2}
                      className="map-dot cursor-pointer"
                      onClick={(click) => {
                        click.stopPropagation();
                        if (count > 1) {
                          openStackMenu(entities, click);
                          return;
                        }
                        onSelect(primary.id);
                      }}
                      onMouseEnter={(e) => scheduleTooltip(e.clientX, e.clientY, entities)}
                      onMouseMove={(e) => {
                        if (tooltip) showTooltip(e.clientX, e.clientY, entities);
                      }}
                      onMouseLeave={clearTooltip}
                    />
                  </g>
                  {count > 1 && (
                    <text
                      y={4}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fill="var(--heading)"
                      className="pointer-events-none"
                    >
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        {stackMenu ? (
          <div
            className="absolute z-30 min-w-[200px] rounded-lg border border-line bg-panel p-2 shadow-lg"
            style={{ left: stackMenu.left, top: stackMenu.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 px-2 text-[10px] font-medium text-muted">{t.mapStackTitle}</p>
            <ul className="max-h-48 overflow-y-auto">
              {stackMenu.entities.map((entity) => (
                <li key={entity.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-panel-2"
                    onClick={() => {
                      onSelect(entity.id);
                      setStackMenu(null);
                    }}
                  >
                    <span className="text-heading">{labelOf(entity.id)}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">{statusOf(entity)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <MapMarkerTooltip payload={tooltip} />
      {yearEvents.length > 0 && (
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
      <p className="mt-auto pt-2 font-mono text-[10px] text-muted">
        {t.noRegion}: BPCE, TSB · {Math.round(transform.k * 100)}%
      </p>
    </div>
  );
}
