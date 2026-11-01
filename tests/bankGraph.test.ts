import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  currentGroupOf,
  doubleLineageParents,
  familiesAtYear,
  familyOf,
  genealogyStats,
  pathToGroup,
} from "../src/lib/bankGraph";
import type { BankDataset } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;

describe("lineage rollup", () => {
  it("walks Caja Madrid through BFA and Bankia into CaixaBank", () => {
    expect(currentGroupOf(dataset, "bankia")).toBe("caixabank");
    expect(pathToGroup(dataset, "caja-madrid")).toEqual([
      "caja-madrid",
      "bfa",
      "bankia",
      "caixabank",
    ]);
  });

  it("sends the Kutxabank cluster to Kutxabank", () => {
    expect(currentGroupOf(dataset, "bbk")).toBe("kutxabank");
    expect(currentGroupOf(dataset, "kutxa")).toBe("kutxabank");
    expect(currentGroupOf(dataset, "vital")).toBe("kutxabank");
    expect(currentGroupOf(dataset, "cajasur")).toBe("kutxabank");
  });

  it("does not let BPCE or TSB capture Sabadell", () => {
    expect(currentGroupOf(dataset, "sabadell")).toBe("sabadell");
    expect(currentGroupOf(dataset, "cam")).toBe("sabadell");
    expect(currentGroupOf(dataset, "banco-cam")).toBe("sabadell");
    expect(currentGroupOf(dataset, "bpce")).not.toBe("sabadell");
    expect(currentGroupOf(dataset, "tsb")).not.toBe("sabadell");
    expect(currentGroupOf(dataset, "sabadell")).not.toBe("santander");
  });

  it("does not let the failed BBVA bid reparent anyone", () => {
    expect(currentGroupOf(dataset, "bbva")).toBe("bbva");
    expect(currentGroupOf(dataset, "sabadell")).toBe("sabadell");
  });

  it("clusters CaixaBank around Bankia, Banca Cívica and BMN", () => {
    const family = familyOf(dataset, "caixabank");
    expect(family[0]).toBe("caixabank");
    expect(family.indexOf("bfa")).toBeLessThan(family.indexOf("caja-madrid"));
    expect(family.indexOf("bankia")).toBeLessThan(family.indexOf("caja-madrid"));
    expect(family.indexOf("bmn")).toBeLessThan(family.indexOf("caja-murcia"));
    expect(family.indexOf("banca-civica")).toBeLessThan(family.indexOf("cajasol"));
    expect(family).toEqual(expect.arrayContaining(["caja-madrid", "bfa", "bmn", "banca-civica", "la-caixa"]));
    expect(family.length).toBeGreaterThan(15);
  });

  it("keeps Cajasol on a single lineage path", () => {
    expect(doubleLineageParents(dataset.events).has("cajasol")).toBe(false);
    expect(pathToGroup(dataset, "cajasol")).toEqual([
      "cajasol",
      "banca-civica",
      "caixabank",
    ]);
  });

  it("absorbs CEISS into Unicaja in 2018, not 2014", () => {
    expect(pathToGroup(dataset, "caja-espana", 2014)).toEqual(["caja-espana", "caja-espana-duero", "ceiss"]);
    expect(currentGroupOf(dataset, "ceiss", 2018)).toBe("unicaja");
  });

  it("keeps named surviving heads independent", () => {
    expect(currentGroupOf(dataset, "cajamar")).toBe("cajamar");
    expect(currentGroupOf(dataset, "banca-march")).toBe("banca-march");
    expect(currentGroupOf(dataset, "caixa-ontinyent")).toBe("caixa-ontinyent");
  });
});

describe("genealogy stats", () => {
  it("shows more independent institutions in 2009 than in 2026", () => {
    const early = genealogyStats(dataset, 2009);
    const late = genealogyStats(dataset, 2026);
    expect(early.independent).toBeGreaterThan(late.independent);
    expect(late.consolidations).toBeGreaterThan(early.consolidations);
    expect(late.largestFamily.id).toBe("caixabank");
    expect(late.largestFamily.count).toBeGreaterThan(early.largestFamily.count);
  });
});

describe("families on the map", () => {
  const heads = (year: number) => familiesAtYear(dataset, year).map((family) => family.headId);

  it("gathers the Bankia branch under CaixaBank today", () => {
    const caixabank = familiesAtYear(dataset, 2026).find((family) => family.headId === "caixabank");
    expect(caixabank?.memberIds).toEqual(expect.arrayContaining(["caja-madrid", "bankia", "la-caixa"]));
  });

  it("leaves out SAREB and the CAM SIP that was unwound", () => {
    expect(heads(2026)).not.toContain("sareb");
    expect(heads(2026)).not.toContain("sip-cam-2010");
  });

  it("keeps Caja Madrid as its own head before the crisis", () => {
    expect(heads(2005)).toContain("caja-madrid");
    expect(heads(2005)).not.toContain("caixabank");
  });

  it("puts every member in exactly one family", () => {
    const members = familiesAtYear(dataset, 2026).flatMap((family) => [family.headId, ...family.memberIds]);
    expect(new Set(members).size).toBe(members.length);
  });
});
