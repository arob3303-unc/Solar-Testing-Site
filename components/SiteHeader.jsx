"use client";

// Site-wide header: wordmark on the left, the two working tabs on the right.
//
// Client component solely for usePathname() — the active-tab state. Everything else
// here is static.
//
// Notes lives HERE and nowhere else. It is internal reference material, so it gets one
// permanent home in the top right rather than being repeated as a button beside the
// working CTAs, where it competes with the action a rep actually came to take.

import Link from "next/link";
import { usePathname } from "next/navigation";
import VechterMark from "@/components/VechterMark";

// Left to right in the order a rep works: run the assessment, run the door
// presentation, look something up.
const TABS = [
  { href: "/audit", label: "Auditors" },
  { href: "/setters", label: "Setters" },
  { href: "/notes", label: "Notes" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-wordmark" href="/">
          <VechterMark />
          <span className="site-wordmark-text">
            <span className="site-wordmark-name">VECHTER</span>
            <span className="site-wordmark-sub">Home Solutions</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          {TABS.map((t) => {
            // startsWith so /notes and any future nested route keep the tab lit.
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`nav-tab ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
