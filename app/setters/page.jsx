"use client";

// The door presentation.
//
// Two phases: a ZIP screen, then the deck as a full-viewport layer.
//
// There is deliberately NO loading step. A setter is standing in front of somebody —
// making them both watch a spinner is dead air at the worst possible moment. The deck
// opens instantly on the hook slide, which needs no data, and the location lookups
// land in the background while the setter is still talking. Deck navigation tracks the
// current slide by ID precisely so the list can grow underneath it without jumping.
//
// THE ONLY INPUT IN THE WHOLE FLOW IS A ZIP CODE. Everything else on screen is either
// written in lib/setterDeck.js or looked up from public data. A setter standing at a
// door is not typing anything else.
//
// The hard requirement running through all of this: a lookup failing must never stop
// the presentation. Every fetch below is allowed to come back empty, and buildDeck()
// drops any slide it cannot honestly fill. A nonsense ZIP still produces a complete,
// truthful deck built on national figures.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VechterLogo } from "@/components/VechterMark";
import Deck from "@/components/setter/Deck";
import { buildDeck } from "@/lib/setterDeck";
import { fetchOutageProfile, generationCoverage } from "@/lib/outages";
import { fetchRate } from "@/lib/rates";
import { fetchReliability } from "@/lib/reliability";

/** Resolve everything the deck needs. Never throws, never returns undefined fields. */
async function resolveLocation(zip) {
  // Geocode and rate in parallel; both tolerate failure internally.
  const [outage, rate] = await Promise.all([
    fetchOutageProfile({ zip }).catch(() => null),
    fetchRate({ zip }).catch(() => null),
  ]);

  const stateAbbr = outage?.stateAbbr || null;
  const stateName = outage?.profile?.stateName || outage?.state || null;
  // fetchRate falls back to a national average constant; only a `live` result is
  // genuinely this address's utility.
  const utilityName = rate?.live ? rate.utilityName || null : null;

  // Sequential by necessity — the reliability lookup needs the state and the utility
  // that the two calls above produce.
  const reliability = await fetchReliability({ stateAbbr, stateName, utilityName });

  return {
    location: {
      place: outage?.located ? outage.place && outage.stateAbbr ? `${outage.place}, ${outage.stateAbbr}` : null : null,
      stateAbbr,
      stateName,
      utilityName,
    },
    reliability,
    coverage: generationCoverage(outage?.profile || {}),
  };
}

function SettersFlow() {
  const params = useSearchParams();
  const deepZip = (params.get("zip") || "").replace(/\D/g, "").slice(0, 5);

  const [zip, setZip] = useState(deepZip);
  // The phase is derivable from the URL, so derive it rather than flipping it from an
  // effect. A deep link is already presenting on first paint.
  const [phase, setPhase] = useState(() => (deepZip.length === 5 ? "deck" : "stage"));
  // null until the lookups land. buildDeck() handles that: it simply yields the slides
  // that need no location data, and the rest appear when the figures arrive.
  const [data, setData] = useState(null);

  // No synchronous setState in here — the first thing it does is await, so it is safe
  // to call from an effect as well as from a submit handler.
  const run = useCallback(async (code) => {
    const resolved = await resolveLocation(code);
    setData(resolved);
  }, []);

  // Submit handler, where a synchronous setState is exactly right.
  const start = useCallback(
    (code) => {
      // Straight into the presentation; the data catches up.
      setPhase("deck");
      run(code);
    },
    [run]
  );

  // ?zip=23112 goes straight in, so a setter can bookmark their territory. The phase
  // is already "deck" from the initializer above, so this only kicks off the lookups.
  //
  // set-state-in-effect is disabled deliberately: run() awaits the network before it
  // touches state, so there is no synchronous setState here and no cascading render —
  // the rule simply cannot see through the async boundary. Starting a fetch on mount
  // is the case effects exist for.
  // exhaustive-deps is disabled because the deep link is read once, at mount, by
  // design; later ZIP changes go through the form instead.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (deepZip.length === 5) run(deepZip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "deck") {
    return (
      <Deck
        // buildDeck(null) is a valid, honest deck — it just has no location figures
        // in it yet. This is what makes opening instantly safe.
        slides={buildDeck(data || {})}
        zip={zip}
        onExit={() => {
          setData(null);
          setPhase("stage");
        }}
      />
    );
  }

  const canStart = zip.length === 5;

  return (
    <main className="setter-stage">
      <div className="setter-stage-card">
        <VechterLogo size={64} />
        <h1>Door Presentation</h1>
        <p className="setter-stage-sub">Enter the ZIP Code you are working in.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) start(zip);
          }}
        >
          <label htmlFor="setter-zip">ZIP Code</label>
          <input
            id="setter-zip"
            className="setter-zip"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            autoComplete="postal-code"
            placeholder="23112"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          />
          <button className="submit-btn" type="submit" disabled={!canStart}>
            Start presentation →
          </button>
        </form>

        <p className="setter-stage-note">
          Works without a correct ZIP Code, it will just run national figures.
        </p>
      </div>
    </main>
  );
}

export default function SettersPage() {
  // useSearchParams needs a Suspense boundary to keep the route statically renderable.
  return (
    <Suspense fallback={<main className="setter-stage" />}>
      <SettersFlow />
    </Suspense>
  );
}
