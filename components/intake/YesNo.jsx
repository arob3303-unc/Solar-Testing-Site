"use client";

// Two-option radio group. Extracted from the old HouseTypeStep when the solar /
// no-solar branch was removed — the branch selector went, this widget stayed.

export default function YesNo({ label, help, value, onYes, onNo, yesText = "Yes", noText = "No" }) {
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
