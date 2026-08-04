import { describe, it, expect } from "vitest";
import { buildUserPrompt, reportHeadings, SYSTEM_PROMPT } from "./prompts.js";
import { getRecommendation } from "./recommendation.js";
import { planPanels, estimateGeneratorKw } from "./rates.js";

const solarBill = getRecommendation({ hasSolar: true, hasBill: true });
const noSolar = getRecommendation({ hasSolar: false, hasBill: false });

describe("reportHeadings", () => {
  it("always includes the rolling-blackouts / data-center section", () => {
    for (const rec of [solarBill, noSolar]) {
      expect(reportHeadings(rec).some((h) => /rolling blackouts/i.test(h))).toBe(true);
    }
  });

  it("adds the panels section only when panels are recommended", () => {
    expect(reportHeadings(solarBill).some((h) => /remaining bill/i.test(h))).toBe(true);
    expect(reportHeadings(noSolar).some((h) => /remaining bill/i.test(h))).toBe(false);
  });

  it("never mentions batteries or storage", () => {
    for (const rec of [solarBill, noSolar]) {
      expect(reportHeadings(rec).join(" ")).not.toMatch(/batter|storage/i);
    }
  });
});

describe("buildUserPrompt", () => {
  it("passes the authoritative product ids and grid-strain context", () => {
    const p = buildUserPrompt({ hasSolar: true, hasBill: true, bill: 180 }, solarBill);
    expect(p).toContain("generac_generator");
    expect(p).toContain("additional_panels");
    expect(p).toMatch(/data center/i);
    expect(p).toMatch(/rolling blackout/i);
    expect(p).toMatch(/do NOT invent/i);
  });

  it("hands the model the SAME generator size the dashboard renders", () => {
    const form = { hasSolar: true, hasBill: true, sqft: 2400, criticalLoads: ["HVAC (Heat / AC)"], heatType: "Gas" };
    const { kw } = estimateGeneratorKw(form);
    const p = buildUserPrompt(form, solarBill);
    expect(p).toContain(`~${kw} kW`);
    expect(p).toMatch(/do not recalculate/i);
    expect(p).toMatch(/never as a final specification/i);
  });

  it("hands the model the SAME panel figures the dashboard renders", () => {
    const plan = planPanels({ utilityKwh: 850 });
    const p = buildUserPrompt({ hasSolar: true, hasBill: true, utilityKwh: 850 }, solarBill, plan);
    expect(p).toContain(`${plan.count} additional panels`);
    expect(p).toMatch(/AUTHORITATIVE — use these exact figures/);
    // Must not let the report claim the bill disappears — connection charges remain.
    expect(p).toMatch(/fixed connection charge remains/i);
    expect(p).toMatch(/do not state or imply the bill goes to zero/i);
  });

  it("omits the panel plan when panels are not recommended", () => {
    const rec = getRecommendation({ hasSolar: false, hasBill: true });
    const p = buildUserPrompt({ hasSolar: false, hasBill: true, utilityKwh: 850 }, rec, planPanels({ utilityKwh: 850 }));
    expect(p).not.toMatch(/additional panels/i);
  });

  it("never leaks battery/storage language", () => {
    const p = buildUserPrompt({ hasSolar: false, hasBill: true }, getRecommendation({ hasSolar: false, hasBill: true }));
    expect(p).not.toMatch(/batter|storage/i);
  });
});

describe("SYSTEM_PROMPT", () => {
  it("forbids batteries and locks products to the authoritative list", () => {
    expect(SYSTEM_PROMPT).toMatch(/never mention batteries/i);
    expect(SYSTEM_PROMPT).toMatch(/authoritative/i);
  });
});
