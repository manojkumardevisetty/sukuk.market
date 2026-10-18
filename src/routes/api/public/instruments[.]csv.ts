import { createFileRoute } from "@tanstack/react-router";

import { fetchInstruments } from "@/lib/catalogue.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const COLUMNS = [
  "name",
  "isin",
  "issuer",
  "issuer_type",
  "country",
  "structure",
  "currency",
  "size_amount",
  "profit_rate",
  "yield_to_maturity",
  "indicative_price",
  "issue_date",
  "maturity_date",
  "rating_moodys",
  "rating_sp",
  "rating_fitch",
  "listing_venue",
  "aaoifi_compliant",
  "is_esg",
  "is_tokenized",
  "status",
  "price_as_of",
  "url",
] as const;

function cell(value: unknown) {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const Route = createFileRoute("/api/public/instruments.csv")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const rows = await fetchInstruments();
        const lines = [COLUMNS.join(",")];
        for (const row of rows) {
          lines.push(
            [
              row.name,
              row.isin,
              row.issuer.name,
              row.issuer.issuer_type,
              row.issuer.country,
              row.structure,
              row.currency,
              row.size_amount,
              row.profit_rate,
              row.yield_to_maturity,
              row.indicative_price,
              row.issue_date,
              row.maturity_date,
              row.rating_moodys,
              row.rating_sp,
              row.rating_fitch,
              row.listing_venue,
              row.aaoifi_compliant,
              row.is_esg,
              row.is_tokenized,
              row.status,
              row.price_as_of,
              `https://sukuk-haven-global.lovable.app/instrument/${row.slug}`,
            ]
              .map(cell)
              .join(","),
          );
        }

        return new Response(lines.join("\n"), {
          headers: {
            ...CORS,
            "Content-Type": "text/csv; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
