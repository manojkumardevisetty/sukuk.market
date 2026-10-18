import { createClient } from "@supabase/supabase-js";

export type Translated = Record<string, { name: string | null; description: string | null }>;

export type IssuerRow = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  name_ms: string | null;
  country: string;
  country_code: string;
  issuer_type: string;
  sector: string | null;
  description: string | null;
  website: string | null;
  translations?: Translated;
};

export type InstrumentRow = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  name_ms: string | null;
  instrument_type: "sukuk" | "bond";
  structure: string | null;
  isin: string | null;
  currency: string;
  size_amount: number | null;
  profit_rate: number | null;
  rate_type: string | null;
  payment_frequency: string | null;
  issue_date: string | null;
  maturity_date: string | null;
  min_investment: number | null;
  listing_venue: string | null;
  governing_law: string | null;
  rating_moodys: string | null;
  rating_sp: string | null;
  rating_fitch: string | null;
  indicative_price: number | null;
  yield_to_maturity: number | null;
  spread_bps: number | null;
  is_esg: boolean;
  use_of_proceeds: string | null;
  shariah_advisor: string | null;
  aaoifi_compliant: boolean;
  underlying_asset: string | null;
  status: "open" | "listed" | "matured" | "upcoming";
  description: string | null;
  description_ar: string | null;
  description_ms: string | null;
  is_tokenized: boolean;
  token_standard: string | null;
  featured: boolean;
  price_as_of: string | null;
  price_source: string;
  issuer: IssuerRow;
  translations?: Translated;
};

export type PricePoint = {
  as_of: string;
  price: number | null;
  yield_to_maturity: number | null;
  spread_bps: number | null;
  source: string;
};

export type PartnerRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  country_code: string;
  regulator: string | null;
  website: string | null;
};

const SELECT =
  "*, issuer:issuers(id,slug,name,name_ar,name_ms,country,country_code,issuer_type,sector,description,website)";

function client() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type TranslationRow = {
  entity_type: string;
  entity_id: string;
  locale: string;
  name: string | null;
  description: string | null;
};

async function attachTranslations(rows: InstrumentRow[]): Promise<InstrumentRow[]> {
  if (rows.length === 0) return rows;
  const ids = [...rows.map((r) => r.id), ...rows.map((r) => r.issuer?.id).filter(Boolean)];
  const { data } = await client()
    .from("content_translations")
    .select("entity_type, entity_id, locale, name, description")
    .in("entity_id", ids as string[]);

  const byEntity = new Map<string, Translated>();
  for (const row of (data ?? []) as TranslationRow[]) {
    const bucket = byEntity.get(row.entity_id) ?? {};
    bucket[row.locale] = { name: row.name, description: row.description };
    byEntity.set(row.entity_id, bucket);
  }

  return rows.map((row) => ({
    ...row,
    translations: byEntity.get(row.id) ?? {},
    issuer: row.issuer ? { ...row.issuer, translations: byEntity.get(row.issuer.id) ?? {} } : row.issuer,
  }));
}

export async function fetchInstruments(): Promise<InstrumentRow[]> {
  const { data, error } = await client()
    .from("instruments")
    .select(SELECT)
    .eq("instrument_type", "sukuk")
    .order("featured", { ascending: false });
  if (error) throw new Error(error.message);
  return attachTranslations((data ?? []) as unknown as InstrumentRow[]);
}

export async function fetchInstrument(slug: string): Promise<InstrumentRow | null> {
  const { data, error } = await client().from("instruments").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [row] = await attachTranslations([data as unknown as InstrumentRow]);
  return row ?? null;
}

export async function fetchPriceHistory(instrumentId: string): Promise<PricePoint[]> {
  const { data, error } = await client()
    .from("price_history")
    .select("as_of, price, yield_to_maturity, spread_bps, source")
    .eq("instrument_id", instrumentId)
    .order("as_of", { ascending: true })
    .limit(365);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PricePoint[];
}

export async function fetchPartners(): Promise<PartnerRow[]> {
  const { data, error } = await client()
    .from("partners")
    .select("id, slug, name, country, country_code, regulator, website")
    .eq("is_active", true)
    .order("country", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PartnerRow[];
}
