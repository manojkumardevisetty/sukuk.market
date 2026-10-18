import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { sukukQuery } from "@/lib/queries";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { MarketExplorer, defaultSearch } from "@/components/market/MarketExplorer";
import { formatMoney, formatPercent, issuerTypeLabel } from "@/lib/format";
import type { InstrumentRow } from "@/lib/catalogue.server";
import { SITE_NAME, abs, breadcrumb, byCountry, datasetLd, faqPage, ldScript, slugify, snapshot } from "@/lib/seo";

export const Route = createFileRoute("/country/$slug")({
  loader: async ({ context, params }) => {
    const rows = await context.queryClient.ensureQueryData(sukukQuery());
    const match = byCountry(rows as InstrumentRow[]).find((c) => c.slug === params.slug);
    if (!match) throw notFound();
    const stats = snapshot(match.rows);
    return { country: match.country, count: stats.count, avgYield: stats.avgYield, updated: stats.updated };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Market not found | Sukuk Market" }, { name: "robots", content: "noindex" }] };
    const url = abs(`/country/${params.slug}`);
    const title = `${loaderData.country} Sukuk — ${loaderData.count} Issues, Yields and Ratings`;
    const description = `${loaderData.count} sukuk issued in ${loaderData.country}${
      loaderData.avgYield != null ? `, averaging ${loaderData.avgYield.toFixed(2)}% yield to maturity` : ""
    }. Full terms, structures, ratings and Shariah detail, free to screen.`;
    return {
      meta: [
        { title: `${title} | ${SITE_NAME}` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldScript(
          datasetLd({
            name: `${loaderData.country} sukuk universe`,
            description,
            path: `/country/${params.slug}`,
            modified: loaderData.updated,
            spatialCoverage: loaderData.country,
          }),
        ),
        ldScript(
          breadcrumb([
            { name: "Home", path: "/" },
            { name: "Screener", path: "/market" },
            { name: loaderData.country, path: `/country/${params.slug}` },
          ]),
        ),
        ldScript(
          faqPage([
            {
              q: `How many sukuk are issued in ${loaderData.country}?`,
              a: `Sukuk Market tracks ${loaderData.count} sukuk issues from ${loaderData.country}.`,
            },
            {
              q: `What is the average sukuk yield in ${loaderData.country}?`,
              a:
                loaderData.avgYield != null
                  ? `The average yield to maturity across tracked ${loaderData.country} sukuk is ${loaderData.avgYield.toFixed(2)}%.`
                  : `Yield data for ${loaderData.country} sukuk is not currently available.`,
            },
          ]),
        ),
      ],
    };
  },
  component: CountryPage,
});

function CountryPage() {
  const { slug } = Route.useParams();
  const { locale } = useI18n();
  const { data: all } = useSuspenseQuery(sukukQuery());
  const rows = (all as InstrumentRow[]).filter((r) => slugify(r.issuer.country) === slug);
  const country = rows[0]?.issuer.country ?? slug;
  const stats = snapshot(rows);
  const issuerTypes = [...new Set(rows.map((r) => r.issuer.issuer_type))];

  return (
    <>
      <PageHeader
        title={`${country} sukuk`}
        subtitle={`${stats.count} tracked issues · ${stats.structures.length} structures · ${stats.currencies.join(", ")}`}
      />
      <main className="mx-auto max-w-7xl px-4 pb-8">
        <section className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <h2 className="sr-only">{country} sukuk market summary</h2>
          <p className="text-base leading-relaxed text-foreground">
            Sukuk Market tracks {stats.count} sukuk issued in {country}
            {stats.avgYield != null ? `, with an average yield to maturity of ${stats.avgYield.toFixed(2)}%` : ""}
            {stats.minYield != null && stats.maxYield != null
              ? ` (range ${stats.minYield.toFixed(2)}%–${stats.maxYield.toFixed(2)}%)`
              : ""}
            . Issues are denominated in {stats.currencies.join(", ")} and structured as {stats.structures.join(", ")}.
            {stats.esg > 0 ? ` ${stats.esg} carry a green or ESG label.` : ""}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            As of {stats.updated ? new Date(stats.updated).toISOString().slice(0, 10) : "the latest catalogue update"}.
          </p>
        </section>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Tracked issues" value={String(stats.count)} />
          <Stat label="Average yield" value={formatPercent(stats.avgYield, locale)} />
          <Stat
            label="Largest outstanding"
            value={
              stats.outstanding[0]
                ? formatMoney(stats.outstanding[0].total, stats.outstanding[0].currency, locale)
                : "—"
            }
          />
          <Stat label="Issuers" value={String(stats.issuers.length)} />
        </dl>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Issuer types</h2>
          <p className="mt-2 text-sm text-muted-foreground">{issuerTypes.map(issuerTypeLabel).join(", ")}</p>
          <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top issuers</h2>
          <p className="mt-2 text-sm text-muted-foreground">{stats.issuers.slice(0, 12).join(", ")}</p>
        </section>
      </main>

      <MarketExplorer rows={rows} search={defaultSearch} onChange={() => {}} />

      <nav className="mx-auto max-w-7xl px-4 pb-16 text-sm">
        <Link to="/market" className="text-primary hover:underline">
          Screen every market
        </Link>
      </nav>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
    </div>
  );
}
