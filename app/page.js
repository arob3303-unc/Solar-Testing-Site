import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <h1>
        Keep the lights on with a <span>whole-home energy audit</span>
      </h1>
      <p>
        See how a Generac standby generator and, if you already have solar, additional panels
        can protect your home from outages and cut your energy costs.
      </p>
      <Link className="cta" href="/audit">
        Start your audit →
      </Link>
      {/* Internal closer reference — deliberately understated next to the CTA. */}
      <Link className="ghost-link" href="/notes">
        📋 notes
      </Link>
    </main>
  );
}
