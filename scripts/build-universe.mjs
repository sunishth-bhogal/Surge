/**
 * Turns the official NASDAQ Trader symbol-directory files into the universe
 * Splash searches over. Run with `npm run build:universe` after refreshing
 * scripts/*.txt from https://www.nasdaqtrader.com/dynamic/symdir/
 *
 * Symbols, company names, exchanges and the ETF flag are all real. Prices are
 * not in here — those are synthesised at runtime (see src/lib/quote-engine.ts).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const EXCHANGE = {
  Q: "NASDAQ",
  N: "NYSE",
  A: "NYSE American",
  P: "NYSE Arca",
  Z: "Cboe BZX",
  V: "IEX",
  F: "TXSE",
};

/** Security names carry a long legal suffix; the company name is the useful part. */
function cleanName(raw) {
  let name = raw.split(" - ")[0];
  name = name.replace(
    /\s+(Common Stock|Common Shares|Ordinary Shares|Class [A-Z] (Common Stock|Ordinary Shares)|American Depositary Shares?|Depositary Shares?|Warrants?|Units?|Rights?)\b.*$/i,
    "",
  );
  name = name.replace(/,?\s+(Inc|Corp|Corporation|Ltd|Limited|plc|N\.V\.|S\.A\.)\.?$/i, (m) => m);
  return name.trim().replace(/\s{2,}/g, " ");
}

function parse(file, map) {
  const lines = readFileSync(join(here, file), "utf8").trim().split("\n");
  const header = lines[0].split("|");
  const rows = [];
  for (const line of lines.slice(1)) {
    // The directory files end with a "File Creation Time" footer row.
    if (line.startsWith("File Creation Time")) continue;
    const cells = line.split("|");
    const row = Object.fromEntries(header.map((h, i) => [h, cells[i]]));
    const parsed = map(row);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

const nasdaq = parse("nasdaqlisted.txt", (r) => {
  if (r["Test Issue"] === "Y") return null;
  if (!r.Symbol || !r["Security Name"]) return null;
  return {
    t: r.Symbol.trim(),
    n: cleanName(r["Security Name"]),
    x: "NASDAQ",
    e: r.ETF === "Y" ? 1 : 0,
  };
});

const other = parse("otherlisted.txt", (r) => {
  if (r["Test Issue"] === "Y") return null;
  const symbol = (r["ACT Symbol"] || "").trim();
  if (!symbol || !r["Security Name"]) return null;
  return {
    t: symbol,
    n: cleanName(r["Security Name"]),
    x: EXCHANGE[r.Exchange] ?? "Other",
    e: r.ETF === "Y" ? 1 : 0,
  };
});

// Dedupe: a handful of symbols appear in both files.
const seen = new Map();
for (const row of [...nasdaq, ...other]) {
  if (!row.t || row.t.includes("$")) continue; // skip preferred/when-issued lines
  if (!seen.has(row.t)) seen.set(row.t, row);
}

const universe = [...seen.values()].sort((a, b) => a.t.localeCompare(b.t));

writeFileSync(
  join(here, "..", "src", "data", "universe.json"),
  JSON.stringify(universe),
);

const etfs = universe.filter((u) => u.e).length;
console.log(
  `universe.json: ${universe.length} securities (${universe.length - etfs} stocks, ${etfs} ETFs)`,
);
