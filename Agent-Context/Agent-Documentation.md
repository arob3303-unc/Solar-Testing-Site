# VECHTER Home Solutions — Agent Documentation

**Last rewritten: August 20, 2026.** This file previously described a deleted
`index.html` + `api/` architecture that sold batteries and carried a NEM 1/2/3 rate
engine. None of that exists. Everything below describes the current app.

---

## What this is

A field sales tool for **VECHTER Home Solutions**, used at the kitchen table. It runs
a diagnostic assessment on a homeowner's **existing solar system**, then makes the
case for whole-home backup power and added production.

The product is deliberately **solar-only**. Every home reaching the audit already
owns a system; the no-solar branch was removed in the August 2026 rehaul.

### The two products
1. **22 kW whole-home standby generator** — recommended in *every* report.
2. **Additional solar panels** — recommended in every report too. Every home on a
   utility has a bill, so there is nothing to gate on.

**The distinction that governs all copy:** a generator solves the **outage**. It does
nothing for the power bill. Added production solves the **bill**. Never blur the two.
Batteries do not exist as a product here. No generator manufacturer is ever named.

---

## Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.js` | **Internal gateway** — Setters / Auditors routing, then service cards. Server component. |
| `/setters` | `app/setters/page.jsx` | **Door presentation.** ZIP stage → loader → full-viewport deck. |
| `POST /api/reliability` | `app/api/reliability/route.js` | Outage record for a location, from the committed EIA-861 dataset. |
| `/audit` | `app/audit/page.jsx` | Intake → loading → **system performance report**. Client, 3-phase state machine. |
| `/pitch` | `app/pitch/page.jsx` | **Options hub** — the four routes to closing the bill. Client. |
| `/pitch/generator` | `app/pitch/generator/page.jsx` | The backup-power argument. The only option that raises outages. |
| `/pitch/[option]` | `app/pitch/[option]/page.jsx` | Spray foam / roof / home improvement, from one template driven by `lib/options.js`. |
| `/notes` | `app/notes/page.jsx` | Internal field guide — the 13-stage Generator Sales Flow. Server component, **public** (no PIN). |
| `app/_terms/` | — | Terms page, **parked**. Underscore prefix makes it unrouted; rename the folder to `terms` to publish. |
| `POST /api/analyze` | `app/api/analyze/route.js` | Authoritative recommendation + Claude-written report. |
| `POST /api/rates` | `app/api/rates/route.js` | NREL URDB residential rate by ZIP/state. |
| `POST /api/outages` | `app/api/outages/route.js` | ZIP geocode + EIA reliability profile. |

### The options model
Every option carries the **same** outcome — added production removes the power bill,
funded as an incentive inside whichever project the homeowner picks. What differs is
the project. `lib/options.js` holds all four plus the shared `PANEL_PACKAGE` wording,
so the panel explanation is worded identically everywhere it appears.

**Only the generator page raises the missing-backup problem.** If the homeowner is on
any other path, assume backup is already handled — arguing outages there is pitching a
product that is not on the table.

### The audit / pitch split — do not merge these back
`/audit` is deliberately neutral. It shows measurements and names no product, no
urgency, and no cost of inaction. `/pitch` carries all persuasion. This mirrors the
field guide: the homeowner agreed to an assessment, so the assessment has to read
like one. Merging them undoes the whole structure.

---

## The `lib/` contract

**The rule this codebase is built on:** every customer-visible number comes from one
pure function in `lib/`, is computed once, and is handed to the LLM as
*"AUTHORITATIVE — do not recalculate."* If the UI and the report can disagree, they
eventually will, and the homeowner sees it. All of `lib/` is pure, has no I/O except
`fetchRate`/`fetchOutageProfile`, and is unit-tested with vitest.

| Module | Owns |
|---|---|
| `lib/diagnostics.js` | The six system tests. **Single source of truth for the audit page.** |
| `lib/recommendation.js` | Which products get recommended. `getRecommendation()` — no arguments. |
| `lib/rates.js` | Rate lookup, 15-year bill projection, panel plan, generator sizing. |
| `lib/prompts.js` | `SYSTEM_PROMPT` + `buildUserPrompt()`, with the accuracy guardrails. |
| `lib/outages.js` | Public-record outage / grid-reliability profile. |
| `lib/options.js` | The four post-assessment options and the shared panel-package wording. |

