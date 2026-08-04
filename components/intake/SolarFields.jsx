"use client";

// Rendered only when hasSolar === true. Captures the details of the existing
// solar system so the audit can reason about how much of the bill remains and
// whether additional panels are worth recommending.

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
        <label>Solar Production (recent month, kWh)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 620"
          value={values.solarProduction}
          onChange={(e) => onChange({ solarProduction: e.target.value })}
        />
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

      {/* Asked only to score Backup Readiness honestly — a battery is NOT a product
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
