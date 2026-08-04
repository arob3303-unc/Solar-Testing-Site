// Persistent disclaimer, rendered on every page from the root layout.
//
// The full Terms page is parked in app/_terms/ (Next treats an underscore-prefixed
// folder as private, so it is not routed). If it goes live again, rename that folder
// to `terms` and restore the link at the end of this paragraph:
//   <Link href="/terms">Terms &amp; Disclaimers</Link>
// Until then this paragraph stands alone, so it has to carry the disclosure by
// itself — do not trim it down expecting a Terms page to catch the rest.

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        <strong>Estimates only.</strong> This tool produces preliminary, non-binding estimates using
        automated calculations, AI-generated written analysis, and third-party data that may be
        incomplete or out of date. Nothing here is a quote, contract, offer, guarantee of savings or
        performance, or engineering, electrical, financial, tax, or legal advice. Equipment sizing,
        panel counts, bill projections, and savings figures are estimates only and require an on-site
        assessment to confirm.
      </p>
    </footer>
  );
}
