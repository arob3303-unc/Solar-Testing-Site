"use client";

// Renders one slide by `type`. Same dispatch pattern as <Block> in app/notes/page.jsx.
//
// Content comes from lib/setterDeck.js, which has already dropped any slide whose
// figures did not resolve — so nothing here needs a "no data" branch. If a value is
// on a slide, it is real.

import RollingBlackoutDiagram from "@/components/dashboard/RollingBlackoutDiagram";
import VechterMark from "@/components/VechterMark";

function Eyebrow({ children }) {
  if (!children) return null;
  return <span className="slide-eyebrow">{children}</span>;
}

function Source({ children }) {
  if (!children) return null;
  return <p className="slide-source">{children}</p>;
}

export default function Slide({ slide, zip }) {
  const s = slide;

  switch (s.type) {
    case "hook":
      return (
        <div className="slide slide-hook">
          <VechterMark size={64} />
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h1 className="slide-headline">{s.headline}</h1>
          <p className="slide-body">{s.body}</p>
        </div>
      );

    case "location":
      return (
        <div className="slide slide-location">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <div className="slide-place">{s.place}</div>
          <div className="slide-utility">{s.utility}</div>
          <p className="slide-body">{s.body}</p>
        </div>
      );

    case "stat":
      return (
        <div className="slide slide-stat">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <div className="slide-figure">{s.figure}</div>
          <div className="slide-caption">{s.caption}</div>
          <p className="slide-body">{s.body}</p>
          <Source>{s.source}</Source>
        </div>
      );

    case "facts":
      return (
        <div className="slide slide-facts">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h2 className="slide-headline">{s.headline}</h2>
          <div className="slide-tiles">
            {s.stats.map((t) => (
              <div className="slide-tile" key={t.label}>
                <div className="slide-tile-val">{t.val}</div>
                <div className="slide-tile-label">{t.label}</div>
                <div className="slide-tile-sub">{t.sub}</div>
              </div>
            ))}
          </div>
          <p className="slide-body">{s.body}</p>
          {/* Only rendered when the EIA arithmetic actually resolved. */}
          {s.footnote && <p className="slide-footnote">{s.footnote}</p>}
        </div>
      );

    case "diagram":
      return (
        <div className="slide slide-diagram">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h2 className="slide-headline">{s.headline}</h2>
          <div className="slide-diagram-wrap">
            <RollingBlackoutDiagram zip={zip} zoneCount={4} cycleMs={2200} />
          </div>
          <p className="slide-body">{s.body}</p>
        </div>
      );

    case "compare":
      return (
        <div className="slide slide-compare">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <div className="slide-compare-row">
            <div className="slide-compare-col">
              <div className="slide-compare-label">{s.left.label}</div>
              <div className="slide-compare-val">{s.left.value}</div>
            </div>
            <div className="slide-compare-col is-bad">
              <div className="slide-compare-label">{s.right.label}</div>
              <div className="slide-compare-val">{s.right.value}</div>
            </div>
          </div>
          <p className="slide-body">{s.body}</p>
          <Source>{s.source}</Source>
        </div>
      );

    case "list":
      return (
        <div className="slide slide-list">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h2 className="slide-headline">{s.headline}</h2>
          <ul className="slide-items">
            {s.items.map((i) => (
              <li key={i.title}>
                <span className="slide-item-icon" aria-hidden="true">
                  {i.icon}
                </span>
                <span className="slide-item-text">
                  <strong>{i.title}</strong>
                  <span>{i.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "solution":
      return (
        <div className="slide slide-solution">
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h2 className="slide-headline">{s.headline}</h2>
          <ul className="slide-points">
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="slide-body">{s.body}</p>
        </div>
      );

    // NOTE: the deck ends on "solution". There is deliberately no ask or
    // what-happens-next screen — that part of the conversation happens face to face,
    // and its wording lives in the closing slide's setter note.

    default:
      return null;
  }
}
