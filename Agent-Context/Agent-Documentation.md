# TTSS Solar Testing Site - Agent Documentation

## Project Overview
AI-powered solar system diagnostic tool for Top Tier Solar Solutions. Analyzes homeowner solar systems and recommends battery storage solutions using Claude AI (Anthropic API).

---

## Latest Updates - June 7-8, 2026 (v5 - Live Rates, Accuracy Overhaul & Financial Table)

This was a large multi-part update. The model is now **claude-opus-4-8** in the editor; the API still calls **claude-sonnet-4-6**. Several v4 behaviors below were **superseded** (see "Superseded by v5" note at the end).

### ✅ 1. Professional AI Response Rendering (`renderAIText`)
- Rewrote `renderAIText` to **parse the AI's markdown into styled section cards** instead of stripping `**` and dumping plain paragraphs.
- Each `**Heading**` on its own line becomes a card (`.ai-block`) with an auto-chosen icon (💸 risk / ⚠️ policy / 🔋 battery / 📈 savings), accent left-border, and fade-up animation.
- Inline `**bold**` → `<strong>`; `- ` lines grouped into styled `<ul>`. HTML is escaped (`esc`) before injection.
- Closing CTA card softened (no overreaching "energy independence" claim).

### ✅ 2. Unified Loading Screen (`#loading-screen`, `launchDashboard` is now async)
- On submit: modal → full-screen loader with spinner + 4 animated steps (`setLoadStep`).
- Dashboard is built **behind** the loader (charts need a visible container to size canvases), then everything is revealed **together** once the AI returns — no more charts popping in while AI spins.
- Flow: `resolveBilling()` → `computeFinancials()` → `populateDashboard()` → `runAIAnalysis()` → fade out loader.

