import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { instrumentQuery, allInstrumentsQuery, partnersQuery, priceHistoryQuery } from "@/lib/queries";
import { createAlert, getWatchlist, registerInterest, submitEnquiry, toggleWatch } from "@/lib/user.functions";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  localizedDescription,
  localizedName,
  tenorYears,
} from "@/lib/format";
import { StatusBadge } from "@/components/market/MarketExplorer";
import { abs, breadcrumb, faqPage, instrumentLd, ldScript, slugify } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/instrument/$slug")({
  loader: async ({ context, params }) => {
    const row = await context.queryClient.ensureQueryData(instrumentQuery(params.slug));
    if (!row) throw notFound();
    context.queryClient.ensureQueryData(allInstrumentsQuery());
    return row;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Instrument unavailable | Sukuk Market" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} | Sukuk Market`;
    const summary =
      loaderData.description ??
      `${loaderData.structure ?? "Sukuk"} issued by ${loaderData.issuer.name} in ${loaderData.currency}, maturing ${loaderData.maturity_date ?? "n/a"}.`;
    const description = summary.slice(0, 155);
    const url = abs(`/instrument/${loaderData.slug}`);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        ldScript(instrumentLd(loaderData)),
        ldScript(
          breadcrumb([
            { name: "Home", path: "/" },
            { name: "Screener", path: "/market" },
            { name: loaderData.issuer.country, path: `/country/${slugify(loaderData.issuer.country)}` },
            { name: loaderData.name, path: `/instrument/${loaderData.slug}` },
          ]),
        ),
        ldScript(
          faqPage([
            {
              q: `What is the yield on ${loaderData.name}?`,
              a:
                loaderData.yield_to_maturity != null
                  ? `${loaderData.name} has an indicative yield to maturity of ${loaderData.yield_to_maturity}%${loaderData.price_as_of ? ` as of ${loaderData.price_as_of}` : ""}.`
                  : `No indicative yield is currently published for ${loaderData.name}.`,
            },
            {
              q: `Who issued ${loaderData.name}?`,
              a: `${loaderData.name} was issued by ${loaderData.issuer.name}, a ${loaderData.issuer.issuer_type.replace(/_/g, " ")} issuer based in ${loaderData.issuer.country}.`,
            },
            {
              q: `Is ${loaderData.name} Shariah-compliant?`,
              a: `${loaderData.name} is structured as a ${loaderData.structure ?? "sukuk"}${loaderData.shariah_advisor ? `, certified by ${loaderData.shariah_advisor}` : ""}${loaderData.aaoifi_compliant ? ", and stated as AAOIFI compliant" : ""}.`,
            },
          ]),
        ),
      ],
    };
  },
  component: InstrumentPage,
  errorComponent: () => <Fallback />,
  notFoundComponent: () => <Fallback />,
});

function Fallback() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-sm text-muted-foreground">{t("common.error")}</p>
      <Button asChild className="mt-4" variant="outline">
        <Link to="/market">{t("common.back")}</Link>
      </Button>
    </div>
  );
}

