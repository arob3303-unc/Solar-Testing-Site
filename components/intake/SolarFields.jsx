"use client";

// Every home reaching this audit already owns a system, so these fields always
// render. They feed lib/diagnostics.js directly: system size and install year are
// what make the production and degradation checks real measurements rather than
// decoration, so an empty field costs a test row.

const INVERTERS = ["SolarEdge", "Enphase", "Micro Inverters", "Other"];

export default function SolarFields({ values, onChange }) {
  return (
    <>
      <div className="form-section">Your Existing Solar System</div>

      <div className="form-group">
        <label>Number of Panels</label>
        <input
          type="number"
          min="1"
          max="100"
          placeholder="e.g. 24"
          value={values.panels}
          onChange={(e) => onChange({ panels: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>System Size (kW)</label>
        <input
          type="number"
          step="0.1"
          placeholder="e.g. 8.4"
          value={values.systemkw}
          onChange={(e) => onChange({ systemkw: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Average Monthly Production (kWh)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 830"
          value={values.solarProduction}
          onChange={(e) => onChange({ solarProduction: e.target.value })}
        />
        {/* An AVERAGE month, not last month. Production swings roughly plus or minus
            35% with the season, so a December reading scored against a year-round
            benchmark would fail a perfectly healthy array. */}
        <div className="q-help">
          Annual total divided by 12, from their monitoring app. Not last month — a
          winter reading would fail a healthy system.
        </div>
      </div>

      <div className="form-group">
        <label>Year Installed</label>
        <input
          type="number"
          min="2000"
          max="2026"
          placeholder="e.g. 2020"
          value={values.installDate}
          onChange={(e) => onChange({ installDate: e.target.value })}
        />
      </div>

      <div className="form-group full">
        <label>Inverter Brand</label>
        <div className="radio-group" role="radiogroup" aria-label="Inverter brand">
          {INVERTERS.map((brand) => (
            <div
              key={brand}
              className={`radio-btn ${values.inverter === brand ? "active" : ""}`}
              role="radio"
              aria-checked={values.inverter === brand}
              tabIndex={0}
              onClick={() => onChange({ inverter: brand })}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange({ inverter: brand })}
            >
              {brand}
            </div>
          ))}
        </div>
      </div>

      {/* Asked only to score the Backup Unit check honestly — a battery is NOT a product
          we sell or recommend, and this never reaches the AI prompt. */}
      <div className="form-group full">
        <label>Do you have a solar backup battery?</label>
        <div className="radio-group" role="radiogroup" aria-label="Solar backup battery">
          {[
            { text: "No battery", val: false },
            { text: "Yes, I have a battery", val: true },
          ].map((opt) => (
            <div
              key={opt.text}
              className={`radio-btn ${values.hasBattery === opt.val ? "active" : ""}`}
              role="radio"
              aria-checked={values.hasBattery === opt.val}
              tabIndex={0}
              onClick={() => onChange({ hasBattery: opt.val })}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange({ hasBattery: opt.val })}
            >
              {opt.text}
            </div>
          ))}
        </div>
        <div className="q-help">
          A battery covers a few circuits for a few hours — it isn&apos;t whole-home standby power.
        </div>
      </div>

      {/* Confirming there is no existing backup is a step in the field guide, and it
          is the only input the Backup Unit check has. Asked plainly, scored honestly. */}
      <div className="form-group full">
        <label>Is there already a standby generator on the property?</label>
        <div className="radio-group" role="radiogroup" aria-label="Existing standby generator">
          {[
            { text: "No standby generator", val: false },
            { text: "Yes, one is installed", val: true },
          ].map((opt) => (
            <div
              key={opt.text}
              className={`radio-btn ${values.hasStandby === opt.val ? "active" : ""}`}
              role="radio"
              aria-checked={values.hasStandby === opt.val}
              tabIndex={0}
              onClick={() => onChange({ hasStandby: opt.val })}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange({ hasStandby: opt.val })}
            >
              {opt.text}
            </div>
          ))}
        </div>
        <div className="q-help">
          Look for a unit on a pad, an automatic transfer switch, or a propane tank serving the home.
        </div>
      </div>

      <div className="form-group full">
        <label>Solar Installer (optional)</label>
        <input
          type="text"
          placeholder="e.g. SunPower, local company…"
          value={values.installer}
          onChange={(e) => onChange({ installer: e.target.value })}
        />
      </div>
    </>
  );
}
