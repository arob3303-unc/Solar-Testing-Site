"use client";

// Rolling blackouts, visualized: utilities shed load by rotating outages through
// geographic zones — one zone dark at a time, on a schedule the homeowner doesn't
// control. Pairs with DatacenterBlackouts.jsx (the "why a generator" section):
// that one argues the grid is getting tighter, this one shows what that looks like
// on your street.
//
// Unlike the rest of the dashboard, this component carries its own <style> block
// instead of living in app/globals.css — it was specced as a self-contained,
// drop-anywhere card. All classes are `rbd-` prefixed to stay out of the way.
//
// Theming note: the page is dark-only today, so keying colors off
// prefers-color-scheme would put a light component on a dark page. Everything here
// derives from currentColor via color-mix() (plain-rgba fallbacks declared first),
// so it adapts to whatever the page actually is.

import { useEffect, useRef, useState } from "react";

const HOUSES_PER_ZONE = 3;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function Bolt({ slashed = false }) {
  return (
    <svg className="rbd-bolt" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      <path
        d="M6.9 1 3 6.6h2.3L5 11l3.9-5.6H6.6L6.9 1Z"
        fill={slashed ? "none" : "currentColor"}
        stroke="currentColor"
        strokeWidth={slashed ? 1 : 0.6}
        strokeLinejoin="round"
      />
      {slashed && <line x1="1.6" y1="10.4" x2="10.4" y2="1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  );
}

// One neighborhood house. Windows carry the lit/unlit signal; the `is-off` class on
// the parent panel repaints them (see the stylesheet below).
function House({ x }) {
  return (
    <g transform={`translate(${x},0)`}>
      <polygon className="rbd-roof" points="16,2 33,15 -1,15" />
      <rect className="rbd-body" x="3" y="15" width="26" height="21" rx="2" />
      <rect className="rbd-win" x="7" y="19" width="6.5" height="6.5" rx="1" />
      <rect className="rbd-win" x="18.5" y="19" width="6.5" height="6.5" rx="1" />
      <rect className="rbd-door" x="12.5" y="28" width="7" height="8" rx="1" />
    </g>
  );
}

export default function RollingBlackoutDiagram({ zoneCount = 5, cycleMs = 2500, zip = "" }) {
  const count = Math.max(2, Math.min(Math.round(Number(zoneCount) || 5), ALPHABET.length));
  const cycle = Math.max(400, Math.round(Number(cycleMs) || 2500));

  const [activeZone, setActiveZone] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const liveRef = useRef(null);

  // Modulo-guard so a shrinking zoneCount can never leave the index out of range.
  const active = activeZone % count;
  const zones = Array.from({ length: count }, (_, i) => ALPHABET[i]);
  const animating = playing && !reducedMotion;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // `activeZone` is in the deps on purpose: a click should restart the dwell timer
  // rather than inherit the leftover remainder of the current tick.
  useEffect(() => {
    if (!animating) return undefined;
    const id = setInterval(() => setActiveZone((z) => (z + 1) % count), cycle);
    return () => clearInterval(id);
  }, [animating, count, cycle, activeZone]);

  const step = () => setActiveZone((z) => (z + 1) % count);

  return (
    <div className="rbd">
      <style>{RBD_CSS}</style>

      <div className="rbd-head">
        <div className="rbd-title">How a Rolling Blackout Moves</div>
        <button
          type="button"
          className="rbd-btn"
          onClick={reducedMotion ? step : () => setPlaying((p) => !p)}
          aria-label={
            reducedMotion
              ? "Advance the blackout to the next zone"
              : playing
                ? "Pause the rolling blackout animation"
                : "Play the rolling blackout animation"
          }
        >
          {reducedMotion ? "Next zone ›" : playing ? "❚❚ Pause" : "▶ Play"}
        </button>
      </div>

      {/* Priority zoning is a real utility concept: during load shedding, circuits
          feeding hospitals, emergency services and other critical infrastructure are
          excluded from rotation. Residential service is not — which is the whole
          point of this diagram. Stated as a classification, not a database lookup. */}
      <div className="rbd-zoning" role="note">
        <span className="rbd-zoning-icon" aria-hidden="true">
          ⚠
        </span>
        <div>
          <div className="rbd-zoning-head">
            {zip ? `ZIP code ${zip} ` : "This ZIP code "}
            <strong>NOT LOCATED IN PRIORITY ZONING</strong>
          </div>
          <div className="rbd-zoning-sub">
            Priority circuits are reserved for hospitals, emergency services and critical
            infrastructure. Residential neighborhoods are not protected from rotating outages.
          </div>
        </div>
      </div>

      {/* Full-width on its own row so it reads as one line on a dashboard-width card
          instead of wrapping beside the Play button. Still wraps freely on mobile. */}
      <p className="rbd-caption">
        When demand outpaces supply, utilities rotate outages across zones — your
        neighborhood&apos;s turn comes on a schedule you don&apos;t control.
      </p>

      <div className="rbd-grid">
        {zones.map((label, i) => {
          const off = i === active;
          return (
            <button
              type="button"
              key={label}
              className={`rbd-zone ${off ? "is-off" : "is-on"}`}
              onClick={() => setActiveZone(i)}
              aria-pressed={off}
              aria-label={`Zone ${label} — ${off ? "blacked out" : "powered"}. Select to move the outage to this zone.`}
            >
              <span className="rbd-zone-name">Zone {label}</span>
              <svg className="rbd-houses" viewBox="0 0 116 38" aria-hidden="true">
                {Array.from({ length: HOUSES_PER_ZONE }, (_, h) => (
                  <House key={h} x={5 + h * 38} />
                ))}
              </svg>
              <span className="rbd-tag">
                <Bolt slashed={off} />
                {off ? "Power off" : "Powered"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rbd-seq" aria-hidden="true">
        {zones.map((label, i) => (
          <span key={label} className="rbd-seq-item">
            <span className={`rbd-seq-dot ${i === active ? "is-current" : ""}`}>{label}</span>
            {i < count - 1 && <span className="rbd-seq-arrow">→</span>}
          </span>
        ))}
        <span className="rbd-seq-loop">↺</span>
      </div>

      {!reducedMotion && (
        <div className="rbd-progress" aria-hidden="true">
          <div
            key={`${active}-${playing}`}
            className={`rbd-progress-fill ${animating ? "is-running" : ""}`}
            style={{ animationDuration: `${cycle}ms` }}
          />
        </div>
      )}

      <div className="rbd-foot">
        <div className="rbd-legend">
          <span className="rbd-legend-item">
            <span className="rbd-swatch is-on" aria-hidden="true" />
            <Bolt />
            Powered
          </span>
          <span className="rbd-legend-item">
            <span className="rbd-swatch is-off" aria-hidden="true" />
            <Bolt slashed />
            Blacked out
          </span>
        </div>
        <p
          className="rbd-status"
          ref={liveRef}
          // Announcing every 2.5s during autoplay would make this unusable with a
          // screen reader — only speak deliberate, user-driven changes.
          aria-live={animating ? "off" : "polite"}
        >
          Currently blacked out: <strong>Zone {zones[active]}</strong> — every other zone
          still has power.
        </p>
      </div>

      <p className="rbd-note">
        Load shedding is standard grid management, not a malfunction: rotating the
        outage keeps the whole system from collapsing. Backup power doesn&apos;t change
        the schedule — it makes your turn a non-event.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scoped styles. Fallback rgba values are declared first, then overridden by
   color-mix() where supported, so the component tracks the page's text color
   instead of the OS color scheme.
   ───────────────────────────────────────────────────────────────────────────── */
const RBD_CSS = `
.rbd {
  --rbd-line: rgba(128,138,157,0.34);
  --rbd-line: color-mix(in srgb, currentColor 24%, transparent);
  --rbd-surface: rgba(128,138,157,0.10);
  --rbd-surface: color-mix(in srgb, currentColor 7%, transparent);
  --rbd-muted: #808896;
  --rbd-muted: color-mix(in srgb, currentColor 62%, transparent);
  --rbd-lit: #f59e0b;
  --rbd-off: #ef4444;
  background: transparent;
  color: inherit;
  font-family: inherit;
  container-type: inline-size;
}
.rbd *, .rbd *::before, .rbd *::after { box-sizing: border-box; }

.rbd-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 0.4rem;
}
.rbd-title { font-size: 0.95rem; font-weight: 700; letter-spacing: -0.1px; }
/* Priority-zoning banner — the loudest thing in the card by design. */
.rbd-zoning {
  display: flex; align-items: flex-start; gap: 0.7rem;
  border: 1px solid rgba(239, 68, 68, 0.55); border-left-width: 4px;
  background: rgba(239, 68, 68, 0.10);
  border-radius: 10px; padding: 0.75rem 0.95rem; margin-bottom: 0.9rem;
}
.rbd-zoning-icon { color: var(--rbd-off); font-size: 1.05rem; line-height: 1.3; flex-shrink: 0; }
.rbd-zoning-head {
  font-size: 0.86rem; line-height: 1.45; color: inherit;
  text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600;
}
.rbd-zoning-head strong { color: var(--rbd-off); font-weight: 800; letter-spacing: 0.6px; }
.rbd-zoning-sub { font-size: 0.75rem; line-height: 1.55; color: var(--rbd-muted); margin-top: 0.3rem; }

/* No max-width: the caption owns the full card width so it sets on one line. */
.rbd-caption {
  font-size: 0.79rem; line-height: 1.55; color: var(--rbd-muted);
  margin: 0 0 1.1rem;
}

.rbd-btn {
  flex-shrink: 0; padding: 7px 14px; border-radius: 999px;
  border: 1px solid var(--rbd-line); background: var(--rbd-surface);
  color: inherit; font-family: inherit; font-size: 0.76rem; font-weight: 600;
  cursor: pointer; white-space: nowrap; letter-spacing: 0.2px;
}
.rbd-btn:hover { border-color: var(--rbd-lit); color: var(--rbd-lit); }
.rbd-btn:focus-visible { outline: 2px solid var(--rbd-lit); outline-offset: 2px; }

/* ── Zone map ── */
.rbd-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  gap: 0.6rem;
}
.rbd-zone {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
  padding: 0.75rem 0.5rem 0.65rem;
  border: 1px solid var(--rbd-line); border-radius: 12px;
  background: var(--rbd-surface); color: inherit;
  font-family: inherit; cursor: pointer; text-align: center;
}
.rbd-zone:focus-visible { outline: 2px solid var(--rbd-lit); outline-offset: 2px; }
.rbd-zone.is-on {
  border-color: rgba(245,158,11,0.40);
  background: rgba(245,158,11,0.07);
}
.rbd-zone.is-on:hover { border-color: rgba(245,158,11,0.75); }

/* Off state stacks five independent cues — dashed border, hatch overlay, dimmed
   contents, unlit windows, and a literal text label — so it never reads by color
   alone, and stays legible on a light or a dark page. */
.rbd-zone.is-off {
  border-style: dashed; border-color: rgba(239,68,68,0.55);
  background: var(--rbd-surface);
}
.rbd-zone.is-off::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(
    45deg, transparent 0 5px, rgba(128,138,157,0.16) 5px 6px
  );
}
.rbd-zone.is-off .rbd-houses { opacity: 0.45; }
.rbd-zone.is-off .rbd-zone-name { opacity: 0.6; }

.rbd-zone-name {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;
  color: var(--rbd-muted);
}
.rbd-houses { width: 100%; height: auto; max-width: 116px; display: block; }

.rbd-roof { fill: currentColor; opacity: 0.30; }
.rbd-body { fill: currentColor; opacity: 0.13; stroke: currentColor; stroke-opacity: 0.25; stroke-width: 0.8; }
.rbd-door { fill: currentColor; opacity: 0.22; }
.rbd-win { fill: var(--rbd-lit); stroke: none; filter: drop-shadow(0 0 3px rgba(245,158,11,0.85)); }
.rbd-zone.is-off .rbd-win {
  fill: none; filter: none;
  stroke: currentColor; stroke-opacity: 0.5; stroke-width: 0.9; stroke-dasharray: 2 1.6;
}

.rbd-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.2px;
  color: var(--rbd-muted);
}
.rbd-zone.is-off .rbd-tag { color: inherit; font-weight: 700; }
.rbd-bolt { flex-shrink: 0; }
.rbd-zone.is-on .rbd-bolt { color: var(--rbd-lit); }
.rbd-zone.is-off .rbd-bolt { color: var(--rbd-off); }

/* ── Rotation order ── */
.rbd-seq {
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
  gap: 0.15rem; margin-top: 0.95rem;
}
.rbd-seq-item { display: inline-flex; align-items: center; gap: 0.15rem; }
.rbd-seq-dot {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 50%;
  border: 1px solid var(--rbd-line); color: var(--rbd-muted);
  font-size: 0.65rem; font-weight: 700;
}
.rbd-seq-dot.is-current {
  border-color: var(--rbd-off); color: var(--rbd-off);
  background: rgba(239,68,68,0.12);
}
.rbd-seq-arrow, .rbd-seq-loop { color: var(--rbd-muted); font-size: 0.7rem; opacity: 0.7; }
.rbd-seq-loop { margin-left: 0.3rem; }

.rbd-progress {
  height: 3px; border-radius: 3px; overflow: hidden;
  background: var(--rbd-surface); margin-top: 0.6rem;
}
.rbd-progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, var(--rbd-lit), var(--rbd-off));
  transform: scaleX(0); transform-origin: left;
}
.rbd-progress-fill.is-running { animation: rbd-fill linear forwards; }
@keyframes rbd-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* ── Legend + status ── */
.rbd-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; flex-wrap: wrap; margin-top: 0.95rem;
}
.rbd-legend { display: flex; gap: 1rem; flex-wrap: wrap; }
.rbd-legend-item {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.72rem; color: var(--rbd-muted);
}
.rbd-legend-item .rbd-bolt { color: var(--rbd-lit); }
.rbd-legend-item:last-child .rbd-bolt { color: var(--rbd-off); }
.rbd-swatch { width: 11px; height: 11px; border-radius: 3px; border: 1px solid var(--rbd-line); }
.rbd-swatch.is-on { background: rgba(245,158,11,0.30); border-color: rgba(245,158,11,0.6); }
.rbd-swatch.is-off {
  border-style: dashed; border-color: rgba(239,68,68,0.6);
  background: repeating-linear-gradient(45deg, transparent 0 3px, rgba(128,138,157,0.35) 3px 4px);
}
.rbd-status { font-size: 0.75rem; color: var(--rbd-muted); margin: 0; }
.rbd-status strong { color: inherit; font-weight: 700; }

.rbd-note {
  font-size: 0.73rem; line-height: 1.6; color: var(--rbd-muted);
  margin: 0.85rem 0 0; padding-top: 0.75rem; border-top: 1px solid var(--rbd-line);
}

@media (prefers-reduced-motion: no-preference) {
  .rbd-zone, .rbd-btn, .rbd-win, .rbd-seq-dot {
    transition: background 0.35s ease, border-color 0.35s ease, color 0.35s ease,
                fill 0.35s ease, opacity 0.35s ease, filter 0.35s ease;
  }
}
@media (pointer: coarse) {
  /* Comfortable tap target for Play/Pause, and no sticky hover state after a tap. */
  .rbd-btn { min-height: 44px; padding: 10px 18px; }
  .rbd-btn:hover { border-color: var(--rbd-line); color: inherit; }
  .rbd-zone { padding-top: 0.9rem; padding-bottom: 0.8rem; }
}
@container (max-width: 380px) {
  .rbd-grid { grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); }
  .rbd-foot { flex-direction: column; align-items: flex-start; }
}
`;
