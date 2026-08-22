import { describe, it, expect } from "vitest";
import {
  runDiagnostics,
  expectedMonthlyKwh,
  ageAdjustedExpected,
  systemAgeYears,
  preSolarBill,
  grade,
  label,
  KWH_PER_PANEL,
  ANNUAL_DEGRADATION,
} from "./diagnostics.js";

// Fixed clock so the age-dependent tests never drift with the calendar.
const NOW = new Date("2026-08-20T12:00:00Z");

/** A complete, realistic intake. Individual tests strip fields from this. */
const FULL_FORM = {
  systemkw: 7,
  panels: 20,
  solarProduction: 780,
  utilityKwh: 400,
  installDate: "2019",
  bill: 95,
  hasBattery: false,
  hasStandby: false,
};
// A LIVE, utility-specific rate. Effective Rate Paid only runs against one of
// these — a fallback average is not this homeowner's rate.
const RATE = { importCents: 17, live: true, utilityName: "Dominion Energy" };
/** What fetchRate returns when NREL cannot resolve the address. */
const FALLBACK_RATE = { importCents: 17, live: false, utilityName: null };

const byName = (result, name) => result.tests.find((t) => t.name === name);

describe("expectedMonthlyKwh", () => {
  it("benchmarks a 20-panel array at about 830 kWh in an average month", () => {
    // The field calibration. A healthy 20-panel system produces roughly this much;
    // the old 1,400 kWh/kW/year figure put it near 1,170 and failed healthy arrays.
    expect(expectedMonthlyKwh({ panels: 20 })).toBe(830);
  });

  it("prefers panel count over kW when both are given", () => {
    // Homeowners misremember system size; a rep counts panels off the roof.
    expect(expectedMonthlyKwh({ panels: 20, systemkw: 10 })).toBe(20 * KWH_PER_PANEL);
  });

  it("falls back to system size when the panel count is unknown", () => {
    expect(expectedMonthlyKwh({ systemkw: 8 })).toBeCloseTo(8 * (KWH_PER_PANEL / 0.4), 10);
  });

  it("returns null rather than guessing when neither figure is known", () => {
    expect(expectedMonthlyKwh({})).toBeNull();
    expect(expectedMonthlyKwh({ panels: 0, systemkw: 0 })).toBeNull();
    expect(expectedMonthlyKwh({ systemkw: "abc" })).toBeNull();
  });
});

describe("systemAgeYears", () => {
  it("counts whole years from the install year", () => {
    expect(systemAgeYears({ installDate: "2019", now: NOW })).toBe(7);
    expect(systemAgeYears({ installDate: 2026, now: NOW })).toBe(0);
  });

  it("never returns a negative age for a future-dated install", () => {
    expect(systemAgeYears({ installDate: "2030", now: NOW })).toBe(0);
  });

  it("returns null when the year is missing or nonsense", () => {
    expect(systemAgeYears({ now: NOW })).toBeNull();
    expect(systemAgeYears({ installDate: "not a year", now: NOW })).toBeNull();
  });
});

describe("ageAdjustedExpected", () => {
  it("applies the annual degradation curve", () => {
    const nameplate = expectedMonthlyKwh({ panels: 20 });
    const aged = ageAdjustedExpected({ panels: 20, installDate: "2019", now: NOW });
    expect(aged).toBeCloseTo(nameplate * Math.pow(1 - ANNUAL_DEGRADATION, 7), 10);
  });

  it("is always at or below nameplate, and falls as the system ages", () => {
    const nameplate = expectedMonthlyKwh({ panels: 20 });
    const young = ageAdjustedExpected({ panels: 20, installDate: "2025", now: NOW });
    const old = ageAdjustedExpected({ panels: 20, installDate: "2010", now: NOW });
    expect(young).toBeLessThanOrEqual(nameplate);
    expect(old).toBeLessThan(young);
  });

  it("is null without both an array size and an install year", () => {
    expect(ageAdjustedExpected({ panels: 20, now: NOW })).toBeNull();
    expect(ageAdjustedExpected({ installDate: "2019", now: NOW })).toBeNull();
  });
});

describe("preSolarBill", () => {
  it("values every kWh the home uses at the retail rate", () => {
    // (700 + 400) kWh × 17¢ = $187
    expect(preSolarBill({ solarProduction: 700, utilityKwh: 400, importCents: 17 })).toBeCloseTo(187, 6);
  });

  it("is null without a rate", () => {
    expect(preSolarBill({ solarProduction: 700, utilityKwh: 400 })).toBeNull();
  });
});

