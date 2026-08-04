// AI energy-audit endpoint.
//
// Flow:
//   1. Receive the intake `form` from the client.
//   2. Compute the AUTHORITATIVE recommendation server-side (single source of truth).
//   3. Build the prompt and call Anthropic.
//   4. Parse the model output defensively (strip ```json fences, try/catch).
//   5. Validate the model echoed back the exact product list; the server's list wins
//      regardless, so a misbehaving model can never surface a wrong product.
//
// ANTHROPIC_API_KEY stays server-side — never exposed to the client.

import { getRecommendation, productsMatch } from "@/lib/recommendation";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import { planPanels } from "@/lib/rates";

/** Pull a JSON object out of a model response that may be fenced or padded. */
function parseModelJson(text) {
  if (!text || typeof text !== "string") return null;
  let s = text.trim();
  // Strip ```json … ``` or ``` … ``` fences if present.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // Fall back to the first {...} block if there's stray prose around it.
  if (!s.startsWith("{")) {
    const brace = s.match(/\{[\s\S]*\}/);
    if (brace) s = brace[0];
  }
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const form = body?.form;
  if (!form || typeof form !== "object") {
    return Response.json({ error: 'Missing "form" in request body' }, { status: 400 });
  }

  // Authoritative recommendation — computed here, not trusted from the client.
  const rec = getRecommendation({ hasSolar: form.hasSolar, hasBill: form.hasBill });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { rec, report: null, error: "ANTHROPIC_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        // Same planPanels() the dashboard renders from, so the report agrees with the UI.
        messages: [{ role: "user", content: buildUserPrompt(form, rec, planPanels({ utilityKwh: form.utilityKwh })) }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Return rec so the UI still shows the correct products even if the prose fails.
      return Response.json(
        { rec, report: null, error: data.error?.message || "Anthropic API Error" },
        { status: response.status }
      );
    }

    const raw = data.content?.map((c) => c.text || "").join("") || "";
    const parsed = parseModelJson(raw);

    // Defensive: if the model didn't return valid JSON, fall back to treating the
    // whole response as the report body so the dashboard never crashes.
    const report = parsed?.report ?? (raw || null);
    const modelProducts = Array.isArray(parsed?.products) ? parsed.products : null;
    const productMismatch = modelProducts ? !productsMatch(modelProducts, rec.products) : true;

    return Response.json({
      rec, // authoritative — the UI renders products from this, never from the model
      report,
      productMismatch,
    });
  } catch (error) {
    return Response.json({ rec, report: null, error: error.message }, { status: 500 });
  }
}