### `lib/diagnostics.js` — the diagnostic engine

`runDiagnostics({ form, rate, now })` returns six checks. **Every one is derived from
homeowner-supplied data.** A check whose inputs are missing returns
`measured: false` and renders as **"Not measured"** — never a plausible-looking score.

| Check | Formula |
|---|---|
| Solar Production Output | `production ÷ (panels × KWH_PER_PANEL)` |
| Degradation Check | `production ÷ age-adjusted expected` (1%/yr curve) |
| Energy Offset | `production ÷ (production + gridKwh)` |
| Effective Rate Paid | `retail¢ ÷ (bill ÷ gridKwh × 100)` — **conditional, see below** |
| Bill Elimination | `1 − (bill ÷ pre-solar cost of the same usage)` |
| Backup Unit | standby → 100, battery only → 30, neither → 0 |

**The production benchmark is panel-derived and market-calibrated.**
`KWH_PER_PANEL = 41.5` lives in `lib/rates.js` and is imported by `diagnostics.js` —
one figure for what a panel makes, shared by the diagnostic benchmark and the panel
plan, because the assessment and the proposal cannot disagree in front of the
homeowner. Calibration anchor: **20 panels ≈ 830 kWh in an average month.** The old
`1400 kWh/kW/year` constant put that near 1,170 and failed healthy arrays.
Panel count beats kW when both are given: a rep counts panels off the roof; homeowners
misremember system size.

The production input is an **average** month (annual ÷ 12), not last month. Output
swings roughly ±35% seasonally, so a December reading against a year-round benchmark
would fail a perfectly good system. The field label says so explicitly.

**Effective Rate Paid is omitted entirely** unless NREL resolved a `live` rate for a
**named** utility. Scoring a homeowner against the US-average fallback and presenting
it as their rate is a number a rep cannot defend. It is dropped, not rendered as "not
measured" — so the suite is five or six checks, never a fixed six.

**History worth keeping.** The previous version shipped three fabricated rows:
inverter comms and grid sync were hardcoded `100`, and panel health was
`91 + (panels % 9)`. They were removed rather than dressed up — a rep asked "how did
you measure that?" has to have an answer.

**Do not add a "grid dependency" row.** `1 − grid/total` is algebraically identical
to Energy Offset, so it would be the same number wearing a different label. That is
why Effective Rate Paid exists instead: it sees fixed charges and unfavourable export
credit, which the offset cannot. There is a regression test guarding this.

`num()` treats `""` as absent, not `0` — an untouched form field must never become a
real-looking score.

**There is no "no bill" case.** Every home on a utility receives a bill, even a fully
offset one (meter/connection charge), so the intake does not ask and
`getRecommendation()` takes no arguments — both products apply to every report.
Whether a panel *plan* renders is gated separately on `planPanels().count > 0`.

**Outage frequency is not collected.** The field guide is explicit that backup does
not come up during the solar assessment, so `BackupFields` asks for major electrical
loads (which still drive sizing) and never mentions outages. `OutageReport` therefore
shows public-record rows only — the "You reported" row was removed rather than
defaulted, which would have invented a homeowner statement.

### `lib/rates.js` — generator sizing

**22 kW is the standard offer, not the top of a ladder.** It backs a home to roughly
4,500 sq ft in full, so there is no essential-circuits tier. Sizing only moves
upward: `> 4,500 sq ft` steps up per 1,000 sq ft over, plus one step for a large
all-electric home or three heavy surge loads on a large home. Tiers are `[22, 24, 26]`
and `tier` is always `whole-home`.

---

## Data flow

