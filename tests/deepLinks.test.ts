import { describe, expect, it } from "vitest";
import { addressHref, explorerHref, parseExplorerQuery } from "../src/lib/deepLinks";
import { MAX_YEAR } from "../src/lib/bankGraph";

const ids = new Set(["caja-madrid", "caixabank"]);

describe("deep links", () => {
  it("parses a valid explorer query", () => {
    expect(parseExplorerQuery("?entity=caja-madrid&year=2012&lang=es", ids)).toEqual({
      entity: "caja-madrid",
      year: 2012,
      lang: "es",
      guide: null,
      guides: false,
    });
  });

  it("ignores invalid ids and years", () => {
    expect(parseExplorerQuery("?entity=nope&year=1900&lang=fr", ids)).toEqual({
      entity: null,
      year: null,
      lang: null,
      guide: null,
      guides: false,
    });
  });

  it("parses a guide", () => {
    expect(parseExplorerQuery("?guide=bankia-seven-cajas&guides=1", ids)).toEqual({
      entity: null,
      year: null,
      lang: null,
      guide: "bankia-seven-cajas",
      guides: true,
    });
  });

  it("builds a shareable href", () => {
    expect(explorerHref({ entity: "caja-madrid", year: 2010, lang: "en" })).toBe(
      "/?entity=caja-madrid&year=2010&lang=en",
    );
  });

  it("keeps the address bar clean of defaults", () => {
    expect(addressHref({ entity: null, year: MAX_YEAR })).toBe("/");
    expect(addressHref({ entity: "caixabank", year: MAX_YEAR })).toBe("/?entity=caixabank");
    expect(addressHref({ entity: "caja-madrid", year: 2010, guide: "bankia-seven-cajas" })).toBe(
      "/?entity=caja-madrid&year=2010&guide=bankia-seven-cajas",
    );
  });
});
