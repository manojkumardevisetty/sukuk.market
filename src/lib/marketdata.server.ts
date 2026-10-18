/**
 * Free-source market data pipeline.
 *
 * Every source used here is a public, key-less official or open feed:
 *  - US Treasury par yield curve (home.treasury.gov CSV)  -> USD benchmark curve
 *  - Bank Negara Malaysia open API (api.bnm.gov.my)       -> MYR money-market rates
 *  - European Central Bank daily reference rates (XML)    -> FX normalisation
 *  - Google News RSS                                      -> new/upcoming sukuk deal radar
 *
 * The orchestrator is called by a scheduled job every 2 hours.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const UA = "SukukMarketBot/1.0 (+https://sukuk.market)";

type CurvePoint = { tenor: number; rate: number };

async function logRun(source: string, status: "ok" | "error", records: number, message?: string) {
  await supabaseAdmin.from("data_feed_runs").insert({ source, status, records, message: message ?? null });
}

/* ------------------------------------------------------------------ curves */

export async function ingestUstCurve() {
  const year = new Date().getUTCFullYear();
  const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`Treasury ${res.status}`);
  const csv = await res.text();
  const [headerLine, firstRow] = csv.trim().split(/\r?\n/);
  if (!headerLine || !firstRow) throw new Error("Treasury: empty file");

  const headers = splitCsv(headerLine);
  const cells = splitCsv(firstRow);
  const asOf = toIsoDate(cells[0] ?? "");
  const points: CurvePoint[] = [];

  headers.forEach((h, i) => {
    const tenor = tenorToYears(h);
    const value = Number(cells[i]);
    if (tenor != null && Number.isFinite(value)) points.push({ tenor, rate: value });
  });

  await supabaseAdmin.from("benchmark_curves").upsert(
    points.map((p) => ({ curve: "UST", tenor_years: p.tenor, rate: p.rate, as_of: asOf, source: "us-treasury" })),
    { onConflict: "curve,tenor_years,as_of" },
  );

  await logRun("us-treasury-curve", "ok", points.length, `as of ${asOf}`);
  return { asOf, points };
}

export async function ingestBnmRates() {
  const res = await fetch("https://api.bnm.gov.my/public/interest-rate", {
    headers: { accept: "application/vnd.BNM.API.v1+json", "user-agent": UA },
  });
  if (!res.ok) throw new Error(`BNM ${res.status}`);
  const json = (await res.json()) as {
    data: { product: string; date: string; overnight: number | null; "1_week": number | null; "1_month": number | null; "3_month": number | null; "6_month": number | null; "1_year": number | null }[];
  };
  const row = json.data.find((d) => d.product === "interbank") ?? json.data[0];
  if (!row) throw new Error("BNM: no rows");

  const map: [number, number | null][] = [
    [1 / 365, row.overnight],
    [7 / 365, row["1_week"]],
    [1 / 12, row["1_month"]],
    [0.25, row["3_month"]],
    [0.5, row["6_month"]],
    [1, row["1_year"]],
  ];
  const points = map
    .filter(([, r]) => r != null && Number.isFinite(Number(r)))
    .map(([tenor, r]) => ({ curve: "MYR", tenor_years: tenor, rate: Number(r), as_of: row.date, source: "bnm" }));

  if (points.length) {
    await supabaseAdmin.from("benchmark_curves").upsert(points, { onConflict: "curve,tenor_years,as_of" });
  }
  await logRun("bnm-rates", "ok", points.length, `as of ${row.date}`);
  return { asOf: row.date, points: points.map((p) => ({ tenor: Number(p.tenor_years), rate: p.rate })) };
}

export async function ingestEcbFx() {
  const res = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", {
    headers: { "user-agent": UA },
  });
  if (!res.ok) throw new Error(`ECB ${res.status}`);
  const xml = await res.text();
  const asOf = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1] ?? new Date().toISOString().slice(0, 10);

  const perEur = new Map<string, number>();
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) {
    perEur.set(m[1]!, Number(m[2]));
  }
  const usdPerEur = perEur.get("USD");
  if (!usdPerEur) throw new Error("ECB: USD missing");

  // Pegged/managed currencies the ECB does not publish; official pegs.
  const pegged: Record<string, number> = { AED: 1 / 3.6725, SAR: 1 / 3.75, QAR: 1 / 3.64, BHD: 1 / 0.376, OMR: 1 / 0.3845, KWD: 1 / 0.3065 };

  const rows = [
    { currency: "USD", rate_to_usd: 1, as_of: asOf, source: "fixed" },
    { currency: "EUR", rate_to_usd: usdPerEur, as_of: asOf, source: "ecb" },
    ...[...perEur.entries()].map(([ccy, rate]) => ({
      currency: ccy,
      rate_to_usd: usdPerEur / rate,
      as_of: asOf,
      source: "ecb",
    })),
    ...Object.entries(pegged).map(([ccy, rate]) => ({ currency: ccy, rate_to_usd: rate, as_of: asOf, source: "peg" })),
  ];

  await supabaseAdmin
    .from("fx_rates")
    .upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: "currency" });
  await logRun("ecb-fx", "ok", rows.length, `as of ${asOf}`);
  return rows.length;
}