```
/audit intake (one useState in app/audit/page.jsx)
  │
  ├─ getRecommendation()                      [client, immediate display]
  ├─ fetchRate() → /api/rates → zippopotam → NREL
  └─ analyze()   → /api/analyze
                     ├─ getRecommendation()  ← AUTHORITATIVE, recomputed server-side
                     ├─ planPanels()
                     ├─ buildUserPrompt() ← estimateGeneratorKw(), TIER_LABELS
                     └─ Anthropic → parse → productsMatch() validate
  │
  ├─→ setAudit({ form, rec, rate, ai })   → AuditProvider + sessionStorage
  │
  ├─→ /audit             SystemReport → SystemTests (runDiagnostics),
  │                                    ProductionChart, HouseSvg
  └─→ /pitch             options hub (4 cards from lib/options.js)
       ├─ /pitch/generator          DatacenterBlackouts, RollingBlackoutDiagram,
       │                            OutageReport, GridStabilityCompare,
       │                            BackupPowerCard, BillProjection, AiAudit
       └─ /pitch/[option]           spray-foam | roof | home-improvement
```

### Audit → pitch handoff
`components/AuditProvider.jsx` is a client context mounted in the root layout. It
holds `{ form, rec, rate, ai }` and mirrors it to **sessionStorage** (`vechter.audit.v1`),
so a hard refresh or a direct link to `/pitch` still works. With nothing stored,
`/pitch` renders a cold-start card rather than empty components.

Built on **`useSyncExternalStore`**, not `useEffect` + `setState`. Storage is an
external system; reading it into state from an effect triggers a cascading render on
every mount and the ESLint `react-hooks/set-state-in-effect` rule rejects it.

`sessionStorage` not `localStorage`, deliberately: one appointment per tab. The next
homeowner must never see the previous homeowner's numbers.

---

## AI integration

`app/api/analyze/route.js` — raw `fetch` to `https://api.anthropic.com/v1/messages`
(no SDK), model `claude-sonnet-4-6`, `max_tokens: 1200`.

The guardrail architecture matters more than the prompt: the route computes
`getRecommendation()` **server-side**, injects it as authoritative, forces JSON
output, parses defensively (`parseModelJson` strips fences), then validates with
`productsMatch()`. **The UI renders products from `rec`, never from the model.**

`components/ai/AiAudit.jsx` renders the report with a small `**heading**` parser using
React text nodes, so escaping is automatic.

---

## Design system

**No Tailwind. No UI library.** One hand-written stylesheet, `app/globals.css`, with
classic global class names. Icons are literal emoji.

Light theme, dark forest green brand. Tokens on `:root`:

```
--paper #faf9f5   --surface #ffffff   --surface2 #f4f2ec
--border #e9e5da  --border-strong #d8d2c4
--ink #0c1f16     --body #55605a      --muted #7c857f
--brand #0b4d2c   --brand-deep #06331d  --brand-soft #e9f1ec  --brand-line #b9d3c3
--premium #a67c00 --premium-soft #fbf3de --premium-line #e6d29a
--cta #e4610f     --cta-hover #c9540c   --cta-soft #fdede1
--alert #b31d1d   --alert-soft #faeaea  --alert-line #edc4c4
```

**Colour roles — do not repurpose:** brand = identity and "pass"; premium gold =
supporting emphasis and "check"; **orange is buttons and only buttons**; red only
ever marks a real problem the homeowner has.

Fonts via `next/font/google` in `app/layout.js`: **Fraunces** (display — wordmark,
headings, large figures) and **Inter** (body/UI), exposed as `--font-display` and
`--font`.

### Two places that carry their own colours
- `components/dashboard/RollingBlackoutDiagram.jsx` has a scoped `<style>` block
  (`rbd-` prefix) using `color-mix()`/`currentColor`.
- `ProductionChart.jsx` and `BillProjection.jsx` declare chart.js colour literals —
  canvas cannot read CSS variables.

---

## Environment variables

| Var | Used by | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `/api/analyze` | Server-only. Missing → 500, but `rec` still returns. |
| `NREL_API_KEY` | `/api/rates` | Falls back to `DEMO_KEY`. Set in Vercel for production. |
| `EIA_API_KEY` | `/api/outages` | Without it the route returns `null` + a reason — it never invents a figure. |

`NOTES_PIN` / `NOTES_SECRET` are **gone** — the `/notes` gate was removed.

