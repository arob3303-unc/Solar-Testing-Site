"use client";

// Carries the completed audit from /audit to /pitch.
//
// The two pages are sibling routes, so a plain useState in /audit dies on navigation.
// This holds the result in a small external store mirrored to sessionStorage, which
// covers the case that actually happens in the field: the rep hard-refreshes, or
// opens /pitch on its own, and the homeowner is sitting right there watching.
//
// sessionStorage, not localStorage, on purpose — one appointment per tab. The next
// homeowner must never see the previous homeowner's numbers.
//
// Implemented with useSyncExternalStore rather than useEffect + setState. Storage is
// an external system, and reading it into state from an effect triggers a cascading
// render on every mount; this is the primitive React provides for exactly this.

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const KEY = "vechter.audit.v1";

// `hydrated` distinguishes "nothing saved" from "not read yet". Without it /pitch
// flashes its cold-start card for a frame before the stored audit arrives.
const EMPTY = { audit: null, hydrated: false };

let store = EMPTY;
const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private-mode Safari throws on sessionStorage access. Losing the handoff is
    // survivable; crashing the whole app on a storage read is not.
    return null;
  }
}

function subscribe(cb) {
  listeners.add(cb);
  // First subscriber pulls the saved audit in. Runs on the client only, after
  // hydration, so it can never desync the server-rendered markup.
  if (!store.hydrated) {
    store = { audit: readSession(), hydrated: true };
    emit();
  }
  return () => listeners.delete(cb);
}

const getSnapshot = () => store;
// The server has no session, so it always renders the pre-hydration state.
const getServerSnapshot = () => EMPTY;

function writeAudit(next) {
  store = { audit: next ?? null, hydrated: true };
  try {
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Same as above — keep the in-memory copy, drop the persistence.
  }
  emit();
}

const AuditContext = createContext(null);

export default function AuditProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setAudit = useCallback((next) => writeAudit(next), []);

  const value = useMemo(
    () => ({ audit: snapshot.audit, hydrated: snapshot.hydrated, setAudit }),
    [snapshot, setAudit]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used inside <AuditProvider>");
  return ctx;
}
