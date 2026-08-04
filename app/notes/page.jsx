// Internal closer reference. Three separate references live here — they are
// different documents, not one merged process, so they stay side by side and the
// closer picks the one they run. They overlap in places, which is expected:
//   1. Generator Sales Flow (Coby Rodriguez) — the structured 9-step field process.
//   2. Mark's Wants and Needs (Mark Wagoner) — the discovery question framework.
//   3. ChatGPT Transcript — the 8-stage flow reconstructed from the call transcript.
// Shared reference material (worksheet, analogies, accuracy rules) sits at the end.
//
// Static server component — no interactivity, so no "use client".

import NotesToc from "@/components/notes/NotesToc";

export const metadata = {
  title: "Closer Notes — Pitch Guides",
  description: "Stage-by-stage pitch guides mapped to the energy audit site.",
};

/* ── Flow 1: Generator Sales Flow ─────────────────────────────────────────── */

const GENERATOR_FLOW = [
  {
    n: 1,
    title: "On-Site Energy Audit / Investigation",
    purpose: "Set the frame, then become the expert. You are investigating, not selling.",
    screen: "Nothing yet — you're outside. The site stays closed until you sit down.",
    blocks: [
      {
        type: "say",
        label: "Set the frame before the survey",
        text: "Thank you for having me out today. The reason I'm here is pretty simple. Since you already own a solar system, we're performing an energy audit to determine whether your home is a good candidate for whole-home backup power. I'm going to take a few measurements around the home, inspect your electrical equipment, and see how your home is currently set up. Once I'm finished, we'll sit down for about 15–20 minutes, I'll explain what I found, answer any questions, and let you know what I would recommend.",
      },
      {
        type: "check",
        label: "Complete the site survey",
        items: [
          "Main electrical panel",
          "Meter base",
          "Gas meter / propane tank",
          "Generator placement",
          "Transfer switch location",
          "Utility access",
          "HVAC",
          "Critical appliances",
          "Home layout",
          "Existing solar equipment",
          "Photos",
          "Measurements",
        ],
      },
      {
        type: "callout",
        text: "Do not sell during the survey. Become the expert, observe everything, take notes, look for opportunities.",
      },
      {
        type: "ask",
        label: "Transition inside",
        items: [
          "While I was outside I noticed you don't currently have a backup generator. Out of curiosity, why do you think one wasn't installed when your solar system was put in?",
          "Did anyone ever explain why they didn't recommend whole-home backup power?",
        ],
      },
    ],
  },
  {
    n: 2,
    title: "Wants & Needs / Building Pain",
    purpose:
      "Discover what losing power actually costs them. People don't buy generators — people buy protection.",
    screen: "Intake form — capture critical loads and outage frequency as they answer.",
    blocks: [
      {
        type: "ask",
        label: "Electrical investigation",
        items: ["What absolutely has to stay on if the power goes out?"],
      },
      {
        type: "check",
        label: "Uncover every load",
        items: [
          "Refrigerator",
          "Freezer",
          "HVAC",
          "Heat",
          "Air conditioning",
          "Medical equipment",
          "Internet",
          "Security system",
          "Garage door",
          "Lights",
          "Water heater",
          "Well pump",
          "Septic pump",
          "Sump pump",
          "Home office",
          "EV charger",
        ],
      },
      {
        type: "callout",
        text: "After every single answer, ask: \"Why is that important?\" The answer to that question is what you sell to later.",
      },
      {
        type: "ask",
        label: "Lifestyle",
        items: [
          "How often do you lose power?",
          "How long do your outages usually last?",
          "Have they become more frequent over the last few years?",
          "What's the biggest inconvenience when the power goes out?",
        ],
      },
      {
        type: "ask",
        label: "Family",
        items: [
          "Who lives in the home?",
          "Does anyone work from home?",
          "Any young children or elderly family members?",
          "Does anyone rely on medical equipment?",
          "Any pets?",
        ],
      },
      {
        type: "ask",
        label: "Financial pain",
        items: [
          "Have you ever lost groceries because of an outage?",
          "Have you ever stayed in a hotel because your home lost power?",
          "Have you ever missed work or lost income?",
          "Have frozen pipes, sump pumps, or alarms ever been a concern?",
          "If you lost power for several days, what would that realistically cost you?",
        ],
      },
      {
        type: "ask",
        label: "Emotional pain",
        items: [
          "What's the most frustrating part about losing power?",
          "If the power stayed off for three or four days, what would worry you the most?",
        ],
      },
      {
        type: "check",
        label: "Build the pain — summarize it back: \"So if the power went out for several days…\"",
        items: [
          "Food spoils",
          "Hotel expenses",
          "No heating or A/C",
          "Lost internet",
          "Missed work",
          "Frozen pipes",
          "Security concerns",
          "Family discomfort",
          "Stress and uncertainty",
        ],
      },
      {
        type: "callout",
        text: "Close the summary with \"Did I miss anything?\" Once they add to it, it's their list — not yours.",
      },
    ],
  },
  {
    n: 3,
    title: "Pre-Frame",
    purpose: "Earn permission to decide today, before you present anything.",
    screen: "Run My Energy Audit — start the diagnostics while you set this up.",
    blocks: [
      {
        type: "say",
        text: "What I'm going to do is very simple. I'm going to show you how we're going to improve your energy situation entirely, and as long as everything makes sense, I'll sign you up today. Does that sound fair?",
      },
      { type: "callout", text: "Wait for agreement before moving forward. Do not present over an unanswered question." },
    ],
  },
  {
    n: 4,
    title: "Rolling Blackouts",
    purpose: "Establish that outages are trending up and are increasingly a decision, not an accident.",
    screen:
      "Rolling Blackouts Are Coming card, then the rotating zone diagram below it. Click their zone so the outage lands on them mid-sentence.",
    blocks: [
      {
        type: "do",
        label: "Explain simply",
        items: [
          "The electrical grid is under more stress than ever.",
          "Population growth, extreme weather, electric vehicles, AI data centers, and aging infrastructure are all adding demand.",
          "Utilities are responding with more outages, longer restoration times, and in some areas rolling blackouts.",
        ],
      },
      { type: "ask", label: "Then ask", items: ["Do you think outages are becoming more common or less common?"] },
      {
        type: "say",
        text: "Most homeowners aren't preparing for the last outage — they're preparing for the next one.",
      },
    ],
  },
  {
    n: 5,
    title: "Generator Needs / Recommendation",
    purpose: "Tie the recommendation back to what you personally saw and what they personally told you.",
    screen: "Backup Power card — sizing and the loads they named.",
    blocks: [
      {
        type: "say",
        label: "Transition",
        text: "Based on what I saw during the energy audit and everything you've shared with me, here's what I recommend.",
      },
      {
        type: "do",
        label: "Explain",
        items: [
          "Generator size",
          "What it will power",
          "Installation process",
          "Timeline",
          "Monitoring",
          "Financing options",
        ],
      },
      { type: "callout", text: "Keep every point anchored to why this recommendation fits this home." },
    ],
  },
  {
    n: 6,
    title: "On Grid vs Off Grid / Price Conditioning",
    purpose: "Price the cost of doing nothing before you price the solution.",
    screen: "Bill Projection, then On-Grid Only vs. Whole-Energy Stability.",
    blocks: [
      {
        type: "compare",
        left: {
          title: "Option 1 — Stay grid-dependent",
          tone: "grid",
          items: [
            "Spoiled groceries",
            "Hotel stays",
            "Missed work or lost income",
            "Frozen pipes and water damage",
            "Security system outages",
            "No heating or air conditioning",
            "No internet",
            "Stress and uncertainty",
          ],
        },
        right: {
          title: "Option 2 — Whole-home backup",
          tone: "stable",
          items: [
            "Automatic backup power",
            "Protection for food and appliances",
            "Heating and cooling",
            "Internet stays up",
            "Security stays armed",
            "Family comfort",
            "Peace of mind",
          ],
        },
      },
      {
        type: "ask",
        label: "Price the risk",
        items: [
          "If you had another multi-day outage, what do you think it would realistically cost your family?",
          "And if that happened once every couple of years, would you say that cost is going up or down?",
        ],
      },
      {
        type: "say",
        label: "Monthly investment vs. cost of doing nothing",
        text: "Most homeowners don't realize they're already paying for outages — they're just paying for them after they happen. Every outage has a price tag: spoiled food, hotel rooms, missed work, frozen pipes, emergency repairs, or simply the inconvenience of your family being without power. Those costs add up quickly. The difference is that instead of paying unpredictable costs every time the power goes out, you're making one predictable monthly investment to eliminate those risks before they happen.",
      },
      {
        type: "ask",
        label: "Then close the frame",
        items: [
          "If your monthly investment to protect your home was less than what one major outage could cost your family, would that make financial sense?",
          "Would you rather continue gambling with expensive outages, or make a small monthly investment to make sure your home is always protected?",
        ],
      },
    ],
  },
  {
    n: 7,
    title: "Urgency",
    purpose: "Make waiting the expensive option, using facts they can verify.",
    screen: "Total cost projection chart.",
    blocks: [
      {
        type: "do",
        label: "Explain",
        items: [
          "Installation schedules fill before storm season.",
          "Most homeowners wait until after the first major outage.",
          "Lead times increase as demand climbs.",
          "The best time to prepare is before backup power is needed.",
        ],
      },
      {
        type: "do",
        label: "Where applicable",
        items: ["Seasonal incentives", "Promotional pricing", "Deferred payments", "Covered payments until storm season"],
      },
    ],
  },
  {
    n: 8,
    title: "Warranty / Energy Provider",
    purpose: "Remove post-signature risk and set up the long-term relationship.",
    screen: "Backup Power card, then the AI briefing.",
    blocks: [
      {
        type: "do",
        label: "Explain",
        items: ["Manufacturer warranty", "Installation warranty", "Generator monitoring", "Ongoing service and maintenance"],
      },
      {
        type: "say",
        text: "Our goal isn't just to install a generator — we want to become your long-term energy provider. Whether it's your generator, your solar system, monitoring, service, future upgrades, or anything related to your home's energy, you'll always have one trusted company to call.",
      },
    ],
  },
  {
    n: 9,
    title: "Next-Step Closing",
    purpose: "Move to the proposal with no new information introduced.",
    screen: "AI audit briefing, then the proposal.",
    blocks: [
      {
        type: "say",
        text: "Next steps are pretty simple. I'm going to show you the proposal, and as long as everything lines up with what we talked about, I'm going to qualify you and get you signed up. Cool?",
      },
      {
        type: "callout",
        text: "If a brand-new objection shows up here, it belongs to an earlier step. Go back to that step instead of negotiating at the close.",
      },
    ],
  },
];

