"use client";

// The options hub — where the assessment hands off.
//
// The homeowner sees the finding first (they still pay a power bill), then the routes
// available to remove it. Every option carries the production package, so the bill
// outcome is the same on all of them; what the homeowner is actually choosing is which
// project they want done to their house.
//
// The rep opens the one that fits what came up during wants and needs. Presenting all
// four and letting the homeowner point is the whole purpose of this screen.

import Link from "next/link";
import { OPTIONS, PANEL_PACKAGE } from "@/lib/options";
import { runDiagnostics } from "@/lib/diagnostics";
import { useAuditOrFallback } from "@/components/pitch/PitchShell";

export default function PitchOptionsPage() {
  const { audit, fallback } = useAuditOrFallback();
  if (fallback) return fallback;

  const { form, rate } = audit;
  const { tests } = runDiagnostics({ form, rate });
  const billTest = tests.find((t) => t.name === "Bill Elimination");
  const monthlyBill = Number(form.bill) || 0;

  return (
    <main className="pitch-main">
      <section className="pitch-hero">
        <span className="pitch-hero-eyebrow">What the assessment found</span>
        <h1>Your panels are working. You are still paying a power bill.</h1>
        <p>
          {billTest?.measured
            ? `The array removed about ${billTest.pct}% of what this home would pay with no solar at all${
                monthlyBill > 0 ? `, and roughly $${monthlyBill.toLocaleString()} a month is still going to the utility` : ""
              }. Closing the rest takes added production — and that production is funded inside whichever project below you choose.`
            : "You own a solar system and the utility still sends a bill every month. Closing that gap takes added production, and that production is funded inside whichever project below you choose."}
        </p>
      </section>

      <div className="options-lede">
        <h2>Four ways to get there</h2>
        <p>
          Every one of these includes the added production that removes the power bill. The
          difference is what gets done to the house.
        </p>
      </div>

      <div className="options-grid">
        {OPTIONS.map((o) => (
          <Link className="option-card" key={o.slug} href={`/pitch/${o.slug}`}>
            <span className="option-icon" aria-hidden="true">
              {o.icon}
            </span>
            <span className="option-title">{o.title}</span>
            <span className="option-subtitle">{o.subtitle}</span>
            <span className="option-summary">{o.summary}</span>
            <span className="option-foot">
              {o.includesPanels && <span className="option-tag">Panels included</span>}
              <span className="option-solves">Solves: {o.solves}</span>
            </span>
            <span className="option-go">Open →</span>
          </Link>
        ))}
      </div>

      <section className="options-package">
        <h2>{PANEL_PACKAGE.label}</h2>
        <p>{PANEL_PACKAGE.detail}</p>
        <p className="options-package-note">{PANEL_PACKAGE.warranty}</p>
      </section>
    </main>
  );
}
