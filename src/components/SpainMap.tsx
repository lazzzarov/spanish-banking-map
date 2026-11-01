import { geoMercator, geoPath, select, zoom, zoomIdentity, type ZoomTransform } from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { interpolate } from "../i18n";
import { currentGroupOf, familiesAtYear, groupColor, markerPresence, type MarkerPresence } from "../lib/bankGraph";
import { withBase } from "../lib/baseUrl";
import { formatEuroBn } from "../lib/format";
import { projectHq, shiftCanaries, type RegionCollection } from "../lib/geo";
import { dashFor, type AssetRecord, type BankDataset, type Entity, type Event } from "../lib/types";
import { MapMarkerTooltip, type MapTooltipPayload } from "./MapMarkerTooltip";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  regions: RegionCollection;
  /** Latest total assets per entity, used to size family bubbles. */
  assets: Map<string, AssetRecord>;
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

/** Bubble area follows total assets; without a figure, size follows the number of institutions. */
function bubbleRadius(assetsBn: number | null, institutions: number): number {
  if (assetsBn != null) return 4 + Math.sqrt(assetsBn) * 0.95;
  return 4.5 + Math.sqrt(institutions) * 1.4;
}

export function SpainMap({
  dataset,
  regions,
  assets,
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
  // Geography is zoomed by transform; markers are drawn unzoomed at transformed positions so they keep their size.
  const [zoomT, setZoomT] = useState<ZoomTransform>(zoomIdentity);
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

  const families = useMemo(() => familiesAtYear(dataset, year), [dataset, year]);
  const headOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const family of families) {
      map.set(family.headId, family.headId);
      for (const id of family.memberIds) map.set(id, family.headId);
    }
    return map;
  }, [families]);

  // A family opens when it is filtered from the bank list or when one of its banks is selected.
  const selectedHead = selectedId ? (headOf.get(selectedId) ?? null) : null;
  const openHead =
    groupFilter ??
    (selectedHead && families.some((family) => family.headId === selectedHead && family.memberIds.length > 0)
      ? selectedHead
      : null);

  const activeIds = new Set(yearEvents.flatMap((event) => [event.from, event.to]));
  const pathIds = new Set(highlight);

  const pointOf = (id: string) => {
    const entity = byId.get(id);
    if (!entity?.hq) return null;
    return projection(projectHq(entity.hq, entity.region));
  };

  const screenOf = (id: string): [number, number] | null => {
    const point = pointOf(id);
    return point ? (zoomT.apply(point) as [number, number]) : null;
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

  // Sizes from a year's accounts apply from that year on; earlier years fall back to institution counts.
  const assetsFor = (id: string): AssetRecord | null => {
    const record = assets.get(id);
    return record && year >= record.year ? record : null;
  };

  const bubbles = families
    .map((family) => {
      const point = screenOf(family.headId);
      if (!point) return null;
      const record = assetsFor(family.headId);
      const ids = [family.headId, ...family.memberIds];
      const active = ids.some((id) => activeIds.has(id));
      const open = openHead === family.headId;
      const faded = openHead ? !open : yearEvents.length > 0 && !active && selectedHead !== family.headId;
      return {
        ...family,
        point,
        record,
        r: bubbleRadius(record?.total_assets_eur_bn ?? null, ids.length),
        color: groupColor(currentGroupOf(dataset, family.headId, year)),
        active,
        open,
        faded,
      };
    })
    .filter((bubble): bubble is NonNullable<typeof bubble> => bubble !== null)
    .sort((a, b) => b.r - a.r);

  const openBubble = bubbles.find((bubble) => bubble.open) ?? null;

  // Name the big bubbles, largest first: below the bubble, else above, else not at all if both overlap.
  const bubbleLabels = (() => {
    const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
    const overlaps = (box: (typeof placed)[number]) =>
      placed.some((other) => box.x0 < other.x1 && box.x1 > other.x0 && box.y0 < other.y1 && box.y1 > other.y0);
    const labels = new Map<string, number>();
    for (const bubble of bubbles) {
      if (bubble.r < 14 || bubble.faded || bubble.headId === selectedId) continue;
      const width = labelOf(bubble.headId).length * 6.2;
      for (const dy of [bubble.r + 13, -(bubble.r + 5)]) {
        const y = bubble.point[1] + dy;
        const box = { x0: bubble.point[0] - width / 2, x1: bubble.point[0] + width / 2, y0: y - 11, y1: y + 2 };
        if (overlaps(box)) continue;
        placed.push(box);
        labels.set(bubble.headId, dy);
        break;
      }
    }
    return labels;
  })();

  // Predecessors of the open family, stacked where several share a headquarters.
  const memberStacks = useMemo(() => {
    if (!openHead) return [];
    const family = families.find((item) => item.headId === openHead);
    if (!family) return [];
    const stacks = new Map<string, Entity[]>();
    for (const id of family.memberIds) {
      const entity = byId.get(id);
      if (!entity?.hq) continue;
      const key = hqKey(entity);
      stacks.set(key, [...(stacks.get(key) ?? []), entity]);
    }
    return [...stacks.values()].map((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
  }, [openHead, families, byId]);

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

  const selectedPoint = selectedId ? screenOf(selectedId) : null;
  const selectedBubble = bubbles.find((bubble) => bubble.headId === selectedId) ?? null;

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
        setZoomT(event.transform);
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

  const showTooltip = (clientX: number, clientY: number, lines: MapTooltipPayload["lines"]) => {
    setTooltip({ x: clientX, y: clientY, lines });
  };

  const scheduleTooltip = (clientX: number, clientY: number, lines: MapTooltipPayload["lines"]) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => showTooltip(clientX, clientY, lines), 200);
  };

  const clearTooltip = () => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setTooltip(null);
  };

  const entityLines = (entities: Entity[]) =>
    entities.map((entity) => ({
      name: labelOf(entity.id),
      group: labelOf(currentGroupOf(dataset, entity.id, year)),
      status: statusOf(entity),
    }));

  const bubbleLines = (bubble: (typeof bubbles)[number]) => [
    {
      name: labelOf(bubble.headId),
      group: bubble.record
        ? `${formatEuroBn(bubble.record.total_assets_eur_bn, locale)} · ${interpolate(t.assetsLabel, { year: bubble.record.year })}`
        : t.mapLegendNoSize,
      status: interpolate(t.mapFamilyCount, { count: bubble.memberIds.length + 1 }),
    },
  ];

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
      <h2 className="sr-only">{t.mapTitle}</h2>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted" aria-label={t.legendTitle}>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="flex items-end gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              <span className="h-4 w-4 rounded-full bg-accent/70" />
            </span>
            {t.mapLegendSize}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-3 rounded-full border-[1.5px] border-dashed border-muted" />
            {t.mapLegendNoSize}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full border-[1.5px] border-accent bg-panel" />
            {t.mapLegendHistorical}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="w-4 border-t-2 border-muted" />
            {t.mapLegendDeal}
          </li>
        </ul>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="map-zoom-btn" onClick={() => zoomBy(1.35)} aria-label={t.mapZoomIn}>
            +
          </button>
          <button type="button" className="map-zoom-btn" onClick={() => zoomBy(1 / 1.35)} aria-label={t.mapZoomOut}>
            −
          </button>
          {selectedId ? (
            <button type="button" className="map-zoom-btn px-3 text-[12px]" onClick={zoomToSelection}>
              {t.mapZoomToSelection}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onResetView}
            className="h-8 rounded-md bg-heading px-3 text-[12px] font-semibold text-panel hover:opacity-90"
          >
            {t.mapShowAll}
          </button>
        </div>
      </div>
      <p className="mb-3 rounded-lg border border-[var(--deal)]/40 bg-[var(--deal)]/10 px-3 py-2 text-xs leading-relaxed text-fog">
        <strong className="text-heading">{t.mapSizeDisclaimer}</strong>{" "}
        <a href={withBase("/about/#sizes")} className="font-semibold text-accent hover:underline">
          {t.mapSizeWhy}
        </a>
      </p>
      <div className="relative min-h-[280px] flex-1">
        <svg
          ref={svgRef}
          viewBox="0 0 640 500"
          className="map-svg h-full max-h-[56vh] w-full touch-none"
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
                vectorEffect="non-scaling-stroke"
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
                  vectorEffect="non-scaling-stroke"
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
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={`M ${tip[0] - 4} ${tip[1]} L ${tip[0]} ${tip[1]} L ${tip[0] - 4} ${tip[1] + 4}`}
                    transform={`rotate(${angle}, ${tip[0]}, ${tip[1]})`}
                    fill="none"
                    stroke={emphasized ? "var(--accent)" : stroke}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </g>

          <g>
            {openBubble
              ? memberStacks.map((entities) => {
                  const point = screenOf(entities[0].id);
                  if (!point) return null;
                  return (
                    <line
                      key={`spoke-${entities[0].id}`}
                      x1={openBubble.point[0]}
                      y1={openBubble.point[1]}
                      x2={point[0]}
                      y2={point[1]}
                      stroke={openBubble.color}
                      strokeOpacity={0.45}
                      strokeWidth={1}
                      className="pointer-events-none"
                    />
                  );
                })
              : null}

            {bubbles.map((bubble) => {
              const selected = bubble.headId === selectedId;
              const showCount = bubble.memberIds.length > 0 && bubble.r >= 11;
              return (
                <g
                  key={bubble.headId}
                  transform={`translate(${bubble.point[0]}, ${bubble.point[1]})`}
                  opacity={bubble.faded ? 0.25 : 1}
                  className="map-marker-group"
                >
                  {bubble.active && !bubble.faded ? (
                    <circle r={bubble.r + 6} fill="var(--accent)" className="hq-pulse" />
                  ) : null}
                  <circle
                    r={bubble.r}
                    fill={bubble.color}
                    fillOpacity={0.85}
                    stroke={selected ? "var(--heading)" : "var(--dot-stroke)"}
                    strokeWidth={selected ? 2.5 : 1.5}
                    strokeDasharray={bubble.record ? undefined : "3 2"}
                    className="map-dot cursor-pointer"
                    onClick={(click) => {
                      click.stopPropagation();
                      onSelect(bubble.headId);
                    }}
                    onMouseEnter={(e) => scheduleTooltip(e.clientX, e.clientY, bubbleLines(bubble))}
                    onMouseMove={(e) => {
                      if (tooltip) showTooltip(e.clientX, e.clientY, bubbleLines(bubble));
                    }}
                    onMouseLeave={clearTooltip}
                  />
                  {showCount ? (
                    <text
                      y={4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={700}
                      fill="#ffffff"
                      className="pointer-events-none"
                    >
                      +{bubble.memberIds.length}
                    </text>
                  ) : null}
                  {bubbleLabels.has(bubble.headId) ? (
                    <text
                      y={bubbleLabels.get(bubble.headId)}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={600}
                      fill="var(--heading)"
                      stroke="var(--panel)"
                      strokeWidth={3}
                      paintOrder="stroke"
                      className="pointer-events-none"
                    >
                      {labelOf(bubble.headId)}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {memberStacks.map((entities) => {
              const point = screenOf(entities[0].id);
              if (!point) return null;
              const count = entities.length;
              const selected = entities.some((entity) => entity.id === selectedId);
              const active = entities.some((entity) => activeIds.has(entity.id));
              return (
                <g key={`member-${entities[0].id}`} transform={`translate(${point[0]}, ${point[1]})`}>
                  <circle
                    r={selected ? 6.5 : count > 1 ? 6 : 4.5}
                    fill="var(--panel)"
                    stroke={selected ? "var(--heading)" : (openBubble?.color ?? "var(--accent)")}
                    strokeWidth={selected ? 2.4 : active ? 2.2 : 1.6}
                    className="map-dot cursor-pointer"
                    onClick={(click) => {
                      click.stopPropagation();
                      if (count > 1) {
                        openStackMenu(entities, click);
                        return;
                      }
                      onSelect(entities[0].id);
                    }}
                    onMouseEnter={(e) => scheduleTooltip(e.clientX, e.clientY, entityLines(entities))}
                    onMouseMove={(e) => {
                      if (tooltip) showTooltip(e.clientX, e.clientY, entityLines(entities));
                    }}
                    onMouseLeave={clearTooltip}
                  />
                  {count > 1 ? (
                    <text
                      y={3}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="IBM Plex Mono, monospace"
                      fill="var(--heading)"
                      className="pointer-events-none"
                    >
                      {count}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {selectedPoint && selectedId ? (
              <text
                x={selectedPoint[0]}
                y={selectedPoint[1] - (selectedBubble ? selectedBubble.r + 6 : 12)}
                textAnchor="middle"
                fontSize="12"
                fontWeight={600}
                fill="var(--heading)"
                stroke="var(--panel)"
                strokeWidth={3}
                paintOrder="stroke"
                className="pointer-events-none"
              >
                {labelOf(selectedId)}
              </text>
            ) : null}
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
      <p className="mt-2 text-[11px] text-muted">{t.mapHint}</p>
      {calloutEvents.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-accent">
          {calloutEvents.map((event) => (
            <li key={event.id}>
              {t.canaryCallout}: {labelOf(event.from)} → {labelOf(event.to)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
