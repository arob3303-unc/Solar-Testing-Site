"use client";

import { useState } from "react";
import HouseTypeStep, { YesNo } from "@/components/intake/HouseTypeStep";
import SolarFields from "@/components/intake/SolarFields";
import BillFields from "@/components/intake/BillFields";
import BackupFields from "@/components/intake/BackupFields";
import EnergyDashboard from "@/components/dashboard/EnergyDashboard";
import LoadingSequence from "@/components/LoadingSequence";
import { getRecommendation } from "@/lib/recommendation";
import { fetchRate } from "@/lib/rates";

const INITIAL = {
  hasSolar: null,
  hasBill: null,
  // solar (only used when hasSolar)
  panels: "",
  systemkw: "",
  inverter: "SolarEdge",
  solarProduction: "",
  installDate: "",
  installer: "",
  hasBattery: false,
  // bill (only used when hasBill)
  utility: "",
  state: "",
  zip: "",
  utilityKwh: "",
  bill: "",
  // backup (always)
  outage: "Occasional",
  criticalLoads: [],
  occupants: "",
  sqft: "",
  heatType: "Gas",
};

function BrandLockup() {
  return (
    <div className="brand">
      <svg
        className="brand-emblem"
        width="52"
        height="52"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Top Tier Solar Solutions logo"
      >
        <defs>
          <linearGradient id="ttGradAudit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00d4aa" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#ttGradAudit)" />
        <circle cx="32" cy="25" r="7.5" fill="#ffffff" />
        <g stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round">
          <line x1="32" y1="7" x2="32" y2="12.5" />
          <line x1="13.5" y1="25" x2="19" y2="25" />
          <line x1="45" y1="25" x2="50.5" y2="25" />
          <line x1="18.8" y1="11.8" x2="22.6" y2="15.6" />
          <line x1="45.2" y1="11.8" x2="41.4" y2="15.6" />
        </g>
        <path d="M17 52 L21.5 40 H42.5 L47 52 Z" fill="#ffffff" />
      </svg>
      <div className="brand-text">
        <span className="brand-eyebrow">Top Tier</span>
        <span className="brand-title">
          <span>Energy Audit</span>
        </span>
      </div>
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

export default function AuditPage() {
  const [form, setForm] = useState(INITIAL);
  const [phase, setPhase] = useState("intake"); // intake | running | dashboard
  const [audit, setAudit] = useState(null); // { rec, rate, ai }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const solarChosen = form.hasSolar !== null;
  const canSubmit = form.hasSolar !== null && form.hasBill !== null;

  const runAudit = async () => {
    const rec = getRecommendation({ hasSolar: form.hasSolar, hasBill: form.hasBill });
    setPhase("running");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });

    const start = Date.now();
    const [rate, ai] = await Promise.all([
      form.hasBill ? fetchRate({ state: form.state, zip: form.zip }) : Promise.resolve(null),
      analyze(form),
    ]);

    // Keep the diagnostics reveal on screen for a beat even if the fetches are fast.
    const MIN_MS = 2400;
    const elapsed = Date.now() - start;
    if (elapsed < MIN_MS) await new Promise((r) => setTimeout(r, MIN_MS - elapsed));

    setAudit({ rec, rate, ai });
    setPhase("dashboard");
  };

  if (phase === "running") {
    const steps = form.hasSolar
      ? ["Fetching your utility rate", "Running system diagnostics", "Assessing backup power needs", "Generating your AI briefing"]
      : ["Assessing backup power needs", form.hasBill ? "Fetching your utility rate" : "Reviewing your home profile", "Generating your AI briefing"];
    return <LoadingSequence steps={steps} />;
  }

  if (phase === "dashboard" && audit) {
    return (
      <main className="dashboard-main">
        <EnergyDashboard form={form} rec={audit.rec} rate={audit.rate} ai={audit.ai} />
      </main>
    );
  }

  return (
    <div className="audit-shell">
      <div className="audit-card">
        <BrandLockup />
        <h2>Whole-Home Energy Audit</h2>
        <p className="sub">
          Answer a few questions and we&apos;ll map out your backup-power and energy plan.
        </p>

        <HouseTypeStep hasSolar={form.hasSolar} onChange={set} />

        {solarChosen && (
          <>
            {form.hasSolar && (
              <div className="form-grid">
                <SolarFields values={form} onChange={set} />
              </div>
            )}

            <YesNo
              label="Do you still receive an electric bill?"
              help="Most homes do — even many with solar still pay for grid usage and connection charges."
              value={form.hasBill}
              yesText="Yes, I have a bill"
              noText="No bill"
              onYes={() => set({ hasBill: true })}
              onNo={() => set({ hasBill: false })}
            />

            {form.hasBill && (
              <div className="form-grid">
                <BillFields values={form} onChange={set} />
              </div>
            )}

            <div className="form-grid">
              <BackupFields values={form} onChange={set} />
            </div>

            <button className="submit-btn" onClick={runAudit} disabled={!canSubmit}>
              Run My Energy Audit →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
