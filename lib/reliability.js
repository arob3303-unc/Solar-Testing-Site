// ─────────────────────────────────────────────────────────────────────────────
// Outage-record lookup, from EIA Form EIA-861.
//
// SAIDI = minutes a customer spends without power in a year.
// SAIFI = number of interruptions a customer sees in a year.
// "WithMed" includes major event days (storms); "WithoutMed" excludes them. The gap
// between the two IS the storm story — Maine 2023 was 1,863 minutes with storms and
// 247 without.
//
// PURE. The dataset is passed IN rather than imported, for two reasons: it keeps this
// module unit-testable against fixtures, and it keeps a 150 KB JSON file out of the
// client bundle. Only app/api/reliability/route.js imports the real data.
//
// THE MATCHING RULE THAT MATTERS: a wrong utility is worse than a right state. If a
// utility name is ambiguous within the state, this resolves to the state average and
// says so, rather than guessing. Every result carries a `scope` that the UI must show,
// so a homeowner is always told whether they are looking at their utility, their
// state, or the country.
// ─────────────────────────────────────────────────────────────────────────────

/** Corporate suffixes carrying no identifying information. Stripped when matching. */
const SUFFIXES = new Set([
  "inc", "llc", "llp", "lp", "co", "company", "corp", "corporation", "plc",
  "the", "of", "a", "an",
]);

/**
 * Reduce a utility name to comparable tokens.
 *
 * EIA and NREL spell the same company differently — "Virginia Electric & Power Co"
 * vs "Virginia Electric and Power Company" — so ampersands, punctuation, abbreviated
 * words and corporate suffixes all have to come out before comparing.
 */
export function normalizeUtility(name) {
  if (typeof name !== "string") return [];
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => {
      // EIA truncates words to fit its column; expand the common ones so they match
      // the spelled-out forms NREL returns.
      if (t === "elec") return "electric";
      if (t === "pwr") return "power";
      if (t === "coop" || t === "cooperative") return "coop";
      if (t === "assn" || t === "association") return "assn";
      if (t === "dept" || t === "department") return "dept";
      return t;
    })
    .filter((t) => t && !SUFFIXES.has(t));
}

const keyOf = (name) => normalizeUtility(name).join(" ");

/** True when one token list is contained in the other. */
function isSubset(a, b) {
  const setB = new Set(b);
  return a.length > 0 && a.every((t) => setB.has(t));
}

/**
 * Minutes → a phrase a homeowner hears rather than reads.
 * @returns {string|null}
 */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return null;
  const n = Number(minutes);
  if (!Number.isFinite(n) || n < 0) return null;

  const total = Math.round(n);
  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const h = `${hours} hour${hours === 1 ? "" : "s"}`;
  return mins ? `${h} ${mins} min` : h;
}

/** Shape a stored row into a result, dropping rows with nothing usable. */
function toResult(row, scope, label, year) {
  if (!row) return null;
  const { saidiWithMed, saidiWithoutMed, saifiWithMed, saifiWithoutMed } = row;
  if (saidiWithMed === null && saidiWithoutMed === null) return null;
  return {
    saidiWithMed: saidiWithMed ?? null,
    saidiWithoutMed: saidiWithoutMed ?? null,
    saifiWithMed: saifiWithMed ?? null,
    saifiWithoutMed: saifiWithoutMed ?? null,
    customers: row.customers ?? null,
    year,
    scope,
    label,
  };
}

/**
 * Find the best available outage record for a location.
 *
 * @param {Object} dataset  parsed data/outage-reliability.json
 * @param {Object} input
 * @param {string} input.stateAbbr    two-letter state, e.g. "VA"
 * @param {string} [input.stateName]  full name for the label, e.g. "Virginia"
 * @param {string} [input.utilityName] serving utility, from NREL
 * @returns {{
 *   saidiWithMed:number|null, saidiWithoutMed:number|null,
 *   saifiWithMed:number|null, saifiWithoutMed:number|null,
 *   customers:number|null, year:number,
 *   scope:'utility'|'state'|'national', label:string
 * }|null}
 */
export function reliabilityFor(dataset, { stateAbbr, stateName, utilityName } = {}) {
  if (!dataset) return null;
  const year = dataset.year;
  const abbr = typeof stateAbbr === "string" ? stateAbbr.trim().toUpperCase() : null;

  // ── 1. Utility, scoped to the state ──
  // Scoping to the state first also resolves most name collisions: 49 utility names
  // in the 2023 file appear in more than one state.
  if (abbr && utilityName) {
    const inState = (dataset.utilities || []).filter((u) => u.state === abbr);
    const wanted = normalizeUtility(utilityName);

    if (wanted.length) {
      const wantedKey = wanted.join(" ");
      const exact = inState.filter((u) => keyOf(u.name) === wantedKey);

      // Containment either direction: "Duke Energy Progress" vs "Duke Energy
      // Progress - (NC)". Only accepted when it identifies ONE utility.
      const partial =
        exact.length === 0
          ? inState.filter((u) => {
              const t = normalizeUtility(u.name);
              return isSubset(wanted, t) || isSubset(t, wanted);
            })
          : [];
      // More than one candidate: deliberately give up and use the state. Naming a
      // specific utility we are not sure about is a claim the homeowner can check.
      const hit = exact.length === 1 ? exact[0] : partial.length === 1 ? partial[0] : null;

      // Note the fall-THROUGH rather than a return: a utility can be listed with no
      // usable figures, and that must land on the state average, not on nothing.
      const result = toResult(hit, "utility", hit?.name, year);
      if (result) return result;
    }
  }

  // ── 2. State ──
  if (abbr && dataset.states?.[abbr]) {
    const label = `${stateName || abbr} average`;
    const result = toResult(dataset.states[abbr], "state", label, year);
    if (result) return result;
  }

  // ── 3. National ──
  return toResult(dataset.national, "national", "U.S. average", year);
}

/**
 * Client-side fetch. Server does the lookup so the dataset never reaches the browser.
 * Always resolves — a presentation cannot stall at a door because a lookup failed.
 * @returns {Promise<Object|null>}
 */
export async function fetchReliability({ stateAbbr, stateName, utilityName } = {}) {
  try {
    const r = await fetch("/api/reliability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stateAbbr, stateName, utilityName }),
    });
    const j = await r.json();
    return j?.reliability ?? null;
  } catch {
    return null;
  }
}
