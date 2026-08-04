import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: "Whole-Home Energy Audit",
  description: "Backup power & energy audit — Generac standby generators and solar.",
};

// Next already emits width=device-width,initial-scale=1; declaring it keeps the
// intent explicit alongside themeColor, which tints the Android Chrome address bar
// and the iOS status bar area so they don't sit light against the dark app.
// Zoom is deliberately NOT capped — maximumScale/userScalable would block pinch-zoom,
// which people with low vision rely on.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0c10",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Flex column so the footer sits after content on short pages without
          floating over the full-height landing/intake screens. */}
      <body>
        <div className="app-shell">{children}</div>
        <SiteFooter />
      </body>
      <Analytics />
    </html>
  );
}
