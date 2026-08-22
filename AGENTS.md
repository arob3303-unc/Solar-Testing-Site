<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# VECHTER Home Solutions

Field sales tool. `/` is an internal gateway; `/audit` runs the system assessment;
`/pitch` argues the options; `/setters` is the door presentation; `/notes` is the
closer field guide.

**Read `Agent-Context/Agent-Documentation.md` before changing anything.** It is
current as of the August 2026 rehaul.

## Non-negotiables

1. **Never invent a number.** If a value cannot be derived from what the homeowner
   supplied, it renders as "Not measured" or `null` with a reason — never as a
   plausible-looking score. Three fabricated diagnostic tests were removed for this
   reason; do not reintroduce that pattern.
2. **One number, one source.** Every customer-visible figure comes from a single pure
   function in `lib/`, is computed once, and is passed to the LLM as
   "AUTHORITATIVE — do not recalculate". The UI and the written report must never be
   able to disagree.
3. **A generator solves the outage. Production solves the bill.** Never let copy blur
   the two. No batteries. Never name a generator manufacturer.
4. **`/audit` stays neutral.** Measurements only — no product, no urgency, no cost of
   inaction. All persuasion lives on `/pitch`.
5. **Nothing internal may appear on the setter deck.** It renders fixed above the site
   header because it gets turned toward a homeowner, and the setter prompt remounts on
   every slide so it cannot be left open. Do not undo either.
6. **The deck never blocks a setter at a door.** Every lookup may fail; slides that
   cannot be honestly filled are dropped, never blanked.

## Stack

- Next.js 16 App Router, React 19, **JavaScript only** (no TypeScript). `@/*` → root.
- **No Tailwind, no UI library.** One stylesheet: `app/globals.css`, global class
  names, emoji icons. Charts are raw chart.js in `useEffect`.
- Tests: vitest, colocated as `lib/*.test.js`. Run `npm test` and `npx eslint .`
  before calling anything done.

## Palette

Light theme on warm paper. `--brand #0b4d2c` (dark forest green) is the identity and
"pass"; `--premium #a67c00` (gold) is supporting emphasis and "check"; `--cta #e4610f`
(orange) is **buttons and only buttons**; `--alert #b31d1d` marks a real problem and
nothing else. Full token list in `app/globals.css`.
