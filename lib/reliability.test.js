import { describe, it, expect } from "vitest";
import { reliabilityFor, normalizeUtility, formatDuration } from "./reliability.js";
import real from "../data/outage-reliability.json";

/** Fixture mirroring the real file's shape, with the naming hazards that matter. */
const DATA = {
  year: 2023,
  national: { saidiWithMed: 341.9, saidiWithoutMed: 118.6, saifiWithMed: 1.34, saifiWithoutMed: 1.01, customers: 153298302 },
  states: {
    VA: { saidiWithMed: 221.1, saidiWithoutMed: 159.3, saifiWithMed: 1.46, saifiWithoutMed: 1.28, customers: 3929294 },
    NC: { saidiWithMed: 300, saidiWithoutMed: 120, saifiWithMed: 1.5, saifiWithoutMed: 1.1, customers: 5000000 },
  },
  utilities: [
    { name: "Virginia Electric & Power Co", state: "VA", saidiWithMed: 240, saidiWithoutMed: 150, saifiWithMed: 1.5, saifiWithoutMed: 1.2, customers: 2612104 },
    { name: "Appalachian Power Co", state: "VA", saidiWithMed: 500, saidiWithoutMed: 300, saifiWithMed: 2, saifiWithoutMed: 1.6, customers: 546507 },
    // Same name in two states — 49 such collisions exist in the real file.
    { name: "Appalachian Power Co", state: "WV", saidiWithMed: 600, saidiWithoutMed: 350, saifiWithMed: 2.2, saifiWithoutMed: 1.7, customers: 400000 },
    // Two utilities in one state that both contain "Duke Energy" — an ambiguous
    // partial match must NOT pick one of them.
    { name: "Duke Energy Progress - (NC)", state: "NC", saidiWithMed: 200, saidiWithoutMed: 100, saifiWithMed: 1.2, saifiWithoutMed: 0.9, customers: 1000000 },
    { name: "Duke Energy Carolinas, LLC", state: "NC", saidiWithMed: 180, saidiWithoutMed: 90, saifiWithMed: 1.1, saifiWithoutMed: 0.8, customers: 2000000 },
    // A row with no usable numbers must be skipped, not returned as zeroes.
    { name: "Empty Data Coop", state: "VA", saidiWithMed: null, saidiWithoutMed: null, saifiWithMed: null, saifiWithoutMed: null, customers: 10 },
  ],
};

describe("normalizeUtility", () => {
  it("makes the two spellings of the same company match", () => {
    // This exact pair is why the function exists: EIA writes one, NREL the other.
    expect(normalizeUtility("Virginia Electric & Power Co").join(" ")).toBe(
      normalizeUtility("Virginia Electric and Power Company").join(" ")
    );
  });

  it("expands EIA's truncated words", () => {
    expect(normalizeUtility("Northern Virginia Elec Coop").join(" ")).toBe(
      normalizeUtility("Northern Virginia Electric Cooperative").join(" ")
    );
    expect(normalizeUtility("Alaska Elec Pwr Co").join(" ")).toBe(
      normalizeUtility("Alaska Electric Power").join(" ")
    );
  });

  it("drops corporate suffixes and punctuation", () => {
    expect(normalizeUtility("Duke Energy Carolinas, LLC")).toEqual(["duke", "energy", "carolinas"]);
  });

  it("survives junk input", () => {
    expect(normalizeUtility(null)).toEqual([]);
    expect(normalizeUtility("")).toEqual([]);
    expect(normalizeUtility("   ,,,  ")).toEqual([]);
  });
});

describe("formatDuration", () => {
  it("reads as speech, not as a number", () => {
    expect(formatDuration(47)).toBe("47 min");
    expect(formatDuration(60)).toBe("1 hour");
    expect(formatDuration(252)).toBe("4 hours 12 min");
    expect(formatDuration(120)).toBe("2 hours");
    expect(formatDuration(1863)).toBe("31 hours 3 min");
  });

  it("returns null rather than a fake zero for missing input", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration("abc")).toBeNull();
    expect(formatDuration(-5)).toBeNull();
  });

  it("renders a genuine zero", () => {
    expect(formatDuration(0)).toBe("0 min");
  });
});

