// ─────────────────────────────────────────────────────────────────────────────
// Rate lookup + energy projection math for the dashboard.
//
// Reframed for the whole-home energy audit: the story is bill elimination + backup
// power, NOT battery arbitrage. There is NO net-billing / export-credit modeling
// here — additional panels simply offset more of the remaining grid bill, and the
// generator is valued as resilience.
//
// The pure functions below take no I/O so they can be unit-tested. Only fetchRate()
// touches the network (browser → /api/rates).
// ─────────────────────────────────────────────────────────────────────────────

/** U.S. residential average, used when the live NREL rate is unavailable (~17¢/kWh). */
export const US_AVG_CENTS = 17;
/** Utility rates have historically risen a few percent per year. */
export const RATE_ESCALATION = 0.045;
export const PROJECTION_YEARS = 15;

/**
 * Live residential retail rate via our /api/rates proxy (browser only).
 * Falls back to the U.S. average so the dashboard always has a number to show.
 * @returns {Promise<{importCents:number, utilityName:string|null, precision:string|null, live:boolean}>}
 */
export async function fetchRate({ state, zip } = {}) {
  try {
    const r = await fetch("/api/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, zip }),
    });
    const j = await r.json();
    if (typeof j.residentialCents === "number" && j.residentialCents > 0) {
      return {
        importCents: j.residentialCents,
        utilityName: j.utilityName || null,
        precision: j.precision || null,
        live: true,
      };
    }
    console.warn("[rates] No live NREL rate; using U.S. average.", j);
  } catch (e) {
    console.warn("[rates] /api/rates failed; using U.S. average.", e);
  }
  return { importCents: US_AVG_CENTS, utilityName: null, precision: null, live: false };
}

/**
 * Project the cost of "doing nothing" — the current bill compounding with rising
 * utility rates over `years`. Pure; unit-tested.
 * @returns {{ series: {year:number, annual:number, cumulative:number}[], total:number, firstYear:number }}
 */
export function projectBill({ monthlyBill, years = PROJECTION_YEARS, escalation = RATE_ESCALATION } = {}) {
  const annual0 = Math.max(0, Number(monthlyBill) || 0) * 12;
  const series = [];
  let cumulative = 0;
  for (let t = 0; t < years; t++) {
    const annual = annual0 * Math.pow(1 + escalation, t);
    cumulative += annual;
    series.push({ year: t + 1, annual: Math.round(annual), cumulative: Math.round(cumulative) });
  }
  return {
    series,
    total: Math.round(cumulative),
    firstYear: Math.round(annual0),
  };
}

/**
 * SINGLE SOURCE OF TRUTH for the additional-panels plan.
 *
 * Every panel figure the customer sees — the count on the Backup Power Plan card,
 * the savings line on the 15-year projection, the comparison table, and the AI
 * report — must derive from this one function. A customer reading two different
 * panel counts or two different offsets on the same page loses trust in all of it.
 *
 * The count is rounded DOWN, which also guarantees offsetFraction <= 1: the plan can
 * never claim to cover more energy than the array actually produces.
 *
 * @returns {{ count:number, gridKwh:number, coveredKwh:number, offsetFraction:number }}
 */

/**
 * Monthly output of one modern residential panel, averaged over the year.
 *
 * THIS IS THE ONE FIGURE for what a panel makes, and lib/diagnostics.js reads it from
 * here — the production benchmark and the panel plan have to agree or the assessment
 * and the proposal contradict each other in front of the homeowner.
 *
 * Calibrated to the field: 20 panels on a healthy system produce roughly 830 kWh in an
 * average month. The previous value of 55 assumed high-desert sun; in an ordinary
 * market it overstated both what an existing array should be producing (making healthy
 * systems fail the diagnostic) and what each added panel would cover.
 */
export const KWH_PER_PANEL = 41.5;

/** Nominal DC rating of a modern residential panel, in kW. */
export const KW_PER_PANEL = 0.4;

/** Derived: monthly kWh per installed kW (~1,245 kWh/kW/year). */
export const KWH_PER_KW_MONTH = KWH_PER_PANEL / KW_PER_PANEL;

export function planPanels({ utilityKwh } = {}) {
  const gridKwh = Math.max(0, Number(utilityKwh) || 0);
  const count = Math.floor(gridKwh / KWH_PER_PANEL);
  const coveredKwh = count * KWH_PER_PANEL;
  const offsetFraction = gridKwh > 0 ? Math.min(1, coveredKwh / gridKwh) : 0;
  return { count, gridKwh, coveredKwh, offsetFraction };
}