⚠️ **Standing item:** the NREL key was shared in plaintext during development.
Rotate it at developer.nrel.gov.

---

## Accuracy rules (these are load-bearing)

1. **Never invent a number.** `/api/outages` returns `null` with a reason rather than
   an estimate. `runDiagnostics` returns "Not measured". `OutageReport` tags every row
   VERIFIED (public record) or REPORTED (homeowner said so) — there is no third category.
2. **One number, one source.** `planPanels()` is computed once per page and threaded
   to every consumer so the chart, the card and the report cannot drift.
3. **The model never decides a product.** Server computes, model echoes, server validates.
4. **The footer disclaimer ships on every page** (`components/SiteFooter.jsx`) and is
   currently the only legal disclosure, since the Terms page is unrouted. Do not trim it.

---

## Conventions

- **Next.js 16.2.12, App Router, JavaScript only.** No TypeScript, no `tsconfig`.
  `jsconfig.json` maps `@/*` → project root. Types are JSDoc on the `lib/` functions.
- Next 16 renamed `middleware` → `proxy`. There is no `proxy.js` any more; if you add
  one it goes at the project root, next to `app/`.
- `npm test` (vitest), `npx eslint .`, `npm run build`, `npm run dev`.
- **Read `node_modules/next/dist/docs/` before writing framework code** — this Next
  version has breaking changes from model training data. See `AGENTS.md`.

---

## August 2026 rehaul — what changed

- Rebranded Top Tier Solar Solutions → **VECHTER Home Solutions**; dark theme → light.
- Landing page rebuilt around the full service range (solar, replacements, panels,
  backup, spray foam, roofing, security).
- One page became three: landing / audit / pitch.
- Non-solar branch removed entirely (`HouseTypeStep.jsx` deleted, `YesNo` extracted to
  `components/intake/YesNo.jsx`).
- Diagnostics rebuilt — three fabricated tests removed, `lib/diagnostics.js` created.
- `hasStandby` added to intake; it is the only input the Backup Unit check has.
- Generator sizing standardised on 22 kW; "Generac" removed everywhere.
- `/notes` replaced with the single finalized 13-stage field guide; **PIN gate deleted**
  (`proxy.js`, `lib/notesAuth.js`, `/notes/unlock`, `/api/notes-unlock`).
- `EnergyDashboard.jsx` split into `SystemReport.jsx` (audit) + `app/pitch/page.jsx`.
- Fixed: `<Analytics />` was rendering outside `<body>`.


---

## Later revisions

**August 20, 2026 (same day, follow-up pass)**
- Landing service grid became hover/focus **flip cards** — the front is the service
  name only, the description is on the back. Implemented as `<button>` so keyboard and
  touch reach the back too, with a reduced-motion cross-fade fallback.
- "System Replacements & Takeovers" → **System Takeover**.
- Trust section collapsed the two warranty items into one and dropped all time frames.
- **The footer disclaimer no longer renders on `/`** (`components/SiteFooter.jsx` is now
  a client component checking `usePathname`). Nothing on the landing page is an
  estimate, so there was nothing to disclaim. It still ships on every other route.
- Intake: the "do you still receive an electric bill?" and "how often do you lose
  power?" questions were removed. `BillFields` always renders.
- Degradation curve changed from 0.5%/yr to **1%/yr**.
- "Backup Readiness" renamed **"Backup Unit"** throughout.
- `ProductionChart` gained a full-screen **Expand** mode for showing customers. It
  makes the same card `position: fixed` and calls `chart.resize()` rather than
  re-mounting the canvas, which would destroy and rebuild the chart mid-conversation.


**August 20, 2026 (third pass)**
- **Production math corrected.** `KWH_PER_PANEL` 55 → **41.5**, moved to being the
  single shared figure (`lib/rates.js`, imported by `diagnostics.js`).
  `expectedMonthlyKwh` is now panel-derived with a kW fallback. A healthy 20-panel
  array now scores 100% instead of 60%. The old constant also overstated panel-plan
  coverage, so `planPanels` counts moved with it (850 kWh → 20 panels, was 15).
