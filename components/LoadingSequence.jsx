"use client";

// The "running diagnostics" reveal between submitting the intake and showing the
// dashboard. Purely visual — it ticks through steps while rates + the AI briefing
// are fetched in the background.

import { useEffect, useState } from "react";

export default function LoadingSequence({ steps }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= steps.length - 1) return;
    const id = setTimeout(() => setActive((a) => a + 1), 700);
    return () => clearTimeout(id);
  }, [active, steps.length]);

  return (
    <div className="loading-shell">
      <div className="loading-card">
        <div className="loading-spinner" />
        <h2>Running your energy audit…</h2>
        <ul className="loading-steps">
          {steps.map((label, i) => (
            <li key={label} className={i < active ? "done" : i === active ? "active" : ""}>
              <span className="ls-mark">{i < active ? "✓" : i === active ? "•" : ""}</span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
