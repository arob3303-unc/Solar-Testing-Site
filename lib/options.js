// ─────────────────────────────────────────────────────────────────────────────
// The options presented after the assessment.
//
// Every option is a route to the SAME outcome for the homeowner: the electric bill
// goes away, because added production is funded as an incentive inside whichever
// project they choose. What differs is the project itself.
//
// The generator option is the only one that also solves the outage. On every other
// option we assume the home already has some form of backup — that is why those
// pages never raise the missing-backup problem.
//
// Content only. No pricing lives here: numbers are quoted on site.
// ─────────────────────────────────────────────────────────────────────────────

/** The panel package, worded identically wherever it appears. */
export const PANEL_PACKAGE = {
  label: "Added production included",
  short: "Panels are built into the project as an incentive and come at our cost.",
  detail:
    "The panel portion is delivered as an incentive built into the project and funded at installation. Funds are disbursed to the company and the panels are supplied to the homeowner at our cost — which is what closes the power bill, and why it does not appear as a separate line the homeowner finances.",
  warranty: "Panels carry a manufacturer warranty and we cover the workmanship.",
};

export const OPTIONS = [
  {
    slug: "generator",
    icon: "⚡",
    title: "Whole-Home Backup",
    subtitle: "22 kW standby generator",
    solves: "Outages and the bill",
    summary:
      "The whole home carries automatically when the grid goes down, in about fifteen seconds. The only option that solves the outage as well as the bill.",
    includesPanels: true,
  },
  {
    slug: "spray-foam",
    icon: "🧊",
    title: "Spray Foam Insulation",
    subtitle: "Attic and crawlspace encapsulation",
    solves: "The bill, by cutting the load",
    summary:
      "Where the roof has no room left for panels, reducing what the home uses does what more production cannot. Also the most comfortable the house will ever be.",
    includesPanels: true,
    hero: "Stop paying to heat and cool the outside",
    lede: "Most of what an older home wastes leaves through the attic and the crawlspace. Encapsulating both cuts the load the system has to cover, which moves the bill the same way added production does — and it works on a roof that is already full.",
    sections: [
      {
        title: "Why this works when panels cannot",
        body: "A bill has two sides: what the home produces and what the home uses. When the roof is full, production is capped — so the only lever left is consumption. Sealing the envelope attacks the same bill from the other direction.",
      },
      {
        title: "What is included",
        items: [
          "Attic encapsulation, sealed at the roof deck",
          "Crawlspace or basement rim-joist sealing",
            "Air-sealing of penetrations, ducts and top plates",
          "Moisture and ventilation assessment before any foam goes in",
        ],
      },
      {
        title: "What the homeowner notices",
        items: [
          "Rooms that were always the hot or cold one even out",
          "The HVAC cycles less and runs shorter",
          "Dust, pollen and humidity drop with the leakage",
        ],
      },
    ],
  },
  {
    slug: "roof",
    icon: "🏠",
    title: "Roof Replacement",
    subtitle: "New roof, panels off and back on once",
    solves: "The roof and the bill",
    summary:
      "An aging roof under an array is a problem that gets more expensive every year it waits. We handle the roof and the array as one project.",
    includesPanels: true,
    hero: "Do the roof once, with the array handled",
    lede: "A solar array on a roof that has ten years left is a scheduling problem. Doing the roof through us means the panels come off and go back on as part of the same job, by people who are responsible for both.",
    sections: [
      {
        title: "Why this is not two projects",
        body: "A roofer who does not do solar will not touch the array, and a solar company that does not roof will not warranty the penetrations. Splitting it is how homeowners end up with two contractors pointing at each other over a leak.",
      },
      {
        title: "What is included",
        items: [
          "Full tear-off and replacement",
          "Array removal and reinstallation, with new flashings and penetrations",
          "Workmanship warranty covering the roof and the mounts together",
          "Permitting and inspection handled",
        ],
      },
    ],
  },
  {
    slug: "home-improvement",
    icon: "🧰",
    title: "Home Improvement Project",
    subtitle: "Whatever the homeowner actually wants",
    solves: "The project and the bill",
    summary:
      "Kitchen, bath, windows, doors, siding, an addition. We project-manage it through our trades, and the production package comes with it.",
    includesPanels: true,
    hero: "The project they were already going to do",
    lede: "Some homeowners do not need a generator or a roof. They need the kitchen done. This is the same structure applied to whatever project they were already planning — with the production package attached, so the power bill goes away alongside it.",
    sections: [
      {
        title: "How it works",
        body: "We scope the project, bring in the trade, and manage it end to end. The homeowner keeps one point of contact — their rep — and one company is accountable for the result.",
      },
      {
        title: "Common projects",
        items: [
          "Kitchen and bathroom remodels",
          "Windows, doors and siding",
          "Additions, decks and outdoor living",
          "HVAC replacement and ductwork",
          "Security systems and smart-home wiring",
        ],
      },
      {
        title: "What we do not do",
        body: "If a project is outside what our trades do well, we say so and point at someone who does it properly. A referral we are not paid on costs less than a job we should not have taken.",
      },
    ],
  },
];

/** Look up one option by its route segment. */
export function getOption(slug) {
  return OPTIONS.find((o) => o.slug === slug) || null;
}

/** Every option except the generator — these render from the shared template. */
export const TEMPLATED_SLUGS = OPTIONS.filter((o) => o.slug !== "generator").map((o) => o.slug);
