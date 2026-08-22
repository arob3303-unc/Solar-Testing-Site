"use client";

// The home profile: size, occupancy, heating and the major electrical loads.
//
// Nothing here mentions outages. This form runs during a SOLAR assessment, and the
// field guide is explicit that backup does not come up until the tests are done — a
// "how often do you lose power?" question here tips the whole appointment early.
// The load list still drives generator sizing later; it is just asked as what the
// home runs, not as what would be lost.

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
      <div className="form-section">Your Home</div>

      <div className="form-group full">
        <label>Major electrical loads in the home</label>
        <div className="chip-group" role="group" aria-label="Major electrical loads">
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
        <div className="q-help">
          Large motors and heating elements are what drive equipment sizing later.
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

      {/* Always collected: drives the utility rate lookup, which two of the six
          diagnostic tests depend on. */}
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
