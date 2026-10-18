import { createFileRoute } from "@tanstack/react-router";

import { fetchInstruments } from "@/lib/catalogue.server";
import { SITE_URL, snapshot } from "@/lib/seo";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/instruments.json")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const rows = await fetchInstruments();
        const stats = snapshot(rows);

        const payload = {
          source: SITE_URL,
          licence: "Free to use and cite with attribution to Sukuk Market.",
          disclaimer:
            "Reference data for information only. Not investment advice, not an offer, and not a live executable price.",
          generated_at: new Date().toISOString(),
          count: rows.length,
          summary: {
            jurisdictions: [...new Set(rows.map((r) => r.issuer.country))].sort(),
            currencies: stats.currencies,
            structures: stats.structures,
            average_yield_to_maturity: stats.avgYield,
            last_price_update: stats.updated,
          },
          instruments: rows.map((row) => ({
            slug: row.slug,
            url: `${SITE_URL}/instrument/${row.slug}`,
            name: row.name,
            isin: row.isin,
            issuer: {
              name: row.issuer.name,
              type: row.issuer.issuer_type,
              country: row.issuer.country,
              country_code: row.issuer.country_code,
              sector: row.issuer.sector,
              website: row.issuer.website,
            },
            structure: row.structure,
            currency: row.currency,
            size_amount: row.size_amount,
            profit_rate: row.profit_rate,
            rate_type: row.rate_type,
            payment_frequency: row.payment_frequency,
            issue_date: row.issue_date,
            maturity_date: row.maturity_date,
            yield_to_maturity: row.yield_to_maturity,
            indicative_price: row.indicative_price,
            spread_bps: row.spread_bps,
            ratings: { moodys: row.rating_moodys, sp: row.rating_sp, fitch: row.rating_fitch },
            listing_venue: row.listing_venue,
            governing_law: row.governing_law,
            shariah_advisor: row.shariah_advisor,
            aaoifi_compliant: row.aaoifi_compliant,
            underlying_asset: row.underlying_asset,
            is_esg: row.is_esg,
            is_tokenized: row.is_tokenized,
            status: row.status,
            description: row.description,
            price_as_of: row.price_as_of,
            price_source: row.price_source,
          })),
        };

        return Response.json(payload, {
          headers: { ...CORS, "Cache-Control": "public, max-age=900" },
        });
      },
    },
  },
});
