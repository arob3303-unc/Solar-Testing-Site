"use client";

// The generator option: the argument for backup power.
//
// This is the only option that solves the outage as well as the bill, so it is the
// only one that raises the missing-backup problem at all. The others under /pitch
// assume backup is already handled.
//
// Deliberately a separate route from /audit. The assessment establishes what is
// true about the system; this page explains what that means. Splitting them means
// the homeowner reads the diagnostics as an inspection rather than as a setup, which
// is the entire premise of the field guide.
//
// Everything here reads the audit out of AuditProvider (sessionStorage-backed), so a
// refresh or a direct link still works. With nothing stored it shows a cold-start
// state rather than a page of empty cards.

import Link from "next/link";
import { useAuditOrFallback, BackToOptions } from "@/components/pitch/PitchShell";
import DatacenterBlackouts from "@/components/dashboard/DatacenterBlackouts";
import RollingBlackoutDiagram from "@/components/dashboard/RollingBlackoutDiagram";
import OutageReport from "@/components/dashboard/OutageReport";
import GridStabilityCompare from "@/components/dashboard/GridStabilityCompare";
import BackupPowerCard from "@/components/dashboard/BackupPowerCard";
import BillProjection from "@/components/dashboard/BillProjection";
import AiAudit from "@/components/ai/AiAudit";
import { PRODUCT_LABELS } from "@/lib/recommendation";
import { planPanels } from "@/lib/rates";
import { runDiagnostics } from "@/lib/diagnostics";

export default function GeneratorPitchPage() {
  const { audit, fallback } = useAuditOrFallback();
  if (fallback) return fallback;

  const { form, rec, rate, ai } = audit;

  // Computed ONCE here and handed to every consumer, so the panel count, the chart's
  // offset, the comparison table and the AI report can never disagree.
  const panelPlan = planPanels({ utilityKwh: form.utilityKwh });
  const showPanelPlan = rec.recommendPanels && panelPlan.count > 0;

  const { tests } = runDiagnostics({ form, rate });
  const backup = tests.find((t) => t.name === "Backup Unit");
  const billTest = tests.find((t) => t.name === "Bill Elimination");

  const monthlyBill = Number(form.bill) || 0;

  return (
    <main className="pitch-main">
      <BackToOptions />

      <section className="pitch-hero">
        <span className="pitch-hero-eyebrow">⚡ Whole-Home Backup</span>
        <h1>
          {backup?.pct === 100
            ? "Your system is covered. Here is what is still working against it."
            : "Your panels are working. Your home still has no backup."}
        </h1>
        <p>
          Two separate problems showed up in the tests, and they have two different answers. Added
          production is what brings a power bill down. A standby generator is what keeps the home
          running when the grid goes down — it does not reduce a bill, and nothing that reduces a
          bill will keep your lights on.
        </p>
      </section>

      <section className="pitch-problems">
        <article className="pitch-problem">
          <span className="pitch-problem-tag">Problem one</span>
          <h2>You still pay a power bill</h2>
          <div className="pitch-problem-figure">
            {monthlyBill > 0 ? `$${monthlyBill.toLocaleString()}/mo` : "Still billed"}
          </div>
          <p>
            {billTest?.measured
              ? `Your system removed about ${billTest.pct}% of what this home would pay with no solar at all. The rest is still being bought from the utility every month, at a rate that rises every year.`
              : "You own a solar system and the utility still sends a bill every month. That gap is what added production closes."}
          </p>
        </article>

        <article className="pitch-problem">
          <span className="pitch-problem-tag">Problem two</span>
          <h2>The home has no backup unit</h2>
          <div className="pitch-problem-figure">{backup?.pct ?? 0}% ready</div>
          <p>
            {form.hasStandby
              ? "A standby unit is on site. The assessment below covers whether it carries this home in full."
              : form.hasBattery
                ? "A battery covers a few essential circuits for a few hours. It is not whole-home standby power, and it cannot recharge through a dark winter outage."
                : "There is no standby generator and no transfer switch on this property. When the grid goes down, this home goes down with it."}
          </p>
        </article>
      </section>

      {/* The limitation, stated plainly before the homeowner finds it themselves. */}
      <section className="pitch-limitation">
        <h2>Your solar shuts off during an outage</h2>
        <p>
          When the grid goes down, a grid-tied solar system shuts down with it. That is a{" "}
          <strong>safety requirement, not a defect</strong> — it stops your panels backfeeding a line
          that a utility crew may be working on. Without backup on site, the panels do not run your
          house.
        </p>
        <p>
          A standby generator picks up automatically, in roughly fifteen seconds. When grid power
          returns, the generator steps down and the solar comes back online.
        </p>
      </section>

      {/* The threat: why this is happening now. */}
      <DatacenterBlackouts />

      {/* Makes the abstract claim above concrete: this is what load shedding looks
          like on your street. Transparent-backed, so it needs the .chart-card shell. */}
      <div className="chart-grid-single">
        <div className="chart-card">
          <RollingBlackoutDiagram zip={form.zip} />
        </div>
      </div>

      {/* Public-record exposure for this specific address. */}
      {form.zip && (
        <OutageReport
          zip={form.zip}
          state={form.state}
          utility={rate?.utilityName || form.utility}
        />
      )}

      <div className="chart-grid-single">
        <GridStabilityCompare form={form} panelPlan={panelPlan} showPanels={showPanelPlan} />
      </div>

      {/* The recommendation, from the single source of truth. */}
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

      <BackupPowerCard
        sqft={form.sqft}
        criticalLoads={form.criticalLoads}
        heatType={form.heatType}
        panelPlan={panelPlan}
        showPanels={showPanelPlan}
      />

      {monthlyBill > 0 && (
        <div className="chart-grid-single">
          <BillProjection
            monthlyBill={monthlyBill}
            showPanels={showPanelPlan}
            panelCount={panelPlan.count}
            offsetFraction={panelPlan.offsetFraction}
          />
        </div>
      )}

      <AiAudit rec={rec} report={ai?.report} error={ai?.error} loading={false} />

      <section className="pitch-close">
        <h2>Next step is a site assessment</h2>
        <p>
          Sizing, placement and clearances are confirmed on site, and the real load calculation
          happens there. Everything on this page is a quote-stage estimate until then.
        </p>
        <div className="home-actions">
          <Link className="btn-cta" href="/pitch">
            Compare the other options
          </Link>
          <Link className="btn-quiet" href="/audit">
            Back to the assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
