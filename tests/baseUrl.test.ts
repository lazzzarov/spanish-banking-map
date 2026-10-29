import { describe, expect, it } from "vitest";
import { withBase } from "../src/lib/baseUrl";

describe("withBase", () => {
  it("leaves absolute URLs unchanged", () => {
    expect(withBase("https://example.com/x")).toBe("https://example.com/x");
  });

  it("prefixes paths when BASE_URL is set", () => {
    const prev = import.meta.env.BASE_URL;
    import.meta.env.BASE_URL = "/spanish-banking-map/";
    expect(withBase("/stats/")).toBe("/spanish-banking-map/stats/");
    expect(withBase("/?year=2020")).toBe("/spanish-banking-map/?year=2020");
    import.meta.env.BASE_URL = prev;
  });
});
