import { useMemo, useState } from "react";
import { interpolate } from "../i18n";
import {
  childrenByParent,
  currentGroupOf,
  entityMap,
  eventsUpTo,
  familyOf,
  groupColor,
} from "../lib/bankGraph";
import { FEATURED_GROUPS, dashFor, type BankDataset, type FeaturedGroup } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  year: number;
  selectedId: string | null;
  highlight: string[];
  groupFilter: FeaturedGroup | null;
  onSelect: (id: string) => void;
  onSelectGroup?: (group: FeaturedGroup) => void;
}

const GROUP_LABEL: Record<FeaturedGroup, string> = {
  caixabank: "CaixaBank",
  santander: "Santander",
  bbva: "BBVA",
  sabadell: "Sabadell",
  unicaja: "Unicaja",
  ibercaja: "Ibercaja",
  kutxabank: "Kutxabank",
  abanca: "Abanca",
};

const ROW = 40;
const INDENT = 28;
const PAD_L = 22;
const PAD_T = 26;
const PAD_R = 248;
const PAD_B = 22;
const TRUNK_GAP = 14;

interface LaidNode {
  id: string;
  x: number;
  y: number;
  childCount: number;
  depth: number;
  trunk: boolean;
}

interface FamilyLayout {
  nodes: Map<string, LaidNode>;
  bands: { id: string; y: number; height: number }[];
  width: number;
  height: number;
}

function sortedChildren(children: Map<string, string[]>, id: string): string[] {
  return [...(children.get(id) ?? [])].sort(
    (a, b) => (children.get(b)?.length ?? 0) - (children.get(a)?.length ?? 0),
  );
}

/** Vertical list clustered by intermediate vehicles so one family reads as a few trunks. */
function layoutFamily(dataset: BankDataset, group: FeaturedGroup): FamilyLayout {
  const children = childrenByParent(dataset.events);
  const rows: { id: string; depth: number; childCount: number }[] = [];
  const walk = (id: string, depth: number) => {
    const kids = sortedChildren(children, id);
    rows.push({ id, depth, childCount: kids.length });
    for (const kid of kids) walk(kid, depth + 1);
  };
  walk(group, 0);

  const nodes = new Map<string, LaidNode>();
  const bands: FamilyLayout["bands"] = [];
  let y = PAD_T;
  let prevDepth = 0;
  let bandStart = y;
  let bandId: string | null = null;

  const closeBand = (endY: number) => {
    if (!bandId) return;
    bands.push({ id: bandId, y: bandStart - 16, height: endY - bandStart + 28 });
    bandId = null;
  };

  for (const row of rows) {
    if (row.depth === 1 && prevDepth >= 1) {
      closeBand(y);
      y += TRUNK_GAP;
    }
    if (row.depth === 1) {
      bandStart = y;
      bandId = row.id;
    }
    nodes.set(row.id, {
      id: row.id,
      x: PAD_L + row.depth * INDENT,
      y,
      childCount: row.childCount,
      depth: row.depth,
      trunk: row.childCount > 0,
    });
    y += ROW;
    prevDepth = row.depth;
  }
  closeBand(y);

  return {
    nodes,
    bands,
    width: Math.max(400, PAD_L + 3 * INDENT + PAD_R),
    height: Math.max(280, y + PAD_B),
  };
}

