// AI energy-audit prompt + response contract.
//
// Hard rules baked in here (never relax):
//   • Two products only: a 22 kW whole-home standby generator, and additional panels.
//   • The generator is recommended in EVERY report. It solves the OUTAGE and does
//     nothing whatsoever for the power bill — never let the report blur those.
//   • Additional panels ONLY when the home still has a bill. Added production is
//     what solves the bill.
//   • The audit is solar-only; every home reaching it already has a system.
//   • NEVER mention batteries or solar storage — that product is gone.
//
// The product decision is NOT the model's to make: app/api/analyze/route.js computes
// it with getRecommendation() and passes it in as authoritative. The model must echo
// that exact list back so the route can validate before anything renders.

import { PRODUCT_LABELS } from "./recommendation";
import { estimateGeneratorKw, TIER_LABELS } from "./rates";

export const SYSTEM_PROMPT = `You are a professional home energy consultant writing a polished, customer-facing audit for a company that sells whole-home standby generators and additional solar panels to homeowners who already own a solar system.

NON-NEGOTIABLE RULES:
- Recommend ONLY the products in the authoritative list you are given. Never add or drop a product.
- The standby generator is part of every recommendation — frame it around backup power and whole-home stability during outages. Never suggest it reduces the power bill; it does not generate savings, it carries the home when the grid is down.
- Recommend additional solar panels ONLY if they appear in the authoritative list (this happens only when the home still has an electric bill). If panels are not in the list, do not suggest adding panels.
- Never name a generator manufacturer or brand. Refer to it by size and function only.
- NEVER mention batteries, solar storage, powerwalls, or storing energy. That product does not exist here. Do not imply the generator stores solar energy — it runs on natural gas or propane.
- Be accurate and never misleading. Present all future figures as estimates/projections, not guarantees. Use only the numbers you are given; do not invent specific rate filings, dates, percentages, or dollar amounts.
- Address the customer directly as "you". Be analytical and grounded, not a hard sell.

OUTPUT FORMAT — return ONLY a single JSON object, no prose outside it, no markdown fences:
{
  "products": [ ...exactly the authoritative product ids you were given, unchanged... ],
  "report": "the full report as markdown text"
}
In "report", use EXACTLY the section headings provided in the user message, each on its own line wrapped in **double asterisks**, followed by 2-4 sentences. Bold key figures with **…**. No greeting, sign-off, or preamble.`;

/** Section headings for the report, chosen from the recommendation scenario. */
export function reportHeadings(rec) {
  const headings = [
    "Your Home's Energy Profile",
    "Backup Power & Whole-Home Stability",
    "Rolling Blackouts & the Data-Center Grid Strain",
  ];
  if (rec.hasBill) headings.push("Your Utility Bill Outlook");
  if (rec.recommendPanels) headings.push("Closing Your Remaining Bill");
  headings.push("Recommended Next Steps");
  return headings;
}

/**
 * Build the user-turn prompt from the intake form + the authoritative recommendation.
 * Pure — safe to unit-test.
 */
export function buildUserPrompt(form = {}, rec, panelPlan = null) {
  const productList = rec.products.map((id) => `${id} (${PRODUCT_LABELS[id]})`).join(", ");
  const headings = reportHeadings(rec);

  const lines = [];
  lines.push("AUTHORITATIVE RECOMMENDATION (do not change): " + productList);
  lines.push(`Scenario: ${rec.scenario}`);
  lines.push("");
  lines.push("CUSTOMER'S HOME:");
  lines.push(
    `- Existing system: ${form.panels || "?"} panels, ${form.systemkw || "?"} kW, ${form.inverter || "?"} inverter, producing ~${form.solarProduction || "?"} kWh/mo` +
      (form.installDate ? `, installed ${form.installDate}` : "")
  );
  lines.push(`- Existing backup power: ${form.hasStandby ? "standby generator already on site" : "none — no standby generator on the property"}`);
  lines.push(
    `- Electric bill: ~$${form.bill || "?"}/mo, ~${form.utilityKwh || "?"} kWh/mo, utility ${form.utility || "unknown"} (${form.state || "?"})`
  );
  lines.push(
    `- Home: ${form.sqft ? `~${form.sqft} sq ft` : "size unknown"}, ${form.occupants || "?"} occupants, ${form.heatType || "?"} heat`
  );
  // The dashboard renders a specific generator size from this same pure function.
  // Hand the model the identical number so the report can't quote a different one.
  const gen = estimateGeneratorKw({
    sqft: form.sqft,
    criticalLoads: form.criticalLoads,
    heatType: form.heatType,
  });
  lines.push(
    `- Generator sizing (AUTHORITATIVE — use this exact size, do not recalculate): ~${gen.kw} kW, ${TIER_LABELS[gen.tier]}. This is a quote-stage estimate from floor area, selected loads and heating type; the site assessment performs the real load calculation. Present it as an estimate, never as a final specification.`
  );
  // The dashboard already shows an exact panel count. Give the model the SAME number
  // so the written report can't contradict what's on screen beside it.
  if (rec.recommendPanels && panelPlan?.count > 0) {
    lines.push(
      `- Additional-panels plan (AUTHORITATIVE — use these exact figures, do not recalculate): ${panelPlan.count} additional panels, producing ~${panelPlan.coveredKwh} kWh/mo, covering ~${Math.round(
        panelPlan.offsetFraction * 100
      )}% of the ~${panelPlan.gridKwh} kWh/mo this home still buys from the utility. Panels offset usage charges only — the utility's fixed connection charge remains. Do not state or imply the bill goes to zero.`
    );
  }
  lines.push(
    `- Major electrical loads in the home: ${form.criticalLoads?.length ? form.criticalLoads.join(", ") : "not specified"}`
  );
  lines.push(
    "- Grid context: AI data centers are adding enormous 24/7 electricity demand to an aging grid, driving up rates and raising the risk of rolling blackouts, where utilities cut power to homes to protect the system. In the 'Rolling Blackouts' section, explain this DIRECTION and why on-site backup power protects this home. Speak to the trend — do NOT invent specific figures, dates, or percentages."
  );
  lines.push("");
  lines.push("Write the report now. Use EXACTLY these section headings, in this order:");
  headings.forEach((h) => lines.push(`**${h}**`));

  return lines.join("\n");
}
