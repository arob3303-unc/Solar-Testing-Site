// Internal field guide — the Generator Sales Flow.
//
// One document, not three. The earlier version of this page carried three
// overlapping pitch guides side by side; this replaces all of them with the single
// finalized flow, so there is never a question of which one a rep is running.
//
// The content here is authored copy, held as data and rendered by <Block>. Keep it
// that way: the visual grammar (shaded = spoken, bulleted = actions, labelled boxes
// = rules) is what makes the document usable in a living room, and it only holds if
// every stage is built from the same block types.
//
// Static server component — no interactivity, so no "use client".

import NotesToc from "@/components/notes/NotesToc";

export const metadata = {
  title: "Field Guide — Generator Sales Flow",
  description: "VECHTER Home Solutions internal sales reference. Generator plus production package.",
};

/* ── The flow ─────────────────────────────────────────────────────────────── */

const FLOW = [
  {
    n: 1,
    title: "Audit",
    purpose: "Find out how the solar system is actually operating. Nothing else is on the table yet.",
    blocks: [
      {
        type: "rule",
        tone: "brand",
        label: "This is a solar assessment",
        text: "Inside sales booked a solar assessment and that is exactly what you are there to do. Most homeowners agreed to the appointment because nobody has looked at their system in years. Do not re-brand it, and do not arrive talking about a generator.",
      },
      {
        type: "say",
        paras: [
          "I'm here to take a look at your solar system and see how it's actually performing. Give me about ten minutes out here and then I'll come find you.",
        ],
      },
      {
        type: "rule",
        tone: "alert",
        label: "Do not mention a generator in this stage",
        text: "The generator does not come up until you know how the system is operating and you have confirmed there is no backup on the property. A rep who leads with the product has nothing left to discover, and the homeowner hears a pitch instead of an assessment.",
      },
      { type: "subhead", text: "Walk the exterior" },
      {
        type: "do",
        label: "Roughly ten minutes. Photograph and note:",
        items: [
          "Main electrical panel and meter base",
          "Existing solar equipment, inverter and data sticker",
          "Roof area, orientation and available space for additional panels",
          "Gas meter or propane location",
          "Transfer switch location, if one exists",
          "Where a generator could be placed, and the clearances around it",
        ],
      },
      { type: "subhead", text: "Confirm there is no existing backup" },
      {
        type: "text",
        text: "Before you go any further, be certain. Look for a battery on the wall, an existing standby unit on a pad, an automatic transfer switch, or a propane tank already serving something other than the house.",
      },
      {
        type: "rule",
        tone: "brand",
        label: "Compatibility",
        text: "Where there is no backup, a generator will work on that home regardless of what solar equipment is installed. Inverter brand, panel brand and system age are not qualifying factors.",
      },
      { type: "subhead", text: "Return to the door" },
      {
        type: "say",
        paras: [
          "Everything looks okay out here. I really can't tell you how the system is performing until I run two tests on it — I need to look at your consumption, and I need to look at the production. Where can we sit?",
        ],
      },
      {
        type: "rule",
        tone: "brand",
        label: "The two tests",
        text: "Test one — consumption. Ask for the utility bill. Test two — production. Open their monitoring app. Run both, and say nothing about what you find. You are gathering, not presenting.",
      },
    ],
  },
  {
    n: 2,
    title: "Rapport and Build Trust",
    purpose: "Build enough trust that the homeowner will accept a problem when you raise it.",
    blocks: [
      {
        type: "text",
        text: "Do not bring up a problem with the system until you have been one-on-one with the homeowner for at least thirty minutes.",
      },
      {
        type: "text",
        text: "Ask about them. What they do for work, how long they have been in the house, who lives there. Be a person in their living room, not a salesperson in their living room.",
      },
      {
        type: "rule",
        tone: "brand",
        label: "Diagnostic",
        text: "If homeowners get resistant quickly, or will not sit down with you at all, the cause is almost always speed. You went too fast and skipped the relationship. Slow down.",
      },
      {
        type: "rule",
        label: "When to slow down further",
        text: "Where the original system was sold by a company that misled them, or where the homeowner has already been burned once, thirty minutes is a floor and not a target. Establish real trust before raising anything.",
      },
    ],
  },
  {
    n: 3,
    title: "Drop the Bomb",
    purpose: "Surface both problems with enough weight that the homeowner feels them.",
    blocks: [
      {
        type: "text",
        text: "Thirty minutes in, with both tests run, you raise the problem. This has to carry weight. If the homeowner does not end up concerned, it is because you did not show concern.",
      },
      { type: "subhead", text: "Problem one — the missing backup" },
      {
        type: "say",
        paras: [
          "Hold on a second. Your panel isn't marked for backup — where's your backup unit?",
          "They never explained that to you when the panels went in?",
        ],
      },
      { type: "subhead", text: "Problem two — the power bill" },
      {
        type: "text",
        text: "They have solar and they still have a bill. You saw it in the two tests. Put it on the table alongside the backup so both problems land together.",
      },
      {
        type: "say",
        paras: ["So you've got two things going on — you're still paying a power bill, and you've got no backup. Fair?"],
      },
      {
        type: "rule",
        tone: "alert",
        label: "Get the agreement",
        text: "Do not move to wants and needs until the homeowner has said out loud that both problems exist. Everything downstream is built on that agreement.",
      },
    ],
  },
  {
    n: 4,
    title: "Wants and Needs",
    purpose: "Get the homeowner to name the problems themselves so the list belongs to them.",
    blocks: [
      { type: "subhead", text: "Pre-frame the questions" },
      {
        type: "say",
        paras: ["I'm going to ask you a couple of questions — all this does is help me get a full picture of your situation."],
      },
      { type: "subhead", text: "Draw the T" },
      { type: "text", text: "On a notebook, draw a T. Two columns, two questions:" },
      {
        type: "say",
        paras: ["What do you like about your solar?", "And what do you not like about your solar?"],
      },
      { type: "text", text: "Write their answers under each side. Then ask the only follow-up that matters:" },
      { type: "say", paras: ["What else?"] },
      { type: "text", text: "Keep asking until they stop giving you material. Do not fill silence and do not move on early." },
      {
        type: "rule",
        tone: "brand",
        label: "What you are listening for",
        text: "Most systems work, so the like column fills easily. The not-like column is where the sale lives — no backup, the bill never went to zero, credits worth less than they used to be. Those are the items you solve later.",
      },
    ],
  },
  {
    n: 5,
    title: "Pre-Frame",
    purpose: "Set the same-day expectation and secure a hard agreement before presenting anything.",
    blocks: [
      {
        type: "say",
        paras: [
          "My job here is simple. I'm going to walk you through how I'm going to solve your usage problem with the power company, and then I'm going to walk you through how I'm going to get your home set up for full backup along with your solar.",
          "During this, let's have an open-minded conversation — ask me as many questions as you possibly can, so all the information is completely clear to you.",
          "As long as everything makes sense and I'm for sure putting you in a better situation than you're in now, I'm going to go ahead and get the ball rolling today. Is that fair?",
        ],
      },
      { type: "text", text: "You need a hard yes. Not “okay,” not “we'll see,” not a conditional." },
      {
        type: "rule",
        tone: "alert",
        label: "If they say no",
        text: "Do not ignore it and do not push past it. Address it here. A pre-frame that is skipped or half-agreed produces heavy pushback at the proposal, because every unresolved concern arrives at once at the end.",
      },
    ],
  },
  {
    n: 6,
    title: "NEM 1 vs. NEM 2",
    purpose: "Explain the rate change on paper, and let the homeowner conclude the arrangement is bad.",
    blocks: [
      {
        type: "text",
        text: "Use “NEM 1 and NEM 2” rather than net metering versus net billing. Homeowners follow one-then-two more easily.",
      },
      { type: "subhead", text: "Draw NEM 1 — the original setup" },
      {
        type: "say",
        paras: [
          "This is how everybody's system used to be set up — 2018, 2019, 2020, all the same.",
          "Sun hits the panels, powers the home, and anything extra goes back to the power company. They hold it for you in a savings account and send it back at night when you need it.",
          "And it came back one for one. You gave them a dollar, they gave you a dollar back. That was your relationship with the power company.",
        ],
      },
      { type: "subhead", text: "Draw NEM 2 — how it works now" },
      {
        type: "say",
        paras: [
          "It looks exactly the same. Sun hits the panels, extra goes back, they hold it, they send it back when you need it.",
          "The difference is what it's worth. Think about it like a stock — you sell it at a low price, and then you buy it back at a high price. Would you ever do that on purpose?",
        ],
      },
      { type: "text", text: "Let them answer. Then:" },
      { type: "say", paras: ["That's the trade you're making with the power company right now."] },
      {
        type: "compare",
        left: {
          tone: "stable",
          title: "NEM 1 — what they were sold",
          items: [
            "Extra production banked with the utility",
            "Credits return one for one",
            "A dollar out, a dollar back",
          ],
        },
        right: {
          tone: "grid",
          title: "NEM 2 — what they have now",
          items: [
            "Identical on the surface — same flow, same banking",
            "Export credited low, import bought back at retail",
            "Selling low and buying high, every single month",
          ],
        },
      },
      { type: "subhead", text: "The solution — production, not storage" },
      {
        type: "say",
        paras: [
          "The way you solve that is you add panels. More production means more electricity banked, so when the credit loss happens you don't feel it on your bill.",
        ],
      },
      {
        type: "rule",
        tone: "brand",
        label: "Full-retail markets",
        text: "In territories still on one-for-one, an underbuilt system behaves the same way a net-billing system does. The fix is identical — add production to close the gap and bring the bill down.",
      },
    ],
  },
  {
    n: 7,
    title: "Rolling Blackouts, Outages, Data Centers",
    purpose: "Establish why homeowners in the area are setting up for full backup.",
    blocks: [
      {
        type: "do",
        label: "Cover the three drivers, then double-tap for agreement",
        items: [
          "<strong>Load growth</strong> — more people, more electricity, data center construction along the East Coast",
          "<strong>Grid stress</strong> — utilities protect infrastructure by shedding load rather than letting equipment fail",
          "<strong>Storm season</strong> — lines come down every year, and restoration times are getting longer",
        ],
      },
      {
        type: "say",
        paras: [
          "Do you know what a rolling blackout is?",
          "It's when the power company strategically shuts down parts of their grid to take stress off a high-consumption area. They've spent billions on that infrastructure — when it gets stressed, they turn it off rather than let it break.",
          "You might get two outages a year now. You don't know what that looks like in ten.",
        ],
      },
      { type: "subhead", text: "The solar limitation — state it plainly" },
      {
        type: "say",
        paras: [
          "One thing worth knowing: when the grid goes down, your solar shuts off too. That's a safety requirement, not a defect. Without backup, the panels don't run your house.",
          "The generator picks up automatically — about fifteen seconds — and when the grid comes back, the generator steps down and the solar comes back online.",
        ],
      },
    ],
  },
  {
    n: 8,
    title: "Renting vs. Owning",
    purpose:
      "Get the homeowner to conclude, in their own words, that owning beats renting — and to accept a high number before you ever show a real one.",
    blocks: [
      {
        type: "callout",
        text: "This is the most important section in the flow. Every objection you would otherwise take at the proposal gets surfaced and solved here instead. Do not rush it.",
      },
      { type: "subhead", text: "Pre-frame it" },
      {
        type: "say",
        paras: [
          "This is actually the main reason homeowners get their system set up for extra production and full home backup at the same time. It's because they understand the difference between renting something and owning something.",
          "In this case, renting is staying on the grid with the power company. Owning is being fully off the grid — not having to worry about what the power company is doing.",
        ],
      },
      {
        type: "rule",
        tone: "brand",
        label: "Why this framing",
        text: "Renting versus owning maps onto on-grid versus off-grid, and homeowners feel that difference immediately. Pair them and the concept lands without explanation.",
      },
      {
        type: "compare",
        left: {
          tone: "grid",
          title: "Renting — on the grid",
          items: ["A payment with no end date", "Rises every year, forever", "Outages are someone else's decision"],
        },
        right: {
          tone: "stable",
          title: "Owning — fully backed up",
          items: ["A fixed payment that ends", "Most pay it off in five to seven years", "The home stays on regardless"],
        },
      },
      { type: "subhead", text: "The silly questions" },
      {
        type: "text",
        text: "Start from their actual bill. Then walk the ladder. Every question here has one obvious answer, and the homeowner gives it to you.",
      },
      {
        type: "say",
        paras: [
          "So you're already paying a hundred and fifty dollars every single month to rent your electricity from the power company.",
          "Now, silly question — how long are you going to have to pay for electricity?",
        ],
      },
      { type: "text", text: "They say forever. Then:" },
      {
        type: "say",
        paras: ["Another silly question. Do you think that bill stays at a hundred and fifty, or does it go up, or does it go down?"],
      },
      { type: "text", text: "They say up. Then:" },
      {
        type: "say",
        paras: [
          "Right. Just with inflation, rates go up around four percent a year. Do you think the power company stops at inflation?",
          "Let me ask you this. If you were the power company, and people were pulling more and more electricity off your grid every year — would you charge them more, or less?",
        ],
      },
      { type: "text", text: "They say more. Then close the ladder:" },
      {
        type: "say",
        paras: [
          "Of course. The power company is a business, they have to make their money. So they raise rates on top of inflation, every year.",
          "Now take that increase, put it on top of a hundred and fifty dollars, and compound it out. That gets scary pretty fast.",
        ],
      },
      {
        type: "rule",
        tone: "alert",
        label: "Double tap here",
        text: "Before you move on, ask it directly: “Does that make sense? Any questions on renting versus owning?” If they doubt any part of it, you want to hear it now. An objection you take here is one you do not take at the proposal.",
      },
      { type: "subhead", text: "Reallocate, do not add" },
      {
        type: "say",
        paras: [
          "All we're doing on the owning side is reallocating the money you're already spending to stay on the grid, and putting it toward you owning all of your electricity instead.",
        ],
      },
      { type: "subhead", text: "Hype them into the number" },
      {
        type: "text",
        text: "Be assumptive here. You are putting the homeowner in a good emotional state on purpose, so the high price conditioning does not draw an objection.",
      },
      {
        type: "say",
        paras: [
          "You already know this — you're a solar owner, you own your house, you own your cars. You know owning is a luxury. Not everybody even qualifies for it.",
          "And you also know that owning something costs more monthly. You know that, right?",
        ],
      },
      { type: "subhead", text: "Condition high" },
      {
        type: "text",
        text: "Name a monthly figure above where the payment will actually land. You want them agreeing to a bigger number than the one you are going to show them.",
      },
      {
        type: "say",
        paras: [
          "So in this case — owning all of your electricity, fully off the grid, fully backed up. Let's say that runs three hundred and fifty a month.",
          "The difference is that number is fixed. It doesn't go up. And most people pay this off in five to seven years — we give you up to fifteen if you want it.",
        ],
      },
      {
        type: "rule",
        tone: "brand",
        label: "Why you condition above",
        text: "If they agree at the conditioned number and the proposal comes in under it, the proposal is good news. If you condition at or below the real payment, the proposal is bad news. Same deal, opposite reaction.",
      },
      { type: "subhead", text: "The double zero" },
      { type: "text", text: "Two questions. The homeowner has to say zero out loud, twice, before you go anywhere." },
      { type: "say", paras: ["So when that system is paid off — how much are you paying for electricity?"] },
      {
        type: "text",
        text: "Guide them if needed: they pay the connection fee, and that is it. They are not paying for electricity. That is your first zero.",
      },
      { type: "say", paras: ["And now you're fully off the grid with full home backup — how many outages are you sitting through?"] },
      { type: "text", text: "That is your second zero." },
      {
        type: "rule",
        tone: "alert",
        label: "Do not move without both",
        text: "If the homeowner has not said zero twice, they have not understood what they are buying. Stay here until they say it.",
      },
      { type: "subhead", text: "Close on the concept" },
      {
        type: "say",
        paras: [
          "Now imagine renting had nothing to do with the power company. And imagine owning had nothing to do with being off the grid. Just the two words — which one would you rather?",
        ],
      },
      { type: "text", text: "They say own. Do not take the win and move on." },
      { type: "say", paras: ["Why?"] },
      { type: "text", text: "Let them list it. It has an end date. No more outages. It saves money over time. Keep pulling until they are finished." },
      {
        type: "rule",
        tone: "alert",
        label: "This is the whole point",
        text: "A yes without reasons is not a close — it is politeness. The reasons the homeowner gives you here are what carry them through the proposal, and they are the reasons you hand back to them if anything wobbles later. Get all of them before you say a word about urgency.",
      },
      { type: "say", paras: ["Perfect."] },
    ],
  },
  {
    n: 9,
    title: "Urgency",
    purpose: "Give accurate, substantiated reasons this happens now rather than later.",
    blocks: [
      { type: "say", paras: ["This is why everyone is getting qualified for extra production and full home backup today."] },
      {
        type: "do",
        label: "Two points",
        items: [
          "<strong>Compatibility</strong> — confirming now that we can get this specific home the panels it needs and a generator that fully backs it up.",
          "<strong>Supply and demand</strong> — as utilities move to NEM 2 style billing, more homeowners add production; as outages increase, more homeowners add backup. Demand rises against fixed supply.",
        ],
      },
    ],
  },
  {
    n: 10,
    title: "Service and Warranties",
    purpose: "Explain what they are covered on and how the production side is delivered.",
    blocks: [
      {
        type: "do",
        label: "Cover in order",
        items: [
          "Generator manufacturer warranty and installation warranty",
          "Ongoing service, monitoring and scheduled maintenance",
          "Twenty-five year manufacturer warranty on panels, plus workmanship coverage",
          "Two-step installation — generator first, panel crew follows",
        ],
      },
      {
        type: "say",
        paras: [
          "Our goal isn't just to put in a generator. We're taking over your system — the generator, the panels, the monitoring, the service. One company to call.",
        ],
      },
      { type: "subhead", text: "The production package" },
      {
        type: "text",
        text: "The panel portion is delivered as an incentive built into the project and funded at generator installation. Funds are disbursed to the company, and the panels are supplied to the homeowner at our cost. This structure is approved by the lender.",
      },
      {
        type: "say",
        paras: [
          "The way we handle the panels is simple. There's an incentive built in at the generator install, and that's what covers the panels — they come to you at our cost, direct.",
          "Those panels carry a twenty-five year manufacturer warranty, and we cover the workmanship.",
        ],
      },
    ],
  },
  {
    n: 11,
    title: "Next-Step Closing",
    purpose: "Move to paperwork as the continuation of an agreement already reached.",
    blocks: [
      { type: "say", paras: ["Before I show you where you qualified — is there anything at all you want to raise with me at this point?"] },
      {
        type: "rule",
        tone: "alert",
        label: "Ask it every time",
        text: "A concern that never reaches the table stays in the homeowner's head and returns as a cancellation two days later. Inviting it is faster than discovering it.",
      },
      {
        type: "say",
        paras: [
          "Next steps are simple. I'll walk you through the proposal, and as long as everything lines up with what we've talked about, I'll qualify you and get you signed up. Sound good?",
        ],
      },
      {
        type: "do",
        label: "Then walk the process so nothing at install is a surprise",
        items: [
          "Sign the agreement and the proposal today.",
          "Short welcome call with our team.",
          "Project manager calls the next day and takes over — you keep your rep.",
          "They handle permitting; the homeowner does nothing.",
          "Generator install is scheduled and takes a few hours.",
          "Panel crew follows on a separate date.",
        ],
      },
    ],
  },
  {
    n: 12,
    title: "Show the Proposal",
    purpose: "Present numbers to a homeowner who has already agreed to everything the numbers represent.",
    blocks: [
      { type: "text", text: "Walk the pricing breakdown line by line. Do not rush it and do not talk over it." },
      {
        type: "say",
        paras: ["Here's the breakdown. Walk through it with me — what stands out?", "Does this make sense? Any questions at all?"],
      },
      {
        type: "rule",
        tone: "alert",
        label: "If you get pushback here",
        text: "Pushback at the proposal means something upstream was skipped — a soft pre-frame, a thin wants and needs, or a rent-versus-own where they never told you why they would rather own. Go back to that step rather than defending the number.",
      },
    ],
  },
  {
    n: 13,
    title: "Sign",
    purpose: "Complete the paperwork cleanly.",
    blocks: [
      {
        type: "say",
        paras: ["Great — next step is to go into your email and complete the DocuSign. I'm right here if anything comes up."],
      },
      {
        type: "rule",
        tone: "alert",
        label: "Before any signature",
        text: "Confirm every decision-maker is present and that the homeowner has had a full opportunity to ask questions. A signature obtained without both is a cancellation with a delay built into it.",
      },
      {
        type: "rule",
        label: "Do not stall",
        text: "Once they have confirmed it makes sense, move. Waiting for an enthusiastic verbal yes that never comes talks homeowners out of decisions they already made — but make sure they have genuinely agreed before you direct them to sign.",
      },
    ],
  },
];