/* ------------------------------------------------------------- repricing */

function interpolate(points: CurvePoint[], tenor: number): number {
  const sorted = [...points].sort((a, b) => a.tenor - b.tenor);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return NaN;
  if (tenor <= first.tenor) return first.rate;
  if (tenor >= last.tenor) return last.rate;
  for (let i = 1; i < sorted.length; i += 1) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    if (tenor <= b.tenor) return a.rate + ((b.rate - a.rate) * (tenor - a.tenor)) / (b.tenor - a.tenor);
  }
  return last.rate;
}

/** Clean price of a semi-annual coupon bond, per 100 face. */
function priceFromYield(couponPct: number, yieldPct: number, years: number): number {
  const n = Math.max(1, Math.round(years * 2));
  const c = (couponPct / 2) * (100 / 100);
  const y = yieldPct / 200;
  let pv = 0;
  for (let t = 1; t <= n; t += 1) pv += c / (1 + y) ** t;
  pv += 100 / (1 + y) ** n;
  return pv;
}

export async function repriceFromCurves(ust: { asOf: string; points: CurvePoint[] }, myr: { asOf: string; points: CurvePoint[] }) {
  const { data: instruments } = await supabaseAdmin
    .from("instruments")
    .select("id, currency, profit_rate, spread_bps, maturity_date, status")
    .neq("status", "matured");

  const now = Date.now();
  const asOf = new Date().toISOString();
  const updates: { id: string; ytm: number; price: number }[] = [];

  for (const row of instruments ?? []) {
    if (!row.maturity_date || row.spread_bps == null) continue;
    const years = (new Date(row.maturity_date).getTime() - now) / (365.25 * 24 * 3600 * 1000);
    if (years <= 0) continue;

    let base: number | null = null;
    if (row.currency === "USD") base = interpolate(ust.points, years);
    else if (row.currency === "MYR") base = interpolate(myr.points, Math.min(years, 1));
    if (base == null || !Number.isFinite(base)) continue;

    const ytm = Number((base + row.spread_bps / 100).toFixed(3));
    const price = Number(priceFromYield(Number(row.profit_rate ?? ytm), ytm, years).toFixed(3));
    updates.push({ id: row.id, ytm, price });
  }

  if (updates.length) {
    await supabaseAdmin.from("price_history").insert(
      updates.map((u) => ({
        instrument_id: u.id,
        price: u.price,
        yield_to_maturity: u.ytm,
        source: "public-curves",
        as_of: asOf,
      })),
    );
    await Promise.all(
      updates.map((u) =>
        supabaseAdmin
          .from("instruments")
          .update({
            indicative_price: u.price,
            yield_to_maturity: u.ytm,
            price_source: "public-curves",
            price_as_of: asOf,
          })
          .eq("id", u.id),
      ),
    );
  }

  await logRun("reprice", "ok", updates.length, `UST ${ust.asOf} / MYR ${myr.asOf}`);
  return updates.length;
}

/* ------------------------------------------------------------- lifecycle */

export async function refreshLifecycle() {
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data } = await supabaseAdmin
    .from("instruments")
    .select("id, issue_date, maturity_date, status");

  let changed = 0;
  for (const row of data ?? []) {
    let next: "listed" | "matured" | "open" | "upcoming" = row.status;
    if (row.maturity_date && row.maturity_date < today) next = "matured";
    else if (row.issue_date && row.issue_date <= today) next = "listed";
    else if (row.issue_date && row.issue_date <= soon) next = "open";
    else if (row.issue_date && row.issue_date > soon) next = "upcoming";

    if (next !== row.status) {
      await supabaseAdmin.from("instruments").update({ status: next }).eq("id", row.id);
      changed += 1;
    }
  }
  await logRun("lifecycle", "ok", changed);
  return changed;
}

/* ------------------------------------------------------------ deal radar */

const QUERIES = [
  '"sukuk" (priced OR issuance OR "order book" OR oversubscribed)',
  'sukuk "upcoming issue" OR "mandates banks" OR "sukuk programme"',
  'sovereign sukuk auction UAE OR "Saudi Arabia" OR Malaysia OR Indonesia OR Qatar OR Bahrain OR Pakistan OR Turkiye',
];

const COUNTRY_HINTS: [RegExp, string][] = [
  [/\b(uae|emirates|dubai|abu dhabi)\b/i, "United Arab Emirates"],
  [/\b(saudi|riyadh|ksa)\b/i, "Saudi Arabia"],
  [/\b(malaysia|bursa|ringgit)\b/i, "Malaysia"],
  [/\bindonesia|jakarta\b/i, "Indonesia"],
  [/\bqatar|doha\b/i, "Qatar"],
  [/\bbahrain|manama\b/i, "Bahrain"],
  [/\bkuwait\b/i, "Kuwait"],
  [/\boman|muscat\b/i, "Oman"],
  [/\bpakistan|karachi\b/i, "Pakistan"],
  [/\bturkiye|turkey|istanbul\b/i, "Türkiye"],
  [/\bunited kingdom|london\b/i, "United Kingdom"],
];

