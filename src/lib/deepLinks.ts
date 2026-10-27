import { MAX_YEAR, MIN_YEAR } from "./bankGraph";
import type { Locale } from "./types";

export interface ExplorerQuery {
  entity: string | null;
  year: number;
  lang: Locale | null;
}

export function parseExplorerQuery(
  search: string,
  entityIds: Set<string>,
): ExplorerQuery {
  const params = new URLSearchParams(search);
  const entityRaw = params.get("entity");
  const yearRaw = Number(params.get("year"));
  const langRaw = params.get("lang");

  return {
    entity: entityRaw && entityIds.has(entityRaw) ? entityRaw : null,
    year: Number.isInteger(yearRaw) && yearRaw >= MIN_YEAR && yearRaw <= MAX_YEAR ? yearRaw : MAX_YEAR,
    lang: langRaw === "en" || langRaw === "es" ? langRaw : null,
  };
}

export function explorerHref(query: { entity?: string | null; year?: number; lang?: Locale }): string {
  const params = new URLSearchParams();
  if (query.entity) params.set("entity", query.entity);
  if (query.year != null) params.set("year", String(query.year));
  if (query.lang) params.set("lang", query.lang);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function writeExplorerQuery(query: { entity: string | null; year: number; lang: Locale }) {
  if (typeof window === "undefined") return;
  const href = explorerHref(query);
  window.history.replaceState(null, "", href);
}
