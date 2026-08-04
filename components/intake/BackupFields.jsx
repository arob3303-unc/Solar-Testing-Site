"use client";

// Always rendered. Captures the resilience side of the audit — how badly an
// outage would hurt, and what has to stay on — which drives generator sizing
// and the backup-power pitch (recommended in every report).

const OUTAGE_LEVELS = ["Rare", "Occasional", "Frequent"];
const HEAT_TYPES = ["Gas", "Electric"];
const CRITICAL_LOADS = [
  "Refrigerator / Freezer",
  "Well Pump",
  "Sump Pump",
  "Medical Equipment",
  "HVAC (Heat / AC)",
  "Home Office / Internet",
  "Electric Range",
];

export default function BackupFields({ values, onChange }) {
  const toggleLoad = (load) => {
    const next = new Set(values.criticalLoads);
    next.has(load) ? next.delete(load) : next.add(load);
    onChange({ criticalLoads: [...next] });
  };

  return (
    <>
      <div className="form-section">Backup Power Needs</div>

      <div className="form-group full">
        <label>How often do you lose power?</label>
        <div className="radio-group" role="radiogroup" aria-label="Outage frequency">
          {OUTAGE_LEVELS.map((level) => (
            <div
              key={level}
              className={`radio-btn ${values.outage === level ? "active" : ""}`}
              role="radio"
              aria-checked={values.outage === level}
              tabIndex={0}
              onClick={() => onChange({ outage: level })}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange({ outage: level })}
            >
              {level}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group full">
        <label>What must stay on during an outage?</label>
        <div className="chip-group" role="group" aria-label="Critical loads">
          {CRITICAL_LOADS.map((load) => (
            <div
              key={load}
              className={`chip ${values.criticalLoads.includes(load) ? "active" : ""}`}
              role="checkbox"
              aria-checked={values.criticalLoads.includes(load)}
              tabIndex={0}
              onClick={() => toggleLoad(load)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleLoad(load)}
            >
              {load}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>People in Household</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 4"
          value={values.occupants}
          onChange={(e) => onChange({ occupants: e.target.value })}
        />
      </div>

      {/* Always collected: drives the location & outage-exposure report and the
          utility rate lookup, both of which apply whether or not there's a bill. */}
      <div className="form-group">
        <label>ZIP Code</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          placeholder="e.g. 90210"
          value={values.zip}
          onChange={(e) => onChange({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
        />
      </div>

      <div className="form-group">
        <label>Home Size (sq. ft.)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 2200"
          value={values.sqft}
          onChange={(e) => onChange({ sqft: e.target.value })}
        />
      </div>

      <div className="form-group full">
        <label>Primary Heating Type</label>
        <div className="radio-group" role="radiogroup" aria-label="Heating type">
          {HEAT_TYPES.map((h) => (
            <div
              key={h}
              className={`radio-btn ${values.heatType === h ? "active" : ""}`}
              role="radio"
              aria-checked={values.heatType === h}
              tabIndex={0}
              onClick={() => onChange({ heatType: h })}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange({ heatType: h })}
            >
              {h} Heat
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
