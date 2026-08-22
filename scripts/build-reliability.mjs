// Builds data/outage-reliability.json from EIA Form EIA-861.
//
//   node scripts/build-reliability.mjs [year] [--file path/to/f861YYYY.zip]
//
// EIA publishes SAIDI/SAIFI (minutes without power, and number of interruptions, per
// customer per year) only inside the annual EIA-861 archive — there is no API for it.
// This downloads that archive, pulls the Reliability workbook out, and flattens it.
//
// DEPENDENCY-FREE ON PURPose. An .xlsx is a zip of XML and the archive is a zip of
// xlsx files, so a ~90-line zip reader plus a regex pass over the sheet XML does the
// whole job. The alternative was the `xlsx` npm package, which is deprecated on npm
// and would have to be trusted at build time to produce a file we commit anyway.
//
// Re-run once a year when EIA posts a new archive, then commit the JSON.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "data/outage-reliability.json");

/* ── Minimal zip reader ───────────────────────────────────────────────────── */

/** Parse a zip buffer into { name -> Buffer }, inflating deflated entries. */
function unzip(buf) {
  // Locate the End Of Central Directory record by scanning backwards for its
  // signature. The comment field is variable-length, so there is no fixed offset.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65535; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file (no end-of-central-directory record)");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Bad central directory entry");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);

    // The local header repeats the name/extra lengths, and they can DIFFER from the
    // central directory's, so the data offset must be computed from the local header.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    files[name] = method === 0 ? raw : inflateRawSync(raw);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

/* ── Minimal xlsx sheet reader ────────────────────────────────────────────── */

const decodeXml = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");

/** Shared strings table — cells of type "s" index into this. */
function sharedStrings(xlsx) {
  const part = xlsx["xl/sharedStrings.xml"];
  if (!part) return [];
  const xml = part.toString("utf8");
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => decodeXml(t[1])).join("")
  );
}

/** Column reference ("BC") -> zero-based index. */
function colIndex(ref) {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Read a worksheet into an array of row arrays. */
function readSheet(xlsx, part, strings) {
  const xml = xlsx[part].toString("utf8");
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const c of rowMatch[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const idx = colIndex(c[1]);
      const attrs = c[2];
      const body = c[3];
      let val = null;
      if (/t="s"/.test(attrs)) {
        const v = body.match(/<v>([\s\S]*?)<\/v>/);
        if (v) val = strings[Number(v[1])];
      } else if (/t="inlineStr"/.test(attrs)) {
        val = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => decodeXml(t[1])).join("");
      } else {
        const v = body.match(/<v>([\s\S]*?)<\/v>/);
        if (v) val = decodeXml(v[1]);
      }
      cells[idx] = val;
    }
    rows.push(cells);
  }
  return rows;
}

/* ── EIA specifics ────────────────────────────────────────────────────────── */