### ✅ 3. Heat-Type-Driven Charts (`drawCharts`)
- **Consumption chart:** electric heat = winter spike (heating on the meter); gas heat = low winter, summer-AC driven.
- (The old monthly "bill projection" chart was replaced — see #8.)
- `prodChart` (production vs consumption) and `gridChart` (self-consumed / export / import doughnut) remain.

### ✅ 4. Net Billing Ratio Analysis — Math Fix (`renderBillingCard`)
- **Bug fixed:** the card showed the *credit fraction* (`export/import`) but labeled it "charging you ___" (reversed). Now shows the **markup**: `(import − export) / export × 100`.
  - 1:1 net metering (28¢/28¢) → **0% markup** (fair); net billing (e.g. 8¢/28¢) → **250%**.
- Card is now **adaptive**: green "✅ Net Metering" callout vs amber "⚠️ Net Billing Penalty"; title, intro, bars, and explanation all change. Import (retail) bar is the 100% reference; export bar sized relative to it.

### ✅ 5. Live Utility Rates via NREL + Curated NEM Engine (NEW `api/rates.js`)
- **`api/rates.js`** (serverless): calls **NREL's Utility Rate Database (URDB) v3 API** for the live residential retail (import) rate. Key from `process.env.NREL_API_KEY` (falls back to `DEMO_KEY`). Sends `User-Agent`/`Accept` headers (NREL/Akamai drops header-less requests).
- Geocoding: **ZIP → lat/lon via Zippopotam.us** (free, no key); falls back to a **50-state centroid table**. Returns `precision` ('zip' | 'state').
- **`resolveBilling(d)`** in index.html = curated policy engine:
  - **CA IOUs (PG&E / SCE / SDG&E)** resolved to NEM version **by install year**: `<2016` = NEM 1.0, `2016–2022` = NEM 2.0, `2023+` = NEM 3.0 / NBT.
  - **Dominion / VEPCO** = 1:1 net metering.
  - All others = clearly **labeled net-billing estimate** (never a false precise claim).
  - Returns `{ importCents, exportCents, markupPct, nemVersion, isNetMetering, policyNote, accurate, rateSource }`. Shows a transparency "Source:" line (e.g. "Live retail rate via NREL — PG&E (ZIP-level)").
- **`vercel.json`** updated: added `api/rates.js` to `builds` and `/api/rates` to `routes`. **NOTE: `vercel.json` routing changes require a full `vercel dev` restart (no hot-reload).**

### ✅ 6. ZIP Code Field
- Added "ZIP Code" input to the intake form; `formData.zip` sent to `/api/rates` for address-level rate accuracy.

### ✅ 7. AI Accuracy Overhaul (no misleading claims)
- **Removed the misleading "$10–15/month bill with battery" / "eliminates grid purchases" claims.**
- Hard guardrails in BOTH the per-request prompt AND `api/analyze.js` system prompt: a battery adds **no generation** (never "$0 bill" — still pay fixed charges + uncovered usage); all future numbers are **estimates, not guarantees**; use only provided figures (no fabricated rate filings).
- `max_tokens` raised 600 → **1024** (was truncating ~550-word reports).
- **1:1 net metering case** now leads with the **net-billing transition risk** (section "What Net Billing Will Cost You") instead of implying a battery slashes today's bill. Handles "battery already installed" case.
- AI consumes the same `fin`/`rates` objects so its dollar figures **match the on-screen table exactly**.

### ✅ 8. 15-Year Financial Breakdown TABLE (replaced the projection chart) — `computeFinancials` + `renderFinancialsTable`
- Replaced the "Bill Projection with Battery" chart with a **financial breakdown table**: rows = Upfront Cost (after 30% ITC, gross shown in sub-text), Year 1 Savings, 15-Yr Cumulative Savings, Net 15-Yr Profit; columns = Solar Only / Solar + Battery / Net Benefit.
- **Fully computed from the entered system size + live rates** (NOT a flat benchmark). Tunable constants at top of `computeFinancials`:
  - `SOLAR_GROSS_PER_KW = 3200` ($/kW → 10 kW ≈ $32k, realistic), `BATTERY_GROSS = 16500` (10 kW battery, user's $13–20k range), `ITC = 0.30`, `PROD_PER_KW_YR = 1400`, `BATTERY_USABLE_KWH = 13.5`, `RATE_ESCALATION = 0.04`, `NEM_TRANSITION_YRS = 10`, `AVOIDED_FLOOR = 0.25`, `SELF_USE_FRAC = 0.35`, `BATTERY_SELF_USE = 0.85`, `YEARS = 15`.
- Savings = value of solar (self-use at retail + exports at export rate) + battery re-valuing time-shifted exports at retail; summed 15 yrs with rising rates. Profit = cumulative − net cost. Math verified to reconcile.
- **1:1 net metering correctly shows ~$0 battery benefit in year 1, growing as net billing arrives.**
- Added a green **home-value note** under the table: "a complete solar system can add **$15,000–$79,000** (≈ **3%–10%** of home value)."

### Data Flow (v5)
```
launchDashboard(formData)               // async, drives loading screen
  → rates = await resolveBilling(d)      // POST /api/rates (NREL+ZIP) + curated NEM engine
  → fin   = computeFinancials(d, rates)  // 15-yr financial table model
  → populateDashboard(d, rates, fin)     // drawCharts(d) + renderBillingCard(d,rates) + renderFinancialsTable(fin)
  → await runAIAnalysis(d, yearsInstalled, rates, fin)  // POST /api/analyze, renderAIText()
```

### Files Touched (v5)
| File | Change |
|---|---|
| `index.html` | Loading screen, renderAIText cards, heat-driven charts, billing-card math fix, ZIP field, resolveBilling, computeFinancials, renderFinancialsTable, home-value note, `[rates]` console diagnostics |
| `api/analyze.js` | model `claude-sonnet-4-6`, `max_tokens` 1024, accuracy guardrails in system prompt |
| `api/rates.js` | **NEW** — NREL URDB v3 proxy, ZIP geocode (Zippopotam), state centroids, UA headers, error `cause` surfacing |
| `vercel.json` | added `api/rates.js` build + `/api/rates` route |
| `.env` | added `NREL_API_KEY` (gitignored via `.env*`) |

### ⚠️ Open Issue (as of June 8, 2026)
- `/api/rates` returned **404** in the user's last test (earlier it returned `200` with a server-side `"fetch failed"`). Likely causes: (a) `vercel dev` not restarted after the `vercel.json` route was added (routing isn't hot-reloaded), or (b) testing a deployed URL where `rates.js` + the route aren't deployed yet. **Fixes:** fully restart `vercel dev`, or `vercel --prod` redeploy + `vercel env add NREL_API_KEY production`. The earlier `"fetch failed"` was diagnosed as NREL/Akamai dropping header-less requests → fixed by adding `User-Agent`/`Accept` headers.

### Production Setup Required
- **`NREL_API_KEY`** must be set in the Vercel project for production (`.env` is local-only, not deployed): `vercel env add NREL_API_KEY production`.
- The NREL key was shared in plaintext during development — **recommend rotating** it at developer.nrel.gov.

### Superseded by v5 (older sections below are partly outdated)
- v4's 3 fixed prompt headings ("Why They Still Pay the Bill" / "The Policy Risk" / "The Battery Solution") → replaced by accuracy-driven, second-person sections that adapt to NEM vs net billing (#7).
- v4's hardcoded net-metering rates (28¢/8¢) → replaced by **live NREL rates + curated NEM-by-install-year engine** (#5).
- v4's `runAIAnalysis(d, yearsInstalled, isNetMetering)` signature → now `runAIAnalysis(d, yearsInstalled, rates, fin)`.
- v4's net-metering detection (Dominion-only string match) → expanded to CA IOUs + Dominion + labeled fallback.

---

## Latest Updates - June 5, 2026 (v4 - UI Refinement & Prompt Optimization)

### ✅ CLEAN AI RESPONSE STYLING
**UI Refinement:**
- Removed overly heavy uppercase headings and letter-spacing (was too tacky)
- Headings now use cleaner 1.15rem size with subtle underline
- Minimal spacing between sections for better flow
- Maintains professional look without appearing overdone
- Arrow bullets (→) remain for clean list formatting
- Report-style appearance is business-professional without being ostentatious

**Heading Styling Update:**
- Font-size: 1.15rem (down from 1.5rem)
- Margin: 1.25rem top / 0.5rem bottom (reduced from 2rem/1rem)
- Border-bottom: 1px solid (down from 2px, more subtle)
- Removed: text-transform uppercase and letter-spacing (was tacky)

### ✅ PROMPT OPTIMIZATION FOR CLEAN OUTPUT
**Content Structure (3 Sections with Bold Headings):**
1. **Why They Still Pay the Bill** - Conditional messaging based on billing type
2. **The Policy Risk** - Utility shift narrative (emphasizes Dominion's temporary 1:1 status)
3. **The Battery Solution** - Specific dollar savings and protection messaging

**Conditional Messaging:**
- **1:1 Net Metering (Dominion):** Explains timing mismatch (solar midday vs usage at night), winter heating load issue, policy risk of shift to 1:3 ratio
- **Net Billing (Other Utilities):** Shows 20¢ gap between export (8-10¢) and import (25-35¢) rates, emphasizes arbitrage loss

**Dynamic Calculations:**
- Annual savings projection: `Math.round((d.bill - 12) * 12)`
- 5-year savings: `Math.round((d.bill - 12) * 12 * 5)`
- Bold sections render as h2 headings via renderAIText markdown parsing

### NET METERING DETECTION (Unchanged - Still Working)
**Utility Classification:**
```
1:1 Net Metering (Traditional):
- Dominion Power
- Dominion Energy  
- VEPCO

Net Billing / Avoided Cost:
- All other utilities (Duke Energy, PG&E, etc.)
```

**Data Flow:**
- Detection in populateDashboard via: `netMeteringUtilities.some(u => d.utility.toLowerCase().includes(u.toLowerCase()))`
- Boolean passed to runAIAnalysis: `runAIAnalysis(d, yearsInstalled, isNetMetering)`
- Prompt uses boolean for conditional messaging

### FORM FIELD STATUS
| Field | Status | Data Variable | Notes |
|---|---|---|---|
| Utility Company | ✅ Working | `d.utility` | Used for net metering detection |
| State | ✅ Working | `d.state` | Passed to AI analysis |
| Number of Panels | ✅ Working | `d.panels` | SVG visualization |
| System Size (kW) | ✅ Working | `d.systemkw` | Baseline calculation |
| Inverter Brand | ✅ Working | `d.inverter` | 3 options (SolarEdge, Enphase, Micro) |
| Battery Installed? | ✅ Working | `d.battery` | Radio toggle |
| Avg Monthly Bill | ✅ Working | `d.bill` | Primary financial metric |
| Solar Production | ✅ Working | `d.solarProduction` | Used in charts + AI |
| Utility kWh | ✅ Working | `d.utilityKwh` | Consumption baseline |
| Heat Type | ✅ Working | `d.heatType` | Affects seasonal projections |
| Year Installed | ✅ Working | `d.installDate` | Calculates years ago |
| Installer | ✅ Working | `d.installer` | AI analysis context |

### NEXT ITERATION CONSIDERATIONS
1. **Expanded Utility Database:** Add more utilities for accurate detection beyond Dominion
2. **Regional Rate Variations:** Account for state-level rate differences
3. **Time-of-Use Rates:** Detect and explain TOU rate structures
4. **Export Data:** Allow customers to download/share their diagnostic report
5. **Chart Generation After AI:** Implement dynamic chart generation based on AI response data

