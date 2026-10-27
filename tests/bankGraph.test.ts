import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  currentGroupOf,
  doubleLineageParents,
  pathToGroup,
} from "../src/lib/bankGraph";
import type { BankDataset } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;

describe("dataset counts", () => {
  it("keeps the real 56 / 50 counts", () => {
    expect(dataset.entities).toHaveLength(56);
    expect(dataset.events).toHaveLength(50);
  });
});

describe("lineage rollup", () => {
  it("sends the Kutxabank cluster to Kutxabank", () => {
    expect(currentGroupOf(dataset, "bbk")).toBe("kutxabank");
    expect(currentGroupOf(dataset, "kutxa")).toBe("kutxabank");
    expect(currentGroupOf(dataset, "vital")).toBe("kutxabank");
  });

  it("walks Bankia into CaixaBank", () => {
    expect(currentGroupOf(dataset, "bankia")).toBe("caixabank");
    expect(pathToGroup(dataset, "caja-madrid")).toEqual([
      "caja-madrid",
      "bankia",
      "caixabank",
    ]);
  });

  it("does not let BPCE capture Sabadell", () => {
    expect(currentGroupOf(dataset, "sabadell")).toBe("sabadell");
    expect(currentGroupOf(dataset, "cam")).toBe("sabadell");
    expect(currentGroupOf(dataset, "bpce")).not.toBe("sabadell");
  });

  it("does not let the failed BBVA bid reparent anyone", () => {
    expect(currentGroupOf(dataset, "bbva")).toBe("bbva");
    expect(currentGroupOf(dataset, "sabadell")).toBe("sabadell");
  });

  it("keeps Cajasol on a single lineage path", () => {
    expect(doubleLineageParents(dataset.events).has("cajasol")).toBe(false);
    expect(pathToGroup(dataset, "cajasol")).toEqual([
      "cajasol",
      "banca-civica",
      "caixabank",
    ]);
  });
});
