"use client";

// Always rendered — every home on a utility gets a bill. Utility + location feed the live rate
// lookup (/api/rates); kWh and $ anchor the bill-elimination math.

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
];

export default function BillFields({ values, onChange }) {
  return (
    <>
      <div className="form-section">Your Electric Bill</div>

      <div className="form-group">
        <label>Utility Company</label>
        <input
          type="text"
          placeholder="e.g. PG&amp;E, Duke Energy"
          value={values.utility}
          onChange={(e) => onChange({ utility: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>State</label>
        <select value={values.state} onChange={(e) => onChange({ state: e.target.value })}>
          <option value="">Select state…</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ZIP moved to BackupFields — it's needed for the location/outage report on
          every audit, including homes with no bill. */}

      <div className="form-group">
        <label>Avg. Monthly Bill ($)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 180"
          value={values.bill}
          onChange={(e) => onChange({ bill: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Monthly Usage (kWh)</label>
        <input
          type="number"
          min="0"
          placeholder="e.g. 850"
          value={values.utilityKwh}
          onChange={(e) => onChange({ utilityKwh: e.target.value })}
        />
      </div>
    </>
  );
}
