"use client";

// Contents rail for the closer notes: click to jump, and it tracks which section
// you're currently reading. The page itself stays a server component — this takes
// the section list as a plain serializable array.
//
// Desktop: sticky sidebar. Narrow screens: a sticky "You are here" bar that opens
// the full list, since a 20-item rail would eat the whole viewport.

import { useEffect, useMemo, useRef, useState } from "react";

export default function NotesToc({ groups }) {
  const firstId = groups[0]?.items[0]?.id || "";
  const [active, setActive] = useState(firstId);
  const [open, setOpen] = useState(false);
  const visible = useRef(new Set());

  // Document order, used to break ties when several sections are on screen.
  const order = useMemo(
    () => groups.flatMap((g) => [g.id, ...g.items.map((i) => i.id)]),
    [groups]
  );

  useEffect(() => {
    const els = order.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.current.add(e.target.id);
          else visible.current.delete(e.target.id);
        }
        // The active section is the highest one still crossing the reading line;
        // when nothing qualifies (mid-section scroll) the last value stands.
        const top = order.find((id) => visible.current.has(id));
        if (top) setActive(top);
      },
      // Reading line sits just below the sticky bar; the -62% bottom margin stops a
      // section from claiming "active" while it's still near the bottom of the view.
      { rootMargin: "-88px 0px -62% 0px", threshold: 0 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [order]);

  const activeLabel = useMemo(() => {
    for (const g of groups) {
      if (g.id === active) return g.label;
      const hit = g.items.find((i) => i.id === active);
      if (hit) return hit.label;
    }
    return groups[0]?.label || "";
  }, [active, groups]);

  return (
    <>
      <div className="toc-bar">
        <button
          type="button"
          className="toc-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="notes-toc"
        >
          <span className="toc-bar-meta">
            <span className="toc-bar-label">You are here</span>
            <span className="toc-bar-current">{activeLabel}</span>
          </span>
          <span className="toc-caret" aria-hidden="true">
            {open ? "▲" : "▼"}
          </span>
        </button>
      </div>

      <nav className={`notes-toc ${open ? "is-open" : ""}`} id="notes-toc" aria-label="Page contents">
        <div className="toc-heading">Contents</div>
        {groups.map((g) => (
          <div className="toc-group" key={g.id}>
            <a
              href={`#${g.id}`}
              className={`toc-group-link ${active === g.id ? "is-active" : ""}`}
              aria-current={active === g.id ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {g.label}
            </a>
            <ul>
              {g.items.map((i) => (
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    className={active === i.id ? "is-active" : ""}
                    aria-current={active === i.id ? "location" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
