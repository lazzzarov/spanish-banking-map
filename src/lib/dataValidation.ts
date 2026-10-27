import { doubleLineageParents } from "./bankGraph";
import { MECHANISM_LINEAGE, type BankDataset } from "./types";
import type { SourceRecord } from "./types";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  entityCount: number;
  eventCount: number;
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
    if (
      (event.mechanism === "minority_stake" || event.mechanism === "bid_failed") &&
      event.lineage
    ) {
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
