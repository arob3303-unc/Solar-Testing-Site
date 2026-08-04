"use client";

// Reframe of the legacy cost-outlook chart. Shows the 15-year cost of the current
// electric bill as utility rates keep rising ("do nothing"), and — for a home that
// already has solar AND still has a bill — overlays the lower path if additional
// panels offset most of what's left. No battery / net-billing modeling.

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { projectBill, projectWithPanels, RATE_ESCALATION } from "@/lib/rates";

const fmt = (n) => "$" + Math.round(n).toLocaleString();

export default function BillProjection({ monthlyBill, showPanels, panelCount = 0, offsetFraction = 0 }) {
  const canvasRef = useRef(null);

  const doNothing = projectBill({ monthlyBill });
  // offsetFraction comes from planPanels() via the dashboard — the same number that
  // produced the panel count on the Backup Power Plan card. Never hardcode it here.
  const withPanels = showPanels ? projectWithPanels({ monthlyBill, offsetFraction }) : null;
  const panelLabel = panelCount ? `With ${panelCount} additional panels` : "With additional panels";

  useEffect(() => {
    if (!canvasRef.current) return;
    const labels = doNothing.series.map((s) => `Yr ${s.year}`);
    const datasets = [
      {
        label: "Keep paying the utility",
        data: doNothing.series.map((s) => s.cumulative),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.12)",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      },
    ];
    if (withPanels) {
      datasets.push({
        label: panelLabel,
        data: withPanels.series.map((s) => s.cumulative),
        borderColor: "#00d4aa",
        backgroundColor: "rgba(0,212,170,0.12)",
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      });
    }

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#6b7280", font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)}` } },
        },
        scales: {
          x: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
          y: {
            ticks: { color: "#6b7280", font: { size: 10 }, callback: (v) => fmt(v) },
            grid: { color: "rgba(255,255,255,0.04)" },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [monthlyBill, showPanels, panelCount, offsetFraction]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">15-Year Electric Cost Projection</div>
        <div className="chart-badge">~{Math.round(RATE_ESCALATION * 100)}%/yr rate rise</div>
      </div>
      <div className="chart-body">
        <canvas ref={canvasRef} />
      </div>
      <div className="proj-summary">
        <div className="proj-stat util">
          <div className="ps-label">Do nothing (15 yr)</div>
          <div className="ps-val">{fmt(doNothing.total)}</div>
        </div>
        {withPanels && (
          <div className="proj-stat save">
            <div className="ps-label">Est. saved with {panelCount} panels</div>
            <div className="ps-val">{fmt(withPanels.savings)}</div>
          </div>
        )}
      </div>
      <p className="proj-note">
        Estimate based on your current bill rising ~{Math.round(RATE_ESCALATION * 100)}%/yr. Actual
        figures vary by usage, rates, and installation. Not a guarantee.
        {withPanels
          ? ` The panel scenario assumes ${panelCount} additional panels covering ~${Math.round(
              withPanels.offsetFraction * 100
            )}% of the usage you currently buy from the utility; fixed connection charges are not offset.`
          : ""}
      </p>
    </div>
  );
}
