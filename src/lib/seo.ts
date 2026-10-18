import type { InstrumentRow } from "./catalogue.server";

export const SITE_URL = "https://sukuk.market";
export const SITE_NAME = "Sukuk Market";

export function abs(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ldScript(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) } as const;
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function instrumentLd(row: InstrumentRow) {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: row.name,
    url: abs(`/instrument/${row.slug}`),
    identifier: row.isin ?? undefined,
    category: row.structure ? `Sukuk ${row.structure}` : "Sukuk",
    description: row.description ?? undefined,
    provider: {
      "@type": "Organization",
      name: row.issuer.name,
      url: row.issuer.website ?? undefined,
      address: { "@type": "PostalAddress", addressCountry: row.issuer.country_code },
    },
    feesAndCommissionsSpecification: "No fees charged by Sukuk Market. Reference data only.",
    interestRate: row.profit_rate ?? undefined,
    annualPercentageRate: row.yield_to_maturity ?? undefined,
    currenciesAccepted: row.currency,
    termsOfService: abs("/data"),
    dateModified: row.price_as_of ?? undefined,
    additionalProperty: [
      prop("ISIN", row.isin),
      prop("Structure", row.structure),
      prop("Issue size", row.size_amount != null ? `${row.size_amount} ${row.currency}` : null),
      prop("Maturity date", row.maturity_date),
      prop("Issue date", row.issue_date),
      prop("Yield to maturity (%)", row.yield_to_maturity),
      prop("Profit rate (%)", row.profit_rate),
      prop("Indicative price", row.indicative_price),
      prop("Rating (Moody's)", row.rating_moodys),
      prop("Rating (S&P)", row.rating_sp),
      prop("Rating (Fitch)", row.rating_fitch),
      prop("Listing venue", row.listing_venue),
      prop("Governing law", row.governing_law),
      prop("Shariah advisor", row.shariah_advisor),
      prop("AAOIFI compliant", row.aaoifi_compliant ? "Yes" : "No"),
      prop("Green / ESG", row.is_esg ? "Yes" : "No"),
      prop("Tokenized", row.is_tokenized ? "Yes" : "No"),
      prop("Status", row.status),
    ].filter(Boolean),
  };
}

function prop(name: string, value: string | number | null | undefined) {
  if (value == null || value === "") return null;
  return { "@type": "PropertyValue", name, value: String(value) };
}

export function datasetLd(input: {
  name: string;
  description: string;
  path: string;
  modified?: string | null;
  spatialCoverage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: input.name,
    description: input.description,
    url: abs(input.path),
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    isAccessibleForFree: true,
    dateModified: input.modified ?? undefined,
    spatialCoverage: input.spatialCoverage,
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: abs("/api/public/instruments.json") },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: abs("/api/public/instruments.csv") },
    ],
  };
}

/* ---------- live aggregate stats used by country / structure / answer pages ---------- */

export type Snapshot = {
  count: number;
  avgYield: number | null;
  minYield: number | null;
  maxYield: number | null;
  currencies: string[];
  structures: string[];
  issuers: string[];
  esg: number;
  outstanding: { currency: string; total: number }[];
  updated: string | null;
};

export function snapshot(rows: InstrumentRow[]): Snapshot {
  const yields = rows.map((r) => r.yield_to_maturity).filter((v): v is number => v != null);
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.size_amount == null) continue;
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + Number(row.size_amount));
  }
  const dates = rows.map((r) => r.price_as_of).filter((v): v is string => !!v).sort();
  return {
    count: rows.length,
    avgYield: yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : null,
    minYield: yields.length ? Math.min(...yields) : null,
    maxYield: yields.length ? Math.max(...yields) : null,
    currencies: [...new Set(rows.map((r) => r.currency))].sort(),
    structures: [...new Set(rows.map((r) => r.structure).filter((v): v is string => !!v))].sort(),
    issuers: [...new Set(rows.map((r) => r.issuer.name))].sort(),
    esg: rows.filter((r) => r.is_esg).length,
    outstanding: [...totals.entries()].map(([currency, total]) => ({ currency, total })).sort((a, b) => b.total - a.total),
    updated: dates.length ? dates[dates.length - 1]! : null,
  };
}

export function byCountry(rows: InstrumentRow[]) {
  const map = new Map<string, { country: string; slug: string; rows: InstrumentRow[] }>();
  for (const row of rows) {
    const slug = slugify(row.issuer.country);
    const entry = map.get(slug) ?? { country: row.issuer.country, slug, rows: [] };
    entry.rows.push(row);
    map.set(slug, entry);
  }
  return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
}

export function byStructure(rows: InstrumentRow[]) {
  const map = new Map<string, { structure: string; slug: string; rows: InstrumentRow[] }>();
  for (const row of rows) {
    if (!row.structure) continue;
    const slug = slugify(row.structure);
    const entry = map.get(slug) ?? { structure: row.structure, slug, rows: [] };
    entry.rows.push(row);
    map.set(slug, entry);
  }
  return [...map.values()].sort((a, b) => b.rows.length - a.rows.length);
}
