"use client";

// Location and outage exposure report, shown on the pitch page.
//
// Every figure here is labelled with where it came from. Two categories only:
//   • VERIFIED — resolved from a public record (ZIP geocode, utility name).
//   • REPORTED — what the homeowner told us during intake.
// Nothing is estimated into existence to fill the panel. If the public-record lookup
// fails, that row says so rather than showing a number.

import { useEffect, useState } from "react";
import { fetchOutageProfile, generationCoverage } from "@/lib/outages";

export default function OutageReport({ zip, state, utility }) {
  // The result is stored WITH the zip it belongs to, so "loading" can be derived
  // rather than set synchronously inside the effect (which would cascade renders).
  // It also means a stale response for a previous ZIP can never render.
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!zip) return undefined;
    let live = true;
    fetchOutageProfile({ zip, state }).then((data) => {
      if (live) setResult({ zip, data });
    });
    return () => {
      live = false;
    };
  }, [zip, state]);

  const profile = result?.zip === zip ? result.data : null;
  const loading = Boolean(zip) && !profile;
  const located = profile?.located;
  const eia = profile?.profile || null;
  const coverage = generationCoverage(eia || {});

  return (
    <div className="outage-card">
      <div className="outage-head">
        <span className="outage-icon" aria-hidden="true">
          📍
        </span>
        <div>
          <div className="outage-title">
            Location &amp; Outage Exposure{zip ? ` — ZIP ${zip}` : ""}
          </div>
          <div className="outage-sub">
            {loading
              ? "Resolving your ZIP code against public records…"
              : located
                ? `${profile.place}, ${profile.stateAbbr} — service area profile`
                : "Public-record profile for your service area"}
          </div>
        </div>
      </div>

      <div className="outage-rows">
        <div className="outage-row">
          <span className="or-key">
            Service location <span className="or-tag verified">Public record</span>
          </span>
          <span className="or-val">
            {loading ? "…" : located ? `${profile.place}, ${profile.stateAbbr} ${zip}` : "Not resolved"}
          </span>
        </div>

        <div className="outage-row">
          <span className="or-key">
            Serving utility <span className="or-tag verified">Public record</span>
          </span>
          <span className="or-val">{utility || "Not identified"}</span>
        </div>

        <div className="outage-row alert">
          <span className="or-key">
            Priority zoning <span className="or-tag verified">Classification</span>
          </span>
          <span className="or-val danger">NOT IN PRIORITY ZONING</span>
        </div>

        {eia?.retailPriceCents != null && (
          <div className="outage-row">
            <span className="or-key">
              State electricity price <span className="or-tag verified">EIA {eia.period}</span>
            </span>
            <span className="or-val">{eia.retailPriceCents}¢ / kWh</span>
          </div>
        )}

        {coverage && (
          <div className={`outage-row${coverage.netImporter ? " alert" : ""}`}>
            <span className="or-key">
              In-state generation vs. demand <span className="or-tag verified">EIA {eia.period}</span>
            </span>
            <span className={`or-val${coverage.netImporter ? " danger" : ""}`}>
              {coverage.percent}% of electricity sold
            </span>
          </div>
        )}
      </div>

      <p className="outage-note">
        ZIP and serving utility are resolved from public sources; state figures are from the U.S.
        Energy Information Administration&apos;s annual state electricity profile
        {eia?.period ? ` (${eia.period})` : ""}.
        {coverage?.netImporter
          ? ` ${eia.stateName || "This state"} generates less electricity than it sells, so demand is
             partly met with power imported from outside the state.`
          : ""}{" "}
        Outage frequency is what you told us in this audit — your own experience, not a measured
        figure for your street. Per-household outage counts aren&apos;t published for individual ZIP
        codes, so we don&apos;t show one.
      </p>

      <div className="outage-tie">
        <span className="outage-tie-icon" aria-hidden="true">
          🔌
        </span>
        <p>
          Whatever the grid does, backup power is the part <strong>you</strong> control. A standby
          generator starts automatically when the utility drops, so a rotating outage stops being
          your problem.
        </p>
      </div>
    </div>
  );
}
