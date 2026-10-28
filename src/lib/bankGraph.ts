import {
  FEATURED_GROUPS,
  GROUP_COLORS,
  type BankDataset,
  type Entity,
  type Event,
  type FeaturedGroup,
  type GraphLayer,
} from "./types";
import { isOverlayMechanism } from "./types";

export const MIN_YEAR = 1920;
export const MAX_YEAR = 2026;

export function entityMap(dataset: BankDataset): Map<string, Entity> {
  return new Map(dataset.entities.map((entity) => [entity.id, entity]));
}

export function eventsUpTo(events: Event[], year: number): Event[] {
  return events.filter((event) => event.year <= year);
}

export function lineageEvents(events: Event[]): Event[] {
  return events.filter((event) => event.lineage && event.outcome === "completed");
}

export function outgoingLineage(events: Event[], entityId: string): Event[] {
  return lineageEvents(events).filter((event) => event.from === entityId);
}

export function walkLineage(
  dataset: BankDataset,
  startId: string,
  year = MAX_YEAR,
): { group: string; path: string[] } {
  const byId = entityMap(dataset);
  const edges = lineageEvents(eventsUpTo(dataset.events, year));
  const path = [startId];
  const seen = new Set<string>([startId]);
  let current = startId;

  while (true) {
    const next = edges.find((event) => event.from === current);
    if (!next || seen.has(next.to)) break;
    path.push(next.to);
    seen.add(next.to);
    current = next.to;
  }

  let featured: string | undefined;
  for (let i = path.length - 1; i >= 0; i--) {
    if (FEATURED_GROUPS.includes(path[i] as FeaturedGroup)) {
      featured = path[i];
      break;
    }
  }
  const end = byId.get(current);
  const group =
    featured ??
    (end?.group_role === "featured_head" ? current : current);

  return { group, path };
}

export function currentGroupOf(
  dataset: BankDataset,
  entityId: string,
  year = MAX_YEAR,
): string {
  return walkLineage(dataset, entityId, year).group;
}

export function currentGroups(
  dataset: BankDataset,
  year = MAX_YEAR,
): Record<string, string> {
  const groups: Record<string, string> = {};
  for (const entity of dataset.entities) {
    groups[entity.id] = currentGroupOf(dataset, entity.id, year);
  }
  return groups;
}

export function pathToGroup(
  dataset: BankDataset,
  entityId: string,
  year = MAX_YEAR,
): string[] {
  return walkLineage(dataset, entityId, year).path;
}

export function eventsForEntity(events: Event[], entityId: string): Event[] {
  return events
    .filter((event) => event.from === entityId || event.to === entityId)
    .sort((a, b) => a.year - b.year);
}

export function eventsInYear(events: Event[], year: number, layer: GraphLayer): Event[] {
  if (layer === "context") return [];
  return events.filter((event) => event.year === year && isOverlayMechanism(event.mechanism, layer));
}

function entityMentionedInText(dataset: BankDataset, text: string, fallbackId: string): string {
  const lower = text.toLowerCase();
  let best: { id: string; len: number } | null = null;
  for (const entity of dataset.entities) {
    const names = [entity.name, entity.name_es, ...(entity.aliases ?? [])].filter(Boolean) as string[];
    for (const name of names) {
      const needle = name.toLowerCase();
      if (needle.length >= 4 && lower.includes(needle) && needle.length > (best?.len ?? 0)) {
        best = { id: entity.id, len: needle.length };
      }
    }
  }
  return best?.id ?? fallbackId;
}

export function storyBeats(
  body: string,
  fallback: { entityId: string; year: number },
  dataset?: BankDataset,
): { text: string; entityId: string; year: number }[] {
  const paragraphs = body
    .trim()
    .replaceAll("\r\n", "\n")
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, 4);
  return paragraphs.map((text) => {
    const years = [...text.matchAll(/\b(?:19|20)\d{2}\b/g)]
      .map((match) => Number(match[0]))
      .filter((year) => year >= MIN_YEAR && year <= MAX_YEAR);
    const entityId = dataset ? entityMentionedInText(dataset, text, fallback.entityId) : fallback.entityId;
    return { text, entityId, year: years[0] ?? fallback.year };
  });
}

export function firstSeenYear(dataset: BankDataset, entityId: string): number {
  const entity = entityMap(dataset).get(entityId);
  if (entity?.founded != null) return entity.founded;
  const years = dataset.events
    .filter((event) => event.from === entityId || event.to === entityId)
    .map((event) => event.year);
  if (years.length > 0) return Math.min(...years);
  return MIN_YEAR;
}

