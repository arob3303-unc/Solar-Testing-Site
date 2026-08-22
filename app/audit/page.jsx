"use client";

// The audit. Solar-only: every home that reaches this page already owns a system,
// so there is no branch to pick. Three phases — intake, running, results.
//
// The results view shows how the system is ACTUALLY performing and stops there. The
// argument for a generator lives on /pitch, reached from the handoff at the bottom,
// because it only carries weight once the homeowner has seen their own numbers.

import { useState } from "react";
import { useRouter } from "next/navigation";
import SolarFields from "@/components/intake/SolarFields";
import BillFields from "@/components/intake/BillFields";
import BackupFields from "@/components/intake/BackupFields";
import SystemReport from "@/components/dashboard/SystemReport";
import LoadingSequence from "@/components/LoadingSequence";
import { VechterLogo } from "@/components/VechterMark";
import { useAudit } from "@/components/AuditProvider";
import { getRecommendation } from "@/lib/recommendation";
import { fetchRate } from "@/lib/rates";

const INITIAL = {
  // existing system
  panels: "",
  systemkw: "",
  inverter: "SolarEdge",
  solarProduction: "",
  installDate: "",
  installer: "",
  hasBattery: false,
  hasStandby: false,
  // the consumption test
  utility: "",
  state: "",
  zip: "",
  utilityKwh: "",
  bill: "",
  // home profile
  criticalLoads: [],
  occupants: "",
  sqft: "",
  heatType: "Gas",
};

function BrandLockup() {
  return (
    <div className="brand">
      <VechterLogo size={58} />
      <span className="brand-title">
        Solar <span>Assessment</span>
      </span>
    </div>
  );
}

async function analyze(form) {
  try {
    const resp = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form }),
    });
    return await resp.json(); // { rec, report, error, productMismatch }
  } catch (e) {
    return { error: e.message };
  }
}

const LOADING_STEPS = [
  "Fetching your utility rate",
  "Running production diagnostics",
  "Measuring consumption and offset",
  "Preparing your system report",
];

export default function AuditPage() {
  const [form, setForm] = useState(INITIAL);
  // null means "not chosen yet" — the phase is then derived from whether a completed
  // audit is already in session. Without this, a rep who walks to /pitch and taps the
  // Audit tab to come back lands on an empty form with the homeowner watching.
  //
  // Note this deliberately does NOT wait on the provider hydrating. Returning a blank
  // frame until sessionStorage is read would blank the FIRST paint of every cold load
  // — the common case — to avoid a flash in the rare one. Coming back from /pitch is a
  // client-side navigation, by which point the store is long since hydrated.
  const [phase, setPhase] = useState(null); // null | intake | running | results
  const { audit, setAudit } = useAudit();
  const router = useRouter();

  const effectivePhase = phase ?? (audit ? "results" : "intake");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // The two tests the assessment is built on are production and consumption, so the
  // three numbers they need are the floor for running it. Everything else degrades
  // gracefully into a "not measured" row.
  const canSubmit = Boolean(form.systemkw && form.solarProduction && form.utilityKwh);

  const runAudit = async () => {
    const rec = getRecommendation();
    setPhase("running");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });

    const start = Date.now();
    // Two diagnostic rows depend on the retail rate; the US-average fallback inside
    // fetchRate keeps a number on screen when NREL cannot resolve the address.
    const [rate, ai] = await Promise.all([
      fetchRate({ state: form.state, zip: form.zip }),
      analyze(form),
    ]);

    // Keep the diagnostics reveal on screen for a beat even if the fetches are fast.
    const MIN_MS = 2400;
    const elapsed = Date.now() - start;
    if (elapsed < MIN_MS) await new Promise((r) => setTimeout(r, MIN_MS - elapsed));

    // Stored on the provider (and mirrored to sessionStorage) so /pitch can read it
    // after the route change.
    setAudit({ form, rec, rate, ai });
    setPhase("results");
  };

  if (effectivePhase === "running") return <LoadingSequence steps={LOADING_STEPS} />;

  if (effectivePhase === "results" && audit) {
    return (
      <main className="dashboard-main">
        <SystemReport
          form={audit.form}
          rate={audit.rate}
          onContinue={() => router.push("/pitch")}
          onRestart={() => {
            setAudit(null);
            setForm(INITIAL);
            setPhase("intake");
          }}
        />
      </main>
    );
  }

  return (
    <div className="audit-shell">
      <div className="audit-card">
        <BrandLockup />
        <h2>Solar System Assessment</h2>
        <p className="sub">
          Two tests on your system — what it produces, and what you still consume. Fill in what you
          have; anything left blank is reported as not measured rather than guessed.
        </p>

        <div className="form-grid">
          <SolarFields values={form} onChange={set} />
        </div>

        {/* Always shown. Every home on a utility gets a bill — even a fully offset
            system still pays a meter or connection charge — so there is nothing to
            branch on, and two of the six tests need these figures. */}
        <div className="form-grid">
          <BillFields values={form} onChange={set} />
        </div>

        <div className="form-grid">
          <BackupFields values={form} onChange={set} />
        </div>

        <button className="submit-btn" onClick={runAudit} disabled={!canSubmit}>
          Run the assessment →
        </button>
        {!canSubmit && (
          <p className="q-help" style={{ textAlign: "center", marginTop: "0.7rem" }}>
            System size, recent production and monthly grid usage are needed to run the two tests.
          </p>
        )}
      </div>
    </div>
  );
}
