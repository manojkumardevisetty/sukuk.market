import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { addHolding, getHoldings, removeHolding } from "@/lib/user.functions";
import { allInstrumentsQuery } from "@/lib/queries";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { formatMoney, formatNumber, localizedName } from "@/lib/format";
import type { InstrumentRow } from "@/lib/catalogue.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Sukuk Market" },
      { name: "description", content: "Track your sukuk holdings, cost and expected income." },
      { property: "og:title", content: "Portfolio — Sukuk Market" },
      { property: "og:description", content: "Track your sukuk holdings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allInstrumentsQuery());
  },
  component: PortfolioPage,
});

type HoldingRow = {
  id: string;
  nominal: number;
  purchase_price: number;
  purchase_date: string;
  instruments: InstrumentRow | null;
};

function PortfolioPage() {
  const { t, lang, locale } = useI18n();
  const queryClient = useQueryClient();
  const { data: instruments } = useSuspenseQuery(allInstrumentsQuery());
  const fetchHoldings = useServerFn(getHoldings);
  const add = useServerFn(addHolding);
  const remove = useServerFn(removeHolding);

  const { data } = useQuery({ queryKey: ["holdings"], queryFn: () => fetchHoldings() });
  const holdings = (data ?? []) as unknown as HoldingRow[];

  const [instrumentId, setInstrumentId] = useState("");
  const [nominal, setNominal] = useState("");
  const [price, setPrice] = useState("100");

  const addMutation = useMutation({
    mutationFn: () => add({ data: { instrumentId, nominal: Number(nominal), price: Number(price) } }),
    onSuccess: () => {
      toast.success(t("form.holdingAdded"));
      setNominal("");
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holdings"] }),
  });

  const totalCost = holdings.reduce((sum, h) => sum + (h.nominal * h.purchase_price) / 100, 0);
  const totalNominal = holdings.reduce((sum, h) => sum + h.nominal, 0);
  const income = holdings.reduce(
    (sum, h) => sum + (h.nominal * (h.instruments?.profit_rate ?? 0)) / 100,
    0,
  );

  return (
    <>
      <PageHeader title={t("portfolio.title")} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          <Stat label={t("portfolio.nominal")} value={formatNumber(totalNominal, locale, 0)} />
          <Stat label={t("portfolio.cost")} value={formatNumber(totalCost, locale, 0)} />
          <Stat label={t("portfolio.income")} value={formatNumber(income, locale, 0)} />
        </dl>

        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">{t("portfolio.add")}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto] md:items-end">
            <div className="min-w-0">
              <Label className="text-xs text-muted-foreground">{t("col.name")}</Label>
              <Select value={instrumentId} onValueChange={setInstrumentId}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder={t("col.name")} />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {localizedName(i, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("portfolio.nominal")}</Label>
              <Input type="number" min={0} value={nominal} onChange={(e) => setNominal(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("detail.price")}</Label>
              <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" />
            </div>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!instrumentId || !nominal || Number(nominal) <= 0 || addMutation.isPending}
            >
              {t("portfolio.add")}
            </Button>
          </div>
        </div>

        {holdings.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("portfolio.empty")}</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("col.name")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("portfolio.nominal")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("detail.price")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("portfolio.value")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium">{h.instruments ? localizedName(h.instruments, lang) : "—"}</p>
                      <p className="text-xs text-muted-foreground">{h.instruments?.issuer.country}</p>
                    </td>
                    <td className="tnum px-4 py-3 text-end">{formatNumber(h.nominal, locale, 0)}</td>
                    <td className="tnum px-4 py-3 text-end">{formatNumber(h.purchase_price, locale)}</td>
                    <td className="tnum px-4 py-3 text-end">
                      {formatMoney((h.nominal * h.purchase_price) / 100, h.instruments?.currency ?? "USD", locale)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button variant="ghost" size="icon" onClick={() => removeMutation.mutate(h.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="tnum mt-1 text-2xl font-bold">{value}</dd>
    </div>
  );
}