export function BankingTree({
  dataset,
  year,
  selectedId,
  highlight,
  groupFilter,
  onSelect,
  onSelectGroup,
}: Props) {
  const { t, locale } = useLocale();
  const byId = entityMap(dataset);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const label = (id: string) => {
    const entity = byId.get(id);
    if (!entity) return id;
    return locale === "es" && entity.name_es ? entity.name_es : entity.name;
  };

  if (!groupFilter) {
    return (
      <div className="flex h-full min-h-[320px] flex-col" data-tree-mode="overview">
        <div className="mb-3">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">{t.treeTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.treeOverviewHint}</p>
        </div>
        <ul className="flex flex-1 flex-col gap-2 overflow-auto pr-1">
          {FEATURED_GROUPS.map((group) => {
            const members = familyOf(dataset, group).filter((id) => id !== group);
            const selectedHere = members.includes(selectedId ?? "") || selectedId === group;
            return (
              <li
                key={group}
                className={`rounded-lg border px-3 py-2.5 ${
                  selectedHere ? "border-accent/50 bg-panel-2" : "border-line bg-panel-2/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => (onSelectGroup ? onSelectGroup(group) : onSelect(group))}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: groupColor(group) }}
                    />
                    <span className="text-sm text-fog">{GROUP_LABEL[group]}</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted">
                    {interpolate(t.treePredecessors, { count: members.length })}
                  </span>
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {members.map((id) => {
                    const onPath = highlight.includes(id);
                    const selected = selectedId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        title={label(id)}
                        aria-label={label(id)}
                        onMouseEnter={() => setHoverId(id)}
                        onMouseLeave={() => setHoverId((current) => (current === id ? null : current))}
                        onFocus={() => setHoverId(id)}
                        onBlur={() => setHoverId((current) => (current === id ? null : current))}
                        onClick={() => onSelect(id)}
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: groupColor(group),
                          opacity: selected || onPath ? 1 : 0.5,
                          outline: selected || onPath ? "1px solid #f8fafc" : "none",
                          outlineOffset: "1px",
                        }}
                      />
                    );
                  })}
                </div>
                <p className="mt-1.5 min-h-[1rem] font-mono text-[10px] text-muted">
                  {hoverId && members.includes(hoverId) ? label(hoverId) : "\u00a0"}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <FamilyTree
      dataset={dataset}
      year={year}
      group={groupFilter}
      selectedId={selectedId}
      highlight={highlight}
      onSelect={onSelect}
      label={label}
      hint={t.treeHint}
      title={t.treeTitle}
    />
  );
}

function FamilyTree({
  dataset,
  year,
  group,
  selectedId,
  highlight,
  onSelect,
  label,
  hint,
  title,
}: {
  dataset: BankDataset;
  year: number;
  group: FeaturedGroup;
  selectedId: string | null;
  highlight: string[];
  onSelect: (id: string) => void;
  label: (id: string) => string;
  hint: string;
  title: string;
}) {
  const layout = useMemo(() => layoutFamily(dataset, group), [dataset, group]);
  const visibleEvents = eventsUpTo(dataset.events, year);

  return (
    <div className="flex h-full min-h-[320px] flex-col" data-tree-mode={group}>
      <div className="mb-3">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          {title}
          <span className="text-fog"> · {GROUP_LABEL[group]}</span>
        </h2>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
      <div className="max-h-[min(640px,75vh)] min-h-[320px] flex-1 overflow-auto">
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="block"
          role="img"
          aria-label={`${GROUP_LABEL[group]} family tree`}
        >
          {layout.bands.map((band) => (
            <rect
              key={band.id}
              x={8}
              y={band.y}
              width={layout.width - 16}
              height={band.height}
              rx={10}
              fill={groupColor(group)}
              fillOpacity={0.05}
            />
          ))}
          {visibleEvents.map((event) => {
            const from = layout.nodes.get(event.from);
            const to = layout.nodes.get(event.to);
            if (!from || !to) return null;
            const onPath =
              highlight.includes(event.from) && highlight.includes(event.to) && event.lineage;
            const muted = !event.lineage;
            return (
              <path
                key={event.id}
                d={`M${from.x},${from.y} H${to.x} V${to.y}`}
                fill="none"
                stroke={muted ? "#64748b" : onPath ? "#f8fafc" : groupColor(currentGroupOf(dataset, event.to))}
                strokeWidth={onPath ? 2.2 : 1.25}
                strokeOpacity={muted ? 0.55 : 0.85}
                strokeDasharray={dashFor(event.mechanism)}
              />
            );
          })}
          {[...layout.nodes.values()].map((node) => {
            const selected = selectedId === node.id;
            const onPath = highlight.includes(node.id);
            const groupId = currentGroupOf(dataset, node.id, year);
            const name = label(node.id);
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                className="cursor-pointer"
                onClick={() => onSelect(node.id)}
              >
                <title>{name}</title>
                <circle
                  r={selected || node.depth === 0 ? 7 : node.trunk ? 6 : 5}
                  fill={groupColor(groupId)}
                  stroke={selected || onPath ? "#f8fafc" : "#07080b"}
                  strokeWidth={selected ? 2 : 1}
                />
                <text
                  x={12}
                  y={5}
                  fill={onPath || selected || node.trunk ? "#f8fafc" : "#c7cde0"}
                  fontSize={node.trunk ? 13 : 12}
                  fontFamily="Manrope, sans-serif"
                  fontWeight={node.trunk || selected ? 600 : 400}
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
