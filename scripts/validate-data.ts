import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { currentGroupOf, pathToGroup } from "../src/lib/bankGraph.ts";
import { validateDataset } from "../src/lib/dataValidation.ts";
import type { BankDataset, SourceRecord } from "../src/lib/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;
const sources = JSON.parse(readFileSync(resolve(root, "data/sources.json"), "utf8")) as SourceRecord[];

const { errors, warnings, entityCount, eventCount } = validateDataset(dataset, sources);

if (currentGroupOf(dataset, "sabadell") !== "sabadell") {
  errors.push("Sabadell must remain its own featured group");
}
if (currentGroupOf(dataset, "bpce") === "sabadell") {
  errors.push("BPCE must not capture Sabadell");
}
if (currentGroupOf(dataset, "bbva") === "sabadell") {
  errors.push("BBVA failed bid must not move BBVA into Sabadell");
}
if (currentGroupOf(dataset, "caja-madrid") !== "caixabank") {
  errors.push("Caja Madrid should roll up to CaixaBank");
}
if (currentGroupOf(dataset, "cajasol") !== "caixabank") {
  errors.push("Cajasol should roll up to CaixaBank via Banca Cívica");
}
const madridPath = pathToGroup(dataset, "caja-madrid").join(" → ");
if (pathToGroup(dataset, "caja-madrid").join(",") !== "caja-madrid,bfa,bankia,caixabank") {
  errors.push(`Caja Madrid path should be caja-madrid → bfa → bankia → caixabank (got ${madridPath})`);
}
if (currentGroupOf(dataset, "cajamar") !== "cajamar") {
  errors.push("Cajamar must remain its own surviving head");
}
if (currentGroupOf(dataset, "banca-march") !== "banca-march") {
  errors.push("Banca March must remain independent");
}

console.log(`counts entities=${entityCount} events=${eventCount}`);

if (errors.length) {
  console.error("VALIDATION FAILED");
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`warn: ${warning}`);
console.log("validation ok");