/* ── Flow 2: Mark's Wants and Needs ───────────────────────────────────────── */

const MARK_FLOW = [
  {
    n: 1,
    title: "The Six Questions",
    purpose:
      "Audit wants and needs. Every question exists to surface a problem you can solve.",
    screen: "Intake form — fill it in as they answer. What they say here is what you sell to later.",
    blocks: [
      {
        type: "qa",
        label: "Ask in this order",
        items: [
          { q: "Why'd you set the appointment?", why: "Find the root cause." },
          { q: "What do you know about your system?", why: "Prior knowledge." },
          { q: "What do you think about your system?", why: "Opinion and feelings." },
          {
            q: "How long have you had this bill / system?",
            why: "How long the customer has been in pain.",
          },
          {
            q: "Why did you go solar? What did you want?",
            why: "Discover how the customer makes decisions.",
          },
          {
            q: "What do you want from this appointment?",
            why: "Recap of everything, and an easy transition into testing / the pre-frame.",
          },
        ],
      },
      {
        type: "callout",
        text: "Listen to Mark explain wants and needs, and apply the same concepts.",
      },
    ],
  },
  {
    n: 2,
    title: "Two Questions to Ask Yourself",
    purpose:
      "Run every question you're about to ask through this filter first. If it fails both, cut it.",
    screen: "Nothing. This one is for you, not the customer.",
    blocks: [
      {
        type: "do",
        label: "Before anything comes out of your mouth",
        items: [
          "Why am I asking this question?",
          "Does this help me find a way to close the customer, by finding a problem I can solve?",
        ],
      },
      { type: "say", text: "Closing is just solving problems." },
    ],
  },
];

