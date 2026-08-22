"use client";

// Persistent disclaimer, rendered from the root layout on every page that shows
// estimated figures.
//
// Deliberately NOT on the landing page: nothing there is a projection, a sizing or a
// savings figure, so the disclaimer has nothing to disclaim and only makes a
// marketing page look hedged. It appears the moment the audit does.
//
// The full Terms page is parked in app/_terms/ (Next treats an underscore-prefixed
// folder as private, so it is not routed). If it goes live again, rename that folder
// to `terms` and restore the link at the end of this paragraph:
//   <Link href="/terms">Terms &amp; Disclaimers</Link>
// Until then this paragraph stands alone, so it has to carry the disclosure by
// itself — do not trim it down expecting a Terms page to catch the rest.

import { usePathname } from "next/navigation";

/** Routes with no estimated figures on them. */
const NO_DISCLAIMER = ["/", "/setters"];

export default function SiteFooter() {
  const pathname = usePathname();
  if (NO_DISCLAIMER.includes(pathname)) return null;

  return (
    <footer className="site-footer">
      <p>
        <strong>Estimates only.</strong> This VECHTER Home Solutions tool produces preliminary,
        non-binding estimates using automated calculations, AI-generated written analysis, and
        third-party data that may be incomplete or out of date. Nothing here is a quote, contract,
        offer, guarantee of savings or performance, or engineering, electrical, financial, tax, or
        legal advice. Equipment sizing, panel counts, bill projections, and savings figures are
        estimates only and require an on-site assessment to confirm.
      </p>
    </footer>
  );
}
