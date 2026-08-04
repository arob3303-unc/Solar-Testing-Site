"use client";

// Renders the AI report returned by /api/analyze. Product decisions come from the
// authoritative `rec` (never the model). Degrades gracefully: if the report is
// missing or errored, we show a clean message instead of crashing the dashboard.

import { PRODUCT_LABELS, PRODUCTS } from "@/lib/recommendation";

// Split "**Heading**\n body…" markdown into blocks, mirroring the legacy renderer.
function parseReport(text) {
  const headingRe = /^\s*\*\*(.+?)\*\*\s*:?\s*$/;
  const blocks = [];
  let current = null;
  for (const raw of String(text).split("\n")) {
    const line = raw.trim();
    const h = line.match(headingRe);
    if (h) {
      current = { title: h[1].trim(), body: [] };
      blocks.push(current);
    } else if (line) {
      if (!current) {
        current = { title: "", body: [] };
        blocks.push(current);
      }
      current.body.push(line);
    }
  }
  return blocks;
}

// Inline **bold** → <strong>, safely (React escapes text nodes for us).
function Inline({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\*\*[^*]+\*\*$/.test(p) ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
      )}
    </>
  );
}

function ReportBlocks({ text }) {
  const blocks = parseReport(text);
  return (
    <div className="ai-report">
      {blocks.map((b, i) => (
        <div className="ai-block" key={i}>
          {b.title && <div className="ai-block-head">{b.title}</div>}
          {b.body.map((line, j) =>
            /^[-*•]\s+/.test(line) ? (
              <ul key={j}>
                <li>
                  <Inline text={line.replace(/^[-*•]\s+/, "")} />
                </li>
              </ul>
            ) : (
              <p key={j}>
                <Inline text={line} />
              </p>
            )
          )}
        </div>
      ))}
    </div>
  );
}

export default function AiAudit({ rec, report, error, loading }) {
  const panels = rec?.products?.includes(PRODUCTS.PANELS);

  return (
    <div className="ai-panel">
      <div className="ai-header">
        <div className="ai-icon">🤖</div>
        <div>
          <div className="ai-title">AI Energy Briefing</div>
          <div className="ai-sub">Powered by Claude — your home &amp; your backup-power plan</div>
        </div>
      </div>

      <div className="ai-output">
        {loading && (
          <div className="ai-loading">
            <div className="dot-spin">
              <span />
              <span />
              <span />
            </div>
            <span>Generating your energy briefing…</span>
          </div>
        )}

        {!loading && error && (
          <div className="ai-error">
            <strong>The AI briefing couldn&apos;t be generated.</strong>
            <div className="ai-error-detail">{error}</div>
            <p>Your recommendation below is unaffected — a specialist can walk you through the full report.</p>
          </div>
        )}

        {!loading && !error && report && <ReportBlocks text={report} />}

        {!loading && !error && !report && (
          <p className="ai-empty">No briefing was returned. Your recommendation below still stands.</p>
        )}
      </div>

      {/* Generator-focused CTA (never batteries). */}
      <div className="cta-generator">
        <div className="cta-icon">🔌</div>
        <div className="cta-text">
          <strong>Ready to keep your home powered through any outage?</strong>
          <br />
          We can size and quote a {rec ? PRODUCT_LABELS[PRODUCTS.GENERATOR] : "Generac standby generator"}
          {panels ? " — plus the additional panels to shrink what's left of your bill" : ""} for your exact home.
        </div>
      </div>
    </div>
  );
}
