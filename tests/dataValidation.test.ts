import { describe, expect, it } from "vitest";
import { validateDataset } from "../src/lib/dataValidation";
import type { BankDataset, SourceRecord } from "../src/lib/types";

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
