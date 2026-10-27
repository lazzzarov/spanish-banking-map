import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  currentGroupOf,
  doubleLineageParents,
} from "../src/lib/bankGraph.ts";
import { MECHANISM_LINEAGE, type BankDataset } from "../src/lib/types.ts";
import type { SourceRecord } from "../src/lib/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;
const sources = JSON.parse(readFileSync(resolve(root, "data/sources.json"), "utf8")) as SourceRecord[];
const raw = JSON.parse(readFileSync(resolve(root, "data/raw/banks.tuples.json"), "utf8")) as {
  entities: unknown[];
  edges: unknown[];
};

const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string) {
  errors.push(message);
}

const sourceIds = new Set(sources.map((source) => source.id));
const entityIds = new Set(dataset.entities.map((entity) => entity.id));

if (dataset.entities.length !== raw.entities.length) {
  fail(`Entity count drifted: canonical ${dataset.entities.length} vs raw ${raw.entities.length}`);
}
if (dataset.events.length !== raw.edges.length) {
  fail(`Event count drifted: canonical ${dataset.events.length} vs raw ${raw.edges.length}`);
}

console.log(`counts entities=${dataset.entities.length} events=${dataset.events.length}`);

const seenEntities = new Set<string>();
for (const entity of dataset.entities) {
  if (seenEntities.has(entity.id)) fail(`Duplicate entity id ${entity.id}`);
  seenEntities.add(entity.id);
  if (!sourceIds.has(entity.src)) fail(`Entity ${entity.id} has unknown src ${entity.src}`);
  if (entity.src === "check") warnings.push(`entity ${entity.id} still marked check`);
}

const seenEvents = new Set<string>();
for (const event of dataset.events) {
  if (seenEvents.has(event.id)) fail(`Duplicate event id ${event.id}`);
  seenEvents.add(event.id);
  if (!entityIds.has(event.from)) fail(`Event ${event.id} from unknown ${event.from}`);
  if (!entityIds.has(event.to)) fail(`Event ${event.id} to unknown ${event.to}`);
  if (!sourceIds.has(event.src)) fail(`Event ${event.id} has unknown src ${event.src}`);
  if (event.year < 1988 || event.year > 2026) fail(`Event ${event.id} year ${event.year} out of range`);
  if (MECHANISM_LINEAGE[event.mechanism] !== undefined && event.mechanism in MECHANISM_LINEAGE) {
    const expected = MECHANISM_LINEAGE[event.mechanism];
    if ((event.mechanism === "minority_stake" || event.mechanism === "bid_failed") && event.lineage) {
      fail(`Event ${event.id} is ${event.mechanism} but lineage is true`);
    }
    if (expected && event.mechanism !== "activity_transfer" && !event.lineage && event.outcome === "completed") {
      warnings.push(`Event ${event.id} looks like a lineage mechanism but lineage=false`);
    }
  }
  if (event.src === "check") warnings.push(`event ${event.id} still marked check`);
}

const doubles = doubleLineageParents(dataset.events);
for (const [id, parents] of doubles) {
  fail(`Entity ${id} has two lineage parents: ${parents.join(", ")}`);
}

if (currentGroupOf(dataset, "sabadell") !== "sabadell") {
  fail("Sabadell must remain its own featured group");
}
if (currentGroupOf(dataset, "bpce") === "sabadell" && currentGroupOf(dataset, "sabadell") === "bpce") {
  fail("BPCE must not capture Sabadell");
}
if (currentGroupOf(dataset, "bbva") === "sabadell") {
  fail("BBVA failed bid must not move BBVA into Sabadell");
}
if (currentGroupOf(dataset, "caja-madrid") !== "caixabank") {
  fail("Caja Madrid should roll up to CaixaBank");
}
if (currentGroupOf(dataset, "cajasol") !== "caixabank") {
  fail("Cajasol should roll up to CaixaBank via Banca Cívica");
}

if (errors.length) {
  console.error("VALIDATION FAILED");
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`warn: ${warning}`);
console.log("validation ok");
