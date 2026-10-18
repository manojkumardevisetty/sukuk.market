import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { sukukQuery } from "@/lib/queries";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { MarketExplorer, defaultSearch } from "@/components/market/MarketExplorer";
import { formatPercent } from "@/lib/format";
import type { InstrumentRow } from "@/lib/catalogue.server";
import { SITE_NAME, abs, breadcrumb, byStructure, datasetLd, faqPage, ldScript, slugify, snapshot } from "@/lib/seo";

const NOTES: Record<string, string> = {
  ijarah:
    "Ijarah sukuk are backed by a sale-and-leaseback of a tangible asset. Lease rentals fund the periodic distributions and the asset is repurchased at maturity, which is why Ijarah is the default structure for benchmark sovereign issuance and is freely tradable in the secondary market.",
  wakalah:
    "Wakalah sukuk appoint the issuer as investment agent over a portfolio of Shariah-compliant assets. Investors receive an expected profit rate rather than a contractual coupon, and any surplus is usually retained by the agent as an incentive fee.",
  murabahah:
    "Murabahah sukuk derive their return from a cost-plus commodity sale with deferred payment. Because the outcome is a monetary receivable, secondary trading at anything other than par is restricted in most jurisdictions outside Malaysia.",
  mudarabah:
    "Mudarabah sukuk are profit-sharing certificates: investors provide capital, the issuer provides management, and returns depend on the venture's actual profit. Losses are borne by the capital provider absent negligence.",
  musharakah:
    "Musharakah sukuk represent a joint venture in which both parties contribute capital and share profit by agreed ratio and loss by capital contribution.",
  hybrid:
    "Hybrid sukuk blend tangible assets with receivables so the portfolio clears the tangibility threshold required for tradability, typically 33% or 51% depending on the jurisdiction.",
};

export const Route = createFileRoute("/structure/$slug")({
  loader: async ({ context, params }) => {
    const rows = await context.queryClient.ensureQueryData(sukukQuery());
    const match = byStructure(rows as InstrumentRow[]).find((s) => s.slug === params.slug);
    if (!match) throw notFound();
    const stats = snapshot(match.rows);
    return { structure: match.structure, count: stats.count, avgYield: stats.avgYield, updated: stats.updated };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Structure not found | Sukuk Market" }, { name: "robots", content: "noindex" }] };
    const url = abs(`/structure/${params.slug}`);
    const title = `${loaderData.structure} Sukuk — Structure Explained and ${loaderData.count} Live Issues`;
    const description = `How ${loaderData.structure} sukuk work, plus ${loaderData.count} tracked ${loaderData.structure} issues${
      loaderData.avgYield != null ? ` averaging ${loaderData.avgYield.toFixed(2)}% yield to maturity` : ""
    }.`;
    return {
      meta: [
        { title: `${title} | ${SITE_NAME}` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldScript(
          datasetLd({
            name: `${loaderData.structure} sukuk universe`,
            description,
            path: `/structure/${params.slug}`,
            modified: loaderData.updated,
          }),
        ),
        ldScript(
          breadcrumb([
            { name: "Home", path: "/" },
            { name: "Screener", path: "/market" },
            { name: `${loaderData.structure} sukuk`, path: `/structure/${params.slug}` },
          ]),
        ),
        ldScript(
          faqPage([
            {
              q: `What is a ${loaderData.structure} sukuk?`,
              a: NOTES[params.slug] ?? `${loaderData.structure} is a Shariah-compliant sukuk structure.`,
            },
            {
              q: `How many ${loaderData.structure} sukuk are there?`,
              a: `Sukuk Market tracks ${loaderData.count} ${loaderData.structure} issues across its coverage universe.`,
            },
          ]),
        ),
      ],
    };
  },
  component: StructurePage,
});

function StructurePage() {
  const { slug } = Route.useParams();
  const { locale } = useI18n();
  const { data: all } = useSuspenseQuery(sukukQuery());
  const rows = (all as InstrumentRow[]).filter((r) => r.structure && slugify(r.structure) === slug);
  const structure = rows[0]?.structure ?? slug;
  const stats = snapshot(rows);

  return (
    <>
      <PageHeader
        title={`${structure} sukuk`}
        subtitle={`${stats.count} tracked issues across ${new Set(rows.map((r) => r.issuer.country)).size} markets`}
      />
      <main className="mx-auto max-w-7xl px-4 pb-8">
        <section className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <p className="text-base leading-relaxed text-foreground">
            {NOTES[slug] ?? `${structure} is a Shariah-compliant sukuk structure used by sovereign and corporate issuers.`}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Sukuk Market tracks {stats.count} {structure} issues
            {stats.avgYield != null ? `, averaging ${stats.avgYield.toFixed(2)}% yield to maturity` : ""}, denominated in{" "}
            {stats.currencies.join(", ")}.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            As of {stats.updated ? new Date(stats.updated).toISOString().slice(0, 10) : "the latest catalogue update"}.
          </p>
        </section>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Tracked issues" value={String(stats.count)} />
          <Stat label="Average yield" value={formatPercent(stats.avgYield, locale)} />
          <Stat label="Issuers" value={String(stats.issuers.length)} />
        </dl>
      </main>

      <MarketExplorer rows={rows} search={defaultSearch} onChange={() => {}} />

      <nav className="mx-auto max-w-7xl px-4 pb-16 text-sm">
        <Link to="/answers/$slug" params={{ slug: "ijarah-vs-wakalah-vs-murabahah" }} className="text-primary hover:underline">
          Compare sukuk structures
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