/**
 * Additional-panels scenario: extra panels offset `offsetFraction` of the remaining
 * bill, so the home only keeps paying the un-offset remainder (still escalating).
 * Only meaningful for homes that ALREADY have solar AND still have a bill.
 *
 * Callers should pass the offsetFraction from planPanels() so the chart agrees with
 * the panel count shown elsewhere. The 0.7 default is only a fallback.
 * @returns {{ series:..., total:number, savings:number, offsetFraction:number }}
 */
export function projectWithPanels({
  monthlyBill,
  offsetFraction = 0.7,
  years = PROJECTION_YEARS,
  escalation = RATE_ESCALATION,
} = {}) {
  const frac = Math.min(1, Math.max(0, offsetFraction));
  const remainingMonthly = (Math.max(0, Number(monthlyBill) || 0)) * (1 - frac);
  const reduced = projectBill({ monthlyBill: remainingMonthly, years, escalation });
  const doNothing = projectBill({ monthlyBill, years, escalation });
  return {
    series: reduced.series,
    total: reduced.total,
    savings: Math.round(doNothing.total - reduced.total),
    offsetFraction: frac,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Standby generator sizing.
//
// The 22 kW unit is the STANDARD offer, not the top of a ladder. It backs up a home
// of roughly 4,500 sq ft in full — central AC, electric water heater, fridge and
// lights all running at once — so there is no need to pick a handful of essential
// circuits. Sizing only moves upward, and only when the home genuinely demands it.
//
// IMPORTANT: square footage is a proxy, not a load calculation. Starting (surge)
// watts, not running watts, decide real sizing, and a central AC compressor or heat
// pump can pull several times its running draw for a moment on startup. This output
// is a quote-stage estimate; the site assessment does the actual load calc.
// ─────────────────────────────────────────────────────────────────────────────

/** The standard unit, and the floor for every quote. */
export const STANDARD_KW = 22;

/** Air-cooled home-standby sizes at and above the standard unit, ascending. */
const GENERATOR_TIERS = [22, 24, 26];

/** Floor area the standard unit covers in full. */
const STANDARD_COVERS_SQFT = 4500;

/** Loads with large starting surge or sustained draw. */
const HEAVY_LOADS = ["HVAC (Heat / AC)", "Well Pump", "Electric Range"];

/**
 * Estimate standby generator size. Starts at the 22 kW standard unit and steps up
 * only for homes past its coverage or with unusually heavy sustained load.
 * Pure; unit-tested.
 *
 * @param {Object} input
 * @param {number|string} input.sqft
 * @param {string[]} input.criticalLoads - labels from BackupFields
 * @param {string} input.heatType - "Gas" | "Electric"
 * @returns {{ kw:number, tier:'whole-home', drivers:string[] }}
 */
export function estimateGeneratorKw({ sqft, criticalLoads = [], heatType = "Gas" } = {}) {
  const area = Number(sqft) || 0;
  const loads = Array.isArray(criticalLoads) ? criticalLoads : [];
  const heavy = HEAVY_LOADS.filter((l) => loads.includes(l));
  const allElectric = heatType === "Electric";

  const drivers = [];
  if (area > 0) drivers.push(`${area.toLocaleString()} sq ft`);
  if (loads.includes("HVAC (Heat / AC)")) drivers.push("central heating & cooling");
  if (loads.includes("Well Pump")) drivers.push("well pump start-up surge");
  if (loads.includes("Electric Range")) drivers.push("electric range");
  if (allElectric) drivers.push("all-electric heat");

  let step = 0;
  // Past what the standard unit covers in full, one step per 1,000 sq ft over.
  if (area > STANDARD_COVERS_SQFT) step += Math.ceil((area - STANDARD_COVERS_SQFT) / 1000);
  // A large all-electric home carries its entire heating load on the generator,
  // which is the single biggest continuous draw a house can have.
  if (allElectric && area > 3500) step += 1;
  // Three heavy surge loads on an already-large home is the other case that pushes
  // past the standard unit.
  if (heavy.length >= 3 && area > 3500) step += 1;

  const kw = GENERATOR_TIERS[Math.min(GENERATOR_TIERS.length - 1, step)];

  // Every unit we quote is a whole-home unit — the essential-circuits and partial
  // bands do not exist in this offer.
  return { kw, tier: "whole-home", drivers };
}

/** Customer-facing name for the coverage band. */
export const TIER_LABELS = {
  "whole-home": "Whole-home coverage",
};