describe("reliabilityFor — utility scope", () => {
  it("matches a utility exactly and reports scope 'utility'", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "VA", utilityName: "Virginia Electric & Power Co" });
    expect(r.scope).toBe("utility");
    expect(r.saidiWithMed).toBe(240);
    expect(r.label).toBe("Virginia Electric & Power Co");
    expect(r.year).toBe(2023);
  });

  it("matches across the EIA/NREL spelling difference", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "VA", utilityName: "Virginia Electric and Power Company" });
    expect(r.scope).toBe("utility");
    expect(r.saidiWithMed).toBe(240);
  });

  it("scopes to the state, so a name in two states cannot cross over", () => {
    const va = reliabilityFor(DATA, { stateAbbr: "VA", utilityName: "Appalachian Power Co" });
    const wv = reliabilityFor(DATA, { stateAbbr: "WV", utilityName: "Appalachian Power Co" });
    expect(va.saidiWithMed).toBe(500);
    // WV has the utility but no state row; the utility match still wins.
    expect(wv.saidiWithMed).toBe(600);
  });

  it("accepts a unique containment match", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "VA", utilityName: "Appalachian Power" });
    expect(r.scope).toBe("utility");
    expect(r.saidiWithMed).toBe(500);
  });
});

describe("reliabilityFor — a wrong utility is worse than a right state", () => {
  it("falls back to STATE when a partial match is ambiguous", () => {
    // "Duke Energy" is contained in two NC utilities. Picking either would be a
    // coin flip presented to a homeowner as their own utility's record.
    const r = reliabilityFor(DATA, { stateAbbr: "NC", stateName: "North Carolina", utilityName: "Duke Energy" });
    expect(r.scope).toBe("state");
    expect(r.label).toBe("North Carolina average");
    expect(r.saidiWithMed).toBe(300);
  });

  it("falls back to state for a utility that is not in the file", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "VA", stateName: "Virginia", utilityName: "Some Co-op That Does Not Report" });
    expect(r.scope).toBe("state");
    expect(r.label).toBe("Virginia average");
  });

  it("falls back to state when a matched row has no usable numbers", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "VA", stateName: "Virginia", utilityName: "Empty Data Coop" });
    expect(r.scope).toBe("state");
  });

  it("goes to state with no utility name at all", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "VA", stateName: "Virginia" });
    expect(r.scope).toBe("state");
  });
});

describe("reliabilityFor — national fallback", () => {
  it("falls back to national for an unknown state", () => {
    const r = reliabilityFor(DATA, { stateAbbr: "ZZ", utilityName: "Anything" });
    expect(r.scope).toBe("national");
    expect(r.label).toBe("U.S. average");
    expect(r.saidiWithMed).toBe(341.9);
  });

  it("falls back to national with no location whatsoever", () => {
    // The bad-ZIP path at a door. It must still produce a usable slide.
    const r = reliabilityFor(DATA, {});
    expect(r.scope).toBe("national");
    expect(r.saidiWithMed).toBe(341.9);
  });

  it("returns null only when there is no dataset", () => {
    expect(reliabilityFor(null, { stateAbbr: "VA" })).toBeNull();
  });
});

describe("the shipped dataset", () => {
  it("is present and carries its provenance", () => {
    expect(real.year).toBeGreaterThanOrEqual(2023);
    expect(real.source).toMatch(/EIA-861/);
    expect(real.sourceUrl).toMatch(/^https:\/\/www\.eia\.gov\//);
  });

  it("covers every state and a useful number of utilities", () => {
    expect(Object.keys(real.states).length).toBeGreaterThanOrEqual(50);
    expect(real.utilities.length).toBeGreaterThan(500);
  });

  it("never has storms REDUCING outage minutes", () => {
    // saidiWithMed includes major event days, so it must be >= the figure excluding
    // them. A violation means the two columns got swapped in the converter.
    const rows = [...real.utilities, ...Object.values(real.states), real.national];
    for (const r of rows) {
      if (r.saidiWithMed !== null && r.saidiWithoutMed !== null) {
        expect(r.saidiWithMed).toBeGreaterThanOrEqual(r.saidiWithoutMed);
      }
    }
  });

  it("produces a sane national figure", () => {
    // EIA has reported roughly 4-8 hours nationally in recent years. Anything far
    // outside that means the customer weighting broke.
    expect(real.national.saidiWithMed).toBeGreaterThan(120);
    expect(real.national.saidiWithMed).toBeLessThan(900);
  });

  it("resolves a real utility end to end", () => {
    const r = reliabilityFor(real, {
      stateAbbr: "VA",
      stateName: "Virginia",
      utilityName: "Virginia Electric & Power Co",
    });
    expect(r.scope).toBe("utility");
    expect(formatDuration(r.saidiWithMed)).toMatch(/hour|min/);
  });
});
