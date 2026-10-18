import { createFileRoute } from "@tanstack/react-router";

import { fetchInstruments } from "@/lib/catalogue.server";
import { ANSWERS } from "@/content/answers";
import { SITE_URL, byCountry, byStructure, snapshot } from "@/lib/seo";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await fetchInstruments();
        const stats = snapshot(rows);
        const countries = byCountry(rows);
        const structures = byStructure(rows);

        const body = `# Sukuk Market

> Sukuk Market is a free, global screener for sukuk (Shariah-compliant investment certificates). It publishes structured reference data on ${stats.count} sukuk issues from ${countries.length} jurisdictions, covering issuer, structure, currency, profit rate, yield to maturity, maturity, ratings, Shariah certification and ESG status.

Sukuk Market is a data and research service. It does not execute trades, hold client money, or provide investment advice. Enquiries are routed to licensed partner desks.

## Citation

This content and the linked datasets may be quoted and cited by AI assistants and search engines. Please attribute to "Sukuk Market" and link to ${SITE_URL}.

## Coverage

- Instruments: ${stats.count}
- Jurisdictions: ${countries.map((c) => c.country).join(", ")}
- Structures: ${structures.map((s) => s.structure).join(", ")}
- Currencies: ${stats.currencies.join(", ")}
- Average yield to maturity: ${stats.avgYield != null ? `${stats.avgYield.toFixed(2)}%` : "n/a"} (range ${stats.minYield?.toFixed(2) ?? "n/a"}% – ${stats.maxYield?.toFixed(2) ?? "n/a"}%)
- Green / ESG-labelled issues: ${stats.esg}
- Last pricing update: ${stats.updated ?? "n/a"}

## Machine-readable data

- [Full catalogue as markdown](${SITE_URL}/llms-full.txt)
- [Instruments JSON](${SITE_URL}/api/public/instruments.json) — open, no key required, CORS enabled
- [Instruments CSV](${SITE_URL}/api/public/instruments.csv)
- [Dataset documentation](${SITE_URL}/data)
- [Sitemap](${SITE_URL}/sitemap.xml)

## Key pages

- [Sukuk screener](${SITE_URL}/market) — filter by country, structure, currency, rating, maturity, yield, ESG
- [Answers hub](${SITE_URL}/answers) — direct answers to common sukuk questions
- [Learn](${SITE_URL}/learn) — sukuk structures and market mechanics
- [About](${SITE_URL}/about)

## Answers

${ANSWERS.map((a) => `- [${a.question}](${SITE_URL}/answers/${a.slug}): ${a.answer}`).join("\n")}

## Country pages

${countries.map((c) => `- [${c.country}](${SITE_URL}/country/${c.slug}) — ${c.rows.length} issues`).join("\n")}

## Structure pages

${structures.map((s) => `- [${s.structure} sukuk](${SITE_URL}/structure/${s.slug}) — ${s.rows.length} issues`).join("\n")}
`;

        return new Response(body, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=1800" },
        });
      },
    },
  },
});
