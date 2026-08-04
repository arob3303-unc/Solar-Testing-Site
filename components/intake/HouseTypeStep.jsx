"use client";

// Step 1 of the intake — the primary branch: does the home already have solar?
// This choice reveals the option-specific questions (SolarFields for solar homes;
// the bill question + BillFields; BackupFields for everyone). hasSolar + hasBill
// still drive the recommendation via lib/recommendation.js.

export function YesNo({ label, help, value, onYes, onNo, yesText = "Yes", noText = "No" }) {
  return (
    <div className="question-block">
      <label>{label}</label>
      <div className="radio-group" role="radiogroup" aria-label={label}>
        <div
          className={`radio-btn ${value === true ? "active" : ""}`}
          role="radio"
          aria-checked={value === true}
          tabIndex={0}
          onClick={onYes}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onYes()}
        >
          {yesText}
        </div>
        <div
          className={`radio-btn ${value === false ? "active" : ""}`}
          role="radio"
          aria-checked={value === false}
          tabIndex={0}
          onClick={onNo}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNo()}
        >
          {noText}
        </div>
      </div>
      {help && <p className="q-help">{help}</p>}
    </div>
  );
}

// The big solar/no-solar branch selector shown at the top of the audit.
export default function HouseTypeStep({ hasSolar, onChange }) {
  const options = [
    { value: true, icon: "☀️", title: "Already have solar", sub: "Solar Audit" },
    { value: false, icon: "🏠", title: "No solar", sub: "Non-Solar Audit" },
  ];
  return (
    <div className="question-block">
      <label>Do you already have solar?</label>
      <div className="branch-group" role="radiogroup" aria-label="Do you already have solar?">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className={`branch-btn ${hasSolar === o.value ? "active" : ""}`}
            role="radio"
            aria-checked={hasSolar === o.value}
            onClick={() => onChange({ hasSolar: o.value })}
          >
            <span className="branch-icon">{o.icon}</span>
            <span className="branch-title">{o.title}</span>
            <span className="branch-sub">{o.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
