// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the system diagnostic tests.
//
// These six checks are the centrepiece of the audit page — they are what the
// homeowner is shown before anyone says the word "generator". So the hard rule here
// is: every number is derived from something the homeowner supplied, and a test with
// missing inputs reports `measured: false` rather than a plausible-looking score.
//
// The previous version shipped three fabricated rows (inverter comms and grid sync
// were hardcoded 100; panel health was `91 + panels % 9`). A rep who is asked "how
// did you measure that?" has to have an answer, so those are gone rather than
// dressed up.
//
// Pure — no I/O, no React, no Date.now() except through an injectable `now`.
// ─────────────────────────────────────────────────────────────────────────────

// The panel-output figure lives in lib/rates.js and is imported, not duplicated:
// the diagnostic benchmark and the panel plan must be the same number, or the
// assessment and the proposal disagree in front of the homeowner.
import { KWH_PER_PANEL, KWH_PER_KW_MONTH } from "./rates.js";

export { KWH_PER_PANEL, KWH_PER_KW_MONTH };

/** Panels lose roughly one percent of output per year of service. */
export const ANNUAL_DEGRADATION = 0.01;

/** Score thresholds shared by every test. */
export const PASS_AT = 85;
export const CHECK_AT = 60;

const clampPct = (n) => Math.max(0, Math.min(100, Math.round(n)));
const num = (v) => {
  // Number("") is 0, which would turn an untouched form field into a real-looking
  // score. Blank means absent here, always.
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
/** Positive-number reader — most of these inputs are meaningless at zero or below. */
const pos = (v) => {
  const n = num(v);
  return n !== null && n > 0 ? n : null;
};

/** Grade band for a score. */
export function grade(pct) {
  return pct >= PASS_AT ? "pass" : pct >= CHECK_AT ? "warn" : "fail";
}

/** Customer-facing label for a score. */
export function label(pct) {
  return pct >= PASS_AT ? "PASS" : pct >= CHECK_AT ? "CHECK" : "LOW";
}

/**
 * What a healthy array this size should produce in an AVERAGE month, before any age
 * adjustment.
 *
 * Panel count wins over kW when both are given. A rep counts panels off the roof and
 * gets it right; homeowners routinely misremember system size, and a wrong kW figure
 * silently moves the benchmark for two of the six tests.
 *
 * @returns {number|null} kWh/month, or null when neither figure is known.
 */
export function expectedMonthlyKwh({ panels, systemkw } = {}) {
  const count = pos(panels);
  if (count !== null) return count * KWH_PER_PANEL;
  const kw = pos(systemkw);
  if (kw !== null) return kw * KWH_PER_KW_MONTH;
  return null;
}

/** Whole years between an install year and `now`, floored at 0. Null if unknown. */
export function systemAgeYears({ installDate, now = new Date() } = {}) {
  const year = num(installDate);
  if (year === null || year < 1970) return null;
  const age = now.getFullYear() - year;
  return age < 0 ? 0 : age;
}

/**
 * What this system should still be producing given its age — the fair benchmark for
 * an older array, which nameplate alone would unfairly mark down.
 * @returns {number|null} kWh/month, or null when size or install year is unknown.
 */
export function ageAdjustedExpected({ panels, systemkw, installDate, now = new Date() } = {}) {
  const nameplate = expectedMonthlyKwh({ panels, systemkw });
  const age = systemAgeYears({ installDate, now });
  if (nameplate === null || age === null) return null;
  return nameplate * Math.pow(1 - ANNUAL_DEGRADATION, age);
}

/**
 * Estimate what this home would be paying with no solar at all: every kWh it uses,
 * bought at the retail rate. Used as the denominator for bill elimination.
 * @returns {number|null} dollars/month, or null without both usage and a rate.
 */
export function preSolarBill({ solarProduction, utilityKwh, importCents } = {}) {
  const prod = num(solarProduction);
  const grid = num(utilityKwh);
  const cents = pos(importCents);
  if (prod === null || grid === null || cents === null) return null;
  const total = prod + grid;
  if (total <= 0) return null;
  return (total * cents) / 100;
}

/** A test that could not be computed. Shown as "Not measured", never as a score. */
function unmeasured(icon, name, note, reason) {
  return { icon, name, note, measured: false, pct: null, grade: "none", label: "NOT MEASURED", reason };
}

function measured(icon, name, note, rawPct, detail) {
  const pct = clampPct(rawPct);
  return { icon, name, note, measured: true, pct, grade: grade(pct), label: label(pct), detail };
}

/**
 * Run the full diagnostic suite.
 *
 * @param {Object} input
 * @param {Object} input.form  the intake form
 * @param {Object|null} input.rate  resolved utility rate, `{ importCents }`
 * @param {Date}   [input.now]  injectable for tests
 * The suite is five or six checks: Effective Rate Paid only appears when a live,
 * utility-specific retail rate was resolved for this address.
 *
 * @returns {{
 *   tests: Array<{icon,name,note,measured,pct,grade,label,detail?,reason?}>,
 *   measuredCount: number,
 *   needsAttention: boolean,
 *   status: 'attention'|'healthy'|'incomplete',
 *   headline: string,
 * }}
 */
export function runDiagnostics({ form = {}, rate = null, now = new Date() } = {}) {
  const production = num(form.solarProduction);
  const gridKwh = num(form.utilityKwh);
  const bill = num(form.bill);
  const importCents = rate ? num(rate.importCents) : null;

  const nameplate = expectedMonthlyKwh({ panels: form.panels, systemkw: form.systemkw });
  const aged = ageAdjustedExpected({
    panels: form.panels,
    systemkw: form.systemkw,
    installDate: form.installDate,
    now,
  });
  const age = systemAgeYears({ installDate: form.installDate, now });

  const tests = [];

  // 1. Production output vs. what a system this size should make.
  tests.push(
    production === null || nameplate === null
      ? unmeasured("⚡", "Solar Production Output", "Measured against array size", "Needs panel count or system size, plus an average monthly production figure")
      : measured(
          "⚡",
          "Solar Production Output",
          "Measured against array size",
          (production / nameplate) * 100,
          `${Math.round(production)} kWh against ${Math.round(nameplate)} kWh expected`
        )
  );

  // 2. Same measurement, but benchmarked against the array's age. An 8-year-old
  //    system is not failing because it no longer hits its day-one nameplate.
  tests.push(
    production === null || aged === null
      ? unmeasured("📉", "Degradation Check", "Output vs. expected for system age", "Needs panel count or system size, plus the install year")
      : measured(
          "📉",
          "Degradation Check",
          `Output vs. expected at ${age} year${age === 1 ? "" : "s"} old`,
          (production / aged) * 100,
          `${Math.round(production)} kWh against ${Math.round(aged)} kWh expected at this age`
        )
  );

  // 3. Solar's share of everything the home uses. Bounded at 100% by construction:
  //    total use is production + grid purchase, so the array cannot offset more than
  //    the home consumes.
  const totalUse = production !== null && gridKwh !== null ? production + gridKwh : null;
  tests.push(
    totalUse === null || totalUse <= 0
      ? unmeasured("🏠", "Energy Offset", "Solar share of total home energy", "Needs production and grid usage")
      : measured(
          "🏠",
          "Energy Offset",
          "Solar share of total home energy",
          (production / totalUse) * 100,
          `${Math.round(production)} of ${Math.round(totalUse)} kWh produced on site`
        )
  );

  // 4. What the home ACTUALLY pays per kWh against the retail rate.
  //
  //    OMITTED ENTIRELY unless NREL resolved a live rate for a NAMED utility. Scoring
  //    a homeowner against the US average and presenting it as their rate is exactly
  //    the kind of number a rep cannot defend when asked "which utility is that?", so
  //    when the lookup falls back this row does not appear at all. It is not rendered
  //    as "not measured" either: an absent row reads cleaner than an empty one.
  //
  //    Note this is deliberately not "grid dependency" - 1 - grid/total is
  //    algebraically identical to the offset above, so it would have been the same
  //    number wearing a different label. This measures something the offset cannot
  //    see: fixed charges, minimum bills and unfavourable export credit all push the
  //    effective rate above retail, and that gap is the bill problem in one figure.
  const rateIsUtilitySpecific = Boolean(rate && rate.live && rate.utilityName);
  const effectiveCents = bill !== null && pos(gridKwh) !== null ? (bill * 100) / gridKwh : null;
  if (rateIsUtilitySpecific && effectiveCents !== null && importCents !== null && importCents > 0) {
    tests.push(
      measured(
        "🔌",
        "Effective Rate Paid",
        `What each purchased kWh really costs vs. ${rate.utilityName}`,
        (importCents / effectiveCents) * 100,
        `${effectiveCents.toFixed(1)}¢/kWh paid against ${rate.utilityName} at ${importCents}¢`
      )
    );
  }

  // 5. How much of the original bill the system actually removed. Only meaningful
  //    when the home still receives a bill and we resolved a real retail rate.
  const baseline = preSolarBill({ solarProduction: production, utilityKwh: gridKwh, importCents });
  if (bill === null || baseline === null || baseline <= 0) {
    tests.push(
      unmeasured("💸", "Bill Elimination", "Bill removed vs. pre-solar cost", "Needs the current bill, usage and a resolved utility rate")
    );
  } else {
    tests.push(
      measured(
        "💸",
        "Bill Elimination",
        "Bill removed vs. pre-solar cost",
        (1 - bill / baseline) * 100,
        `$${Math.round(bill)} today against roughly $${Math.round(baseline)} without solar`
      )
    );
  }

  // 6. Backup unit is a measured fact, not a courtesy score. With no standby
  //    generator the home has zero whole-home backup, and saying otherwise would
  //    contradict everything downstream. A wall battery earns partial credit only:
  //    it carries a few essential circuits for hours, not the whole home through a
  //    multi-day outage, and it cannot recharge on a dark winter day.
  if (form.hasStandby) {
    tests.push(measured("🛡️", "Backup Unit", "Whole-home standby generator on site", 100, "Standby generator confirmed on the property"));
  } else if (form.hasBattery) {
    tests.push(measured("🛡️", "Backup Unit", "Solar battery only — partial loads, short duration", 30, "No standby generator; battery covers essential circuits briefly"));
  } else {
    tests.push(measured("🛡️", "Backup Unit", "No backup power on site", 0, "No standby generator and no battery found"));
  }

  const scored = tests.filter((t) => t.measured);
  const measuredCount = scored.length;
  const needsAttention = scored.some((t) => t.grade !== "pass");
  const status = measuredCount === 0 ? "incomplete" : needsAttention ? "attention" : "healthy";

  const failing = scored.filter((t) => t.grade === "fail").length;
  const headline =
    status === "incomplete"
      ? "Not enough data"
      : failing > 0
        ? `${failing} check${failing === 1 ? "" : "s"} below standard`
        : needsAttention
          ? "Needs attention"
          : "System healthy";

  return { tests, measuredCount, needsAttention, status, headline };
}
