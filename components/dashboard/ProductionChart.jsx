"use client";

// Ported from the legacy drawCharts(): 12-month solar production (bars) vs. home
// consumption (line). Seasonality depends on heat type. Solar homes only.

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const PROD_SEASONAL = [1.3, 1.35, 1.2, 1.0, 0.8, 0.6, 0.65, 0.75, 0.9, 1.05, 1.15, 1.25];
// Electric heat → winter demand spike; gas heat → cooling-driven summer peak only.
const CONS_ELECTRIC = [1.15, 1.2, 1.1, 0.95, 1.1, 1.45, 1.65, 1.6, 1.4, 1.05, 0.95, 1.05];
const CONS_GAS = [1.3, 1.35, 1.2, 1.0, 0.8, 0.7, 0.72, 0.78, 0.85, 1.0, 1.1, 1.25];

export default function ProductionChart({ productionKwh, consumptionKwh, heatType }) {
  const canvasRef = useRef(null);

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
            backgroundColor: "rgba(0,212,170,0.5)",
            borderColor: "#00d4aa",
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: "Purchased from grid",
            data: MONTHS.map((_, i) => Math.round(consBase * consSeasonal[i])),
            backgroundColor: "rgba(59,130,246,0.3)",
            borderColor: "#3b82f6",
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
        plugins: { legend: { labels: { color: "#6b7280", font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
          y: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
        },
      },
    });

    return () => chart.destroy();
  }, [productionKwh, consumptionKwh, heatType]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">Monthly Solar Production vs. Grid Purchase (kWh)</div>
        <div className="chart-badge">12 months</div>
      </div>
      <div className="chart-body">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
