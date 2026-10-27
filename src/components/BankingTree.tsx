import { useMemo } from "react";
import { hierarchy, tree } from "d3";
import {
  childrenByParent,
  currentGroupOf,
  entityMap,
  eventsUpTo,
  groupColor,
} from "../lib/bankGraph";
import { FEATURED_GROUPS, type BankDataset, type FeaturedGroup, type Mechanism } from "../lib/types";
import { useLocale } from "./LocaleContext";

interface Props {
  dataset: BankDataset;
  year: number;
  selectedId: string | null;
  highlight: string[];
  groupFilter: FeaturedGroup | null;
  onSelect: (id: string) => void;
}

function dashFor(mechanism: Mechanism): string | undefined {
  if (mechanism === "sip") return "6 4";
  if (mechanism === "activity_transfer") return "2 3";
  if (mechanism === "rebrand") return "1 4";
  if (mechanism === "minority_stake") return "2 6";
  if (mechanism === "bid_failed") return "8 3 2 3";
  return undefined;
}

interface LaidNode {
  id: string;
  x: number;
  y: number;
}

export function BankingTree({
  dataset,
  year,
  selectedId,
  highlight,
  groupFilter,
  onSelect,
}: Props) {
  const { t, locale } = useLocale();
  const byId = entityMap(dataset);
  const groups = groupFilter ? [groupFilter] : [...FEATURED_GROUPS];

  const layout = useMemo(() => {
    const nodes = new Map<string, LaidNode>();
    const width = 720;
    const height = 420;
    const colW = width / groups.length;

    groups.forEach((group, index) => {
      const children = childrenByParent(dataset.events);
      const walk = (id: string): { name: string; children: ReturnType<typeof walk>[] } => ({
        name: id,
        children: (children.get(id) ?? []).map(walk),
      });
      const root = hierarchy(walk(group));
      const layoutTree = tree<typeof root.data>().nodeSize([16, colW - 36]);
      layoutTree(root);
      let minX = Infinity;
      let maxX = -Infinity;
      root.descendants().forEach((node) => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
      });
      const span = Math.max(1, maxX - minX);
      root.descendants().forEach((node) => {
        const x = 28 + index * colW + (root.height === 0 ? 0 : node.y);
        const y = 40 + ((node.x - minX) / span) * (height - 70);
        nodes.set(node.data.name, { id: node.data.name, x, y });
      });
    });

    return nodes;
  }, [dataset.events, groups]);

  const visibleEvents = eventsUpTo(dataset.events, year);
  const label = (id: string) => {
    const entity = byId.get(id);
    if (!entity) return id;
    const name = locale === "es" && entity.name_es ? entity.name_es : entity.name;
    return name.length > 18 ? `${name.slice(0, 16)}…` : name;
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="mb-3">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">{t.treeTitle}</h2>
        <p className="mt-1 text-xs text-muted">{t.treeHint}</p>
      </div>
      <svg viewBox="0 0 720 440" className="h-full w-full">
        {visibleEvents.map((event) => {
          const from = layout.get(event.from);
          const to = layout.get(event.to);
          if (!from || !to) return null;
          const onPath =
            highlight.includes(event.from) && highlight.includes(event.to) && event.lineage;
          const muted = !event.lineage;
          return (
            <path
              key={event.id}
              d={`M${from.x},${from.y} C${(from.x + to.x) / 2},${from.y} ${(from.x + to.x) / 2},${to.y} ${to.x},${to.y}`}
              fill="none"
              stroke={muted ? "#64748b" : onPath ? "#f8fafc" : groupColor(currentGroupOf(dataset, event.to))}
              strokeWidth={onPath ? 2 : 1.1}
              strokeOpacity={muted ? 0.7 : 0.9}
              strokeDasharray={dashFor(event.mechanism)}
            />
          );
        })}
        {[...layout.values()].map((node) => {
          const selected = selectedId === node.id;
          const onPath = highlight.includes(node.id);
          const group = currentGroupOf(dataset, node.id, year);
          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(node.id)}
            >
              <circle
                r={selected ? 7 : 5}
                fill={groupColor(group)}
                stroke={selected || onPath ? "#f8fafc" : "#07080b"}
                strokeWidth={selected ? 2 : 1}
              />
              <text
                x={8}
                y={3}
                fill={onPath || selected ? "#f8fafc" : "#8b93a7"}
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
              >
                {label(node.id)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
