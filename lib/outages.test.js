import { describe, it, expect } from "vitest";
import { reportedOutageProfile, generationCoverage } from "./outages.js";

describe("reportedOutageProfile", () => {
  it("scales with the frequency the homeowner reported", () => {
    const rare = reportedOutageProfile({ outage: "Rare", hoursPerOutage: 4 });
    const occ = reportedOutageProfile({ outage: "Occasional", hoursPerOutage: 4 });
    const freq = reportedOutageProfile({ outage: "Frequent", hoursPerOutage: 4 });
    expect(occ.perYear).toBeGreaterThan(rare.perYear);
    expect(freq.perYear).toBeGreaterThan(occ.perYear);
    expect(freq.hoursPerYear).toBeGreaterThan(rare.hoursPerYear);
  });

  it("falls back to Occasional for an unknown answer and never returns NaN", () => {
    for (const outage of ["Occasional", "nonsense", undefined]) {
      const r = reportedOutageProfile({ outage, hoursPerOutage: 4 });
      expect(Number.isFinite(r.hoursPerYear)).toBe(true);
      expect(r.perYear).toBeGreaterThan(0);
    }
    expect(reportedOutageProfile({}).hoursPerYear).toBeTypeOf("number");
  });

  it("does not inflate: hoursPerYear is exactly frequency x duration", () => {
    const r = reportedOutageProfile({ outage: "Occasional", hoursPerOutage: 6 });
    expect(r.hoursPerYear).toBe(r.perYear * 6);
  });
});

describe("generationCoverage", () => {
  it("flags a state that sells more than it generates as a net importer", () => {
    // Real EIA 2024 figures for Georgia.
    const c = generationCoverage({ netGenerationMwh: 139805428, retailSalesMwh: 150003965 });
    expect(c.percent).toBe(93);
    expect(c.netImporter).toBe(true);
  });

  it("does not flag a net exporter", () => {
    const c = generationCoverage({ netGenerationMwh: 200, retailSalesMwh: 100 });
    expect(c.netImporter).toBe(false);
    expect(c.percent).toBe(200);
  });

  it("returns null rather than a fabricated percentage when data is missing", () => {
    expect(generationCoverage({})).toBeNull();
    expect(generationCoverage({ netGenerationMwh: 100, retailSalesMwh: 0 })).toBeNull();
    expect(generationCoverage({ netGenerationMwh: null, retailSalesMwh: 100 })).toBeNull();
  });
});