/* ── Flow 3: ChatGPT Transcript (from the call transcript) ────────────────── */

const STAGES = [
  {
    n: 1,
    title: "Opening & Discovery",
    lines: "Lines 1–90",
    purpose: "Build rapport and uncover motivation before a single number comes out.",
    screen: "Intake form — fill it out together, out loud. Their answers are your ammunition later.",
    asks: [
      "Why did you set the appointment? What did they tell you on the phone?",
      "Ever had a power audit done before?",
      "Any upgrades to the home — roof, foundation, remodel?",
      "What's the weather like here? Extreme heat, storms, hurricanes?",
      "What's the electric bill running? Has it always been that?",
      "How long have you been in the home?",
      "Anything specific you want me to look at while I walk the house?",
    ],
    tip: "Mirror their answers back as a frame you'll reuse: \"So when something isn't working properly, you fix it.\" That sets them up as proactive, which makes the close consistent with who they already told you they are.",
  },
  {
    n: 2,
    title: "Outage Discovery",
    lines: "Lines 91–191",
    purpose: "Turn outages from an annoyance into a number. This is the stage that funds the T-chart.",
    screen: "Intake backup fields — outage frequency and critical loads, entered as they answer.",
    asks: [
      "How often do outages hit? How long do they last? Which season?",
      "What's affected — Wi-Fi, food, work from home, the kids, your spouse?",
      "Have you actually lost food before, or is it just a worry?",
      "Did you ever have to leave for a hotel? How many nights, how much?",
      "How fast is the utility to respond when a line goes down?",
      "How quick does the house get hot when the AC drops?",
    ],
    tip: "Do not leave this stage without dollar figures: cost of a grocery haul, cost of a hotel night, how many people had to go. You cannot build the cost-of-doing-nothing math without them.",
  },
  {
    n: 3,
    title: "Transition to Solution",
    lines: "Lines 192–199",
    purpose: "Summarize the problems back, name the solution, and get an agreement to decide today.",
    screen: "Hit Run My Energy Audit — the diagnostics sequence runs while you talk.",
    asks: [
      "Summarize every problem they just handed you, in their words.",
      "\"In light of all of that, what fixes everything is a backup power unit.\"",
      "\"I'll walk you through exactly how it works. If we agree it puts you in a better situation, I'll get you qualified and signed up today. Does that sound fair?\"",
    ],
    tip: "The \"does that sound fair?\" yes is the real pre-close. Get it before you educate, not after — it's what makes the rest of the pitch a decision instead of a lecture.",
  },
  {
    n: 4,
    title: "Education: Rolling Blackouts",
    lines: "Lines 200–260",
    purpose: "Reframe outages from accident to policy — something scheduled and done to them on purpose.",
    screen:
      "Rolling Blackouts Are Coming card, then the rotating zone diagram directly below it. Click their zone so the outage lands on them while you talk.",
    asks: [
      "\"Have you ever heard of a rolling blackout? A controlled blackout?\"",
      "Two tiers of infrastructure: residential/commercial vs. priority buildings.",
      "\"When I say priority building, what do you think I mean?\" — let them say hospital, police, government.",
      "Data centers now fall under that priority umbrella — state revenue, utility funding.",
      "One data center draws power on the scale of an entire city added to the grid.",
      "\"If you drop that into your city, does that add stress to the grid?\"",
      "Too much stress and the grid has to shed load somewhere.",
      "\"Who do you think they sacrifice — the priority buildings and data centers, or the neighborhoods?\" Then: \"Why?\"",
    ],
    tip: "Land it plainly: it isn't that a tree fell. The utility switched their power off because in their accounting the neighborhood is worth less than a data center. Let the zone diagram keep rotating while that sits.",
  },
  {
    n: 5,
    title: "On-Grid vs. Off-Grid",
    lines: "Lines 261–336",
    purpose: "Stack the true monthly cost of doing nothing, then show it only goes up.",
    screen: "Bill Projection chart, then On-Grid Only vs. Whole-Energy Stability.",
    asks: [
      "Draw the T-chart: on-grid with the utility vs. off-grid with a power unit.",
      "Fold the outage losses into the bill (see the worksheet below) — that's their real number.",
      "\"Is there a button you can hit to make outages go away?\" → outages last forever.",
      "\"With everything you now know, are outages getting more common or less?\" → so that cost climbs.",
      "Phone-provider analogy: bad service, you switch carriers. The utility is a monopoly — you can't.",
      "\"So we do the same thing: take the money you already spend on power that fails and reallocate it into power that works.\"",
      "Outages fixed at zero. Equity added to the home on resale. Most pay it off in 3–6 years, grace period to 15.",
    ],
    tip: "Ask why they picked the power unit side and stay quiet. When they say \"peace of mind\" or \"my family is safer,\" make them expand on it — their own words close harder than yours.",
  },
  {
    n: 6,
    title: "Urgency",
    lines: "Lines 337–366",
    purpose: "Two interconnected levers: install schedules and storm season.",
    screen: "Total cost projection chart.",
    asks: [
      "\"When's storm season here?\" — get them to name the window.",
      "Closer to storm season, everyone wants to be prepped. \"What does that do to demand?\"",
      "\"And when demand goes up, what happens to price?\"",
      "So you face both problems: schedules book out past the season, and you pay more.",
      "Incentive: we cover the monthly payments through to storm season to smooth the transition.",
    ],
    tip: "Let them supply each answer. Urgency they reason their way into holds up; urgency you assert gets argued with.",
  },
  {
    n: 7,
    title: "Peace of Mind & Partnership",
    lines: "Lines 367–394",
    purpose: "Remove post-signature risk — the quiet objection they haven't said out loud.",
    screen: "Backup Power card.",
    asks: [
      "15-year warranty: parts, everything electrical, and workmanship — 100% covered.",
      "Energy partnership: additional solar panels to bring the bill down alongside the unit.",
      "\"If anything happens with power in this home, who do you call? Us.\" HVAC, insulation, windows, anything power-related.",
      "We're not a fly-by-night installer who buys ten units and disappears — we service this home for decades.",
      "If they ask \"what if I move?\" — we're still your partner, still the first call.",
    ],
    tip: "This is where a hesitant buyer is actually sitting. If they've gone quiet since the T-chart, slow down and spend real time here.",
  },
  {
    n: 8,
    title: "Close",
    lines: "Lines 395–400",
    purpose: "Move straight into next steps with no new information introduced.",
    screen: "AI audit briefing, then the proposal.",
    asks: [
      "Review the design and proposal from the engineering team together.",
      "Confirm it aligns with everything discussed.",
      "Get them qualified.",
      "On approval, send the documents and sign.",
      "Set the welcome call.",
    ],
    tip: "Nothing new goes on the table here. If a fresh objection appears, it belongs to an earlier stage — go back to that stage rather than negotiating at the close.",
  },
];

