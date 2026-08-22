"use client";

// The "why a generator matters" section: AI data centers are piling unprecedented
// 24/7 demand onto an aging grid, pushing rolling blackouts from rare emergency to
// a growing, planned reality. Figures are framed as reported/projected estimates —
// directionally accurate, deliberately not presented as precise guarantees.

const STATS = [
  { val: "2×+", label: "Data-center power demand", sub: "Projected U.S. growth by 2030 as AI scales" },
  { val: "100k+", label: "Homes' worth of power", sub: "Draw of a single large AI data center" },
  { val: "Elevated", label: "Grid shortfall risk", sub: "Reliability regulators' multi-year outlook" },
];

const PAIN_POINTS = [
  "AI data centers run flat-out 24/7 — they don't ease off during heat waves the way homes do, so the strain on the grid never lets up.",
  "To feed them, utilities are delaying old coal and gas plant retirements and racing to build capacity — then passing those billions on to you through higher rates.",
  "When demand outruns supply, grid operators order rolling blackouts: deliberately cutting power to entire neighborhoods to stop the whole system from collapsing.",
  "Your home is last in line. Data centers sign priority power contracts; residential customers are the first to get shed when the grid is short.",
  "Aging infrastructure + extreme weather + explosive AI demand is a compounding problem — regulators warn the risk of shortfalls grows every year this decade.",
  "A blackout gives no warning: no heat in winter, no AC in a heat wave, spoiled food, dead medical equipment, and no water if you're on a well.",
];

export default function DatacenterBlackouts() {
  return (
    <div className="dc-card">
      <div className="dc-head">
        <span className="dc-icon">⚠️</span>
        <div>
          <div className="dc-title">Rolling Blackouts Are Coming — Data Centers Are Draining the Grid</div>
          <div className="dc-sub">
            The AI boom is bolting enormous new demand onto a grid that&apos;s already stretched thin.
            Data centers now compete with your home for the same electricity — and when supply falls
            short, the utility keeps the lights on by cutting yours.
          </div>
        </div>
      </div>

      <div className="dc-stats">
        {STATS.map((s) => (
          <div className="dc-stat" key={s.label}>
            <div className="dc-stat-val">{s.val}</div>
            <div className="dc-stat-label">{s.label}</div>
            <div className="dc-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <ul className="dc-points">
        {PAIN_POINTS.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>

      <div className="dc-tie">
        <span className="dc-tie-icon">🔌</span>
        <p>
          This is exactly why a <strong>whole-home standby generator</strong> matters. It takes your home
          off the grid&apos;s mercy — starting automatically the second the power drops, whether the
          outage lasts minutes or days. You stop depending on whether the grid has enough left over
          after the data centers take their share.
        </p>
      </div>
    </div>
  );
}