// EIA writes "." for "not reported". Number(".") is NaN, but Number("") is 0 — which
// would silently become a confident "0 minutes without power". Reject both.
function num(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const round1 = (n) => (n === null ? null : Math.round(n * 10) / 10);
const round2 = (n) => (n === null ? null : Math.round(n * 100) / 100);

// Utilities report under IEEE OR under "Other Standard"; whichever they used, the
// other block is all dots. Columns are documented in the workbook header rows.
const IEEE = { saidiWith: 5, saifiWith: 6, saidiWithout: 8, saifiWithout: 9, customers: 14 };
const OTHER = { saidiWith: 17, saifiWith: 18, saidiWithout: 20, saifiWithout: 21, customers: 23 };

function pickBlock(row) {
  for (const cols of [IEEE, OTHER]) {
    const saidiWith = num(row[cols.saidiWith]);
    const saidiWithout = num(row[cols.saidiWithout]);
    if (saidiWith === null && saidiWithout === null) continue;
    return {
      saidiWithMed: round1(saidiWith),
      saifiWithMed: round2(num(row[cols.saifiWith])),
      saidiWithoutMed: round1(saidiWithout),
      saifiWithoutMed: round2(num(row[cols.saifiWithout])),
      customers: num(row[cols.customers]),
    };
  }
  return null;
}

// "State Totals" sheet. The "Any Standard" block (cols 12-18) is the inclusive one —
// it folds in utilities reporting under either standard, so it covers more customers
// than the IEEE-only block. Prefer it, fall back to IEEE.
const STATE_ANY = { customers: 12, saidiWith: 13, saifiWith: 14, saidiWithout: 16, saifiWithout: 17 };
const STATE_IEEE = { customers: 2, saidiWith: 3, saifiWith: 4, saidiWithout: 6, saifiWithout: 7 };

function pickStateBlock(row) {
  for (const cols of [STATE_ANY, STATE_IEEE]) {
    const saidiWith = num(row[cols.saidiWith]);
    const saidiWithout = num(row[cols.saidiWithout]);
    if (saidiWith === null && saidiWithout === null) continue;
    return {
      saidiWithMed: round1(saidiWith),
      saifiWithMed: round2(num(row[cols.saifiWith])),
      saidiWithoutMed: round1(saidiWithout),
      saifiWithoutMed: round2(num(row[cols.saifiWithout])),
      customers: num(row[cols.customers]),
    };
  }
  return null;
}

/* ── Fetch ────────────────────────────────────────────────────────────────── */

async function download(url) {
  process.stdout.write(`  GET ${url}\n`);
  const r = await fetch(url, {
    headers: { "User-Agent": "VECHTER-Home-Solutions/1.0 (build script)", Accept: "*/*" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const fileArg = args.indexOf("--file");
const localFile = fileArg >= 0 ? args[fileArg + 1] : null;
const year = Number(args.find((a) => /^\d{4}$/.test(a))) || 2023;

console.log(`Building reliability data for ${year}`);

const archive = localFile
  ? readFileSync(resolve(localFile))
  : await download(`https://www.eia.gov/electricity/data/eia861/archive/zip/f861${year}.zip`);

console.log(`  archive ${(archive.length / 1e6).toFixed(1)} MB`);

const outer = unzip(archive);
const wbName = Object.keys(outer).find((n) => /Reliability_\d{4}\.xlsx$/i.test(n));
if (!wbName) throw new Error(`No Reliability workbook in the archive. Found: ${Object.keys(outer).join(", ")}`);
console.log(`  workbook ${wbName}`);

const xlsx = unzip(outer[wbName]);
const strings = sharedStrings(xlsx);

// Sheet order in this workbook: 1 Reliability_States, 2 Reliability_Territories,
// 3 State Totals. Verified against the 2023 file.
const utilityRows = readSheet(xlsx, "xl/worksheets/sheet1.xml", strings);
const stateRows = readSheet(xlsx, "xl/worksheets/sheet3.xml", strings);

/* Utilities — skip the three header rows, keep rows with a name, state and data. */
const utilities = [];
for (const row of utilityRows.slice(3)) {
  const name = (row[2] || "").trim();
  const state = (row[3] || "").trim().toUpperCase();
  if (!name || state.length !== 2) continue;
  const block = pickBlock(row);
  if (!block) continue;
  utilities.push({ name, state, ...block });
}

/* States — EIA's own aggregation, so we are not re-weighting their arithmetic. */
const states = {};
for (const row of stateRows.slice(3)) {
  const state = (row[1] || "").trim().toUpperCase();
  if (state.length !== 2) continue;
  const block = pickStateBlock(row);
  if (block) states[state] = block;
}

/* National — customer-weighted across the states, so big states carry proportionate
   weight. A plain mean would let Wyoming count as much as California. */
function weighted(key) {
  let num_ = 0;
  let den = 0;
  for (const s of Object.values(states)) {
    if (s[key] === null || !s.customers) continue;
    num_ += s[key] * s.customers;
    den += s.customers;
  }
  return den ? num_ / den : null;
}
const national = {
  saidiWithMed: round1(weighted("saidiWithMed")),
  saifiWithMed: round2(weighted("saifiWithMed")),
  saidiWithoutMed: round1(weighted("saidiWithoutMed")),
  saifiWithoutMed: round2(weighted("saifiWithoutMed")),
  customers: Object.values(states).reduce((a, s) => a + (s.customers || 0), 0),
};

const out = {
  source: "U.S. EIA, Form EIA-861 (Reliability)",
  sourceUrl: "https://www.eia.gov/electricity/data/eia861/",
  year,
  generatedAt: new Date().toISOString().slice(0, 10),
  note: "SAIDI = minutes without power per customer per year. SAIFI = interruptions per customer per year. WithMed includes major event days (storms); WithoutMed excludes them.",
  national,
  states,
  utilities,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 0));

console.log(`\n  utilities : ${utilities.length}`);
console.log(`  states    : ${Object.keys(states).length}`);
console.log(`  national  : ${national.saidiWithMed} min with storms / ${national.saidiWithoutMed} min without`);
console.log(`  written   : ${OUT} (${(existsSync(OUT) ? readFileSync(OUT).length / 1024 : 0).toFixed(0)} KB)`);