- Production input relabelled **Average Monthly Production** — comparing a single
  winter month against a year-round benchmark was failing healthy systems.
- **Effective Rate Paid is now conditional** on a live, utility-named NREL rate, and
  is dropped from the list entirely otherwise.
- `/pitch` became an **options hub**; the old pitch content moved to
  `/pitch/generator`, and spray foam / roof / home improvement render from
  `app/pitch/[option]/page.jsx` against `lib/options.js`.
- `components/pitch/PitchShell.jsx` holds the shared cold-start card and audit lookup
  so every option page behaves identically with no stored assessment.


**August 21, 2026**
- The landing page is now an **internal gateway**, not a marketing page: a Setters
  panel and an Auditors panel route a rep in one click, with the service cards and
  trust block kept underneath as reference.
- `/setters` exists and is styled but is **deliberately empty of content**. A setter
  script nobody approved is worse than an empty page — drop the real flow in and it
  renders against the same block types as `/notes`.
- The brand word is **VECHTER**, always uppercase, everywhere.
- The mark moved to `components/VechterMark.jsx` (was exported from `SiteHeader`).
  **Nothing else in the app draws the logo** — replace the internals there and every
  usage picks it up.
- The Field guide button was removed from the landing CTAs. Notes lives in the header,
  top right, and nowhere else.


**August 21, 2026 — logo traced from the real artwork**
- `components/VechterMark.jsx` was redrawn from the supplied app-icon image: a wide,
  low-pitched roof with a second layer beneath it, two posts, and the sword descending
  through the centre with its crossguard above the peak. Traced as vector rather than
  embedding the source, which was a phone screenshot of the icon and far too
  low-resolution for a header.
- The mark is **monochrome and inherits `currentColor`**, like the original. White on
  the dark green header, `--brand-deep` on paper. The original artwork is dark navy;
  it is rendered in the site green so the logo and the palette agree.
- `VechterLogo` (named export, same file) is the **stacked lockup** — mark over
  VECHTER over HOME SOLUTIONS — used on the gateway, the intake card and `/setters`.
  The header keeps the bare mark beside horizontal text; a stacked lockup does not fit
  a 62px bar.
- The wordmark deliberately uses **Inter 800 with wide tracking**, not the Fraunces
  display face the headings use, because that is what the artwork is set in.


**August 21, 2026 — the real logo went in**
- `components/VechterMark.jsx` now carries the **actual artwork path**, lifted verbatim
  from the supplied `vechter-app-icon.svg`. The earlier hand-traced version is gone.
  **Do not "tidy" the path**: `fill-rule="evenodd"` is what cuts the fuller line out of
  the blade, and the single-path construction is what keeps the sword, the roof wedges
  and the posts reading as one object.
- The artwork is **340 x 360 in its own space — taller than it is wide.** The component
  sizes on height and lets width follow, rather than forcing a square and letterboxing
  it. Layout around the mark should not assume a square.
- Source vendored at `public/vechter-app-icon.svg` and served as the browser tab icon
  via `app/icon.svg` (the stale Next.js `favicon.ico` was deleted).
- New token **`--logo-ink: #202730`**, straight off the artwork and deliberately
  separate from `--ink` so a text-colour change can never silently recolour the logo.
- `VechterMark` is monochrome and inherits `currentColor`. `.site-wordmark` sets
  `color: #fff` explicitly — without it `a { color: inherit }` hands the mark the body
  ink, which is near-invisible on the dark green header bar.
- A `tile` prop reproduces the rounded app-icon container when that is wanted; the site
  uses the untiled mark so it sits inline like a glyph.


---

# The setter door presentation (`/setters`)

A phone-first, tap-through deck a door-to-door setter turns toward a homeowner. Its job
is to build enough pain to book an appointment for a closer — not to sell anything.
8 screens, about 2 minutes.

**The deck ends on the fix.** There is no ask or what-happens-next screen: that part is
said face to face, so the homeowner is looking at the setter rather than at a phone. The
wording for the ask lives in the closing slide's setter note.

**The only input in the entire flow is a ZIP code.** Everything else is either written
in `lib/setterDeck.js` or resolved from public data.

