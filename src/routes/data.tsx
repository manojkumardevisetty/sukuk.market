import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { sukukQuery } from "@/lib/queries";
import { PageHeader } from "@/components/layout/SiteLayout";
import type { InstrumentRow } from "@/lib/catalogue.server";
import { SITE_NAME, SITE_URL, abs, breadcrumb, byCountry, byStructure, datasetLd, ldScript, snapshot } from "@/lib/seo";

const TITLE = "Sukuk Open Data — Free JSON & CSV Sukuk Dataset";
const DESCRIPTION =
  "Free, no-key sukuk dataset: JSON, CSV and markdown feeds covering issuer, structure, currency, profit rate, yield, ratings and Shariah detail. Citable with attribution.";

export const Route = createFileRoute("/data")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sukukQuery()),
  head: () => ({
    meta: [
      { title: `${TITLE} | ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: abs("/data") },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: abs("/data") }],
    scripts: [
      ldScript(
        datasetLd({
          name: "Sukuk Market global sukuk dataset",
          description: DESCRIPTION,
          path: "/data",
        }),
      ),
      ldScript(breadcrumb([{ name: "Home", path: "/" }, { name: "Open data", path: "/data" }])),
    ],
  }),
  component: DataPage,
});

const FEEDS = [
  { path: "/api/public/instruments.json", label: "Instruments JSON", note: "Full universe with nested issuer objects. CORS enabled, no key." },
  { path: "/api/public/instruments.csv", label: "Instruments CSV", note: "Flat table, one row per instrument. Opens directly in Excel or pandas." },
  { path: "/llms.txt", label: "llms.txt", note: "Site summary and link index for AI assistants." },
  { path: "/llms-full.txt", label: "llms-full.txt", note: "Complete catalogue and reference content as markdown." },
  { path: "/sitemap.xml", label: "sitemap.xml", note: "Every indexable page, including instrument, country and structure pages." },
];

function DataPage() {
  const { data } = useSuspenseQuery(sukukQuery());
  const rows = data as InstrumentRow[];
  const stats = snapshot(rows);

  return (
    <>
      <PageHeader title="Open sukuk data" subtitle="Free to fetch, free to quote — attribution appreciated." />
      <main className="mx-auto max-w-4xl px-4 pb-20">
        <p className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-base leading-relaxed text-foreground">
          Sukuk Market publishes its full sukuk catalogue as open, key-free feeds: {stats.count} instruments across{" "}
          {byCountry(rows).length} jurisdictions, with issuer, structure, currency, profit rate, yield to maturity,
          maturity date, ratings, Shariah certification and ESG status on every record.
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Endpoints</h2>
          <ul className="mt-3 space-y-3">
            {FEEDS.map((feed) => (
              <li key={feed.path} className="rounded-lg border border-border bg-card p-4">
                <a href={feed.path} className="text-sm font-medium text-primary hover:underline">
                  {feed.label}
                </a>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {SITE_URL}
                  {feed.path}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{feed.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Licence and attribution</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The data is free to use, redistribute and quote, including by AI assistants and search engines, provided the
            source is attributed as “Sukuk Market” with a link to {SITE_URL}. It is reference data for information only
            — not investment advice, not an offer, and not a live executable price. Sukuk Market does not execute trades.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Browse by market</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {byCountry(rows).map((c) => (
              <Link
                key={c.slug}
                to="/country/$slug"
                params={{ slug: c.slug }}
                className="rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {c.country} ({c.rows.length})
              </Link>
            ))}
          </div>
          <h2 className="mt-6 text-lg font-semibold text-foreground">Browse by structure</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {byStructure(rows).map((s) => (
              <Link
                key={s.slug}
                to="/structure/$slug"
                params={{ slug: s.slug }}
                className="rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {s.structure} ({s.rows.length})
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
