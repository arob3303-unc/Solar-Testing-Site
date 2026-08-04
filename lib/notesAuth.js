// Shared PIN gate for /notes (internal closer material).
//
// Deliberately edge-safe: uses only Web Crypto + TextEncoder, so the SAME module
// works in proxy.js (edge runtime) and in the API route (node runtime). No Node
// built-ins, no shared state.
//
// The cookie stores a SHA-256 digest of `${PIN}:${SECRET}`, never the PIN itself,
// so the value in the browser can't be read back into the PIN and can't be guessed
// without knowing NOTES_SECRET.
//
// NO FALLBACK VALUES BY DESIGN. Both come from the environment, and when either is
// missing the gate FAILS CLOSED — nobody gets in, rather than everybody getting in
// on a default baked into a public repo. Set NOTES_PIN and NOTES_SECRET in .env
// locally and in the Vercel project's Environment Variables for deploys.
//
// Scope note: this keeps casual visitors and search crawlers out of internal sales
// material. A shared 4-digit PIN is a speed bump, not authentication — don't put
// anything behind it that would actually hurt if it leaked.

export const NOTES_COOKIE = "notes_access";

const PIN = process.env.NOTES_PIN;
const SECRET = process.env.NOTES_SECRET;

/** False when the gate isn't configured, so callers can fail closed and say why. */
export function isConfigured() {
  return Boolean(PIN && SECRET);
}

/** SHA-256 hex digest of the PIN + secret. Same value in both runtimes. */
export async function expectedToken() {
  if (!isConfigured()) return null;
  const data = new TextEncoder().encode(`${PIN}:${SECRET}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** True when the submitted PIN matches. Length-independent compare is fine here —
 *  the PIN is shared and low-entropy by design, so timing isn't the weak link. */
export function pinMatches(submitted) {
  if (!isConfigured()) return false;
  return typeof submitted === "string" && submitted.trim() === PIN;
}

/** True when a cookie value is a valid access token. */
export async function tokenValid(value) {
  if (!value || !isConfigured()) return false;
  const expected = await expectedToken();
  return Boolean(expected) && value === expected;
}
