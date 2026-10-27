import { MAX_YEAR, MIN_YEAR } from "./bankGraph";
import type { Locale } from "./types";

export interface ExplorerQuery {
  entity: string | null;
  year: number | null;
  lang: Locale | null;
  guide: string | null;
  guides: boolean;
}

export function guideKey(slug: string): string {
  return slug.replace(/-en$|-es$/, "");
}

export function parseExplorerQuery(
  search: string,
  entityIds: Set<string>,
): ExplorerQuery {
  const params = new URLSearchParams(search);
  const entityRaw = params.get("entity");
  const yearRaw = Number(params.get("year"));
  const langRaw = params.get("lang");
  const guideRaw = params.get("guide");
  const guidesRaw = params.get("guides");

  return {
    entity: entityRaw && entityIds.has(entityRaw) ? entityRaw : null,
    year: Number.isInteger(yearRaw) && yearRaw >= MIN_YEAR && yearRaw <= MAX_YEAR ? yearRaw : null,
    lang: langRaw === "en" || langRaw === "es" ? langRaw : null,
    guide: guideRaw && guideRaw.length > 0 ? guideRaw : null,
    guides: guidesRaw === "1" || guidesRaw === "true",
  };
}

export function explorerHref(query: {
  entity?: string | null;
  year?: number | null;
  lang?: Locale;
  guide?: string | null;
  guides?: boolean;
}): string {
  const params = new URLSearchParams();
  if (query.entity) params.set("entity", query.entity);
  if (query.year != null) params.set("year", String(query.year));
  if (query.lang) params.set("lang", query.lang);
  if (query.guide) params.set("guide", query.guide);
  if (query.guides) params.set("guides", "1");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function writeExplorerQuery(query: {
  entity: string | null;
  year: number;
  lang: Locale;
  guide?: string | null;
  guides?: boolean;
}) {
  if (typeof window === "undefined") return;
  const href = explorerHref(query);
  window.history.replaceState(null, "", href);
}
