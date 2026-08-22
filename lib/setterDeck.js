// ─────────────────────────────────────────────────────────────────────────────
// The door presentation, as data.
//
// Eight screens, about two minutes. The job is NOT to sell a generator — it is to
// build enough pain that the homeowner agrees to an hour with a closer. Every screen
// carries one idea, because it is being read at arm's length on a phone held by
// someone standing on a porch.
//
// IT ENDS ON THE FIX. The ask is made face to face, not off a screen — the homeowner
// should be looking at the setter for that part, not at a phone. The words for it
// live in the closing slide's setter note, where only the setter sees them.
//
// Content lives here, rendering lives in components/setter/. Same split as
// lib/options.js and the notes flow: copy can be rewritten without touching a
// component.
//
// buildDeck() takes the resolved location data and returns only the slides that can
// be honestly filled in. A slide whose figure did not resolve is DROPPED, never shown
// blank and never shown with a placeholder number.
//
// Every slide may carry `setterNote` — what to say, what to listen for. Never visible
// to the homeowner; it opens behind a deliberate tap.
// ─────────────────────────────────────────────────────────────────────────────

import { formatDuration } from "./reliability";

/** Grid-strain figures. Lifted from components/dashboard/DatacenterBlackouts.jsx —
 *  directional, sourced to public reporting, and deliberately not precise claims. */
const DATA_CENTER_STATS = [
  { val: "2×", label: "Data-center power demand", sub: "Projected U.S. growth by 2030" },
  { val: "100k", label: "Homes' worth of power", sub: "Draw of one large AI data center" },
  { val: "Last", label: "Where your home sits", sub: "Data centers hold priority contracts" },
];

