// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for what we recommend.
//
// Both the UI and the AI prompt read from getRecommendation()'s output. No product
// logic lives anywhere else.
//
// Product rules (do not change without updating tests):
//   • The Generac generator is recommended in EVERY report. No exceptions.
//   • Additional solar panels are recommended IF AND ONLY IF the home ALREADY has
//     solar AND still has an electric bill.
//   • A home with NO solar NEVER gets a panel pitch, regardless of its bill.
//   • Batteries / solar storage do not exist here. That product is gone.
// ─────────────────────────────────────────────────────────────────────────────

/** Stable product identifiers. Use these ids everywhere — never bare strings. */
export const PRODUCTS = {
  GENERATOR: 'generac_generator',
  PANELS: 'additional_panels',
};

/** Human-readable labels, so the UI/prompt don't duplicate product names. */
export const PRODUCT_LABELS = {
  [PRODUCTS.GENERATOR]: 'Generac standby generator',
  [PRODUCTS.PANELS]: 'Additional solar panels',
};

/**
 * Decide which products to recommend for a home.
 *
 * @param {Object}  input
 * @param {boolean} input.hasSolar - Home already has a solar system installed.
 * @param {boolean} input.hasBill  - Home still receives an electric bill.
 * @returns {{
 *   hasSolar: boolean,
 *   hasBill: boolean,
 *   scenario: 'solar_with_bill'|'solar_no_bill'|'no_solar_with_bill'|'no_solar_no_bill',
 *   products: string[],           // always includes GENERATOR; PANELS only when solar && bill
 *   recommendGenerator: boolean,  // always true
 *   recommendPanels: boolean,     // true only when hasSolar && hasBill
 * }}
 */
export function getRecommendation({ hasSolar, hasBill } = {}) {
  const solar = Boolean(hasSolar);
  const bill = Boolean(hasBill);

  // Generac generator: recommended in every report, always first.
  const products = [PRODUCTS.GENERATOR];

  // Additional panels: only when the home already has solar AND still has a bill.
  const recommendPanels = solar && bill;
  if (recommendPanels) products.push(PRODUCTS.PANELS);

  const scenario = solar
    ? (bill ? 'solar_with_bill' : 'solar_no_bill')
    : (bill ? 'no_solar_with_bill' : 'no_solar_no_bill');

  return {
    hasSolar: solar,
    hasBill: bill,
    scenario,
    products,
    recommendGenerator: true,
    recommendPanels,
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
