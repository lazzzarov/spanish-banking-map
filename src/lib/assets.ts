import type { AssetRecord } from "./types";

/** Asset records per entity, oldest year first. */
export function assetsByEntity(records: AssetRecord[]): Map<string, AssetRecord[]> {
  const map = new Map<string, AssetRecord[]>();
  for (const record of records) map.set(record.entityId, [...(map.get(record.entityId) ?? []), record]);
  for (const list of map.values()) list.sort((a, b) => a.year - b.year);
  return map;
}

/** The latest figure published at or before `year`, or null when the first one comes later. */
export function assetsAt(records: AssetRecord[] | undefined, year: number): AssetRecord | null {
  let found: AssetRecord | null = null;
  for (const record of records ?? []) {
    if (record.year > year) break;
    found = record;
  }
  return found;
}
