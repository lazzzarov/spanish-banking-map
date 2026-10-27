import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { familyPathSvg } from "../src/lib/pathExport";
import type { BankDataset } from "../src/lib/types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(readFileSync(resolve(root, "data/banks.json"), "utf8")) as BankDataset;

describe("path export", () => {
  it("draws the Caja Madrid lineage as SVG", () => {
    const svg = familyPathSvg(dataset, "caja-madrid", 2026, {
      "caja-madrid": "Caja Madrid",
      bfa: "BFA",
      bankia: "Bankia",
      caixabank: "CaixaBank",
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("Caja Madrid");
    expect(svg).toContain("BFA");
    expect(svg).toContain("Bankia");
    expect(svg).toContain("CaixaBank");
  });
});
