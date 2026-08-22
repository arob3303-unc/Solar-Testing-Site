"use client";

// Dynamic SVG of the home, drawn on the light theme.
//
// Every home reaching the audit has solar, so the panels always render, scaled to
// the entered count. The standby generator is opt-in via `showGenerator`: it belongs
// on the pitch page, not on the neutral assessment, where a unit sitting beside the
// house would be pitching before the homeowner has agreed there is a problem.
//
// No brand name is drawn on the unit — the offer is generic by design.

const INK = "#0c1f16";
const BRAND = "#0b4d2c";
const GOLD = "#a67c00";
const PAPER = "#f4f2ec";
const LINE = "#d8d2c4";
const PANEL = "#123a5c";

function panelRects(count) {
  const n = Math.max(0, Math.min(Number(count) || 0, 18));
  if (!n) return [];
  const cols = Math.min(n, 6);
  const pW = 22, pH = 11, gapX = 4, gapY = 6;
  const totalW = cols * pW + (cols - 1) * gapX;
  const startX = 150 - totalW / 2;
  const startY = 42;
  return Array.from({ length: n }, (_, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    return {
      x: startX + col * (pW + gapX),
      y: startY + row * (pH + gapY),
      w: pW,
      h: pH,
    };
  });
}

export default function HouseSvg({ panels = 0, productionKwh = 0, showGenerator = false }) {
  const rects = panelRects(panels);
  const perDay = productionKwh ? Math.round(productionKwh / 30) : null;

  return (
    <svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your home and solar array">
      <rect width="300" height="200" fill={PAPER} rx="10" />
      <rect x="0" y="155" width="300" height="45" fill="#e7e3d8" />

      {/* sun */}
      <circle cx="255" cy="30" r="14" fill={GOLD} opacity="0.85" />
      <g stroke={GOLD} strokeWidth="1.5" opacity="0.55">
        <line x1="255" y1="10" x2="255" y2="5" />
        <line x1="255" y1="50" x2="255" y2="55" />
        <line x1="235" y1="30" x2="230" y2="30" />
      </g>

      {/* house body + roof */}
      <rect x="60" y="95" width="180" height="70" fill="#ffffff" stroke={LINE} strokeWidth="1.5" rx="3" />
      <polygon points="40,98 150,30 260,98" fill="#e2ded1" stroke={LINE} strokeWidth="1.5" />
      {/* door + windows */}
      <rect x="128" y="125" width="28" height="40" fill={INK} opacity="0.82" rx="2" />
      <circle cx="153" cy="147" r="2.5" fill={GOLD} />
      <rect x="75" y="110" width="30" height="22" fill="#cfe0d6" stroke={LINE} strokeWidth="1" rx="2" />
      <rect x="195" y="110" width="30" height="22" fill="#cfe0d6" stroke={LINE} strokeWidth="1" rx="2" />

      {/* solar array */}
      <g>
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx="1.5" fill={PANEL} stroke={BRAND} strokeWidth="0.75" />
        ))}
      </g>

      {showGenerator && (
        <g>
          <line x1="240" y1="168" x2="252" y2="168" stroke={BRAND} strokeWidth="1.4" strokeDasharray="3,2">
            <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1s" repeatCount="indefinite" />
          </line>
          <rect x="252" y="158" width="40" height="26" rx="4" fill="#ffffff" stroke={BRAND} strokeWidth="1.2" />
          <rect x="256" y="162" width="32" height="6" rx="1" fill={PAPER} stroke={LINE} strokeWidth="0.5" />
          <circle cx="288" cy="156" r="2.5" fill={BRAND}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text x="272" y="180" textAnchor="middle" fill={BRAND} fontSize="6.5" fontFamily="sans-serif" fontWeight="700">
            22 kW
          </text>
        </g>
      )}

      {/* status badge */}
      <rect x="8" y="10" width="92" height="30" fill="#e9f1ec" stroke="#b9d3c3" strokeWidth="0.75" rx="4" />
      <text x="54" y="23" textAnchor="middle" fill={BRAND} fontSize="7.5" fontFamily="sans-serif" fontWeight="700">
        {showGenerator ? "PRODUCING + BACKUP" : "PRODUCING"}
      </text>
      <text x="54" y="35" textAnchor="middle" fill={BRAND} fontSize="9" fontFamily="sans-serif">
        {perDay != null ? `${perDay} kWh/day` : "Solar active"}
      </text>
    </svg>
  );
}
