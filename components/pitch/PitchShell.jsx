"use client";

// Shared scaffolding for every page under /pitch.
//
// Two jobs: read the audit out of the provider (returning a cold-start card when
// there is nothing stored) and render the back-to-options rail. Every option page
// wraps itself in this so the empty state and the navigation are identical across
// all of them.

import Link from "next/link";
import { useAudit } from "@/components/AuditProvider";

export function ColdStart() {
  return (
    <main className="pitch-main">
      <div className="pitch-empty">
        <div className="pitch-empty-icon" aria-hidden="true">
          📋
        </div>
        <h1>Run the assessment first</h1>
        <p>
          These pages explain what the diagnostic results mean for a specific home, so they need a
          completed assessment to read from. It takes a few minutes.
        </p>
        <Link className="btn-cta" href="/audit">
          Start the assessment →
        </Link>
      </div>
    </main>
  );
}

/**
 * Gives a pitch page the stored audit, or renders the cold-start card for it.
 * Returns `{ audit, fallback }` — render `fallback` when it is non-null.
 */
export function useAuditOrFallback() {
  const { audit, hydrated } = useAudit();
  // Render nothing until sessionStorage has been read, or the cold-start card
  // flashes for a frame on every load.
  if (!hydrated) return { audit: null, fallback: <main className="pitch-main" /> };
  if (!audit?.form) return { audit: null, fallback: <ColdStart /> };
  return { audit, fallback: null };
}

export function BackToOptions() {
  return (
    <Link className="pitch-back" href="/pitch">
      ← All options
    </Link>
  );
}
