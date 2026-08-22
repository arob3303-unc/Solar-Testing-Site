// Live residential retail electricity rate via NREL's Utility Rate Database (URDB) API.
// Free, government-maintained. Get a key at https://developer.nrel.gov/signup/ and set
// NREL_API_KEY in your env. DEMO_KEY works for light testing (low rate limit).
//
// The intake form only collects utility + state, but NREL's v3 endpoint needs lat/lon,
// so we map each state to a representative centroid. The returned rate is the residential
// average for the utility serving that point — used as the "import (retail)" rate.
//
// Ported from the legacy /api/rates.js Vercel function.

const STATE_CENTROIDS = {
  'Alabama': [32.806, -86.791], 'Alaska': [61.370, -152.404], 'Arizona': [33.729, -111.431],
  'Arkansas': [34.970, -92.373], 'California': [36.116, -119.682], 'Colorado': [39.059, -105.311],
  'Connecticut': [41.598, -72.755], 'Delaware': [39.319, -75.507], 'Florida': [27.766, -81.687],
  'Georgia': [33.040, -83.643], 'Hawaii': [21.094, -157.498], 'Idaho': [44.240, -114.478],
  'Illinois': [40.349, -88.986], 'Indiana': [39.849, -86.258], 'Iowa': [42.011, -93.210],
  'Kansas': [38.526, -96.726], 'Kentucky': [37.668, -84.670], 'Louisiana': [31.169, -91.867],
  'Maine': [44.693, -69.381], 'Maryland': [39.064, -76.802], 'Massachusetts': [42.230, -71.530],
  'Michigan': [43.326, -84.536], 'Minnesota': [45.694, -93.900], 'Mississippi': [32.741, -89.678],
  'Missouri': [38.456, -92.288], 'Montana': [46.921, -110.454], 'Nebraska': [41.125, -98.268],
  'Nevada': [38.313, -117.055], 'New Hampshire': [43.452, -71.564], 'New Jersey': [40.298, -74.521],
  'New Mexico': [34.840, -106.248], 'New York': [42.166, -74.948], 'North Carolina': [35.630, -79.806],
  'North Dakota': [47.528, -99.784], 'Ohio': [40.388, -82.764], 'Oklahoma': [35.565, -96.928],
  'Oregon': [44.572, -122.071], 'Pennsylvania': [40.590, -77.209], 'Rhode Island': [41.680, -71.511],
  'South Carolina': [33.856, -80.945], 'South Dakota': [44.299, -99.438], 'Tennessee': [35.747, -86.692],
  'Texas': [31.054, -97.563], 'Utah': [40.150, -111.862], 'Vermont': [44.045, -72.710],
  'Virginia': [37.769, -78.170], 'Washington': [47.400, -121.490], 'West Virginia': [38.491, -80.954],
  'Wisconsin': [44.268, -89.616], 'Wyoming': [42.756, -107.302]
};

// Geocode a 5-digit US ZIP to [lat, lon] via Zippopotam.us (free, no key).
async function geocodeZip(zip) {
  if (!/^\d{5}$/.test(zip || '')) return null;
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;                       // 404 = ZIP not found
    const j = await r.json();
    const p = j.places?.[0];
    if (!p) return null;
    const lat = parseFloat(p.latitude), lon = parseFloat(p.longitude);
    return (isFinite(lat) && isFinite(lon)) ? [lat, lon, `${p['place name']}, ${p['state abbreviation']} ${zip}`] : null;
  } catch { return null; }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { state, zip, lat, lon } = body || {};

  // Resolve coordinates, most precise first: explicit lat/lon → ZIP → state centroid.
  let coords, precision, place = null;
  if (typeof lat === 'number' && typeof lon === 'number') {
    coords = [lat, lon]; precision = 'coords';
  } else {
    const geo = await geocodeZip(zip);
    if (geo) { coords = [geo[0], geo[1]]; precision = 'zip'; place = geo[2]; }
    else if (STATE_CENTROIDS[state]) { coords = STATE_CENTROIDS[state]; precision = 'state'; }
  }

  if (!coords) {
    return Response.json({ residentialCents: null, error: `No coordinates for ZIP "${zip}" / state "${state}"` });
  }

  const key = process.env.NREL_API_KEY || 'DEMO_KEY';
  const url = `https://developer.nrel.gov/api/utility_rates/v3.json?api_key=${key}&lat=${coords[0]}&lon=${coords[1]}`;

  try {
    // Akamai (which fronts developer.nrel.gov) can silently drop requests that lack
    // a User-Agent/Accept header, surfacing as a generic "fetch failed".
    const r = await fetch(url, {
      headers: { 'User-Agent': 'VECHTER-Home-Solutions/1.0', 'Accept': 'application/json' }
    });
    const data = await r.json();

    if (!r.ok || data.errors?.length) {
      return Response.json({ residentialCents: null, precision, place, error: data.errors?.[0] || `NREL API error (HTTP ${r.status})` });
    }

    // outputs.residential is $/kWh; NREL returns -1 (or missing) when unavailable.
    const resi = data.outputs?.residential;
    const cents = (typeof resi === 'number' && resi > 0) ? +(resi * 100).toFixed(1) : null;

    return Response.json({
      residentialCents: cents,
      utilityName: data.outputs?.utility_name || null,
      precision,   // 'zip' = address-level, 'state' = state-average fallback
      place
    });
  } catch (error) {
    // Include the underlying cause (DNS/TLS/timeout) — "fetch failed" alone is opaque.
    return Response.json({
      residentialCents: null, precision, place,
      error: error.message,
      cause: String(error.cause?.code || error.cause?.message || error.cause || '')
    });
  }
}