/* ── Shared reference ─────────────────────────────────────────────────────── */

const ANALOGIES = [
  {
    name: "Priority vs. residential",
    use: "Hospitals, police, and government must stay powered — and data centers now sit in that tier. Everything else is what gets shed.",
  },
  {
    name: "The data center",
    use: "A single facility adds city-scale demand to the grid overnight. Ask whether that adds stress rather than asserting it.",
  },
  {
    name: "The phone carrier",
    use: "Bad cell service and you switch providers. The utility is a monopoly, so the only way to switch is to make your own power.",
  },
  {
    name: "Reallocation, not new spend",
    use: "They already pay for power that fails. This moves that same money to power that works.",
  },
  {
    name: "Renting vs. owning",
    use: "A utility payment rents power for one month and buys nothing — and the rent goes up every year, forever. A financed unit is a payment that ends, leaving equipment they own that stays with the home. Ask what ten years of rent has bought them so far.",
  },
];

const GUARDRAILS = [
  "Present the payoff window, monthly figure, and any savings as estimates until engineering returns real numbers — never as guarantees.",
  "\"Zero outages\" means the home stays powered through utility outages. Don't stretch it into a claim that nothing can ever go wrong.",
  "The data center comparison is an order-of-magnitude analogy. Don't attach invented precise figures, dates, or percentages to it.",
  "Never invent a specific rate filing or a percentage increase. Speak to the direction of the trend, which is well supported.",
  "Batteries and solar storage are not products here. Never pitch storage, and never imply the generator stores solar energy — it runs on natural gas or propane.",
  "Backup power doesn't remove the home from the utility's rotation. It makes their turn a non-event. That's the accurate version and it lands just as hard.",
];

