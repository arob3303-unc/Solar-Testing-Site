import "./globals.css";
import { Inter, Fraunces } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuditProvider from "@/components/AuditProvider";
import { Analytics } from "@vercel/analytics/next";

// Two faces, one job each: Fraunces carries the wordmark, headings and every large
// figure (it is what makes the report read as a document rather than a web form);
// Inter carries body copy, forms and dense UI. Both are exposed as CSS variables so
// globals.css owns the actual assignment — see --font / --font-display there.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata = {
  title: "VECHTER Home Solutions",
  description:
    "Complete solar systems, whole-home backup power, spray foam, roofing and security — one company for everything your home runs on.",
};

// Next already emits width=device-width,initial-scale=1; declaring it keeps the
// intent explicit alongside themeColor, which tints the Android Chrome address bar
// and the iOS status bar so they match the dark green site header.
// Zoom is deliberately NOT capped — maximumScale/userScalable would block pinch-zoom,
// which people with low vision rely on.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06331d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      {/* Flex column so the footer sits after content on short pages without
          floating over the full-height intake screens. */}
      <body>
        <SiteHeader />
        {/* The audit result lives here rather than in /audit so the pitch page can
            read it after a route change. */}
        <AuditProvider>
          <div className="app-shell">{children}</div>
        </AuditProvider>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
