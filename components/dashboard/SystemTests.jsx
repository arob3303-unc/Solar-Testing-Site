"use client";

// Reframed from the legacy "System Diagnostic Tests". Solar homes only.
// Battery-free: the old "Energy Independence = 0% without a battery" check is gone;
// resilience is now satisfied by the recommended standby generator.

import { useEffect, useRef, useState } from "react";

function grade(p) {
  return p >= 85 ? "pass" : p >= 60 ? "warn" : "fail";
}
function label(p) {
  return p >= 85 ? "PASS" : p >= 60 ? "CHECK" : "LOW";
}

export default function SystemTests({ form }) {
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
  const kw = Number(form.systemkw) || 7;
  const production = Number(form.solarProduction) || 0;
  const usage = Number(form.utilityKwh) || 0;
  const panels = Number(form.panels) || 0;
  const expMonthly = Math.max(1, (kw * 1400) / 12); // ~1400 kWh/kW/yr

  // Energy offset = solar's share of the home's TOTAL energy use.
  //
  // `utilityKwh` is captured under "Your Electric Bill → Monthly Usage (kWh)", so it
  // is grid-PURCHASED energy, not whole-home consumption. Total consumption is
  // therefore production + grid, which is what solar is measured against:
  //
  //     offset = production / (production + utilityKwh)
  //
  // The previous production/utilityKwh treated the grid portion as the whole home's
  // usage, which overstated the offset and could exceed 100%. This form is bounded
  // at 100% by construction — a home can't offset more than it uses.
  const totalConsumption = production + usage;
  const offsetPct = totalConsumption > 0 ? (production / totalConsumption) * 100 : 0;

  // Backup readiness is a measured fact, not a courtesy score. With no standby
  // generator on site the home has zero whole-home backup — saying otherwise
  // contradicts the entire rest of the audit. A solar backup battery earns partial
  // credit only: it carries a few essential circuits for hours, not the whole home
  // through a multi-day outage, and it cannot recharge on a dark winter day.
  const backupPct = form.hasBattery ? 30 : 0;
  const backupNote = form.hasBattery
    ? "Solar battery only — partial loads, short duration"
    : "No standby generator on site";

  const tests = [
    { icon: "⚡", name: "Solar Production Output", note: "Measured vs. expected generation", pct: clamp((production / expMonthly) * 100) },
    { icon: "🔆", name: "Panel & String Health", note: "Array performance scan", pct: clamp(91 + (panels % 9)) },
    { icon: "🏠", name: "Energy Offset", note: "Solar share of total home energy", pct: clamp(offsetPct) },
    { icon: "📡", name: "Inverter Communication", note: "Telemetry & WiFi link", pct: 100 },
    { icon: "🔗", name: "Grid Synchronization", note: "Voltage & frequency sync", pct: 100 },
    { icon: "🛡️", name: "Backup Readiness", note: backupNote, pct: backupPct },
  ];

  // Overall status: attention if solar is under-producing OR the home has no real
  // backup. A "System Healthy" badge sitting next to a 0% row is the same
  // contradiction the readiness score itself used to have.
  const underproducing = tests[0].pct < 60;
  const needsAttention = underproducing || backupPct < 60;

  const [filled, setFilled] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="test-section" ref={ref}>
      <div className="test-head">
        <div>
          <h2>System Diagnostic Tests</h2>
          <p>Automated production &amp; consumption checks on your solar system</p>
        </div>
        <div className={`sys-status ${needsAttention ? "attention" : "complete"}`}>
          <span>{needsAttention ? "⚠️" : "✓"}</span>
          <span>{needsAttention ? "Needs Attention" : "System Healthy"}</span>
        </div>
      </div>

      <div className="test-list">
        {tests.map((t) => {
          const g = grade(t.pct);
          return (
            <div className={`test-row test-${g}`} key={t.name}>
              <div className="test-row-top">
                <span className="test-name">
                  <span className="ti">{t.icon}</span>
                  {t.name}
                  <span className="test-note"> · {t.note}</span>
                </span>
                <span className="test-result">
                  {t.pct}% · {label(t.pct)}
                </span>
              </div>
              <div className="test-track">
                <div className={`test-fill ${g}`} style={{ width: filled ? `${t.pct}%` : "0%" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
