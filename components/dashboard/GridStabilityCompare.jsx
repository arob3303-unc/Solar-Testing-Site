"use client";

// Reframe of the legacy "On Grid vs. Off Grid" comparison — now
// "On-Grid Only vs. Whole-Energy Stability". No batteries / off-grid living:
// the right column is the resilience of a Generac standby generator (plus, when
// applicable, additional solar to shrink the bill).

export default function GridStabilityCompare({ form, rec, panelPlan = null, showPanels = false }) {
  const oldBill = Math.round(Number(form.bill) || 0);
  const utility = form.utility && form.utility !== "Unknown Utility" ? form.utility : "your utility";
  // Same gate and same count as the Backup Power Plan card and the projection chart.
  const panelCount = showPanels && panelPlan?.count > 0 ? panelPlan.count : 0;

  const onGrid = [
    oldBill
      ? `Still paying <strong>~$${oldBill.toLocaleString()}/mo</strong> to ${utility} — a bill that keeps climbing with every rate hike.`
      : `A utility bill that keeps climbing with every rate hike.`,
    `<strong>No backup power.</strong> When the grid goes down, so does your home — heat, AC, fridge, well pump, medical devices.`,
    `Outages are getting <strong>longer and more frequent</strong> as the grid ages and demand from data centers and electrification grows.`,
    `You're fully dependent on ${utility}'s uptime and pricing, with no control of your own.`,
  ];

  const stability = [
    `<strong>Automatic backup power</strong> from a Generac standby generator — your home stays on within seconds of an outage, for days if needed.`,
    `Runs on <strong>natural gas or propane</strong> — no fuel to haul or store, no manual starting.`,
    panelCount
      ? `<strong>${panelCount} additional solar panels</strong> cover about ${Math.round(
          panelPlan.offsetFraction * 100
        )}% of the ${panelPlan.gridKwh.toLocaleString()} kWh/mo you still buy, shrinking the usage charges you pay ${utility}.`
      : `Peace of mind for <strong>${form.criticalLoads?.length ? form.criticalLoads.slice(0, 3).join(", ") : "the essentials"}</strong> — the loads you told us must stay on.`,
    `<strong>Energy stability you control</strong> — resilience against outages and a hedge against rising utility costs.`,
  ];

  return (
    <div className="chart-card gsc-card">
      <div className="chart-header">
        <div className="chart-title">On-Grid Only vs. Whole-Energy Stability</div>
      </div>
      <div className="gsc-cols">
        <div className="gsc-col gsc-grid">
          <div className="gsc-col-head">
            <span className="gsc-icon">🏚️</span>
            <div>
              <div className="gsc-col-title">On-Grid Only</div>
              <div className="gsc-col-sub grid">Today</div>
            </div>
          </div>
          <ul className="gsc-list grid">
            {onGrid.map((t, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
            ))}
          </ul>
        </div>

        <div className="gsc-col gsc-stable">
          <div className="gsc-col-head">
            <span className="gsc-icon">🏡</span>
            <div>
              <div className="gsc-col-title">Whole-Energy Stability</div>
              <div className="gsc-col-sub stable">Recommended</div>
            </div>
          </div>
          <ul className="gsc-list stable">
            {stability.map((t, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
