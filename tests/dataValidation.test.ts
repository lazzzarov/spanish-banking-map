import { describe, expect, it } from "vitest";
import { validateAssets, validateDataset } from "../src/lib/dataValidation";
import type { AssetRecord, BankDataset, SourceRecord } from "../src/lib/types";

const dataset = { meta: {}, entities: [], events: [] } as unknown as BankDataset;

const source = (url: string | null): SourceRecord => ({
  id: "s1",
  url,
  title: "Source",
  title_es: "Fuente",
  publisher: "Publisher",
});

describe("source url validation", () => {
  it("accepts https and missing urls", () => {
    expect(validateDataset(dataset, [source("https://www.bde.es/")]).errors).toEqual([]);
    expect(validateDataset(dataset, [source(null)]).errors).toEqual([]);
  });

  it("rejects urls that are not https", () => {
    expect(validateDataset(dataset, [source("javascript:alert(1)")]).errors).toHaveLength(1);
    expect(validateDataset(dataset, [source("http://example.com")]).errors).toHaveLength(1);
    expect(validateDataset(dataset, [source("not a url")]).errors).toHaveLength(1);
  });
});

describe("asset validation", () => {
  const withBank = { meta: {}, entities: [{ id: "bank" }], events: [] } as unknown as BankDataset;
  const asset = (over: Partial<AssetRecord>): AssetRecord => ({
    entityId: "bank",
    year: 2025,
    total_assets_eur_bn: 10,
    basis: "entity",
    src: "s1",
    ...over,
  });

  it("accepts a known entity, source and positive value", () => {
    expect(validateAssets([asset({})], withBank, [source(null)])).toEqual([]);
  });

  it("rejects unknown entities, unknown sources and non-positive values", () => {
    expect(validateAssets([asset({ entityId: "nope" })], withBank, [source(null)])).toHaveLength(1);
    expect(validateAssets([asset({ src: "nope" })], withBank, [source(null)])).toHaveLength(1);
    expect(validateAssets([asset({ total_assets_eur_bn: 0 })], withBank, [source(null)])).toHaveLength(1);
  });
});