export function buildDeck({ location, reliability, coverage } = {}) {
  const place = location?.place || null;
  const utility = location?.utilityName || null;
  const stateName = location?.stateName || null;

  // Wording that works whether or not the ZIP resolved. A setter cannot be stranded
  // at a door because a geocoder was down.
  const areaPhrase = place || (stateName ? stateName : "your area");
  const utilityPhrase = utility || "your utility";

  const slides = [];

  /* 1 ── Hook */
  slides.push({
    id: "hook",
    type: "hook",
    eyebrow: "VECHTER Home Solutions",
    headline: "Can I show you something about your power?",
    body: "Sixty seconds. It is about the grid where you live, not a sales pitch.",
    setterNote: {
      say: "Hi, I'm with VECHTER — we're in the neighborhood today. Can I show you something about your power real quick? Takes about a minute.",
      listenFor: "Anything at all other than 'no'. Get the phone turned toward them and start tapping.",
    },
  });

  /* 2 ── Where they are */
  slides.push({
    id: "location",
    type: "location",
    eyebrow: "Your grid",
    place: areaPhrase,
    utility: utilityPhrase,
    body: utility
      ? `You're served by ${utility}. Here is what their record actually looks like.`
      : "Here is what the record for your area actually looks like.",
    setterNote: {
      say: `You're on ${utilityPhrase}, right?`,
      listenFor: "A correction. If they name a different utility, say 'good to know' and keep going — the next number is a regional record either way.",
    },
  });

  /* 3 ── The outage record. Dropped entirely if nothing resolved. */
  if (reliability?.saidiWithMed != null) {
    slides.push({
      id: "record",
      type: "stat",
      eyebrow: "The record where you live",
      figure: formatDuration(reliability.saidiWithMed),
      caption: "without power last year",
      body:
        reliability.saifiWithMed != null
          ? `Across about ${reliability.saifiWithMed} separate interruptions. That is the average customer — some had far worse.`
          : "That is the average customer. Some had far worse.",
      source: `${reliability.label} · EIA-861, ${reliability.year}`,
      setterNote: {
        say: "Does that sound about right to you? Or does it feel worse than that?",
        listenFor:
          "A story. 'We lost it for three days last winter.' Their own outage is worth more than any number on this screen — let them tell it.",
      },
    });
  }

  /* 4 ── Why it is getting worse */
  slides.push({
    id: "datacenters",
    type: "facts",
    eyebrow: "Why it is getting worse",
    headline: "Data centers are draining the grid",
    stats: DATA_CENTER_STATS,
    body: "AI data centers run flat out, around the clock. They do not ease off in a heat wave the way a house does — so the strain never lets up.",
    // Real arithmetic on public EIA figures, or nothing.
    footnote:
      coverage && coverage.netImporter
        ? `${stateName || "This state"} generates only ${coverage.percent}% of the electricity it uses. The rest is bought in — and everyone is bidding for it.`
        : null,
    setterNote: {
      say: "You've seen them going up around here — those giant windowless buildings. Every one of those pulls what a small city pulls.",
      listenFor: "Recognition. Most people have seen the construction and not connected it to their own bill or their own outages.",
    },
  });

  /* 5 ── What load shedding looks like */
  slides.push({
    id: "rolling",
    type: "diagram",
    eyebrow: "Rolling blackouts",
    headline: "This is how they keep the grid up",
    body: "When demand outruns supply, the utility cuts power to whole neighborhoods in rotation. It is not a failure — it is the plan.",
    setterNote: {
      say: "Do you know what a rolling blackout is? It's when the power company shuts off a section on purpose to take the strain off. They pick who goes dark.",
      listenFor: "'They'd never do that here.' That is the moment to point back at the outage number two screens ago.",
    },
  });

  /* 6 ── Storms. Needs both figures to make the comparison honest. */
  if (reliability?.saidiWithMed != null && reliability?.saidiWithoutMed != null) {
    slides.push({
      id: "storms",
      type: "compare",
      eyebrow: "And then there are storms",
      left: { label: "A normal year", value: formatDuration(reliability.saidiWithoutMed) },
      right: { label: "With major storms", value: formatDuration(reliability.saidiWithMed) },
      body: "Storm outages are rare. They are also the ones that last days, not hours — and they arrive with no warning at all.",
      source: `${reliability.label} · EIA-861, ${reliability.year}`,
      setterNote: {
        say: "That difference is one bad storm season. When it happens, crews are out for days — and the whole neighborhood is in line ahead of you.",
        listenFor: "Whether they have been through a long one. If they have, slow down and let them talk.",
      },
    });
  }

  /* 7 ── What it actually costs them */
  slides.push({
    id: "cost",
    type: "list",
    eyebrow: "What actually happens",
    headline: "It is never just the lights",
    items: [
      { icon: "🩺", title: "Medical equipment stops", body: "Oxygen, CPAP, a fridge full of insulin. These do not wait for a crew." },
      { icon: "🧊", title: "The food goes", body: "A full fridge and freezer is hundreds of dollars, gone in a day and a half." },
      { icon: "🌡️", title: "No heat, no AC", body: "In January or in August, the house becomes the problem." },
      { icon: "💻", title: "You cannot work", body: "No internet, no power. A work-from-home day is simply lost." },
      { icon: "🚿", title: "On a well, no water", body: "No pump means no showers, no dishes, no flushing." },
    ],
    setterNote: {
      say: "Which one of those would hit you hardest here?",
      listenFor:
        "THE ANSWER TO THIS QUESTION IS THE APPOINTMENT. Whatever they name — medical, the freezer, working from home — repeat it back on the closing screen.",
    },
  });

  /* 8 ── The fix */
  slides.push({
    id: "solution",
    type: "solution",
    eyebrow: "The fix",
    headline: "The whole house, in about fifteen seconds",
    points: [
      "Grid drops, the unit starts on its own — you do not have to be home",
      "The whole house, not a few circuits: AC, heat, well pump, kitchen",
      "Runs on natural gas or propane, so there is no fuel to haul",
      "Grid comes back, it shuts itself down again",
    ],
    body: "Nothing to switch on. Nothing to remember. It just picks the house up.",
    setterNote: {
      say: "It runs itself. You could be at work, on vacation, asleep — the house never goes dark.",
      listenFor:
        "Price questions. Do not quote. \u201CThat is exactly what the specialist works out with you.\u201D",
      close:
        "Put the phone down for this part. \u201CWhat we are doing is having our specialist come out, look at your panel and your setup, and show you exactly what it would take to keep this house running. About an hour, no cost, no obligation \u2014 and I do need both of you there.\u201D Then offer TWO times, never ask whether they want one. If they stall, go back to whichever thing they said would hit them hardest.",
    },
  });

  return slides;
}