/* ── Reference material ───────────────────────────────────────────────────── */

const PRODUCT_REFERENCE = [
  ["Standard unit", "22 kW — backs up a home to roughly 4,500 sq ft in full"],
  ["Transfer", "Automatic. Approximately 15 seconds from outage to generator power"],
  ["Load limits", "Carries AC and full home loads — no need to pick a handful of essential circuits"],
  ["No natural gas", "$2,500 adder for propane tank. Typically 200 gallons, or two 100-gallon tanks"],
  ["Tank fill", "Coordinated with local supplier; homeowner maintains the tank thereafter"],
  ["Solar during outage", "Solar does not run the home without storage. Generator carries the load; solar returns when the grid does"],
  ["Panel pricing", "$350 per panel"],
  ["Panel warranty", "25-year manufacturer warranty plus workmanship"],
  ["Install sequence", "Generator first, panel crew follows on a separate date"],
  ["Inverter", "If an additional inverter is required it comes with the panel install at no additional homeowner cost"],
  ["Roof full", "Pivot the production side to spray foam — attic and crawlspace — and sell it the same way"],
  ["Commercial property", "No home improvement financing. Business loan or cash only"],
  ["Financing", "GreenSky is current first look. Do not place generators with Service Finance."],
];

const STANDING_REQUIREMENTS = [
  "Thirty minutes of relationship before any problem is raised. No exceptions.",
  "Read rates off the bill in front of you. Do not quote figures from memory or from another customer.",
  "Claim rolling blackouts only where they demonstrably occur in that utility's territory.",
  "State the limits of the product out loud before the homeowner finds them.",
  "Confirm every decision-maker is present before presenting the proposal.",
  "Where a homeowner states a clear reason they will not sign today, book a specific follow-up rather than pushing through it.",
];

