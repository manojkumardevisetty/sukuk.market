import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { useState } from "react";

import { getAdminOverview, getCrawlerActivity, getDataFeeds, getPricingBoard, recordPrice, setDealStatus, setRequestStatus } from "@/lib/admin.functions";
import { useI18n } from "@/i18n";
import { PageHeader } from "@/components/layout/SiteLayout";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Sukuk Market" },
      { name: "description", content: "Review enquiries and subscription requests." },
      { property: "og:title", content: "Admin — Sukuk Market" },
      { property: "og:description", content: "Review enquiries and subscription requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getAdminOverview);
  const setStatus = useServerFn(setRequestStatus);
  const { data, isLoading } = useQuery({ queryKey: ["admin"], queryFn: () => fetchOverview() });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: "allocated" | "rejected" }) => setStatus({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  if (isLoading) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (!data?.isAdmin) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-sm text-muted-foreground">{t("admin.denied")}</p>;
  }

  return (
    <>
      <PageHeader title={t("admin.title")} subtitle={`${t("admin.instruments")}: ${data.instrumentCount}`} />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">{t("admin.requests")}</TabsTrigger>
            <TabsTrigger value="enquiries">{t("admin.enquiries")}</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="feeds">Data feeds</TabsTrigger>
            <TabsTrigger value="crawlers">AI crawlers</TabsTrigger>
          </TabsList>


          <TabsContent value="requests" className="mt-4 space-y-3">
            {data.requests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.instruments?.name ?? "—"}</p>
                  <p className="tnum text-xs text-muted-foreground">
                    {r.currency} {r.amount} · {formatDate(r.created_at, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.status}</Badge>
                  <Button size="sm" onClick={() => mutation.mutate({ id: r.id, status: "allocated" })}>
                    ✓
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: r.id, status: "rejected" })}>
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="enquiries" className="mt-4 space-y-3">
            {data.enquiries.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{e.subject}</p>
                  <Badge variant="secondary">{e.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{e.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {e.instruments?.name ?? "—"} · {formatDate(e.created_at, locale)}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <PricingBoard />
          </TabsContent>

          <TabsContent value="feeds" className="mt-4">
            <FeedsBoard />
          </TabsContent>

          <TabsContent value="crawlers" className="mt-4">
            <CrawlerBoard />
          </TabsContent>
        </Tabs>
      </div>

    </>
  );
}

/** Manual pricing desk: shows staleness and lets an admin post a quote until the vendor feed is live. */
function PricingBoard() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const fetchBoard = useServerFn(getPricingBoard);
  const savePrice = useServerFn(recordPrice);
  const [draft, setDraft] = useState<Record<string, { price: string; yield: string }>>({});

  const { data, isLoading } = useQuery({ queryKey: ["admin", "pricing"], queryFn: () => fetchBoard() });

  const mutation = useMutation({
    mutationFn: (vars: { instrumentId: string; price?: number | null; yieldToMaturity?: number | null }) =>
      savePrice({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "pricing"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
        Prices are curated reference data. Once a market-data vendor is contracted, their feed can POST to
        <code className="mx-1">/api/public/ingest/prices</code> with the ingest secret and these rows update automatically.
      </p>
      {(data ?? []).map((row) => {
        const d = draft[row.id] ?? { price: "", yield: "" };
        return (
          <div key={row.id} className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.name}</p>
              <p className="tnum text-xs text-muted-foreground">
                {row.isin ?? "—"} · {row.price_source} · {row.price_as_of ? formatDate(row.price_as_of, locale) : "never priced"}
              </p>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Price</label>
                <Input
                  className="h-9 w-24"
                  inputMode="decimal"
                  value={d.price}
                  onChange={(e) => setDraft((s) => ({ ...s, [row.id]: { ...d, price: e.target.value } }))}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Yield %</label>
                <Input
                  className="h-9 w-24"
                  inputMode="decimal"
                  value={d.yield}
                  onChange={(e) => setDraft((s) => ({ ...s, [row.id]: { ...d, yield: e.target.value } }))}
                />
              </div>
              <Button
                size="sm"
                disabled={mutation.isPending || (!d.price && !d.yield)}
                onClick={() =>
                  mutation.mutate({
                    instrumentId: row.id,
                    price: d.price ? Number(d.price) : null,
                    yieldToMaturity: d.yield ? Number(d.yield) : null,
                  })
                }
              >
                Save
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TARGET_PROMPTS = [
  "What is a sukuk?",
  "Sukuk vs bonds — what is the difference?",
  "Are sukuk safe investments?",
  "Which sukuk have the highest yield right now?",
  "How do I invest in UAE sukuk?",
  "Are sukuk halal?",
  "Best Shariah-compliant fixed income investments",
  "Green sukuk explained",
  "List of Malaysian sukuk issues",
  "Where can I find open sukuk data?",
];

/** Which AI answer engines and search crawlers are reading the site. */
function CrawlerBoard() {
  const fetchActivity = useServerFn(getCrawlerActivity);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "crawlers"], queryFn: () => fetchActivity() });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data || data.recent.length === 0)
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
        No AI or search crawler visits recorded yet. GPTBot, PerplexityBot, ClaudeBot, Googlebot and others are logged
        here automatically once they fetch a page.
      </p>
    );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Visits by bot</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.bots.map((bot) => (
            <span key={bot.bot} className="rounded-full border border-border bg-card px-3 py-1 text-xs">
              {bot.bot} · {bot.count}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Most crawled pages</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {data.paths.map((row) => (
            <li key={row.path} className="flex justify-between gap-4 border-b border-border py-1">
              <span className="truncate font-mono">{row.path}</span>
              <span className="tnum">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Prompts we target</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Spot-check these in ChatGPT, Perplexity, Gemini and Claude to see whether Sukuk Market is cited.
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {TARGET_PROMPTS.map((prompt) => (
            <li key={prompt}>· {prompt}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Recent visits</h3>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {data.recent.map((row) => (
            <li key={row.id} className="flex justify-between gap-4 border-b border-border py-1">
              <span className="truncate">
                <span className="font-medium text-foreground">{row.bot}</span>{" "}
                <span className="font-mono">{row.path}</span>
              </span>
              <span className="whitespace-nowrap">{new Date(row.hit_at).toISOString().slice(0, 16).replace("T", " ")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Free public-source pipeline: run log, FX snapshot and the sukuk deal radar. */
function FeedsBoard() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const fetchFeeds = useServerFn(getDataFeeds);
  const updateDeal = useServerFn(setDealStatus);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "feeds"], queryFn: () => fetchFeeds() });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: "tracked" | "dismissed" }) => updateDeal({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feeds"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
        Runs every 2 hours on free official sources: US Treasury par curve, Bank Negara Malaysia rates, ECB reference FX,
        instrument lifecycle refresh and a sukuk deal radar. No vendor keys required.
      </p>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Deal radar</h3>
        <div className="space-y-2">
          {(data?.deals ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No new deals spotted yet — the next run will populate this.</p>
          ) : null}
          {(data?.deals ?? []).map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="min-w-0">
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium hover:underline">
                  {d.headline}
                </a>
                <p className="tnum text-xs text-muted-foreground">
                  {[d.publisher, d.country, d.currency, d.size_amount ? d.size_amount.toLocaleString() : null,
                    d.published_at ? formatDate(d.published_at, locale) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{d.stage}</Badge>
                <Button size="sm" onClick={() => mutation.mutate({ id: d.id, status: "tracked" })}>Track</Button>
                <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: d.id, status: "dismissed" })}>
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Recent runs</h3>
        <div className="space-y-1">
          {(data?.runs ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-xs">
              <span className="font-medium">{r.source}</span>
              <span className="text-muted-foreground">{r.message ?? ""}</span>
              <span className="tnum">{r.records}</span>
              <Badge variant={r.status === "ok" ? "secondary" : "destructive"}>{r.status}</Badge>
              <span className="tnum text-muted-foreground">{formatDate(r.ran_at, locale)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">FX snapshot</h3>
        <div className="flex flex-wrap gap-2">
          {(data?.fx ?? []).map((f) => (
            <span key={f.currency} className="tnum rounded-md border border-border bg-card px-2 py-1 text-xs">
              {f.currency} {Number(f.rate_to_usd).toFixed(4)}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
