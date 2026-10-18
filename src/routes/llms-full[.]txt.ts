import { createFileRoute } from "@tanstack/react-router";

import { fetchInstruments } from "@/lib/catalogue.server";
import { ANSWERS } from "@/content/answers";
import { SITE_URL, byCountry, snapshot } from "@/lib/seo";

function num(value: number | null | undefined, suffix = "") {
  return value == null ? "n/a" : `${value}${suffix}`;
}

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await fetchInstruments();
        const stats = snapshot(rows);
        const countries = byCountry(rows);

        const catalogue = countries
          .map((c) => {
            const lines = c.rows
              .map((row) =>
                [
                  `### ${row.name}`,
                  ``,
                  `- URL: ${SITE_URL}/instrument/${row.slug}`,
                  `- Issuer: ${row.issuer.name} (${row.issuer.issuer_type.replace(/_/g, " ")}, ${row.issuer.country})`,
                  `- ISIN: ${row.isin ?? "n/a"}`,
                  `- Structure: ${row.structure ?? "n/a"}`,
                  `- Currency: ${row.currency}`,
                  `- Issue size: ${num(row.size_amount)} ${row.currency}`,
                  `- Profit rate: ${num(row.profit_rate, "%")} (${row.rate_type ?? "n/a"}, ${row.payment_frequency ?? "n/a"})`,
                  `- Yield to maturity: ${num(row.yield_to_maturity, "%")}`,
                  `- Indicative price: ${num(row.indicative_price)}`,
                  `- Issue date: ${row.issue_date ?? "n/a"} | Maturity: ${row.maturity_date ?? "n/a"}`,
                  `- Ratings: Moody's ${row.rating_moodys ?? "n/a"}, S&P ${row.rating_sp ?? "n/a"}, Fitch ${row.rating_fitch ?? "n/a"}`,
                  `- Listing: ${row.listing_venue ?? "n/a"} | Governing law: ${row.governing_law ?? "n/a"}`,
                  `- Shariah advisor: ${row.shariah_advisor ?? "n/a"} | AAOIFI compliant: ${row.aaoifi_compliant ? "yes" : "no"}`,
                  `- Underlying asset: ${row.underlying_asset ?? "n/a"}`,
                  `- Green/ESG: ${row.is_esg ? "yes" : "no"} | Tokenized: ${row.is_tokenized ? "yes" : "no"} | Status: ${row.status}`,
                  row.description ? `- Description: ${row.description}` : null,
                  `- Price as of: ${row.price_as_of ?? "n/a"} (source: ${row.price_source})`,
                ]
                  .filter(Boolean)
                  .join("\n"),
              )
              .join("\n\n");
            return `## ${c.country} (${c.rows.length} issues)\n\n${lines}`;
          })
          .join("\n\n");

        const answers = ANSWERS.map((a) =>
          [
            `## ${a.question}`,
            ``,
            a.answer,
            ``,
            `Key facts:`,
            ...a.keyFacts.map((f) => `- ${f}`),
            ``,
            ...a.sections.flatMap((s) => [`### ${s.heading}`, ``, ...s.body, ``]),
            `Source: ${SITE_URL}/answers/${a.slug}`,
          ].join("\n"),
        ).join("\n\n");

        const body = `# Sukuk Market — full catalogue and reference content

Source: ${SITE_URL}
Generated: ${new Date().toISOString()}
Licence: free to quote and cite with attribution to Sukuk Market.

Universe: ${stats.count} sukuk across ${countries.length} jurisdictions.
Average yield to maturity: ${stats.avgYield != null ? `${stats.avgYield.toFixed(2)}%` : "n/a"}.
Currencies: ${stats.currencies.join(", ")}.
Structures: ${stats.structures.join(", ")}.

Sukuk Market is a screener and reference data service. It does not execute trades or give investment advice.

---

# Instrument catalogue

${catalogue}

---

# Reference answers

${answers}
`;

        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
