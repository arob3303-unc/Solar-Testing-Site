// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for what we recommend.
//
// Both the UI and the AI prompt read from getRecommendation()'s output. No product
// logic lives anywhere else.
//
// Product rules (do not change without updating tests):
//   • The audit is solar-only. Every home reaching it already has a system — the
//     no-solar branch was removed with the rehaul.
//   • The standby generator is recommended in EVERY report. No exceptions. It solves
//     the outage; it does nothing at all for the power bill.
//   • Additional solar panels are recommended in every report too. Every home on a
//     utility receives a bill — even a fully offset system still pays a meter or
//     connection charge — so there is no no-bill case to gate on. Whether a panel
//     PLAN is actually shown is a separate question, gated on planPanels().count.
//   • Batteries / solar storage do not exist here. That product is gone.
// ─────────────────────────────────────────────────────────────────────────────

/** Stable product identifiers. Use these ids everywhere — never bare strings. */
export const PRODUCTS = {
  GENERATOR: 'standby_generator',
  PANELS: 'additional_panels',
};

/** Human-readable labels, so the UI/prompt don't duplicate product names. */
export const PRODUCT_LABELS = {
  [PRODUCTS.GENERATOR]: '22 kW whole-home standby generator',
  [PRODUCTS.PANELS]: 'Additional solar panels',
};

/**
 * Decide which products to recommend for a home.
 *
 * Takes no input: the audit is solar-only and every home on a utility has a bill,
 * so both products apply to every report. Kept as a function rather than a constant
 * because it is the documented seam for future product rules, and because the
 * analyze route calls it server-side as the authoritative source.
 *
 * @returns {{
 *   hasSolar: true,
 *   hasBill: true,
 *   scenario: 'solar_with_bill',
 *   products: string[],
 *   recommendGenerator: boolean,
 *   recommendPanels: boolean,
 * }}
 */
export function getRecommendation() {
  return {
    hasSolar: true,
    hasBill: true,
    scenario: 'solar_with_bill',
    // Generator always first — it is the product every report leads with.
    products: [PRODUCTS.GENERATOR, PRODUCTS.PANELS],
    recommendGenerator: true,
    recommendPanels: true,
  };
}

/**
 * Order-independent equality of two product lists. Used by the analyze route to
 * validate that the model echoed back the authoritative products unchanged.
 */
export function productsMatch(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
