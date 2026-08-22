"use client";

// The audit result: how the system is actually performing, and nothing else.
//
// This is the neutral half of the site. No product is named, no cost of inaction is
// projected, no urgency is applied — it reads as an inspection report, which is what
// the homeowner agreed to. Everything persuasive lives on /pitch, behind the handoff
// at the bottom of this card.

import HouseSvg from "./HouseSvg";
import ProductionChart from "./ProductionChart";
import SystemTests from "./SystemTests";
import { runDiagnostics } from "@/lib/diagnostics";

function StatCard({ tone, icon, label, value, sub }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function InfoRow({ k, v }) {
  return (
    <div className="info-row">
      <span className="info-key">{k}</span>
      <span className="info-val">{v || "—"}</span>
    </div>
  );
}

export default function SystemReport({ form, rate = null, onContinue, onRestart }) {
  const { status, headline } = runDiagnostics({ form, rate });

  const heroTitle = `${form.panels || "—"}-Panel ${form.systemkw || "—"} kW System — ${form.state || "Your Home"}`;
  const heroSub = [
    form.inverter ? `${form.inverter} inverter` : null,
    form.utility || "your utility",
    `Assessed ${new Date().toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const cards = [
    {
      tone: "green",
      icon: "⚡",
      label: "Solar Production",
      value: `${form.solarProduction || "—"} kWh`,
      sub: "recent month",
    },
    {
      // Labelled as GRID purchase, not total consumption: utilityKwh is what the
      // utility billed. Calling it "Home Consumption" would contradict the Energy
      // Offset math, which treats total use as production + grid purchase.
      tone: "blue",
      icon: "🏠",
      label: "Purchased from Grid",
      value: `${form.utilityKwh || "—"} kWh`,
      sub: "monthly, on top of your solar",
    },
  ];
  cards.push({
    tone: "warn",
    icon: "💸",
    label: "Current Utility Bill",
    value: `$${form.bill || "—"}`,
    sub: rate?.live ? `${rate.importCents}¢/kWh live rate` : "monthly average",
  });

  return (
    <div className="dashboard">
      <div className="hero">
        <div className="hero-left">
          <h1>{heroTitle}</h1>
          <p>{heroSub}</p>
        </div>
        <div className="hero-actions">
          <div className="status-pill">
            <span className="pulse" />
            Assessment complete
          </div>
          {onRestart && (
            <button type="button" className="btn-quiet btn-small" onClick={onRestart}>
              New assessment
            </button>
          )}
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <SystemTests form={form} rate={rate} />

      <div className="chart-grid-single">
        <ProductionChart
          productionKwh={form.solarProduction}
          consumptionKwh={form.utilityKwh}
          heatType={form.heatType}
        />
      </div>

      <div className="house-section">
        <div className="house-wrap">
          <div className="house-eyebrow">System Visualization</div>
          <HouseSvg
            panels={Number(form.panels) || 0}
            productionKwh={Number(form.solarProduction) || 0}
          />
          <div className="house-caption">Panels shown to scale with your reported array</div>
        </div>

        <div className="house-info">
          <h3>System Details</h3>
          <InfoRow k="Installer" v={form.installer} />
          <InfoRow k="Inverter Brand" v={form.inverter} />
          <InfoRow k="Panels" v={form.panels ? `${form.panels} panels` : ""} />
          <InfoRow k="System Size" v={form.systemkw ? `${form.systemkw} kW` : ""} />
          <InfoRow k="Year Installed" v={form.installDate} />
          <InfoRow k="Backup Unit" v={form.hasStandby ? "Standby generator on site" : "None on site"} />
          <InfoRow k="Home Size" v={form.sqft ? `${Number(form.sqft).toLocaleString()} sq ft` : ""} />
          <InfoRow k="Occupants" v={form.occupants} />
          <InfoRow k="Heating" v={form.heatType ? `${form.heatType} heat` : ""} />
          <InfoRow k="Utility Company" v={form.utility} />
          <InfoRow k="State" v={form.state} />
        </div>
      </div>

      <div className="handoff">
        <div>
          <h2>{status === "healthy" ? "Your system is performing well" : "Some of these results need explaining"}</h2>
          <p>
            {status === "healthy"
              ? "The array is doing its job, and you are still paying a power bill. There are a few different ways to close it — here is what they look like."
              : `${headline}. Here is what is behind those results, and the options for closing what is left of your power bill.`}
          </p>
        </div>
        <button className="btn-cta" onClick={onContinue}>
          See your options →
        </button>
      </div>
    </div>
  );
}
