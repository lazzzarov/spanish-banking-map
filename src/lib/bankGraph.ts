import {
  FEATURED_GROUPS,
  type BankDataset,
  type Entity,
  type Event,
  type FeaturedGroup,
} from "./types";

export const MIN_YEAR = 2009;
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

export function childrenByParent(events: Event[]): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const event of lineageEvents(events)) {
    const list = children.get(event.to) ?? [];
    list.push(event.from);
    children.set(event.to, list);
  }
  return children;
}

export function visibleEntities(dataset: BankDataset, year: number): Entity[] {
  const absorbedByYear = new Set(
    lineageEvents(eventsUpTo(dataset.events, year)).map((event) => event.from),
  );

  return dataset.entities.filter((entity) => {
    if (entity.founded && entity.founded > year) return false;
    if (entity.group_role === "foreign_shareholder") {
      return dataset.events.some(
        (event) =>
          (event.from === entity.id || event.to === entity.id) && event.year <= year,
      );
    }
    if (entity.status === "active" && !absorbedByYear.has(entity.id)) return true;
    const firstSeen = dataset.events
      .filter((event) => event.from === entity.id || event.to === entity.id)
      .map((event) => event.year);
    if (entity.founded) firstSeen.push(entity.founded);
    const appears = firstSeen.length === 0 || Math.min(...firstSeen) <= year;
    return appears;
  });
}

export function searchEntities(entities: Entity[], query: string): Entity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return entities
    .filter((entity) => {
      const es = entity.name_es?.toLowerCase() ?? "";
      return (
        entity.name.toLowerCase().includes(q) ||
        es.includes(q) ||
        entity.id.replaceAll("-", " ").includes(q)
      );
    })
    .slice(0, 8);
}

export function groupColor(groupId: string | undefined): string {
  const colors: Record<string, string> = {
    caixabank: "#7dd3fc",
    santander: "#fb7185",
    bbva: "#c4b5fd",
    sabadell: "#34d399",
    unicaja: "#fbbf24",
    ibercaja: "#f9a8d4",
    kutxabank: "#38bdf8",
    abanca: "#d8b4fe",
  };
  return colors[groupId ?? ""] ?? "#64748b";
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
