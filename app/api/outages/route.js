// Grid reliability lookup for a ZIP code.
//
// SOURCES (all genuinely public record):
//   • Zippopotam.us  — free ZIP → place/state geocode, no key. Same service the
//     rates route already uses.
//   • EIA Form EIA-861 — annual utility reliability metrics (SAIDI / SAIFI),
//     collected by the U.S. Energy Information Administration. Read through the
//     EIA API v2 when EIA_API_KEY is set.
//
// DELIBERATE DESIGN RULE: this endpoint NEVER invents a number. If the reliability
// source is unconfigured or fails, it returns `reliability: null` with a reason, and
// the UI renders a "not loaded" state. A fabricated outage statistic shown to a
// customer as public record is a claim they can check and a contract they can void,
// so an empty panel is the correct failure mode.
//
// SAIDI = System Average Interruption Duration Index — average minutes a customer is
//         without power per year.
// SAIFI = System Average Interruption Frequency Index — average number of
//         interruptions per customer per year.

const EIA_BASE = "https://api.eia.gov/v2";

async function geocodeZip(zip) {
  if (!/^\d{5}$/.test(zip || "")) return null;
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;
    const j = await r.json();
    const p = j.places?.[0];
    if (!p) return null;
    return {
      place: p["place name"] || null,
      stateAbbr: p["state abbreviation"] || null,
      state: p.state || null,
      lat: parseFloat(p.latitude),
      lon: parseFloat(p.longitude),
    };
  } catch {
    return null;
  }
}

/**
 * Latest annual state electricity profile from EIA.
 *
 * NOTE ON OUTAGE STATISTICS: EIA's v2 API does NOT expose reliability indices.
 * The whole /v2/electricity tree was enumerated — retail-sales, operational data,
 * rto, state-electricity-profiles, generator capacity, facility-fuel — and none
 * carry SAIDI/SAIFI. Those live only in the downloadable Form EIA-861 workbooks.
 * So this returns the grid figures the API genuinely has, and the UI does not claim
 * to know per-ZIP outage counts.
 *
 * Returns null (never a guess) when the key is missing or the response is unusable.
 */
async function fetchStateProfile(stateAbbr) {
  const key = process.env.EIA_API_KEY;
  if (!key) return { data: null, reason: "EIA_API_KEY not set" };
  if (!stateAbbr) return { data: null, reason: "No state resolved for this ZIP" };

  const params = [
    `api_key=${key}`,
    "frequency=annual",
    "data[0]=average-retail-price",
    "data[1]=net-generation",
    "data[2]=total-retail-sales",
    `facets[stateID][]=${stateAbbr}`,
    "sort[0][column]=period",
    "sort[0][direction]=desc",
    "length=1",
  ].join("&");

  try {
    const r = await fetch(
      `${EIA_BASE}/electricity/state-electricity-profiles/summary/data/?${params}`,
      { headers: { "User-Agent": "TTSS-Energy-Audit/1.0", Accept: "application/json" } }
    );
    if (!r.ok) return { data: null, reason: `EIA API error (HTTP ${r.status})` };
    const j = await r.json();
    const row = j?.response?.data?.[0];
    if (!row) return { data: null, reason: "EIA returned no rows for this state" };

    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    return {
      data: {
        period: row.period ?? null,
        stateName: row.stateDescription ?? null,
        retailPriceCents: num(row["average-retail-price"]),
        netGenerationMwh: num(row["net-generation"]),
        retailSalesMwh: num(row["total-retail-sales"]),
      },
      reason: null,
    };
  } catch (e) {
    return { data: null, reason: e.message || "EIA request failed" };
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { zip, state } = body || {};
  const geo = await geocodeZip(zip);

  if (!geo) {
    return Response.json({
      zip: zip || null,
      located: false,
      place: null,
      state: state || null,
      reliability: null,
      reason: `ZIP "${zip}" could not be resolved`,
    });
  }

  const { data, reason } = await fetchStateProfile(geo.stateAbbr);

  return Response.json({
    zip,
    located: true,
    place: geo.place,
    stateAbbr: geo.stateAbbr,
    state: geo.state || state || null,
    // Residential service is never a designated priority circuit — priority status is
    // reserved for hospitals, emergency services and critical infrastructure.
    priorityZoned: false,
    profile: data,
    reason,
  });
}
