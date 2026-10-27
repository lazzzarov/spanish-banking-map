import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { nextPlayableYear } from "../src/lib/timelineUtils";
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
