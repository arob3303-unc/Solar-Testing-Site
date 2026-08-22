"use client";

// Thin renderer over lib/diagnostics.js. Deliberately holds NO math of its own —
// if a number appears on this card it was computed by runDiagnostics() from
// something the homeowner supplied, and a rep can explain where it came from.

import { useEffect, useState } from "react";
import { runDiagnostics } from "@/lib/diagnostics";

export default function SystemTests({ form, rate }) {
  const { tests, status, headline } = runDiagnostics({ form, rate });

  // Bars animate from zero on mount, so the reveal reads as a measurement running
  // rather than a static graphic.
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const unmeasured = tests.filter((t) => !t.measured).length;

  return (
    <div className="test-section">
      <div className="test-head">
        <div>
          <h2>System Diagnostic Tests</h2>
          <p>Production and consumption checks measured against your own system</p>
        </div>
        <div className={`sys-status ${status === "healthy" ? "complete" : "attention"}`}>
          <span>{status === "healthy" ? "✓" : "⚠️"}</span>
          <span>{headline}</span>
        </div>
      </div>

      <div className="test-list">
        {tests.map((t) => (
          <div className={`test-row test-${t.measured ? t.grade : "none"}`} key={t.name}>
            <div className="test-row-top">
              <span className="test-name">
                <span className="ti" aria-hidden="true">
                  {t.icon}
                </span>
                {t.name}
                <span className="test-note"> · {t.measured ? t.detail || t.note : t.reason}</span>
              </span>
              <span className="test-result">
                {t.measured ? `${t.pct}% · ${t.label}` : t.label}
              </span>
            </div>
            <div
              className="test-track"
              role="img"
              aria-label={t.measured ? `${t.name}: ${t.pct} percent, ${t.label}` : `${t.name}: not measured`}
            >
              {t.measured && (
                <div className={`test-fill ${t.grade}`} style={{ width: filled ? `${t.pct}%` : "0%" }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="test-footnote">
        Production benchmarks assume a healthy panel produces about 41 kWh in an average month,
        on a 1% per year degradation curve. Rate-based checks appear only where a live rate was
        resolved for your utility.
        {unmeasured > 0 &&
          ` ${unmeasured} check${unmeasured === 1 ? "" : "s"} could not be measured from the information provided — those are reported as not measured rather than estimated.`}
      </p>
    </div>
  );
}