function InstrumentPage() {
  const { slug } = Route.useParams();
  const { t, lang, locale } = useI18n();
  const { data: row } = useSuspenseQuery(instrumentQuery(slug));
  const { data: all } = useSuspenseQuery(allInstrumentsQuery());
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchWatchlist = useServerFn(getWatchlist);
  const watchFn = useServerFn(toggleWatch);
  const { data: watchlist } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetchWatchlist(),
    enabled: Boolean(user),
  });

  const watched = Boolean(watchlist?.some((w) => w.instrument_id === row?.id));
  const watchMutation = useMutation({
    mutationFn: (vars: { instrumentId: string; watched: boolean }) => watchFn({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  if (!row) return <Fallback />;

  const similar = all
    .filter((r) => r.id !== row.id && (r.issuer.country === row.issuer.country || r.structure === row.structure))
    .slice(0, 4);
  const tenor = tenorYears(row.issue_date, row.maturity_date);

  return (
    <div>
      <div className="border-b border-border bg-surface geo-pattern">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Link to="/market" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("common.back")}
          </Link>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={row.status} />
                <Badge variant="secondary">Sukuk</Badge>
                {row.structure ? <Badge variant="secondary">{row.structure}</Badge> : null}
                {row.is_esg ? <Badge className="bg-primary text-primary-foreground">{t("detail.esgBadge")}</Badge> : null}
                {row.is_tokenized ? <Badge className="bg-gold text-primary">{t("detail.tokenized")}</Badge> : null}
              </div>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{localizedName(row, lang)}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {localizedName(row.issuer, lang)} · {row.issuer.country}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {user ? (
                <Button
                  variant="outline"
                  onClick={() => watchMutation.mutate({ instrumentId: row.id, watched })}
                  disabled={watchMutation.isPending}
                >
                  <Star className={`me-2 h-4 w-4 ${watched ? "fill-gold text-gold" : ""}`} />
                  {watched ? t("detail.unwatch") : t("detail.watch")}
                </Button>
              ) : null}
              <EnquiryDialog instrumentId={row.id} />
              <RegisterInterestDialog instrumentId={row.id} country={row.issuer.country} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {localizedDescription(row, lang) ? (
              <section className="rounded-lg border border-border bg-card p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{localizedDescription(row, lang)}</p>
              </section>
            ) : null}

            <Panel title={t("detail.keyTerms")}>
              <Row label={t("detail.issuer")} value={localizedName(row.issuer, lang)} />
              <Row label={t("detail.isin")} value={row.isin ?? "—"} />
              <Row label={t("col.structure")} value={row.structure ?? "—"} />
              <Row label={t("detail.issueSize")} value={formatMoney(row.size_amount, row.currency, locale)} />
              <Row label={t("col.currency")} value={row.currency} />
              <Row label={t("detail.minInvestment")} value={formatMoney(row.min_investment, row.currency, locale)} />
              <Row label={t("detail.frequency")} value={row.payment_frequency ?? "—"} />
              <Row label={t("detail.venue")} value={row.listing_venue ?? "—"} />
              <Row label={t("detail.law")} value={row.governing_law ?? "—"} />
            </Panel>

            <Panel title={t("detail.pricing")}>
              <Row label={t("col.rate")} value={`${formatPercent(row.profit_rate, locale)}${row.rate_type ? ` (${row.rate_type})` : ""}`} />
              <Row label={t("detail.price")} value={formatNumber(row.indicative_price, locale)} />
              <Row label={t("detail.ytm")} value={formatPercent(row.yield_to_maturity, locale)} />
              <Row label={t("detail.spread")} value={row.spread_bps != null ? `${row.spread_bps} bps` : "—"} />
              <Row
                label={t("detail.ratings")}
                value={[row.rating_moodys, row.rating_sp, row.rating_fitch].filter(Boolean).join(" / ") || "—"}
              />
            </Panel>

            <Panel title={t("detail.timeline")}>
              <Row label={t("detail.issueDate")} value={formatDate(row.issue_date, locale)} />
              <Row label={t("detail.maturityDate")} value={row.maturity_date ? formatDate(row.maturity_date, locale) : t("detail.perpetual")} />
              <Row label={t("detail.tenor")} value={tenor ? `${tenor} ${t("detail.years")}` : "—"} />
            </Panel>

            <Panel title={t("detail.shariah")}>
              <Row label={t("detail.advisor")} value={row.shariah_advisor ?? "—"} />
              <Row label={t("detail.aaoifi")} value={row.aaoifi_compliant ? "✓" : "—"} />
              <Row label={t("detail.asset")} value={row.underlying_asset ?? "—"} />
              <Row label={t("detail.proceeds")} value={row.use_of_proceeds ?? "—"} />
            </Panel>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("detail.ytm")}</p>
              <p className="tnum mt-1 text-4xl font-bold text-primary">{formatPercent(row.yield_to_maturity, locale)}</p>
              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <Row label={t("col.rate")} value={formatPercent(row.profit_rate, locale)} />
                <Row label={t("col.maturity")} value={row.maturity_date ? formatDate(row.maturity_date, locale) : t("detail.perpetual")} />
                <Row label={t("col.size")} value={formatMoney(row.size_amount, row.currency, locale)} />
              </div>
            </div>

            <PricePanel instrumentId={row.id} asOf={row.price_as_of} source={row.price_source} />

            {user ? <AlertPanel instrumentId={row.id} /> : null}

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-sm font-semibold">{t("detail.similar")}</h2>
              <div className="mt-3 space-y-3">
                {similar.map((s) => (
                  <Link
                    key={s.id}
                    to="/instrument/$slug"
                    params={{ slug: s.slug }}
                    className="block rounded-md border border-border p-3 transition-colors hover:border-primary"
                  >
                    <p className="truncate text-sm font-medium">{localizedName(s, lang)}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {s.issuer.country} · {formatPercent(s.yield_to_maturity, locale)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="tnum text-end text-sm font-medium">{value}</dd>
    </div>
  );
}

function EnquiryDialog({ instrumentId }: { instrumentId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const send = useServerFn(submitEnquiry);

  const mutation = useMutation({
    mutationFn: () => send({ data: { instrumentId, subject, message } }),
    onSuccess: () => {
      toast.success(t("form.enquirySent"));
      setOpen(false);
      setSubject("");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => !user && toast.error(t("form.signInFirst"))}>
          {t("detail.enquire")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("detail.enquire")}</DialogTitle>
        </DialogHeader>
        {user ? (
          <div className="space-y-3">
            <div>
              <Label>{t("form.subject")}</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 200))} className="mt-1" />
            </div>
            <div>
              <Label>{t("form.message")}</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} rows={5} className="mt-1" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("form.signInFirst")}</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("form.cancel")}
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!user || !subject || !message || mutation.isPending}>
            {t("form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RegisterInterestDialog({ instrumentId, country }: { instrumentId: string; country: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [message, setMessage] = useState("");
  const { data: partners } = useQuery({ ...partnersQuery(), enabled: open });
  const send = useServerFn(registerInterest);

  const mutation = useMutation({
    mutationFn: () => send({ data: { instrumentId, partnerId: partnerId || null, message } }),
    onSuccess: () => {
      toast.success(t("interest.sent"));
      setOpen(false);
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suggested = (partners ?? []).filter((p) => p.country === country);
  const list = suggested.length > 0 ? [...suggested, ...(partners ?? []).filter((p) => p.country !== country)] : (partners ?? []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => !user && toast.error(t("form.signInFirst"))}>{t("interest.title")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("interest.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("interest.sub")}</p>
        {user ? (
          <div className="space-y-3">
            <div>
              <Label>{t("interest.partner")}</Label>
              <Select value={partnerId} onValueChange={setPartnerId}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {list.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("form.message")}</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} rows={4} className="mt-1" />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("form.signInFirst")}</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("form.cancel")}
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!user || !partnerId || mutation.isPending}>
            {t("interest.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PricePanel({
  instrumentId,
  asOf,
  source,
}: {
  instrumentId: string;
  asOf: string | null;
  source: string;
}) {
  const { t, locale } = useI18n();
  const { data } = useQuery(priceHistoryQuery(instrumentId));
  const points = data ?? [];

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{t("price.history")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("price.asOf")} {asOf ? formatDate(asOf, locale) : "—"} ·{" "}
        {source === "vendor" ? t("price.source.vendor") : t("price.source.curated")}
      </p>
      {points.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("price.noData")}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {points.slice(-8).reverse().map((p) => (
            <div key={p.as_of} className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">{formatDate(p.as_of, locale)}</span>
              <span className="tnum font-medium">
                {formatNumber(p.price, locale)} · {formatPercent(p.yield_to_maturity, locale)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertPanel({ instrumentId }: { instrumentId: string }) {
  const { t } = useI18n();
  const [metric, setMetric] = useState("yield");
  const [direction, setDirection] = useState("above");
  const [threshold, setThreshold] = useState("");
  const send = useServerFn(createAlert);

  const mutation = useMutation({
    mutationFn: () => send({ data: { instrumentId, metric, direction, threshold: Number(threshold) } }),
    onSuccess: () => {
      toast.success(t("alerts.create"));
      setThreshold("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{t("alerts.title")}</h2>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yield">{t("alerts.yield")}</SelectItem>
              <SelectItem value="price">{t("alerts.price")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="above">{t("alerts.above")}</SelectItem>
              <SelectItem value="below">{t("alerts.below")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          inputMode="decimal"
          placeholder={t("alerts.threshold")}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value.slice(0, 8))}
        />
        <Button
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || threshold === "" || Number.isNaN(Number(threshold))}
        >
          {t("alerts.create")}
        </Button>
      </div>
    </div>
  );
}
