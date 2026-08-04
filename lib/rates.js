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
    // eslint-disable-next-line no-console
    console.warn("[rates] No live NREL rate; using U.S. average.", j);
  } catch (e) {
    // eslint-disable-next-line no-console
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
 * A modern panel produces roughly 50–60 kWh/month; 55 is the midpoint. The count is
 * rounded DOWN, which also guarantees offsetFraction <= 1: the plan can never claim
 * to cover more energy than the array actually produces.
 *
 * @returns {{ count:number, gridKwh:number, coveredKwh:number, offsetFraction:number }}
 */
export const KWH_PER_PANEL = 55;

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
// Industry coverage bands this model targets:
//   • Essential circuits only  7–11 kW — fridge, lights, furnace fan, Wi-Fi, outlets.
//                                        Will NOT carry central air conditioning.
//   • Partial / mid-range     14–16 kW — essentials plus a couple of major appliances
//                                        (well pump, window AC).
//   • Whole-house             20–24 kW — central AC, electric water heater, fridge
//                                        and lights all running at once.
//
// A 2,400 sq ft home lands at 15–22 kW, with 20–24 kW recommended for full comfort
// when central air is in play — the reference point this table is calibrated to.
//
// IMPORTANT: square footage is a proxy, not a load calculation. Starting (surge)
// watts, not running watts, decide real sizing, and a central AC compressor or heat
// pump can pull several times its running draw for a moment on startup. This output
// is a quote-stage estimate; the site assessment does the actual load calc.
// ─────────────────────────────────────────────────────────────────────────────

/** Real Generac air-cooled home-standby sizes, ascending. */
const GENERATOR_TIERS = [10, 14, 18, 20, 22, 24, 26];

/** Loads with large starting surge or sustained draw. Each pushes up one size. */
const HEAVY_LOADS = ["HVAC (Heat / AC)", "Well Pump", "Electric Range"];

/** Whole-home baseline by conditioned floor area, before load/fuel adjustments. */
function baseKwForArea(area) {
  if (area <= 0) return 20; // unknown size → typical U.S. whole-home unit
  if (area < 1500) return 14;
  if (area < 2000) return 18;
  if (area < 3000) return 20; // a 2,400 sq ft home starts here
  if (area < 4000) return 22;
  if (area < 5000) return 24;
  return 26;
}

/**
 * Estimate standby generator size from home size, the loads that must stay on, and
 * heating type. Snapped to a real Generac tier. Pure; unit-tested.
 *
 * @param {Object} input
 * @param {number|string} input.sqft
 * @param {string[]} input.criticalLoads - labels from BackupFields
 * @param {string} input.heatType - "Gas" | "Electric"
 * @returns {{ kw:number, tier:'essential'|'partial'|'whole-home', drivers:string[] }}
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

  // A small, gas-heated home with no large motors genuinely doesn't need a
  // whole-home unit — quoting one anyway would be overselling.
  if (area > 0 && area < 1500 && heavy.length === 0 && !allElectric) {
    return { kw: 10, tier: "essential", drivers };
  }

  // Electric heat means resistance strips or a heat pump carrying the whole heating
  // load, which is the single biggest continuous draw a house can have.
  const bump = Math.min(heavy.length + (allElectric ? 1 : 0), 3);
  const baseIdx = GENERATOR_TIERS.indexOf(baseKwForArea(area));
  const kw = GENERATOR_TIERS[Math.min(GENERATOR_TIERS.length - 1, baseIdx + bump)];

  const tier = kw < 12 ? "essential" : kw < 20 ? "partial" : "whole-home";
  return { kw, tier, drivers };
}

/** Customer-facing name for each coverage band. */
export const TIER_LABELS = {
  essential: "Essential-circuit coverage",
  partial: "Partial-home coverage",
  "whole-home": "Whole-home coverage",
};