## The deck must never block a setter at a door

This is the constraint the whole feature is built around. Every lookup is allowed to
fail, and `buildDeck()` **drops** any slide it cannot honestly fill rather than showing
it blank or with a placeholder. A nonsense ZIP still produces a complete, truthful
8-slide deck on national figures. Verified paths:

| Data available | Slides | Wording |
|---|---|---|
| Utility matched | 8 | "Midlothian, VA" · utility named |
| SAIDI but no without-MED split | 7 | storms slide dropped |
| No reliability at all | 6 | record + storms dropped |
| Nothing resolved | 6 | "your area" · "your utility" |

## Where the outage numbers come from

EIA's v2 API **does not expose SAIDI/SAIFI** — `app/api/outages/route.js` documents
that the whole tree was enumerated. The figures come instead from **Form EIA-861**,
whose Reliability workbook ships inside an annual zip archive with no API at all.

- `scripts/build-reliability.mjs` — downloads `f861YYYY.zip`, pulls the Reliability
  workbook out, flattens it. Run with `npm run build:reliability`, then commit the JSON.
  Refresh once a year.
- **Dependency-free on purpose.** An .xlsx is a zip of XML and the archive is a zip of
  xlsx files, so a ~90-line zip reader plus a regex pass does the job. The `xlsx` npm
  package is deprecated and would have to be trusted at build time to produce a file we
  commit anyway.
- `data/outage-reliability.json` — 966 utilities, 51 states, one national figure,
  ~150 KB. **Server-side only.**

SAIDI = minutes without power per customer per year. SAIFI = interruptions per year.
`WithMed` includes major event days (storms), `WithoutMed` excludes them — **the gap
between the two is the storm slide.** Maine 2023: 1,863 min with storms, 247 without.

### The matching rule
`reliabilityFor()` in `lib/reliability.js` resolves **utility → state → national** and
every result carries a `scope` the UI is required to display, so a homeowner is always
told which one they are looking at.

**A wrong utility is worse than a right state.** EIA and NREL spell companies
differently ("Virginia Electric & Power Co" vs "Dominion Energy Virginia"), so matching
is fuzzy — and when a fuzzy match is *ambiguous within the state* it resolves to the
state average rather than guessing. "Duke Energy" matches two NC utilities and
correctly returns the North Carolina average. There is a test for this; do not
"improve" the matcher into picking a winner.

`lib/reliability.js` is **pure and takes the dataset as an argument.** That keeps it
unit-testable and keeps 150 KB of JSON out of the client bundle — only the API route
imports the data.

## Structure

- `lib/setterDeck.js` — all slides as data, plus `buildDeck()`. Copy lives here.
- `components/setter/Deck.jsx` — shell: tap zones, swipe, arrow keys, dots, exit.
- `components/setter/Slide.jsx` — dispatch by `type`, like `<Block>` in the notes page.
- `components/setter/SetterNote.jsx` — the private prompt.
- Slide 5 reuses `components/dashboard/RollingBlackoutDiagram.jsx` as-is.

### Two things that must not be undone

**The deck is `position: fixed; z-index: 300` and covers the site header.** The header
carries internal nav (Auditors / Setters / Notes) and this screen gets turned toward a
customer. Nothing internal may ever be visible on it.

**`<SetterNote key={slide.id}>` resets the prompt by remounting.** The note holds the
setter's script and must never be on screen when the phone is facing a homeowner.
Keying it is deliberately stronger than resetting in an effect — a remount cannot be
skipped, a stale-dependency effect can.

## Navigation
Tap right two-thirds forward, left third back; horizontal swipe with a 45px threshold
so a vertical scroll is not misread; arrow keys and Escape for desk review; tappable
progress dots. `?zip=23112` deep-links straight into the deck.


**Deck reconciliation gotcha.** `.deck-stage` and `<SetterNote>` are siblings and must
not share a `key`. They briefly both used `key={slide.id}`, and duplicate sibling keys are
undefined behaviour in React — it stopped replacing the previous slide and started
appending, stacking every visited slide onto the page. They are now `stage-` and `note-`
prefixed.
