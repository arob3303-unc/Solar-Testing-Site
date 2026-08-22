"use client";

// The presentation shell.
//
// Renders as a FIXED FULL-VIEWPORT LAYER, above the site header. That is not styling
// preference — the header carries internal nav (Auditors / Setters / Notes) and this
// screen gets turned toward a homeowner. Nothing internal may be visible on it.
//
// One slide on screen at a time; the previous one unmounts. Navigation is deliberately
// boring: click anywhere to advance, explicit Back/Next controls to move either way,
// arrow keys, and swipe on touch.
//
// An earlier version used invisible full-height tap zones behind a `pointer-events:
// none` stage. Do not reintroduce that: a non-hit-testable element cannot be scrolled,
// so any slide taller than the window became unreadable on a laptop.

import { useCallback, useEffect, useRef, useState } from "react";
import Slide from "./Slide";
import SetterNote from "./SetterNote";

/** Horizontal px before a drag counts as a swipe. Below this it is a tap or a scroll. */
const SWIPE_PX = 45;

/** Clicks on these never advance the deck — they do their own job. */
const INTERACTIVE = "button, a, input, select, textarea, .setter-note-sheet";

export default function Deck({ slides, zip, onExit }) {
  // Tracked by ID, not index. The slide list can grow once the location data lands
  // (the outage record and storm slides only exist when their figures resolve), and
  // an index would silently point at a different slide when that happens.
  const [activeId, setActiveId] = useState(slides[0]?.id);
  const touch = useRef(null);

  const total = slides.length;
  const found = slides.findIndex((s) => s.id === activeId);
  const index = found >= 0 ? found : 0;

  const go = useCallback(
    (i) => {
      const clamped = Math.max(0, Math.min(i, slides.length - 1));
      setActiveId(slides[clamped]?.id);
    },
    [slides]
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === "Escape") onExit?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onExit]);

  // The deck owns the viewport while it is open; the page behind must not scroll.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onTouchStart = (e) => {
    const t = e.changedTouches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    // Only a mostly-horizontal drag counts, or scrolling a tall slide would skip on.
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  // Click anywhere that is not a control to advance.
  const onClick = (e) => {
    if (e.target.closest?.(INTERACTIVE)) return;
    next();
  };

  const slide = slides[index];
  if (!slide) return null;

  const atStart = index === 0;
  const atEnd = index === total - 1;

  return (
    <div
      className="deck"
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="presentation"
      aria-label={`Slide ${index + 1} of ${total}`}
    >
      <div className="deck-topbar">
        <div className="deck-dots" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={`deck-dot ${i === index ? "is-active" : ""} ${i < index ? "is-done" : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="deck-exit" onClick={onExit} aria-label="End presentation">
          ✕
        </button>
      </div>

      {/* key= unmounts the previous slide outright, so only ever one is on screen.
          NOTE THE PREFIXES on this key and the note's below. They are siblings, and
          two siblings sharing a key is undefined behaviour in React — it stops
          replacing the old node and starts appending, so every click stacked another
          slide onto the page. Keep them distinct. */}
      <div className="deck-stage" key={`stage-${slide.id}`}>
        <Slide slide={slide} zip={zip} />
      </div>

      {/* key= remounts the note on every slide, which is what guarantees it is closed
          when the screen is facing a homeowner. Do not remove it. */}
      <SetterNote key={`note-${slide.id}`} note={slide.setterNote} />

      <div className="deck-nav">
        <button
          type="button"
          className="deck-arrow"
          onClick={prev}
          disabled={atStart}
          aria-label="Previous slide"
        >
          ‹ Back
        </button>
        <span className="deck-count">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          className="deck-arrow is-next"
          onClick={next}
          disabled={atEnd}
          aria-label="Next slide"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