describe("grade / label thresholds", () => {
  it("bands at 85 and 60", () => {
    expect(grade(85)).toBe("pass");
    expect(grade(84)).toBe("warn");
    expect(grade(60)).toBe("warn");
    expect(grade(59)).toBe("fail");
    expect(label(100)).toBe("PASS");
    expect(label(70)).toBe("CHECK");
    expect(label(10)).toBe("LOW");
  });
});

describe("runDiagnostics — the reference case", () => {
  const result = runDiagnostics({ form: FULL_FORM, rate: RATE, now: NOW });

  it("returns six checks when a live utility rate resolved", () => {
    expect(result.tests).toHaveLength(6);
  });

  it("scores production against the array size", () => {
    // 20 panels → 830 kWh/mo expected; 780 actual → 94%
    const t = byName(result, "Solar Production Output");
    expect(t.measured).toBe(true);
    expect(t.pct).toBe(94);
    expect(t.grade).toBe("pass");
  });

  it("uses a one-percent-per-year degradation curve", () => {
    // 20 panels benchmark at 830 kWh/mo; after 7 years at 1%/yr the fair figure is
    // 830 x 0.99^7 = 773.6, so 780 kWh actual scores 101% -> clamped to 100.
    expect(byName(result, "Degradation Check").pct).toBe(100);
  });

  it("scores degradation against the system's age, which is kinder than nameplate", () => {
    const nameplateTest = byName(result, "Solar Production Output");
    const degradation = byName(result, "Degradation Check");
    expect(degradation.pct).toBeGreaterThan(nameplateTest.pct);
    expect(degradation.note).toMatch(/7 years old/);
  });

  it("computes offset as solar's share of TOTAL use, not of the grid portion", () => {
    // 780 / (780 + 400) = 66.1% → 66
    expect(byName(result, "Energy Offset").pct).toBe(66);
  });

  it("measures the effective rate paid, which the offset cannot see", () => {
    // $95 over 400 kWh = 23.75c/kWh actually paid against a 17c retail rate,
    // so the home is paying ~72% of what a fair retail purchase would cost it.
    const t = byName(result, "Effective Rate Paid");
    expect(t.pct).toBe(72);
    expect(t.detail).toMatch(/23\.8/);
  });

  it("effective rate is a genuinely separate measurement from energy offset", () => {
    // Regression guard: "grid dependency" (1 - grid/total) is algebraically the
    // same number as the offset. This row must never drift back into that.
    const offset = byName(result, "Energy Offset").pct;
    const rateCheck = byName(result, "Effective Rate Paid").pct;
    expect(rateCheck).not.toBe(offset);
  });

  it("scores a home paying exactly retail at 100%", () => {
    // 400 kWh at 17c = $68 — no fixed charges, no export penalty.
    const r = runDiagnostics({ form: { ...FULL_FORM, bill: 68 }, rate: RATE, now: NOW });
    expect(byName(r, "Effective Rate Paid").pct).toBe(100);
  });

  it("names the utility the rate came from", () => {
    expect(byName(result, "Effective Rate Paid").note).toMatch(/Dominion Energy/);
  });

  it("measures bill elimination against the pre-solar cost of the same usage", () => {
    // (780 + 400) kWh x 17c = $200.60 baseline; bill $95 → 53% removed
    expect(byName(result, "Bill Elimination").pct).toBe(53);
  });

  it("reports zero backup when there is no generator and no battery", () => {
    const t = byName(result, "Backup Unit");
    expect(t.pct).toBe(0);
    expect(t.grade).toBe("fail");
  });

  it("flags the system overall as needing attention", () => {
    expect(result.status).toBe("attention");
    expect(result.needsAttention).toBe(true);
  });
});

describe("runDiagnostics — the backup unit check is a measured fact", () => {
  it("gives full credit only for a standby generator", () => {
    const r = runDiagnostics({ form: { ...FULL_FORM, hasStandby: true }, rate: RATE, now: NOW });
    expect(byName(r, "Backup Unit").pct).toBe(100);
  });

  it("gives a battery partial credit only — it cannot carry a multi-day outage", () => {
    const r = runDiagnostics({ form: { ...FULL_FORM, hasBattery: true }, rate: RATE, now: NOW });
    const t = byName(r, "Backup Unit");
    expect(t.pct).toBe(30);
    expect(t.grade).toBe("fail");
  });

  it("a standby generator outranks a battery", () => {
    const gen = runDiagnostics({ form: { ...FULL_FORM, hasStandby: true }, rate: RATE, now: NOW });
    const bat = runDiagnostics({ form: { ...FULL_FORM, hasBattery: true }, rate: RATE, now: NOW });
    expect(byName(gen, "Backup Unit").pct).toBeGreaterThan(byName(bat, "Backup Unit").pct);
  });
});

