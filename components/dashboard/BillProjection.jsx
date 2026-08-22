"use client";

// Reframe of the legacy cost-outlook chart. Shows the 15-year cost of the current
// electric bill as utility rates keep rising ("do nothing"), and — for a home that
// already has solar AND still has a bill — overlays the lower path if additional
// panels offset most of what's left. No battery / net-billing modeling.

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { projectBill, projectWithPanels, RATE_ESCALATION } from "@/lib/rates";

// Chart palette, matched to the light theme tokens in app/globals.css. Kept as
// literals because chart.js draws to a canvas and cannot read CSS variables.
const INK_MUTED = "#7c857f";
const GRID_LINE = "rgba(12,31,22,0.08)";
const BRAND = "#0b4d2c";
const BRAND_FILL = "rgba(11,77,44,0.45)";
const GOLD = "#a67c00";
const GOLD_FILL = "rgba(166,124,0,0.25)";
const ALERT = "#b31d1d";
const ALERT_FILL = "rgba(179,29,29,0.14)";

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
        borderColor: ALERT,
        backgroundColor: ALERT_FILL,
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
        borderColor: BRAND,
        backgroundColor: "rgba(11,77,44,0.12)",
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
          legend: { labels: { color: INK_MUTED, font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)}` } },
        },
        scales: {
          x: { ticks: { color: INK_MUTED, font: { size: 10 } }, grid: { color: GRID_LINE } },
          y: {
            ticks: { color: INK_MUTED, font: { size: 10 }, callback: (v) => fmt(v) },
            grid: { color: GRID_LINE },
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
