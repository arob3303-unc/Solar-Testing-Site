import { describe, it, expect } from "vitest";
import { projectBill, projectWithPanels, estimateGeneratorKw, planPanels, KWH_PER_PANEL, STANDARD_KW } from "./rates.js";

describe("planPanels", () => {
  it("rounds the panel count DOWN so the plan is never oversold", () => {
    // 850 / 41.5 = 20.48 → 20 panels, not 21
    expect(planPanels({ utilityKwh: 850 }).count).toBe(20);
    expect(planPanels({ utilityKwh: 1200 }).count).toBe(28);
  });

  it("never claims to offset more than the array produces", () => {
    for (const kwh of [0, 40, 41.5, 300, 850, 1200, 5000]) {
      const { offsetFraction, coveredKwh, count } = planPanels({ utilityKwh: kwh });
      expect(offsetFraction).toBeLessThanOrEqual(1);
      expect(offsetFraction).toBeGreaterThanOrEqual(0);
      expect(coveredKwh).toBe(count * KWH_PER_PANEL);
      expect(coveredKwh).toBeLessThanOrEqual(kwh);
    }
  });

  it("yields no plan when usage is below a single panel", () => {
    expect(planPanels({ utilityKwh: 40 }).count).toBe(0);
    expect(planPanels({ utilityKwh: 0 }).offsetFraction).toBe(0);
    expect(planPanels({}).count).toBe(0);
  });

  it("assumes a panel makes what the field says it makes", () => {
    // Calibration anchor: a healthy 20-panel array averages about 830 kWh/month.
    // This constant is shared with lib/diagnostics.js, so drifting it here silently
    // moves the production benchmark the homeowner is scored against.
    expect(KWH_PER_PANEL).toBe(41.5);
    expect(20 * KWH_PER_PANEL).toBe(830);
  });

  it("the count and the projection offset describe the SAME plan", () => {
    // Regression guard: the chart must not model an offset the panel count can't deliver.
    const plan = planPanels({ utilityKwh: 850 });
    const { offsetFraction } = projectWithPanels({ monthlyBill: 200, offsetFraction: plan.offsetFraction });
    expect(offsetFraction).toBeCloseTo((plan.count * KWH_PER_PANEL) / 850, 10);
  });
});

describe("projectBill", () => {
  it("compounds and accumulates over the horizon", () => {
    const { series, total, firstYear } = projectBill({ monthlyBill: 100, years: 3, escalation: 0.1 });
    expect(firstYear).toBe(1200);
    // year 1: 1200, year 2: 1320, year 3: 1452  → cumulative 3972
    expect(series.map((s) => s.annual)).toEqual([1200, 1320, 1452]);
    expect(series[series.length - 1].cumulative).toBe(total);
    expect(total).toBe(3972);
  });

  it("cumulative is monotonically increasing", () => {
    const { series } = projectBill({ monthlyBill: 180, years: 15 });
    for (let i = 1; i < series.length; i++) {
      expect(series[i].cumulative).toBeGreaterThan(series[i - 1].cumulative);
    }
  });

  it("handles zero / missing bill without NaN", () => {
    expect(projectBill({ monthlyBill: 0 }).total).toBe(0);
    expect(projectBill({}).total).toBe(0);
  });
});

describe("projectWithPanels", () => {
  it("offsetting part of the bill yields positive savings", () => {
    const { savings, total } = projectWithPanels({ monthlyBill: 200, offsetFraction: 0.7, years: 10 });
    const doNothing = projectBill({ monthlyBill: 200, years: 10 }).total;
    expect(savings).toBeGreaterThan(0);
    expect(total).toBeLessThan(doNothing);
  });

  it("a 100% offset saves the entire projected bill", () => {
    const doNothing = projectBill({ monthlyBill: 150, years: 12 }).total;
    const { total, savings } = projectWithPanels({ monthlyBill: 150, offsetFraction: 1, years: 12 });
    expect(total).toBe(0);
    expect(savings).toBe(doNothing);
  });
});

describe("estimateGeneratorKw", () => {
  const TIERS = [22, 24, 26];

  it("quotes the 22 kW standard unit for an ordinary home", () => {
    // The standard offer covers a home to roughly 4,500 sq ft in full, so nothing
    // below that threshold has any reason to move off it.
    for (const sqft of [0, 900, 1800, 2400, 3200, 4500]) {
      const { kw, tier } = estimateGeneratorKw({ sqft, heatType: "Gas" });
      expect(kw).toBe(STANDARD_KW);
      expect(tier).toBe("whole-home");
    }
  });

  it("never quotes below the standard unit", () => {
    for (const sqft of [0, 700, 1100, 2400, 4500, 6000, 12000]) {
      for (const heatType of ["Gas", "Electric"]) {
        const { kw, tier } = estimateGeneratorKw({
          sqft,
          heatType,
          criticalLoads: ["HVAC (Heat / AC)", "Well Pump", "Electric Range"],
        });
        expect(kw).toBeGreaterThanOrEqual(STANDARD_KW);
        expect(TIERS).toContain(kw);
        // Every unit in this offer is a whole-home unit.
        expect(tier).toBe("whole-home");
      }
    }
  });

  it("does not oversell a small gas home", () => {
    const { kw } = estimateGeneratorKw({ sqft: 1100, heatType: "Gas", criticalLoads: ["Refrigerator / Freezer"] });
    expect(kw).toBe(STANDARD_KW);
  });

  it("steps up past the coverage of the standard unit", () => {
    expect(estimateGeneratorKw({ sqft: 5000 }).kw).toBeGreaterThan(STANDARD_KW);
    expect(estimateGeneratorKw({ sqft: 8000 }).kw).toBe(26);
  });

  it("never decreases as floor area grows", () => {
    const sizes = [1800, 2400, 3200, 4500, 6000, 9000].map((s) => estimateGeneratorKw({ sqft: s }).kw);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
  });

  it("sizes a LARGE all-electric home above the same home on gas heat", () => {
    // Below the standard unit's coverage the fuel type cannot matter — 22 kW carries
    // it either way. It only becomes a factor once the home is already large.
    const gas = estimateGeneratorKw({ sqft: 4000, heatType: "Gas" }).kw;
    const electric = estimateGeneratorKw({ sqft: 4000, heatType: "Electric" }).kw;
    expect(electric).toBeGreaterThan(gas);

    const smallGas = estimateGeneratorKw({ sqft: 2400, heatType: "Gas" }).kw;
    const smallElectric = estimateGeneratorKw({ sqft: 2400, heatType: "Electric" }).kw;
    expect(smallElectric).toBe(smallGas);
  });

  it("defaults to the standard unit when size is unknown", () => {
    const { kw, tier } = estimateGeneratorKw({});
    expect(kw).toBe(STANDARD_KW);
    expect(tier).toBe("whole-home");
  });

  it("explains what drove the size", () => {
    const { drivers } = estimateGeneratorKw({
      sqft: 2400,
      criticalLoads: ["HVAC (Heat / AC)", "Well Pump"],
      heatType: "Electric",
    });
    expect(drivers).toContain("2,400 sq ft");
    expect(drivers).toContain("central heating & cooling");
    expect(drivers).toContain("all-electric heat");
  });
});