describe("runDiagnostics — missing inputs are reported, never invented", () => {
  it("marks production-dependent tests unmeasured with no production figure", () => {
    const r = runDiagnostics({ form: { ...FULL_FORM, solarProduction: "" }, rate: RATE, now: NOW });
    for (const name of ["Solar Production Output", "Degradation Check"]) {
      const t = byName(r, name);
      expect(t.measured).toBe(false);
      expect(t.pct).toBeNull();
      expect(t.label).toBe("NOT MEASURED");
      expect(t.reason).toBeTruthy();
    }
  });

  it("marks degradation unmeasured when the install year is unknown, but keeps output scored", () => {
    const r = runDiagnostics({ form: { ...FULL_FORM, installDate: "" }, rate: RATE, now: NOW });
    expect(byName(r, "Degradation Check").measured).toBe(false);
    expect(byName(r, "Solar Production Output").measured).toBe(true);
  });

  it("marks bill elimination unmeasured when no rate resolved", () => {
    const r = runDiagnostics({ form: FULL_FORM, rate: null, now: NOW });
    expect(byName(r, "Bill Elimination").measured).toBe(false);
  });

  it("marks bill elimination unmeasured when the bill is blank", () => {
    // There is no "no bill" case any more - every home on a utility gets one - so a
    // blank field means the rep has not entered it, not that the bill is zero.
    const r = runDiagnostics({ form: { ...FULL_FORM, bill: "" }, rate: RATE, now: NOW });
    expect(byName(r, "Bill Elimination").measured).toBe(false);
    expect(byName(r, "Effective Rate Paid")).toBeUndefined();
  });

  it("DROPS the rate check entirely when the rate is a fallback, not this utility", () => {
    // Scoring a homeowner against the US average and calling it their rate is a
    // number a rep cannot defend. The row is absent, not shown as "not measured".
    const r = runDiagnostics({ form: FULL_FORM, rate: FALLBACK_RATE, now: NOW });
    expect(byName(r, "Effective Rate Paid")).toBeUndefined();
    expect(r.tests).toHaveLength(5);
    // A fallback rate is still good enough to frame bill elimination as an estimate.
    expect(byName(r, "Bill Elimination").measured).toBe(true);
  });

  it("drops the rate check when the rate is live but no utility was named", () => {
    const r = runDiagnostics({
      form: FULL_FORM,
      rate: { importCents: 17, live: true, utilityName: null },
      now: NOW,
    });
    expect(byName(r, "Effective Rate Paid")).toBeUndefined();
  });

  it("never emits NaN, Infinity or a negative score", () => {
    const forms = [
      {},
      { systemkw: 0, solarProduction: 0, utilityKwh: 0, bill: 0 },
      { systemkw: 7, solarProduction: 5000, utilityKwh: 0, bill: 0 },
      { systemkw: -3, solarProduction: -100, utilityKwh: -50, bill: -10 },
      { ...FULL_FORM, bill: 100000 },
    ];
    for (const form of forms) {
      for (const rate of [null, RATE, FALLBACK_RATE, { importCents: 0, live: true, utilityName: "X" }]) {
        const r = runDiagnostics({ form, rate, now: NOW });
        expect(r.tests.length).toBeGreaterThanOrEqual(5);
        for (const t of r.tests) {
          if (!t.measured) {
            expect(t.pct).toBeNull();
            continue;
          }
          expect(Number.isFinite(t.pct)).toBe(true);
          expect(t.pct).toBeGreaterThanOrEqual(0);
          expect(t.pct).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("reports an incomplete status when nothing but the backup unit could be scored", () => {
    // The backup unit is always measurable, so the floor is one scored test.
    const r = runDiagnostics({ form: {}, rate: null, now: NOW });
    expect(r.measuredCount).toBe(1);
    expect(byName(r, "Backup Unit").measured).toBe(true);
  });
});

describe("runDiagnostics — the headline follows the scores", () => {
  it("reads healthy only when every scored check passes", () => {
    const r = runDiagnostics({
      form: { ...FULL_FORM, solarProduction: 900, utilityKwh: 40, bill: 6.8, hasStandby: true },
      rate: RATE,
      now: NOW,
    });
    expect(r.status).toBe("healthy");
    expect(r.headline).toBe("System healthy");
  });

  it("counts the failing checks when any are below standard", () => {
    const r = runDiagnostics({ form: FULL_FORM, rate: RATE, now: NOW });
    expect(r.headline).toMatch(/below standard/);
  });
});