export function absorbedIdsAtYear(dataset: BankDataset, year: number): Set<string> {
  return new Set(lineageEvents(eventsUpTo(dataset.events, year)).map((event) => event.from));
}

export type MarkerPresence = "hidden" | "alive" | "historical";

export function markerPresence(dataset: BankDataset, entity: Entity, year: number): MarkerPresence {
  if (!entity.hq) return "hidden";
  if (entity.group_role === "foreign_shareholder" || entity.group_role === "asset_vehicle") {
    const seen = dataset.events.some(
      (event) => (event.from === entity.id || event.to === entity.id) && event.year <= year,
    );
    return seen ? "alive" : "hidden";
  }
  if (firstSeenYear(dataset, entity.id) > year) return "hidden";
  if (absorbedIdsAtYear(dataset, year).has(entity.id)) return "historical";
  return "alive";
}

export function lineageParentAtYear(
  dataset: BankDataset,
  entityId: string,
  year: number,
): string | null {
  const edge = lineageEvents(eventsUpTo(dataset.events, year)).find((event) => event.from === entityId);
  return edge?.to ?? null;
}

export function childrenByParent(events: Event[]): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const event of lineageEvents(events)) {
    const list = children.get(event.to) ?? [];
    list.push(event.from);
    children.set(event.to, list);
  }
  return children;
}

/** Lineage descendants of a group head, head first, vehicles before leaf siblings. */
export function familyOf(dataset: BankDataset, groupId: string): string[] {
  const children = childrenByParent(dataset.events);
  const ids: string[] = [];
  const walk = (id: string) => {
    ids.push(id);
    const kids = [...(children.get(id) ?? [])].sort(
      (a, b) => (children.get(b)?.length ?? 0) - (children.get(a)?.length ?? 0),
    );
    for (const child of kids) walk(child);
  };
  walk(groupId);
  return ids;
}

export function visibleEntities(dataset: BankDataset, year: number): Entity[] {
  return dataset.entities.filter((entity) => markerPresence(dataset, entity, year) !== "hidden");
}

export function searchEntities(entities: Entity[], query: string): Entity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return entities
    .filter((entity) => {
      const es = entity.name_es?.toLowerCase() ?? "";
      const aliases = (entity.aliases ?? []).join(" ").toLowerCase();
      return (
        entity.name.toLowerCase().includes(q) ||
        es.includes(q) ||
        aliases.includes(q) ||
        entity.id.replaceAll("-", " ").includes(q)
      );
    })
    .slice(0, 8);
}

export function groupColor(groupId: string | undefined): string {
  return GROUP_COLORS[groupId ?? ""] ?? "#64748b";
}

export interface GenealogyStats {
  independent: number;
  consolidations: number;
  largestFamily: { id: FeaturedGroup | ""; count: number };
}

export function genealogyStats(dataset: BankDataset, year: number): GenealogyStats {
  const lineage = lineageEvents(eventsUpTo(dataset.events, year));
  const absorbed = new Set(lineage.map((event) => event.from));
  const independent = dataset.entities.filter((entity) => {
    if (entity.group_role === "foreign_shareholder" || entity.group_role === "asset_vehicle") return false;
    if (entity.founded && entity.founded > year) return false;
    return !absorbed.has(entity.id);
  }).length;

  const counts = Object.fromEntries(FEATURED_GROUPS.map((group) => [group, 0])) as Record<
    FeaturedGroup,
    number
  >;
  for (const entity of dataset.entities) {
    if (entity.group_role === "foreign_shareholder" || entity.group_role === "asset_vehicle") continue;
    if (entity.founded && entity.founded > year) continue;
    const walked = walkLineage(dataset, entity.id, year);
    if (FEATURED_GROUPS.includes(walked.group as FeaturedGroup) && walked.path.includes(walked.group)) {
      counts[walked.group as FeaturedGroup] += 1;
    }
  }

  let largestFamily: GenealogyStats["largestFamily"] = { id: "", count: 0 };
  for (const group of FEATURED_GROUPS) {
    if (counts[group] > largestFamily.count) {
      largestFamily = { id: group, count: counts[group] };
    }
  }

  return { independent, consolidations: lineage.length, largestFamily };
}

export function doubleLineageParents(events: Event[]): Map<string, string[]> {
  const parents = new Map<string, string[]>();
  for (const event of lineageEvents(events)) {
    const list = parents.get(event.from) ?? [];
    list.push(event.to);
    parents.set(event.from, list);
  }
  for (const [id, list] of parents) {
    if (list.length < 2) parents.delete(id);
  }
  return parents;
}
