import { describe, expect, it } from "vitest";
import { assetsAt, assetsByEntity } from "../src/lib/assets";
import type { AssetRecord } from "../src/lib/types";

const record = (entityId: string, year: number, total: number): AssetRecord => ({
  entityId,
  year,
  total_assets_eur_bn: total,
  basis: "entity",
  src: "s1",
});

describe("assets over time", () => {
  const byEntity = assetsByEntity([record("bank", 2025, 30), record("bank", 2008, 10), record("other", 2012, 5), record("bank", 2016, 20)]);

  it("groups records per entity, oldest first", () => {
    expect(byEntity.get("bank")?.map((item) => item.year)).toEqual([2008, 2016, 2025]);
    expect(byEntity.get("other")).toHaveLength(1);
  });

  it("uses the nearest year at or before the one shown", () => {
    const bank = byEntity.get("bank");
    expect(assetsAt(bank, 2007)).toBeNull();
    expect(assetsAt(bank, 2008)?.total_assets_eur_bn).toBe(10);
    expect(assetsAt(bank, 2015)?.total_assets_eur_bn).toBe(10);
    expect(assetsAt(bank, 2016)?.total_assets_eur_bn).toBe(20);
    expect(assetsAt(bank, 2030)?.total_assets_eur_bn).toBe(30);
    expect(assetsAt(undefined, 2020)).toBeNull();
  });
});
