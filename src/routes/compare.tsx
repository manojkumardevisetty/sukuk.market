import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { X } from "lucide-react";
import { z } from "zod";

import { allInstrumentsQuery } from "@/lib/queries";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { formatDate, formatMoney, formatPercent, localizedName, ratingLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const searchSchema = z.object({
  ids: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/compare")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Compare Sukuk — Sukuk Market" },
      { name: "description", content: "Compare yields, tenors, structures and ratings across sukuk side by side." },
      { property: "og:title", content: "Compare Sukuk — Sukuk Market" },
      { property: "og:description", content: "Side-by-side comparison of sukuk terms." },
      { property: "og:url", content: "https://sukuk.market/compare" },
    ],
    links: [{ rel: "canonical", href: "https://sukuk.market/compare" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allInstrumentsQuery());
  },
  component: ComparePage,
  errorComponent: () => null,
  notFoundComponent: () => null,
});

function ComparePage() {
  const { t, lang, locale } = useI18n();
  const { data: rows } = useSuspenseQuery(allInstrumentsQuery());
  const { ids } = Route.useSearch();
  const navigate = useNavigate({ from: "/compare" });

  const selectedIds: string[] = ids ? ids.split(",").filter(Boolean).slice(0, 4) : [];
  const selected = selectedIds.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as typeof rows;

  function setIds(next: string[]) {
    navigate({ search: { ids: next.join(",") } });
  }

  return (
    <>
      <PageHeader title={t("compare.title")} subtitle={t("compare.sub")} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Select value="" onValueChange={(v) => setIds([...new Set([...selectedIds, v])].slice(0, 4))}>
              <SelectTrigger>
                <SelectValue placeholder={t("compare.add")} />
              </SelectTrigger>
              <SelectContent>
                {rows.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {localizedName(r, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" onClick={() => setIds([])}>
            {t("compare.clear")}
          </Button>
        </div>

        {selected.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("compare.empty")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-3xl text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-start text-xs uppercase tracking-wide text-muted-foreground">
                    {t("col.name")}
                  </th>
                  {selected.map((r) => (
                    <th key={r.id} className="px-4 py-3 text-start">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{localizedName(r, lang)}</span>
                        <button
                          onClick={() => setIds(selectedIds.filter((id) => id !== r.id))}
                          aria-label="remove"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label={t("detail.issuer")} values={selected.map((r) => localizedName(r.issuer, lang))} />
                <CompareRow label={t("filter.country")} values={selected.map((r) => r.issuer.country)} />
                <CompareRow label={t("col.structure")} values={selected.map((r) => r.structure ?? "—")} />
                <CompareRow label={t("col.currency")} values={selected.map((r) => r.currency)} />
                <CompareRow label={t("col.size")} values={selected.map((r) => formatMoney(r.size_amount, r.currency, locale))} />
                <CompareRow label={t("col.rate")} values={selected.map((r) => formatPercent(r.profit_rate, locale))} />
                <CompareRow label={t("detail.ytm")} values={selected.map((r) => formatPercent(r.yield_to_maturity, locale))} />
                <CompareRow
                  label={t("col.maturity")}
                  values={selected.map((r) => (r.maturity_date ? formatDate(r.maturity_date, locale) : t("detail.perpetual")))}
                />
                <CompareRow label={t("col.rating")} values={selected.map((r) => ratingLabel(r))} />
                <CompareRow label={t("detail.venue")} values={selected.map((r) => r.listing_venue ?? "—")} />
                <CompareRow label={t("detail.esgBadge")} values={selected.map((r) => (r.is_esg ? "✓" : "—"))} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="tnum px-4 py-3">
          {v}
        </td>
      ))}
    </tr>
  );
}
