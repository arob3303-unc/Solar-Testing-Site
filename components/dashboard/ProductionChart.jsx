"use client";

// 12-month solar production (bars) vs. grid purchase (line). Seasonality depends on
// heat type.
//
// Expandable: the rep is showing this on a laptop across a kitchen table, so there is
// a full-screen mode. It works by making the SAME card position:fixed rather than
// re-mounting the canvas in a portal — remounting would destroy and rebuild the chart
// and lose the entry animation mid-conversation.

import { useCallback, useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

// Chart palette, matched to the light theme tokens in app/globals.css. Kept as
// literals because chart.js draws to a canvas and cannot read CSS variables.
const INK_MUTED = "#7c857f";
const GRID_LINE = "rgba(12,31,22,0.08)";
const BRAND = "#0b4d2c";
const BRAND_FILL = "rgba(11,77,44,0.45)";
const GOLD = "#a67c00";
const GOLD_FILL = "rgba(166,124,0,0.25)";

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const PROD_SEASONAL = [1.3, 1.35, 1.2, 1.0, 0.8, 0.6, 0.65, 0.75, 0.9, 1.05, 1.15, 1.25];
// Electric heat → winter demand spike; gas heat → cooling-driven summer peak only.
const CONS_ELECTRIC = [1.15, 1.2, 1.1, 0.95, 1.1, 1.45, 1.65, 1.6, 1.4, 1.05, 0.95, 1.05];
const CONS_GAS = [1.3, 1.35, 1.2, 1.0, 0.8, 0.7, 0.72, 0.78, 0.85, 1.0, 1.1, 1.25];

export default function ProductionChart({ productionKwh, consumptionKwh, heatType }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const prodBase = Number(productionKwh) || 0;
    const consBase = Number(consumptionKwh) || 0;
    const consSeasonal = heatType === "Electric" ? CONS_ELECTRIC : CONS_GAS;

    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: MONTHS,
        datasets: [
          {
            label: "Production",
            data: MONTHS.map((_, i) => Math.round(prodBase * PROD_SEASONAL[i])),
            backgroundColor: BRAND_FILL,
            borderColor: BRAND,
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: "Purchased from grid",
            data: MONTHS.map((_, i) => Math.round(consBase * consSeasonal[i])),
            backgroundColor: GOLD_FILL,
            borderColor: GOLD,
            borderWidth: 1.5,
            type: "line",
            fill: false,
            tension: 0.4,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: INK_MUTED, font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: INK_MUTED, font: { size: 10 } }, grid: { color: GRID_LINE } },
          y: { ticks: { color: INK_MUTED, font: { size: 10 } }, grid: { color: GRID_LINE } },
        },
      },
    });

    chartRef.current = chart;
    return () => {
      chartRef.current = null;
      chart.destroy();
    };
  }, [productionKwh, consumptionKwh, heatType]);

  // chart.js sizes to its container, and the container changes size the moment the
  // card goes fixed. ResizeObserver would fire eventually, but the frame in between
  // shows a squashed chart in front of the customer.
  useEffect(() => {
    chartRef.current?.resize();
  }, [expanded]);

  const close = useCallback(() => setExpanded(false), []);

  // Escape closes, and the page behind must not scroll while the overlay is up.
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, close]);

  return (
    <>
      {expanded && <div className="chart-backdrop" onClick={close} aria-hidden="true" />}
      <div className={`chart-card ${expanded ? "is-expanded" : ""}`}>
        <div className="chart-header">
          <div className="chart-title">Monthly Solar Production vs. Grid Purchase (kWh)</div>
          <div className="chart-actions">
            <div className="chart-badge">12 months</div>
            <button
              type="button"
              className="chart-expand"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "✕ Close" : "⛶ Expand"}
            </button>
          </div>
        </div>
        <div className="chart-body">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </>
  );
}
