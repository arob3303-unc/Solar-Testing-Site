// Verifies the /notes PIN and issues the access cookie.
//
// The PIN is compared server-side and never reaches the client bundle. The cookie
// is httpOnly so page scripts can't read it back out.

import { NOTES_COOKIE, expectedToken, isConfigured, pinMatches } from "@/lib/notesAuth";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(request) {
  // Distinguish "wrong PIN" from "server has no PIN set" — otherwise a missing
  // Vercel env var looks identical to a typo and is painful to diagnose.
  if (!isConfigured()) {
    return Response.json(
      { ok: false, error: "Notes access is not configured on the server (NOTES_PIN / NOTES_SECRET)" },
      { status: 503 }
    );
  }

  let pin = "";
  try {
    ({ pin } = await request.json());
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (!pinMatches(pin)) {
    return Response.json({ ok: false, error: "Incorrect PIN" }, { status: 401 });
  }

  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    [
      `${NOTES_COOKIE}=${await expectedToken()}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${THIRTY_DAYS}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
  return res;
}
