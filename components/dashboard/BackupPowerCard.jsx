"use client";

// NEW card — the resilience value of the Generac standby generator, which is
// recommended in every report. Sizing comes from lib/rates.estimateGeneratorKw.

import { estimateGeneratorKw, KWH_PER_PANEL, TIER_LABELS } from "@/lib/rates";

// What each coverage band will actually carry. Stated plainly so the number on the
// card can't be read as promising more than the unit does.
const COVERAGE_COPY = {
  essential: "Refrigerator, lights, furnace fan, Wi-Fi and outlets — not central air conditioning.",
  partial: "Essentials plus a couple of major appliances, such as a well pump or a window AC unit.",
  "whole-home": "Central air, water heater, refrigerator and lights all running at the same time.",
};

const OUTAGE_COPY = {
  Rare: "Even rare outages hit at the worst times — storms, heat waves, grid strain.",
  Occasional: "Occasional outages add up: spoiled food, no heat or AC, no water on a well.",
  Frequent: "With frequent outages, automatic standby power stops being a luxury.",
};

export default function BackupPowerCard({
  sqft,
  criticalLoads = [],
  outage = "Occasional",
  heatType = "Gas",
  panelPlan = null,
  showPanels = false,
}) {
  // heatType matters as much as floor area: an all-electric home carries its entire
  // heating load on the generator, which gas-heated homes do not.
  const { kw, tier, drivers } = estimateGeneratorKw({ sqft, criticalLoads, heatType });
  const loads = criticalLoads.length ? criticalLoads : ["Refrigerator / Freezer", "Heating / Cooling", "Lights & Outlets"];

  // Panel math comes from planPanels() in lib/rates — never recomputed locally, or
  // this card could drift from the projection chart.
  const showPanelPlan = showPanels && panelPlan?.count > 0;

  return (
    <div className="backup-card">
      <div className="backup-head">
        <span className="backup-icon">🔌</span>
        <div>
          <div className="backup-title">Backup Power Plan</div>
          <div className="backup-sub">Generac standby generator — recommended for your home</div>
        </div>
      </div>

      <div className="backup-size">
        <div className="bs-kw">
          <span className="bs-num">~{kw}</span>
          <span className="bs-unit">kW</span>
        </div>
        <div className="bs-meta">
          <div className="bs-tier">{TIER_LABELS[tier]}</div>
          <div className="bs-detail">{COVERAGE_COPY[tier]}</div>
          {/* Only the factors that actually moved the number are listed — occupant
              count doesn't affect sizing, so showing it here would imply it does. */}
          <div className="bs-detail bs-drivers">
            Sized on {drivers.length ? drivers.join(" · ") : "a typical home of unknown size"} ·
            automatic transfer within seconds
          </div>
        </div>
      </div>

      <p className="backup-outage">{OUTAGE_COPY[outage] || OUTAGE_COPY.Occasional}</p>

      {/* Solar homes that still have a bill: what it takes to close the remaining gap. */}
      {showPanelPlan && (
        <div className="backup-panels">
          <div className="bp-head">
            <span className="bp-icon" aria-hidden="true">
              🔆
            </span>
            <div className="bl-label">Additional panels to cover your remaining usage</div>
          </div>
          <div className="bp-body">
            <div className="bs-kw">
              <span className="bs-num">+{panelPlan.count}</span>
              <span className="bs-unit">panels</span>
            </div>
            <div className="bs-detail">
              You still buy <strong>~{panelPlan.gridKwh.toLocaleString()} kWh/mo</strong> from the
              utility. At roughly {KWH_PER_PANEL} kWh per panel per month,{" "}
              <strong>{panelPlan.count} more panels</strong> would produce about{" "}
              <strong>{panelPlan.coveredKwh.toLocaleString()} kWh/mo</strong> — covering{" "}
              {Math.round(panelPlan.offsetFraction * 100)}% of what you currently buy.
            </div>
          </div>
        </div>
      )}

      <div className="backup-loads">
        <div className="bl-label">Keeps running during an outage</div>
        <div className="bl-chips">
          {loads.map((l) => (
            <span key={l} className="bl-chip">{l}</span>
          ))}
        </div>
      </div>

      <p className="backup-note">
        Sizing is a quote-stage estimate from floor area, the loads you selected and your heating
        type. Actual sizing depends on <em>starting</em> surge watts — a central AC compressor
        briefly draws several times its running load — so a site assessment does the load
        calculation and confirms the model. Runs on natural gas or propane; on the same engine
        natural gas delivers slightly lower peak output than propane, which can affect the final
        size.
        {showPanelPlan
          ? " Panel count assumes ~50–60 kWh per panel per month and is rounded down; actual production varies with roof orientation, shading, and weather, and the engineering design confirms the final number. Panels offset the usage portion of your bill — your utility's fixed connection charge remains either way."
          : ""}
      </p>
    </div>
  );
}
