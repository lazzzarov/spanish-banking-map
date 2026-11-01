import { doubleLineageParents } from "./bankGraph";
import { MECHANISM_LINEAGE, NON_LINEAGE_ALWAYS, type BankDataset } from "./types";
import type { AssetRecord, SourceRecord } from "./types";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  entityCount: number;
  eventCount: number;
}

export function validateAssets(assets: AssetRecord[], dataset: BankDataset, sources: SourceRecord[]): string[] {
  const errors: string[] = [];
  const entityIds = new Set(dataset.entities.map((entity) => entity.id));
  const sourceIds = new Set(sources.map((source) => source.id));
  const seen = new Set<string>();
  for (const asset of assets) {
    const key = `${asset.entityId}:${asset.year}`;
    if (seen.has(key)) errors.push(`Duplicate assets for ${key}`);
    seen.add(key);
    if (!entityIds.has(asset.entityId)) errors.push(`Assets for unknown entity ${asset.entityId}`);
    if (!sourceIds.has(asset.src)) errors.push(`Assets for ${asset.entityId} have unknown src ${asset.src}`);
    if (!(asset.total_assets_eur_bn > 0)) errors.push(`Assets for ${asset.entityId} must be positive`);
    if (asset.basis !== "entity" && asset.basis !== "group") errors.push(`Assets for ${asset.entityId} have unknown basis`);
  }
  return errors;
}

export function validateDataset(
  dataset: BankDataset,
  sources: SourceRecord[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set(sources.map((source) => source.id));
  const entityIds = new Set(dataset.entities.map((entity) => entity.id));
  const seenEntities = new Set<string>();
  const seenEvents = new Set<string>();

  // Source URLs become links on the site, so only https is accepted (no javascript: or data: URLs).
  for (const source of sources) {
    if (source.url == null) continue;
    let protocol = "";
    try {
      protocol = new URL(source.url).protocol;
    } catch {
      errors.push(`Source ${source.id} has an invalid url`);
      continue;
    }
    if (protocol !== "https:") errors.push(`Source ${source.id} url must use https (got ${protocol})`);
  }

  for (const entity of dataset.entities) {
    if (seenEntities.has(entity.id)) errors.push(`Duplicate entity id ${entity.id}`);
    seenEntities.add(entity.id);
    if (!sourceIds.has(entity.src)) errors.push(`Entity ${entity.id} has unknown src ${entity.src}`);
    if (entity.src === "check") warnings.push(`entity ${entity.id} still marked check`);
  }

  for (const event of dataset.events) {
    if (seenEvents.has(event.id)) errors.push(`Duplicate event id ${event.id}`);
    seenEvents.add(event.id);
    if (!entityIds.has(event.from)) errors.push(`Event ${event.id} from unknown ${event.from}`);
    if (!entityIds.has(event.to)) errors.push(`Event ${event.id} to unknown ${event.to}`);
    if (!sourceIds.has(event.src)) errors.push(`Event ${event.id} has unknown src ${event.src}`);
    if (event.year < 1920 || event.year > 2026) {
      errors.push(`Event ${event.id} year ${event.year} out of range`);
    }
    if (NON_LINEAGE_ALWAYS.includes(event.mechanism) && event.lineage) {
      errors.push(`Event ${event.id} is ${event.mechanism} but lineage is true`);
    }
    if (event.src === "check") warnings.push(`event ${event.id} still marked check`);
    if (!(event.mechanism in MECHANISM_LINEAGE)) {
      errors.push(`Event ${event.id} has unknown mechanism ${event.mechanism}`);
    }
  }

  for (const [id, parents] of doubleLineageParents(dataset.events)) {
    errors.push(`Entity ${id} has two lineage parents: ${parents.join(", ")}`);
  }

  return {
    errors,
    warnings,
    entityCount: dataset.entities.length,
    eventCount: dataset.events.length,
  };
}
