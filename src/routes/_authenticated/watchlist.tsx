import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getWatchlist } from "@/lib/user.functions";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { formatDate, formatPercent, localizedName } from "@/lib/format";
import type { InstrumentRow } from "@/lib/catalogue.server";

export const Route = createFileRoute("/_authenticated/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — Sukuk Market" },
      { name: "description", content: "Your saved sukuk watchlist — track yields, prices, ratings and maturities for the Shariah-compliant issues you follow on Sukuk Market." },
      { property: "og:title", content: "Watchlist — Sukuk Market" },
      { property: "og:description", content: "Track yields, prices and maturities for the sukuk you follow on Sukuk Market." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { t, lang, locale } = useI18n();
  const fetchWatchlist = useServerFn(getWatchlist);
  const { data, isLoading } = useQuery({ queryKey: ["watchlist"], queryFn: () => fetchWatchlist() });

  const rows = (data ?? [])
    .map((w) => w.instruments as unknown as InstrumentRow | null)
    .filter((r): r is InstrumentRow => Boolean(r));

  return (
    <>
      <PageHeader title={t("watchlist.title")} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("watchlist.empty")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <Link
                key={row.id}
                to="/instrument/$slug"
                params={{ slug: row.slug }}
                className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <p className="truncate font-medium">{localizedName(row, lang)}</p>
                <p className="truncate text-xs text-muted-foreground">{localizedName(row.issuer, lang)}</p>
                <div className="tnum mt-4 flex justify-between text-sm">
                  <span>{formatPercent(row.yield_to_maturity, locale)}</span>
                  <span className="text-muted-foreground">
                    {row.maturity_date ? formatDate(row.maturity_date, locale) : t("detail.perpetual")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
