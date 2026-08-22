import Link from "next/link";
import { VechterLogo } from "@/components/VechterMark";

// Internal gateway, not a marketing page. Its first job is to put a rep on the right
// path in one click — setter or auditor — so the routing panels sit above everything
// else and nothing competes with them.
//
// The service cards and the trust block stay underneath as reference: a rep reviewing
// what we sell, and a page that still reads like a real company if a homeowner
// glances over a shoulder.
//
// Notes is deliberately absent from this page. It lives in the header, top right.

const SERVICES = [
  {
    icon: "☀️",
    title: "Complete Solar Systems",
    body: "Design, permitting and installation of a full system sized to what your home actually uses — not a template.",
  },
  {
    icon: "🔧",
    title: "System Takeover",
    body: "Inherited a system from a company that disappeared? We take over the equipment, the monitoring and the service.",
  },
  {
    icon: "🔋",
    title: "Additional Production Panels",
    body: "Still paying a power bill with solar on the roof? Added production closes the gap the original build left open.",
  },
  {
    icon: "⚡",
    title: "Whole-Home Backup Power",
    body: "A 22 kW standby generator that picks up the entire home automatically when the grid goes down — not a few circuits.",
  },
  {
    icon: "🧊",
    title: "Spray Foam Insulation",
    body: "Attic and crawlspace encapsulation. Where the roof is full, cutting the load does what more panels cannot.",
  },
  {
    icon: "🏠",
    title: "Roofing",
    body: "Full roof replacement and repair, coordinated with your array so panels come off and go back on once.",
  },
  {
    icon: "🛡️",
    title: "Security Systems",
    body: "Cameras, monitoring and smart entry, installed and supported by the same team that handles your power.",
  },
  {
    icon: "🧰",
    title: "Anything Home-Related",
    body: "If it affects how your home runs, costs or protects you, we either handle it or we know exactly who does.",
  },
];

const TRUST = [
  {
    title: "Warranty and service in-house",
    body: "Panels and generators are both covered, and we service what we install. No chasing a manufacturer.",
  },
  {
    title: "One company to call",
    body: "The panels, the generator, the monitoring and the service all sit with the same team.",
  },
  {
    title: "We do the paperwork",
    body: "Permitting and utility coordination are handled for you. A project manager owns it start to finish.",
  },
];

export default function Home() {
  return (
    <main className="home-main">
      <section className="gateway-hero">
        <VechterLogo size={76} />
        <div className="home-rule" />
        <p>Choose your role to get to the right tools.</p>
      </section>

      <section className="gateway" aria-label="Choose your role">
        <Link className="gateway-panel" href="/setters">
          <span className="gateway-role">Setters</span>
          <h2>At the door</h2>
          <p>
            Everything for setting the appointment — the approach, qualifying the homeowner, and
            booking the assessment.
          </p>
          <span className="gateway-go">Open setter tools →</span>
        </Link>

        <Link className="gateway-panel is-primary" href="/audit">
          <span className="gateway-role">Auditors</span>
          <h2>Start with the assessment</h2>
          <p>
            Run the two tests on the homeowner&apos;s system — production and consumption — then walk
            them through what it found and the options for closing the bill.
          </p>
          <span className="gateway-go">Start with the assessment →</span>
        </Link>
      </section>

      <section>
        <div className="home-section-head">
          <h2>What we handle</h2>
          <p>
            Complete coverage for the systems that keep a home powered, protected and comfortable.
            Hover any card for detail.
          </p>
        </div>
        <div className="home-services">
          {SERVICES.map((s) => (
            // A button, not a div: the description is only reachable by hovering,
            // which leaves it invisible to keyboards and to touch. Focus flips the
            // card too, so tab and tap both work.
            <button type="button" className="flip-card" key={s.title}>
              <span className="flip-inner">
                <span className="flip-face flip-front">
                  <span className="home-service-icon" aria-hidden="true">
                    {s.icon}
                  </span>
                  <span className="flip-title">{s.title}</span>
                </span>
                <span className="flip-face flip-back">
                  <span className="flip-back-title">{s.title}</span>
                  <span className="flip-body">{s.body}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-trust">
        <h2>Built to still be here in fifteen years</h2>
        <p>
          Most homeowners we meet were sold a system by a company that is no longer answering the
          phone. Everything below exists so that never becomes your problem twice.
        </p>
        <div className="home-trust-grid">
          {TRUST.map((t) => (
            <div className="home-trust-item" key={t.title}>
              <strong>{t.title}</strong>
              <span>{t.body}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
