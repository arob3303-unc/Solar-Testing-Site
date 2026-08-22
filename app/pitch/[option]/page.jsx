"use client";

// The non-generator options: spray foam, roof, home improvement.
//
// One template driven by lib/options.js. The generator has its own route
// (app/pitch/generator/page.jsx) because it carries the outage argument and half a
// dozen bespoke components; Next resolves the static segment ahead of this dynamic
// one, so the two coexist.
//
// NOTE THE ASSUMPTION: none of these pages raises the missing-backup problem. If the
// homeowner is on this path rather than the generator path, we take it that backup is
// already handled — arguing outages here would be pitching a product we are not on.

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { getOption, PANEL_PACKAGE } from "@/lib/options";
import { planPanels } from "@/lib/rates";
import { runDiagnostics } from "@/lib/diagnostics";
import { useAuditOrFallback, BackToOptions } from "@/components/pitch/PitchShell";

export default function OptionPage() {
  const params = useParams();
  const option = getOption(params?.option);
  const { audit, fallback } = useAuditOrFallback();

  // A slug we do not have content for is a 404, not an empty page.
  if (!option || option.slug === "generator") notFound();
  if (fallback) return fallback;

  const { form, rate } = audit;
  const panelPlan = planPanels({ utilityKwh: form.utilityKwh });
  const { tests } = runDiagnostics({ form, rate });
  const billTest = tests.find((t) => t.name === "Bill Elimination");
  const monthlyBill = Number(form.bill) || 0;

  return (
    <main className="pitch-main">
      <BackToOptions />

      <section className="pitch-hero">
        <span className="pitch-hero-eyebrow">
          {option.icon} {option.title}
        </span>
        <h1>{option.hero}</h1>
        <p>{option.lede}</p>
      </section>

      {/* The bill, restated with their own numbers, because that is the outcome this
          option is being chosen for. */}
      <section className="pitch-problems">
        <article className="pitch-problem">
          <span className="pitch-problem-tag">What this removes</span>
          <h2>The power bill</h2>
          <div className="pitch-problem-figure">
            {monthlyBill > 0 ? `$${monthlyBill.toLocaleString()}/mo` : "Still billed"}
          </div>
          <p>
            {billTest?.measured
              ? `Your system removed about ${billTest.pct}% of what this home would pay with no solar. The remainder is what added production closes.`
              : "The utility still bills this home every month. That remainder is what added production closes."}
          </p>
        </article>

        <article className="pitch-problem is-good">
          <span className="pitch-problem-tag good">Included</span>
          <h2>Added production</h2>
          <div className="pitch-problem-figure good">
            {panelPlan.count > 0 ? `${panelPlan.count} panels` : "Sized on site"}
          </div>
          <p>
            {panelPlan.count > 0
              ? `Enough to cover about ${Math.round(panelPlan.offsetFraction * 100)}% of the ${panelPlan.gridKwh.toLocaleString()} kWh a month this home still buys. ${PANEL_PACKAGE.short}`
              : PANEL_PACKAGE.short}
          </p>
        </article>
      </section>

      {option.sections.map((sec) => (
        <section className="pitch-section" key={sec.title}>
          <h2>{sec.title}</h2>
          {sec.body && <p>{sec.body}</p>}
          {sec.items && (
            <ul className="pitch-list">
              {sec.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="pitch-limitation">
        <h2>How the panels are handled</h2>
        <p>{PANEL_PACKAGE.detail}</p>
        <p>
          <strong>{PANEL_PACKAGE.warranty}</strong>
        </p>
      </section>

      <section className="pitch-close">
        <h2>Next step is a site assessment</h2>
        <p>
          Scope, measurements and panel placement are confirmed on site. Everything here is a
          quote-stage estimate until then.
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
