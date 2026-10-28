import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { nearestPlayableYear, nextPlayableYear } from "../src/lib/timelineUtils";
import type { BankDataset, ContextEvent } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;
const context = JSON.parse(readFileSync(resolve(root, "data/historical_context.json"), "utf8")) as ContextEvent[];

describe("nextPlayableYear", () => {
  it("skips empty years and lands on the next event or context year", () => {
    expect(nextPlayableYear(dataset.events, context, 1920, "business")).toBe(1921);
    expect(nextPlayableYear(dataset.events, context, 1987, "business")).toBe(1988);
    expect(nextPlayableYear(dataset.events, context, 2024, "ownership")).toBe(2025);
  });
});

describe("nearestPlayableYear", () => {
  it("stays put when the year already has events", () => {
    expect(nearestPlayableYear(dataset.events, context, 2010, "business")).toBe(2010);
  });

  it("jumps to the nearest year with matching layer events", () => {
    expect(nearestPlayableYear(dataset.events, context, 2024, "ownership")).toBe(2025);
    expect(nearestPlayableYear(dataset.events, context, 2013, "asset")).toBe(2012);
  });
});
