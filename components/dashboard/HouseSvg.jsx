"use client";

// Ported from the legacy dynamic SVG house. Reframed for the new pitch:
//  • the "No Battery" warning is GONE (that product no longer exists),
//  • a Generac standby generator now sits beside the house (recommended in every report),
//  • solar panels still render on the roof, scaled to the entered panel count.

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

export default function HouseSvg({ hasSolar, panels = 0, productionKwh = 0 }) {
  const rects = hasSolar ? panelRects(panels) : [];
  const perDay = productionKwh ? Math.round(productionKwh / 30) : null;

  return (
    <svg viewBox="0 0 300 200" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#0d1117" rx="10" />
      <rect x="0" y="155" width="300" height="45" fill="#161b22" />
      {/* house body + roof */}
      <rect x="60" y="95" width="180" height="70" fill="#1e2430" stroke="#2a3040" strokeWidth="1.5" rx="3" />
      <polygon points="40,98 150,30 260,98" fill="#1a2035" stroke="#2a3540" strokeWidth="1.5" />
      {/* door + windows */}
      <rect x="128" y="125" width="28" height="40" fill="#0f1520" stroke="#2a3040" strokeWidth="1" rx="2" />
      <circle cx="153" cy="147" r="2.5" fill="#3b4a60" />
      <rect x="75" y="110" width="30" height="22" fill="#0f1520" stroke="#2a3040" strokeWidth="1" rx="2" />
      <rect x="195" y="110" width="30" height="22" fill="#0f1520" stroke="#2a3040" strokeWidth="1" rx="2" />

      {/* solar panels (solar homes only) */}
      <g>
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx="1.5"
            fill="#1a3a5c"
            stroke="#00d4aa"
            strokeWidth="0.75"
          />
        ))}
      </g>

      {/* sun — solar homes only; on a non-solar audit it's the last thing on the
          page implying a solar system the customer doesn't have */}
      {hasSolar && (
        <>
          <circle cx="255" cy="30" r="14" fill="#f59e0b" opacity="0.9" />
          <g stroke="#f59e0b" strokeWidth="1.5" opacity="0.5">
            <line x1="255" y1="10" x2="255" y2="5" />
            <line x1="255" y1="50" x2="255" y2="55" />
            <line x1="235" y1="30" x2="230" y2="30" />
          </g>
        </>
      )}

      {/* Generac standby generator on the ground, tied to the house */}
      <g>
        <line x1="240" y1="168" x2="252" y2="168" stroke="#00d4aa" strokeWidth="1.2" strokeDasharray="3,2">
          <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1s" repeatCount="indefinite" />
        </line>
        <rect x="252" y="158" width="40" height="26" rx="4" fill="#12202b" stroke="#00d4aa" strokeWidth="1" />
        <rect x="256" y="162" width="32" height="6" rx="1" fill="#0d1720" stroke="#22394a" strokeWidth="0.5" />
        <circle cx="288" cy="156" r="2.5" fill="#00d4aa">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <text x="272" y="180" textAnchor="middle" fill="#00d4aa" fontSize="6.5" fontFamily="sans-serif" fontWeight="700">
          GENERAC
        </text>
      </g>

      {/* status badge */}
      <rect x="8" y="10" width="86" height="30" fill="rgba(0,212,170,0.08)" stroke="rgba(0,212,170,0.25)" strokeWidth="0.75" rx="4" />
      <text x="51" y="23" textAnchor="middle" fill="#00d4aa" fontSize="7.5" fontFamily="sans-serif" fontWeight="600">
        {hasSolar ? "PRODUCING + BACKUP" : "BACKUP READY"}
      </text>
      <text x="51" y="35" textAnchor="middle" fill="#00d4aa" fontSize="9" fontFamily="sans-serif">
        {perDay != null ? `${perDay} kWh/day` : "Standby power"}
      </text>
    </svg>
  );
}
