// Outage / grid-reliability helpers for the non-solar audit.
//
// Everything the customer-facing report shows comes from one of two places, and the
// report labels which is which:
//   1. VERIFIED  — ZIP resolved against a public geocoder, utility name from NREL.
//   2. REPORTED  — what the homeowner told us in the intake form.
//
// There is deliberately no third category of estimated-looking statistics. Pure
// functions only; the network call lives in fetchOutageProfile().

/** Outage-frequency answers from BackupFields, mapped to a per-year range. */
const FREQUENCY_PER_YEAR = {
  Rare: { perYear: 1, label: "about once a year" },
  Occasional: { perYear: 4, label: "a few times a year" },
  Frequent: { perYear: 10, label: "many times a year" },
};

/**
 * Turn the homeowner's own reported outage experience into annual figures.
 * Explicitly THEIR numbers — never presented as measured grid data.
 *
 * @param {Object} input
 * @param {string} input.outage - "Rare" | "Occasional" | "Frequent"
 * @param {number} input.hoursPerOutage - typical hours without power
 * @returns {{ perYear:number, label:string, hoursPerYear:number }}
 */
export function reportedOutageProfile({ outage = "Occasional", hoursPerOutage = 4 } = {}) {
  const f = FREQUENCY_PER_YEAR[outage] || FREQUENCY_PER_YEAR.Occasional;
  const hours = Math.max(0, Number(hoursPerOutage) || 0);
  return {
    perYear: f.perYear,
    label: f.label,
    hoursPerYear: Math.round(f.perYear * hours),
  };
}

/**
 * How much of the electricity sold in a state is generated inside it.
 *
 * Both inputs are published EIA figures, so this is arithmetic on public record,
 * not a model. A value under 100% means the state leans on imported power to meet
 * its own demand — real, checkable grid-strain context.
 *
 * Returns null when either figure is missing, so the UI can omit the row rather
 * than render a made-up percentage.
 */
export function generationCoverage({ netGenerationMwh, retailSalesMwh } = {}) {
  // Number(null) and Number("") are both 0, which is finite — so a missing EIA
  // figure would render as a confident "0% of electricity sold". Reject absent
  // values before coercing.
  const strict = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));
  const gen = strict(netGenerationMwh);
  const sales = strict(retailSalesMwh);
  if (!Number.isFinite(gen) || !Number.isFinite(sales) || sales <= 0) return null;
  return {
    percent: Math.round((gen / sales) * 100),
    netImporter: gen < sales,
  };
}

/**
 * Look up the public-record profile for a ZIP (browser → /api/outages).
 * Resolves to a shape the UI can always render; never throws.
 */
export async function fetchOutageProfile({ zip, state } = {}) {
  try {
    const r = await fetch("/api/outages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip, state }),
    });
    return await r.json();
  } catch (e) {
    return { zip: zip || null, located: false, profile: null, reason: e.message };
  }
}
