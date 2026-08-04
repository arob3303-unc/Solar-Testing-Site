"use client";

// PIN entry for the internal closer notes. Exempted from the gate in proxy.js.
// The PIN itself lives server-side — this screen only reports pass/fail.

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UnlockPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !pin) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/notes-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        // refresh() clears the cached redirect so the gate re-evaluates.
        router.replace("/notes");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect PIN");
        setPin("");
        setBusy(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="audit-shell">
      <form className="unlock-card" onSubmit={submit}>
        <div className="unlock-icon" aria-hidden="true">
          🔒
        </div>
        <h2>Closer Notes</h2>
        <p className="sub">Internal sales material. Enter the team PIN to continue.</p>

        <label htmlFor="notes-pin">Team PIN</label>
        <input
          id="notes-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          className="unlock-input"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "notes-pin-error" : undefined}
        />

        {error && (
          <p className="unlock-error" id="notes-pin-error" role="alert">
            {error}
          </p>
        )}

        <button className="submit-btn" type="submit" disabled={busy || !pin}>
          {busy ? "Checking…" : "Unlock →"}
        </button>
      </form>
    </div>
  );
}
