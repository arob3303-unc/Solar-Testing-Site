// Server-side PIN gate for /notes.
//
// Next 16 renamed the `middleware` file convention to `proxy` — this file must stay
// at the project root, alongside app/. See node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/proxy.md.
//
// Gating here rather than in the page means the notes markup is never sent to an
// unauthenticated browser. A client-side check would ship the whole pitch guide and
// just hide it, which defeats the point.

import { NextResponse } from "next/server";
import { NOTES_COOKIE, tokenValid } from "@/lib/notesAuth";

export const config = {
  matcher: "/notes/:path*",
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // The unlock screen lives under /notes, so it must be exempt or it can never
  // render and the redirect loops.
  if (pathname === "/notes/unlock") return NextResponse.next();

  const ok = await tokenValid(request.cookies.get(NOTES_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/notes/unlock";
  return NextResponse.redirect(url);
}
