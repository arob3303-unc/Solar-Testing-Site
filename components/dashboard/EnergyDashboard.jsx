"use client";

import HouseSvg from "./HouseSvg";
import ProductionChart from "./ProductionChart";
import BillProjection from "./BillProjection";
import BackupPowerCard from "./BackupPowerCard";
import SystemTests from "./SystemTests";
import GridStabilityCompare from "./GridStabilityCompare";
import DatacenterBlackouts from "./DatacenterBlackouts";
import RollingBlackoutDiagram from "./RollingBlackoutDiagram";
import OutageReport from "./OutageReport";
import AiAudit from "@/components/ai/AiAudit";
import { PRODUCT_LABELS } from "@/lib/recommendation";
import { planPanels } from "@/lib/rates";

function StatCard({ tone, icon, label, value, sub }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
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

export default function EnergyDashboard({ form, rec, rate = null, ai = null }) {
  const hasSolar = form.hasSolar;
  const hasBill = form.hasBill;
  const utility = form.utility || "your utility";

  // Computed ONCE here and handed to every consumer, so the panel count, the chart's
  // offset, the comparison table and the AI report can never disagree.
  const panelPlan = planPanels({ utilityKwh: form.utilityKwh });
  const showPanelPlan = rec.recommendPanels && panelPlan.count > 0;

  const heroTitle = hasSolar
    ? `${form.panels || "—"}-Panel ${form.systemkw || "—"} kW System — ${form.state || "Your Home"}`
    : `Whole-Home Backup Assessment — ${form.state || "Your Home"}`;
  const heroSub = [hasSolar ? `${form.inverter} inverter` : null, hasBill ? utility : null, `Generated ${new Date().toLocaleDateString()}`]
    .filter(Boolean)
    .join(" · ");

  const cards = [];
  if (hasSolar) {
    cards.push({ tone: "green", icon: "⚡", label: "Solar Production", value: `${form.solarProduction || "—"} kWh`, sub: "recent month" });
    // Labelled as GRID purchase, not total consumption: utilityKwh is what the utility
    // billed. Calling it "Home Consumption" contradicted the Energy Offset math, which
    // treats total use as solar production + grid purchase.
    cards.push({
      tone: "blue",
      icon: "🏠",
      label: "Purchased from Grid",
      value: `${form.utilityKwh || "—"} kWh`,
      sub: hasSolar ? "monthly, on top of your solar" : "monthly usage",
    });
  }
  if (hasBill) {
    cards.push({
      tone: "warn",
      icon: "💸",
      label: "Current Utility Bill",
      value: `$${form.bill || "—"}`,
      sub: rate ? (rate.live ? `${rate.importCents}¢/kWh live rate` : "monthly average") : "monthly average",
    });
  }
  cards.push({ tone: "green", icon: "🔌", label: "Backup Power", value: "Recommended", sub: "Generac standby" });

  return (
    <div className="dashboard">
      <div className="hero">
        <div className="hero-left">
          <h1>{heroTitle}</h1>
          <p>{heroSub}</p>
        </div>
        <div className="status-pill">
          <span className="pulse" />
          Audit complete
        </div>
      </div>

      {/* Recommendation banner — straight from the single source of truth */}
      <div className="rec-banner">
        <div className="rec-banner-title">Recommended for your home</div>
        <div className="rec-banner-items">
          {rec.products.map((id) => (
            <span key={id} className="rec-pill">
              ✅ {PRODUCT_LABELS[id]}
            </span>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {hasSolar && (
        <div className="chart-grid-single">
          <ProductionChart productionKwh={form.solarProduction} consumptionKwh={form.utilityKwh} heatType={form.heatType} />
        </div>
      )}

      {/* Reframed diagnostic tests — solar homes only, per request. */}
      {hasSolar && <SystemTests form={form} />}

      {hasBill && (
        <div className="chart-grid-single">
          <BillProjection
            monthlyBill={Number(form.bill) || 0}
            showPanels={showPanelPlan}
            panelCount={panelPlan.count}
            offsetFraction={panelPlan.offsetFraction}
          />
        </div>
      )}

      <div className="house-section">
        <div className="house-wrap">
          <div className="house-eyebrow">{hasSolar ? "System Visualization" : "Home Visualization"}</div>
          <HouseSvg hasSolar={hasSolar} panels={Number(form.panels) || 0} productionKwh={Number(form.solarProduction) || 0} />
          <div className="house-caption">
            {hasSolar ? "Panels adjust to your system; generator on standby" : "Generac standby generator on call 24/7"}
          </div>
        </div>

        <div className="house-info">
          <h3>{hasSolar ? "System Details" : "Home Details"}</h3>
          {hasSolar && <InfoRow k="Installer" v={form.installer} />}
          {hasSolar && <InfoRow k="Inverter Brand" v={form.inverter} />}
          {hasSolar && <InfoRow k="Panels" v={form.panels ? `${form.panels} panels` : ""} />}
          {hasSolar && <InfoRow k="System Size" v={form.systemkw ? `${form.systemkw} kW` : ""} />}
          {hasSolar && <InfoRow k="Year Installed" v={form.installDate} />}
          <InfoRow k="Home Size" v={form.sqft ? `${Number(form.sqft).toLocaleString()} sq ft` : ""} />
          <InfoRow k="Occupants" v={form.occupants} />
          <InfoRow k="Heating" v={form.heatType ? `${form.heatType} heat` : ""} />
          {hasBill && <InfoRow k="Utility Company" v={form.utility} />}
          <InfoRow k="State" v={form.state} />
        </div>
      </div>

      {/* Non-solar audits have no production/diagnostic charts, so the location and
          outage-exposure report carries that part of the story instead. Needs a ZIP,
          which today is only collected on the bill step. */}
      {!hasSolar && form.zip && (
        <OutageReport
          zip={form.zip}
          state={form.state}
          utility={rate?.utilityName || form.utility}
          outage={form.outage}
        />
      )}

      {/* The threat (data centers + rolling blackouts) → then the solution below. */}
      <DatacenterBlackouts />

      {/* Makes the abstract claim above concrete: this is what load shedding looks
          like on your street. Transparent-backed, so it needs the .chart-card shell. */}
      <div className="chart-grid-single">
        <div className="chart-card">
          <RollingBlackoutDiagram zip={form.zip} />
        </div>
      </div>

      <BackupPowerCard
        sqft={form.sqft}
        criticalLoads={form.criticalLoads}
        outage={form.outage}
        heatType={form.heatType}
        // rec.recommendPanels is the authoritative solar-AND-bill rule, so a
        // no-solar home can never surface a panel pitch here.
        panelPlan={panelPlan}
        showPanels={showPanelPlan}
      />

      <div className="chart-grid-single">
        <GridStabilityCompare form={form} rec={rec} panelPlan={panelPlan} showPanels={showPanelPlan} />
      </div>

      <AiAudit rec={rec} report={ai?.report} error={ai?.error} loading={false} />
    </div>
  );
}