/* ── Contents rail ────────────────────────────────────────────────────────── */

// Ids here MUST match the ids rendered below — NotesToc resolves them with
// getElementById to track scroll position.
const TOC = [
  {
    id: "generator-flow",
    label: "Generator Sales Flow",
    items: GENERATOR_FLOW.map((s) => ({ id: `gen-${s.n}`, label: `${s.n}. ${s.title}` })),
  },
  {
    id: "mark-wants-needs",
    label: "Mark's Wants and Needs",
    items: MARK_FLOW.map((s) => ({ id: `mark-${s.n}`, label: `${s.n}. ${s.title}` })),
  },
  {
    id: "audit-pitch",
    label: "ChatGPT Transcript",
    items: STAGES.map((s) => ({ id: `pitch-${s.n}`, label: `${s.n}. ${s.title}` })),
  },
  {
    id: "reference",
    label: "Reference & Accuracy",
    items: [
      { id: "ref-worksheet", label: "Cost-of-Doing-Nothing Worksheet" },
      { id: "ref-analogies", label: "Analogies That Carry the Pitch" },
      { id: "ref-accuracy", label: "Keep It Accurate" },
    ],
  },
];

/* ── Renderers ────────────────────────────────────────────────────────────── */

function Block({ b }) {
  if (b.type === "say") {
    return (
      <div className="note-say">
        {b.label && <span className="note-block-label">{b.label}</span>}
        <p>{b.text}</p>
      </div>
    );
  }
  if (b.type === "ask" || b.type === "do") {
    return (
      <div className="note-block">
        {b.label && <span className="note-block-label">{b.label}</span>}
        <ul className={b.type === "ask" ? "note-asks" : "note-dos"}>
          {b.items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    );
  }
  // Question paired with the reason it's being asked — the whole point of Mark's
  // framework is that the "why" travels with the question.
  if (b.type === "qa") {
    return (
      <div className="note-block">
        {b.label && <span className="note-block-label">{b.label}</span>}
        <ol className="note-qa">
          {b.items.map((item, i) => (
            <li key={i}>
              <span className="note-qa-q">{item.q}</span>
              <span className="note-qa-why">{item.why}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (b.type === "check") {
    return (
      <div className="note-block">
        {b.label && <span className="note-block-label">{b.label}</span>}
        <div className="note-check">
          {b.items.map((t) => (
            <span className="note-check-item" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (b.type === "callout") {
    return <p className="note-callout">{b.text}</p>;
  }
  if (b.type === "compare") {
    return (
      <div className="note-compare">
        {[b.left, b.right].map((col) => (
          <div className={`note-compare-col ${col.tone}`} key={col.title}>
            <div className="note-compare-title">{col.title}</div>
            <ul>
              {col.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function FlowStep({ s, id }) {
  return (
    <section className="note-stage" id={id}>
      <div className="note-stage-head">
        <span className="note-num">{s.n}</span>
        <div>
          <h3 className="note-stage-title">{s.title}</h3>
          {s.lines && <span className="note-lines">{s.lines}</span>}
        </div>
      </div>

      <p className="note-purpose">{s.purpose}</p>

      <div className="note-screen">
        <span className="note-screen-tag">On screen</span>
        <span>{s.screen}</span>
      </div>

      {s.blocks?.map((b, i) => (
        <Block b={b} key={i} />
      ))}

      {s.asks && (
        <ul className="note-asks">
          {s.asks.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}

      {s.tip && (
        <p className="note-tip">
          <strong>Coaching:</strong> {s.tip}
        </p>
      )}
    </section>
  );
}

export default function NotesPage() {
  return (
    <main className="note-main">
      <header className="note-header">
        <span className="note-eyebrow">Internal — Closer Reference</span>
        <h1>
          Pitch Guides: <span>Whole-Home Backup Power</span>
        </h1>
        <p>
          The most recent Pitch Flows, summarized and easy to follow.
        </p>
        <div className="note-jump">
          <a href="#generator-flow">① Generator Sales Flow</a>
          <a href="#mark-wants-needs">② Mark&apos;s Wants and Needs</a>
          <a href="#audit-pitch">③ ChatGPT Transcript</a>
          <a href="#reference">④ Reference &amp; Accuracy</a>
        </div>
      </header>

      <div className="note-layout">
        <NotesToc groups={TOC} />

        <div className="note-content">
      {/* ── Flow 1 ── */}
      <div className="note-flowhead" id="generator-flow">
        <h2>Generator Sales Flow</h2>
        <p className="note-attrib">
          Created by Coby Rodriguez · Executive of Sales · Vector Home Solutions
        </p>
        <p className="note-tagline">
          Protecting the home. Protecting the family. Becoming their long-term energy partner.
        </p>
      </div>

      <nav className="note-flow" aria-label="Generator sales flow steps">
        {GENERATOR_FLOW.map((s) => (
          <a className="note-flow-item" key={s.n} href={`#gen-${s.n}`}>
            <span className="note-flow-num">{s.n}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {GENERATOR_FLOW.map((s) => (
        <FlowStep key={s.n} s={s} id={`gen-${s.n}`} />
      ))}

      {/* ── Flow 2 ── */}
      <div className="note-flowhead" id="mark-wants-needs">
        <h2>Mark&apos;s Wants and Needs</h2>
        <p className="note-attrib">Created by Mark Wagoner · President of Sales</p>
        <p className="note-tagline">
          Audit wants and needs — every question exists to surface a problem you can solve.
        </p>
      </div>

      <nav className="note-flow" aria-label="Mark's wants and needs sections">
        {MARK_FLOW.map((s) => (
          <a className="note-flow-item" key={s.n} href={`#mark-${s.n}`}>
            <span className="note-flow-num">{s.n}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {MARK_FLOW.map((s) => (
        <FlowStep key={s.n} s={s} id={`mark-${s.n}`} />
      ))}

      {/* ── Flow 3 ── */}
      <div className="note-flowhead" id="audit-pitch">
        <h2>ChatGPT Transcript</h2>
        <p className="note-attrib">Reconstructed from the recorded call transcript</p>
        <p className="note-tagline">
          Discovery earns the numbers, the site makes them visual, the close restates what they
          already agreed to.
        </p>
      </div>

      <nav className="note-flow" aria-label="ChatGPT transcript stages">
        {STAGES.map((s) => (
          <a className="note-flow-item" key={s.n} href={`#pitch-${s.n}`}>
            <span className="note-flow-num">{s.n}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {STAGES.map((s) => (
        <FlowStep key={s.n} s={s} id={`pitch-${s.n}`} />
      ))}

      {/* ── Shared reference ── */}
      <div className="note-flowhead" id="reference">
        <h2>Reference &amp; Accuracy</h2>
        <p className="note-tagline">Applies to both flows.</p>
      </div>

      <section className="note-stage note-worksheet" id="ref-worksheet">
        <h3 className="note-stage-title">The Cost-of-Doing-Nothing Worksheet</h3>
        <p className="note-purpose">
          Run this live with their own numbers. The point is that the true cost of staying
          grid-dependent is already well above the bill they think they pay.
        </p>
        <ol className="note-steps">
          <li>
            <strong>Outages per year</strong> × <strong>what each one costs</strong> (spoiled
            groceries, a hotel night, lost work) = annual loss.
          </li>
          <li>
            Annual loss <strong>÷ 12</strong> = the hidden monthly cost.
          </li>
          <li>
            Add that to the electric bill = <strong>what they actually pay per month today</strong>.
          </li>
          <li>Establish outages are trending up, so that number climbs every year they wait.</li>
        </ol>
        <p className="note-example">
          <strong>Worked example:</strong> $250/mo bill · 4 outages/yr · $200 groceries lost each =
          $800/yr ÷ 12 ≈ <strong>$66/mo</strong> → roughly <strong>$316/mo</strong>, called an even
          $300. Round <em>down</em>, out loud — being conservative with their number buys
          credibility for the rest of the math.
        </p>
      </section>

      <section className="note-stage" id="ref-analogies">
        <h3 className="note-stage-title">Analogies That Carry the Pitch</h3>
        <div className="note-analogies">
          {ANALOGIES.map((a) => (
            <div className="note-analogy" key={a.name}>
              <div className="note-analogy-name">{a.name}</div>
              <p>{a.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="note-stage note-guard" id="ref-accuracy">
        <h3 className="note-stage-title">Keep It Accurate</h3>
        <p className="note-purpose">
          The grid strain is real and the argument stands on its own. Overstating it is the one
          thing that can lose a deal at the kitchen table — or after it.
        </p>
        <ul className="note-guard-list">
          {GUARDRAILS.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </section>
        </div>
      </div>
    </main>
  );
}
