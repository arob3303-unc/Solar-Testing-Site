"use client";

// The setter's private prompt for the current slide.
//
// THIS IS THE ONE COMPONENT THAT MUST NOT LEAK. The phone is turned toward a
// homeowner; anything visible here is visible to them. Two rules follow from that:
//   1. Collapsed by default, opened only by a deliberate tap on a small control.
//   2. Closed on every slide change, so it can never be left open by accident while
//      the setter swipes on.
//
// Rule 2 is enforced by the CALLER passing key={slide.id}, which remounts this with
// fresh state on every slide. That is deliberately stronger than resetting in an
// effect: a remount cannot be skipped, whereas an effect with a stale dependency can.

import { useState } from "react";

export default function SetterNote({ note }) {
  const [open, setOpen] = useState(false);

  if (!note) return null;

  return (
    <>
      <button
        type="button"
        className={`setter-note-toggle ${open ? "is-open" : ""}`}
        onClick={(e) => {
          // The deck advances on taps anywhere; this control must not do both.
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={open ? "Hide setter prompt" : "Show setter prompt"}
      >
        {open ? "✕" : "⊙"}
      </button>

      {open && (
        <div
          className="setter-note-sheet"
          role="dialog"
          aria-label="Setter prompt"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="setter-note-tag">Setter only — not for the homeowner</div>
          {note.say && (
            <div className="setter-note-block">
              <span className="setter-note-label">Say</span>
              <p className="setter-note-say">{note.say}</p>
            </div>
          )}
          {note.listenFor && (
            <div className="setter-note-block">
              <span className="setter-note-label">Listen for</span>
              <p>{note.listenFor}</p>
            </div>
          )}
          {/* Only the last slide carries this: the deck ends on the fix, so the ask
              is made face to face and its wording lives here rather than on screen. */}
          {note.close && (
            <div className="setter-note-block setter-note-close">
              <span className="setter-note-label">Then ask</span>
              <p>{note.close}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