function parseSize(text: string): { currency: string | null; amount: number | null } {
  const m = /(US\$|\$|AED|SAR|QAR|MYR|RM|IDR|USD|EUR|GBP|PKR|TRY|OMR|BHD|KWD)\s?([\d.,]+)\s?(billion|bil|bn|million|mil|mn|m|b)?\b/i.exec(text);
  if (!m) return { currency: null, amount: null };
  const raw = Number((m[2] ?? "").replace(/,/g, ""));
  if (!Number.isFinite(raw)) return { currency: null, amount: null };
  const unit = (m[3] ?? "").toLowerCase();
  const mult = unit.startsWith("b") ? 1e9 : unit.startsWith("m") ? 1e6 : 1;
  const ccyRaw = (m[1] ?? "").toUpperCase();
  const currency = ccyRaw === "$" || ccyRaw === "US$" ? "USD" : ccyRaw === "RM" ? "MYR" : ccyRaw;
  return { currency, amount: raw * mult };
}

function stage(text: string): string {
  if (/matured|redeem/i.test(text)) return "matured";
  if (/priced|allocat|closed the book|oversubscrib/i.test(text)) return "priced";
  if (/book\s?building|initial price|guidance|open(s|ed)? (for )?subscription/i.test(text)) return "subscription";
  if (/plan|mandate|hires|to issue|upcoming|intends/i.test(text)) return "upcoming";
  return "announced";
}

export async function ingestDealRadar() {
  const items: { headline: string; url: string; publisher: string | null; published: string | null }[] = [];

  for (const q of QUERIES) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, { headers: { "user-agent": UA } });
    if (!res.ok) continue;
    const xml = await res.text();
    for (const block of xml.split("<item>").slice(1)) {
      const headline = decodeXml(/<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? "").trim();
      const link = (/<link>([\s\S]*?)<\/link>/.exec(block)?.[1] ?? "").trim();
      const pub = decodeXml(/<source[^>]*>([\s\S]*?)<\/source>/.exec(block)?.[1] ?? "").trim() || null;
      const date = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1] ?? "").trim();
      if (!headline || !link || !/sukuk/i.test(headline)) continue;
      items.push({
        headline,
        url: link,
        publisher: pub,
        published: date ? new Date(date).toISOString() : null,
      });
    }
  }

  const seen = new Set<string>();
  const rows = items
    .filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)))
    .slice(0, 120)
    .map((i) => {
      const { currency, amount } = parseSize(i.headline);
      return {
        headline: i.headline,
        url: i.url,
        publisher: i.publisher,
        published_at: i.published,
        issuer_guess: i.headline.split(/\s+(?:raises|prices|priced|plans|to issue|launches|sells|mandates)\b/i)[0]?.slice(0, 120) ?? null,
        country: COUNTRY_HINTS.find(([re]) => re.test(i.headline))?.[1] ?? null,
        currency,
        size_amount: amount,
        stage: stage(i.headline),
      };
    });

  if (rows.length) {
    await supabaseAdmin.from("deal_candidates").upsert(rows, { onConflict: "url", ignoreDuplicates: true });
  }
  await logRun("deal-radar", "ok", rows.length);
  return rows.length;
}

/* --------------------------------------------------------------- runner */

export async function runAllFeeds() {
  const result: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      result[name] = await fn();
    } catch (err) {
      result[name] = { error: String(err) };
      await logRun(name, "error", 0, String(err));
    }
  };

  let ust: { asOf: string; points: CurvePoint[] } | null = null;
  let myr: { asOf: string; points: CurvePoint[] } | null = null;

  await step("ust", async () => {
    ust = await ingestUstCurve();
    return { as_of: ust.asOf, points: ust.points.length };
  });
  await step("bnm", async () => {
    myr = await ingestBnmRates();
    return { as_of: myr.asOf, points: myr.points.length };
  });
  await step("fx", () => ingestEcbFx());
  if (ust) await step("reprice", () => repriceFromCurves(ust!, myr ?? { asOf: "n/a", points: [] }));
  await step("lifecycle", () => refreshLifecycle());
  await step("deal_radar", () => ingestDealRadar());

  return result;
}

/* --------------------------------------------------------------- helpers */

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function toIsoDate(us: string): string {
  const [m, d, y] = us.split("/");
  if (!m || !d || !y) return new Date().toISOString().slice(0, 10);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function tenorToYears(header: string): number | null {
  const m = /^([\d.]+)\s*(Mo|Month|Yr)/i.exec(header.replace(/"/g, "").trim());
  if (!m) return null;
  const n = Number(m[1]);
  return /yr/i.test(m[2] ?? "") ? n : n / 12;
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "");
}
