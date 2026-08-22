// Outage-record lookup for a location.
//
// The lookup runs HERE rather than in the browser purely for weight: the EIA-861
// dataset is ~150 KB of JSON, and importing it from a client component would ship the
// whole thing to a phone standing on someone's porch. The matching logic itself is
// pure and lives in lib/reliability.js, where it is unit-tested.
//
// Needs no API key and makes no outbound request — the data is committed to the repo
// and refreshed once a year with scripts/build-reliability.mjs.
//
// Same rule as /api/outages: never invent a figure. Every response carries `scope`
// ('utility' | 'state' | 'national') and the UI is required to show it, so a homeowner
// always knows whether they are being shown their own utility's record or an average.

import { reliabilityFor } from "@/lib/reliability";
import dataset from "@/data/outage-reliability.json";

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    // A malformed body still gets the national figure rather than an error — this is
    // never allowed to be the thing that stops a setter mid-presentation.
  }

  const reliability = reliabilityFor(dataset, {
    stateAbbr: body?.stateAbbr,
    stateName: body?.stateName,
    utilityName: body?.utilityName,
  });

  return Response.json({
    reliability,
    source: dataset.source,
    sourceUrl: dataset.sourceUrl,
    year: dataset.year,
  });
}
