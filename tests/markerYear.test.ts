import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { firstSeenYear, markerPresence } from "../src/lib/bankGraph";
import type { BankDataset } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;

describe("markerPresence by year", () => {
  it("hides 2011 banks in 1936", () => {
    const ibercaja = dataset.entities.find((entity) => entity.id === "ibercaja")!;
    const ceiss = dataset.entities.find((entity) => entity.id === "ceiss")!;
    expect(markerPresence(dataset, ibercaja, 1936)).toBe("hidden");
    expect(markerPresence(dataset, ceiss, 1936)).toBe("hidden");
  });

  it("shows caja-madrid in 1936 and as historical after absorption", () => {
    const cajaMadrid = dataset.entities.find((entity) => entity.id === "caja-madrid")!;
    expect(markerPresence(dataset, cajaMadrid, 1936)).toBe("alive");
    expect(markerPresence(dataset, cajaMadrid, 2026)).toBe("historical");
  });

  it("derives firstSeen from events when founded is null", () => {
    expect(firstSeenYear(dataset, "caja-madrid")).toBe(1702);
    expect(firstSeenYear(dataset, "bfa")).toBe(2010);
  });

  it("shows early banks alive in 1920", () => {
    const santander = dataset.entities.find((entity) => entity.id === "santander")!;
    const bilbao = dataset.entities.find((entity) => entity.id === "banco-bilbao")!;
    const laCaixa = dataset.entities.find((entity) => entity.id === "la-caixa")!;
    expect(markerPresence(dataset, santander, 1920)).toBe("alive");
    expect(markerPresence(dataset, bilbao, 1920)).toBe("alive");
    expect(markerPresence(dataset, laCaixa, 1920)).toBe("alive");
  });
});
