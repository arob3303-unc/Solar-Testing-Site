import { describe, it, expect } from "vitest";
import { buildUserPrompt, reportHeadings, SYSTEM_PROMPT } from "./prompts.js";
import { getRecommendation } from "./recommendation.js";
import { planPanels, estimateGeneratorKw } from "./rates.js";

// One recommendation now, not four: the audit is solar-only and every home has a bill.
const rec = getRecommendation();

describe("reportHeadings", () => {
  it("always includes the rolling-blackouts / data-center section", () => {
    expect(reportHeadings(rec).some((h) => /rolling blackouts/i.test(h))).toBe(true);
  });

  it("includes the closing-the-bill section, since panels are always recommended", () => {
    expect(reportHeadings(rec).some((h) => /remaining bill/i.test(h))).toBe(true);
  });

  it("never mentions batteries or storage", () => {
    expect(reportHeadings(rec).join(" ")).not.toMatch(/batter|storage/i);
  });
});

describe("buildUserPrompt", () => {
  it("passes the authoritative product ids and grid-strain context", () => {
    const p = buildUserPrompt({ bill: 180 }, rec);
    expect(p).toContain("standby_generator");
    expect(p).toContain("additional_panels");
    expect(p).toMatch(/data center/i);
    expect(p).toMatch(/rolling blackout/i);
    expect(p).toMatch(/do NOT invent/i);
  });

  it("hands the model the SAME generator size the pitch page renders", () => {
    const form = { sqft: 2400, criticalLoads: ["HVAC (Heat / AC)"], heatType: "Gas" };
    const { kw } = estimateGeneratorKw(form);
    const p = buildUserPrompt(form, rec);
    expect(p).toContain(`~${kw} kW`);
    expect(p).toMatch(/do not recalculate/i);
    expect(p).toMatch(/never as a final specification/i);
  });

  it("hands the model the SAME panel figures the pitch page renders", () => {
    const plan = planPanels({ utilityKwh: 850 });
    const p = buildUserPrompt({ utilityKwh: 850 }, rec, plan);
    expect(p).toContain(`${plan.count} additional panels`);
    expect(p).toMatch(/AUTHORITATIVE — use these exact figures/);
    // Must not let the report claim the bill disappears - connection charges remain.
    expect(p).toMatch(/fixed connection charge remains/i);
    expect(p).toMatch(/do not state or imply the bill goes to zero/i);
  });

  it("omits the panel plan when the home buys too little to need one", () => {
    // planPanels rounds down, so usage under one panel of output yields no plan.
    const p = buildUserPrompt({ utilityKwh: 20 }, rec, planPanels({ utilityKwh: 20 }));
    expect(p).not.toMatch(/\d+ additional panels/i);
  });

  it("never leaks battery/storage language", () => {
    expect(buildUserPrompt({ bill: 120 }, rec)).not.toMatch(/batter|storage/i);
  });

  it("never names a generator brand", () => {
    // The offer is generic. A brand name in the prompt comes straight back out in
    // the customer-facing report.
    expect(buildUserPrompt({ sqft: 2400 }, rec)).not.toMatch(/generac/i);
    expect(SYSTEM_PROMPT).not.toMatch(/generac/i);
  });

  it("states whether the home already has backup power", () => {
    expect(buildUserPrompt({}, rec)).toMatch(/no standby generator on the property/i);
    expect(buildUserPrompt({ hasStandby: true }, rec)).toMatch(/already on site/i);
  });

  it("never asks the model to reason about outage frequency", () => {
    // That question was removed from the intake - it is not asked during a solar
    // assessment, so there is no homeowner-reported value to hand over.
    expect(buildUserPrompt({ bill: 120 }, rec)).not.toMatch(/outage frequency/i);
  });
});

describe("SYSTEM_PROMPT", () => {
  it("forbids batteries and locks products to the authoritative list", () => {
    expect(SYSTEM_PROMPT).toMatch(/never mention batteries/i);
    expect(SYSTEM_PROMPT).toMatch(/authoritative/i);
  });
});