/* ── Contents rail ─────────────────────────────────────────────────────────
   These ids MUST match the ids rendered below — NotesToc resolves them with
   getElementById, so a typo silently produces a dead link and a rail that never
   highlights. */
const TOC = [
  {
    id: "frame",
    label: "The Frame",
    items: [],
  },
  {
    id: "flow",
    label: "Sales Flow",
    items: FLOW.map((s) => ({ id: `stage-${s.n}`, label: `${s.n}. ${s.title}` })),
  },
  {
    id: "reference",
    label: "Reference",
    items: [
      { id: "ref-product", label: "Product and Operations" },
      { id: "ref-standing", label: "Standing Requirements" },
    ],
  },
];

/* ── Renderers ────────────────────────────────────────────────────────────── */

function Block({ b }) {
  if (b.type === "subhead") {
    return <span className="note-subhead">{b.text}</span>;
  }

  if (b.type === "text") {
    return <p className="note-purpose">{b.text}</p>;
  }

  // Shaded block = spoken word for word. The single most important visual
  // distinction in the document, so it never shares styling with anything else.
  if (b.type === "say") {
    return (
      <div className="note-say">
        {b.paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  if (b.type === "do") {
    return (
      <div className="note-block">
        {b.label && <span className="note-block-label">{b.label}</span>}
        <ul className="note-dos">
          {b.items.map((t, i) => (
            // Authored copy only — the strings live in this file, never user input.
            <li key={i} dangerouslySetInnerHTML={{ __html: t }} />
          ))}
        </ul>
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

  // Labelled rule box. tone "alert" is a hard rule the rep does not get to
  // interpret; "brand" explains why something works; the default gold is guidance.
  if (b.type === "rule") {
    return (
      <div className={`note-rule ${b.tone || ""}`}>
        <span className="note-rule-label">{b.label}</span>
        <p>{b.text}</p>
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

function Stage({ s }) {
  return (
    <section className="note-stage" id={`stage-${s.n}`}>
      <div className="note-stage-head">
        <span className="note-num">{s.n}</span>
        <div>
          <h3 className="note-stage-title">{s.title}</h3>
        </div>
      </div>

      <p className="note-purpose">
        <strong>Purpose.</strong> {s.purpose}
      </p>

      {s.blocks.map((b, i) => (
        <Block b={b} key={i} />
      ))}
    </section>
  );
}

export default function NotesPage() {
  return (
    <main className="note-main">
      <header className="note-header">
        <span className="note-eyebrow">Internal — Field Guide</span>
        <h1>
          Generator <span>Sales Flow</span>
        </h1>
        <p className="note-motto">Solve the power bill. Solve the backup. Take over the system.</p>
        <p className="note-sub">Field guide · Generator + Production Package</p>
        <div className="note-jump">
          <a href="#frame">The Frame</a>
          <a href="#flow">The 13 Stages</a>
          <a href="#ref-product">Product Reference</a>
          <a href="#ref-standing">Standing Requirements</a>
        </div>
      </header>

      <div className="note-layout">
        <NotesToc groups={TOC} />

        <div className="note-content">
          <section className="note-frame" id="frame">
            <h2>The Frame</h2>
            <p>
              This flow solves two problems for the homeowner at the same time: the power bill they
              are still paying, and the fact that their home has no backup when the grid goes down.
            </p>
            <p>
              The package is a generator plus added production, delivered together, with warranty and
              service behind it.
            </p>
            <p>
              The critical distinction: <strong>a generator does not reduce a power bill.</strong> It
              powers the home when the grid goes down, and that is all it does. The bill is solved by
              adding production — panels — or, where the roof is full, by reducing load with spray
              foam.
            </p>
            <div className="note-rule brand">
              <span className="note-rule-label">Why this works</span>
              <p>
                Building the array past full offset — roughly 130 percent — banks enough extra
                production that the homeowner stops feeling the credit loss on their bill. That is
                what solves the power bill. The generator is what solves the outage.
              </p>
            </div>
          </section>

          <div className="note-key">
            <span className="note-key-item">
              <span className="note-key-swatch say" aria-hidden="true" />
              Shaded blocks are spoken, word for word
            </span>
            <span className="note-key-item">
              <span className="note-key-swatch act" aria-hidden="true" />
              Bulleted lists are actions you take
            </span>
            <span className="note-key-item">
              Do not advance until the current stage is complete and the homeowner has verbally
              agreed.
            </span>
          </div>

          <div className="note-flowhead" id="flow">
            <h2>The Flow</h2>
            <p className="note-attrib">VECHTER Home Solutions · Generator + Production Package</p>
            <p className="note-tagline">
              Thirteen stages, in order. Each one earns the right to the next.
            </p>
          </div>

          <nav className="note-flow" aria-label="Sales flow stages">
            {FLOW.map((s) => (
              <a className="note-flow-item" key={s.n} href={`#stage-${s.n}`}>
                <span className="note-flow-num">{s.n}</span>
                {s.title}
              </a>
            ))}
          </nav>

          {FLOW.map((s) => (
            <Stage key={s.n} s={s} />
          ))}

          <div className="note-flowhead" id="reference">
            <h2>Product and Operations Reference</h2>
            <p className="note-tagline">The figures a rep is expected to know without looking them up.</p>
          </div>

          <section className="note-stage" id="ref-product">
            <div className="note-table-wrap">
              <table className="note-table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCT_REFERENCE.map(([item, detail]) => (
                    <tr key={item}>
                      <td>{item}</td>
                      <td>{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="note-rule" style={{ marginTop: "1.1rem", marginBottom: 0 }}>
              <span className="note-rule-label">Install timelines</span>
              <p>
                Vary by market and change as volume grows. Confirm the current window with operations
                before quoting a date to a homeowner.
              </p>
            </div>
          </section>

          <section className="note-stage note-guard" id="ref-standing">
            <h3 className="note-stage-title">Standing Requirements</h3>
            <p className="note-purpose">
              These apply at every appointment, in every market, regardless of which stage you are in.
            </p>
            <ul className="note-guard-list">
              {STANDING_REQUIREMENTS.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
            <div className="note-standard">
              <span className="note-standard-label">Standard</span>
              <p>
                A signature obtained by moving past an unresolved concern is not a sale. It costs the
                representative the commission, the company the acquisition cost and the funding
                relationship, and the homeowner their trust in the industry.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
