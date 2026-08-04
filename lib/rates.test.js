import { describe, it, expect } from "vitest";
import { projectBill, projectWithPanels, estimateGeneratorKw, planPanels, KWH_PER_PANEL } from "./rates.js";

describe("planPanels", () => {
  it("rounds the panel count DOWN so the plan is never oversold", () => {
    // 850 / 55 = 15.45 → 15 panels, not 16
    expect(planPanels({ utilityKwh: 850 }).count).toBe(15);
    expect(planPanels({ utilityKwh: 1200 }).count).toBe(21);
  });

  it("never claims to offset more than the array produces", () => {
    for (const kwh of [0, 54, 55, 300, 850, 1200, 5000]) {
      const { offsetFraction, coveredKwh, count } = planPanels({ utilityKwh: kwh });
      expect(offsetFraction).toBeLessThanOrEqual(1);
      expect(offsetFraction).toBeGreaterThanOrEqual(0);
      expect(coveredKwh).toBe(count * KWH_PER_PANEL);
      expect(coveredKwh).toBeLessThanOrEqual(kwh);
    }
  });

  it("yields no plan when usage is below a single panel", () => {
    expect(planPanels({ utilityKwh: 54 }).count).toBe(0);
    expect(planPanels({ utilityKwh: 0 }).offsetFraction).toBe(0);
    expect(planPanels({}).count).toBe(0);
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
  const TIERS = [10, 14, 18, 20, 22, 24, 26];

  it("puts a 2,400 sq ft home in the industry 15–22 kW band", () => {
    // The calibration reference: 2,400 sq ft needs 15–22 kW, stepping to 20–24 kW
    // for full comfort once central air is on the generator.
    const plain = estimateGeneratorKw({ sqft: 2400, heatType: "Gas" });
    expect(plain.kw).toBeGreaterThanOrEqual(15);
    expect(plain.kw).toBeLessThanOrEqual(22);

    const withAc = estimateGeneratorKw({ sqft: 2400, criticalLoads: ["HVAC (Heat / AC)"], heatType: "Gas" });
    expect(withAc.kw).toBeGreaterThanOrEqual(20);
    expect(withAc.kw).toBeLessThanOrEqual(24);
  });

  it("always returns a real Generac size and a valid coverage tier", () => {
    for (const sqft of [0, 900, 1200, 1800, 2400, 3200, 4500, 8000]) {
      for (const heatType of ["Gas", "Electric"]) {
        const { kw, tier } = estimateGeneratorKw({ sqft, heatType, criticalLoads: ["HVAC (Heat / AC)"] });
        expect(TIERS).toContain(kw);
        expect(["essential", "partial", "whole-home"]).toContain(tier);
      }
    }
  });

  it("scales with floor area", () => {
    const sizes = [1800, 2400, 3200, 4500, 6000].map((s) => estimateGeneratorKw({ sqft: s }).kw);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThanOrEqual(sizes[i - 1]);
  });

  it("sizes an all-electric home above the same home on gas heat", () => {
    const gas = estimateGeneratorKw({ sqft: 2400, heatType: "Gas" }).kw;
    const electric = estimateGeneratorKw({ sqft: 2400, heatType: "Electric" }).kw;
    expect(electric).toBeGreaterThan(gas);
  });

  it("steps up for each heavy surge load", () => {
    const none = estimateGeneratorKw({ sqft: 2400 }).kw;
    const one = estimateGeneratorKw({ sqft: 2400, criticalLoads: ["HVAC (Heat / AC)"] }).kw;
    const two = estimateGeneratorKw({ sqft: 2400, criticalLoads: ["HVAC (Heat / AC)", "Well Pump"] }).kw;
    expect(one).toBeGreaterThan(none);
    expect(two).toBeGreaterThan(one);
  });

  it("does not oversell a small gas home with no large motors", () => {
    const { kw, tier } = estimateGeneratorKw({ sqft: 1100, heatType: "Gas", criticalLoads: ["Refrigerator / Freezer"] });
    expect(kw).toBe(10);
    expect(tier).toBe("essential");
  });

  it("defaults to a typical whole-home unit when size is unknown", () => {
    const { kw, tier } = estimateGeneratorKw({});
    expect(kw).toBe(20);
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
