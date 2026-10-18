import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin.server";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) return { isAdmin: false as const, enquiries: [], requests: [], instrumentCount: 0 };

    const [enquiries, requests, instruments] = await Promise.all([
      context.supabase.from("enquiries").select("*, instruments(name)").order("created_at", { ascending: false }),
      context.supabase
        .from("subscription_requests")
        .select("*, instruments(name)")
        .order("created_at", { ascending: false }),
      context.supabase.from("instruments").select("id", { count: "exact", head: true }),
    ]);

    return {
      isAdmin: true as const,
      enquiries: enquiries.data ?? [],
      requests: requests.data ?? [],
      instrumentCount: instruments.count ?? 0,
    };
  });

export const setRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status: "submitted" | "under_review" | "allocated" | "rejected" | "withdrawn" }) => data)
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("subscription_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Instruments ordered by staleness so admins can see what the feed has not refreshed. */
export const getPricingBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("instruments")
      .select("id, name, isin, currency, indicative_price, yield_to_maturity, price_source, price_as_of")
      .order("price_as_of", { ascending: true, nullsFirst: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Manual price override — used until a market-data vendor feed is wired to the ingest endpoint. */
export const recordPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; price?: number | null; yieldToMaturity?: number | null; source?: string }) => data)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const asOf = new Date().toISOString();
    const source = data.source?.trim() || "manual";

    const { error: histError } = await context.supabase.from("price_history").insert({
      instrument_id: data.instrumentId,
      price: data.price ?? null,
      yield_to_maturity: data.yieldToMaturity ?? null,
      source,
      as_of: asOf,
    });
    if (histError) throw new Error(histError.message);

    const { error } = await context.supabase
      .from("instruments")
      .update({
        ...(data.price != null ? { indicative_price: data.price } : {}),
        ...(data.yieldToMaturity != null ? { yield_to_maturity: data.yieldToMaturity } : {}),
        price_source: source,
        price_as_of: asOf,
      })
      .eq("id", data.instrumentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** AI + search crawler activity, for measuring answer-engine visibility. */
export const getCrawlerActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("crawler_hits")
      .select("id, bot, path, hit_at")
      .order("hit_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const byBot = new Map<string, number>();
    const byPath = new Map<string, number>();
    for (const row of rows) {
      byBot.set(row.bot, (byBot.get(row.bot) ?? 0) + 1);
      byPath.set(row.path, (byPath.get(row.path) ?? 0) + 1);
    }
    return {
      recent: rows.slice(0, 60),
      bots: [...byBot.entries()].map(([bot, count]) => ({ bot, count })).sort((a, b) => b.count - a.count),
      paths: [...byPath.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 20),
    };
  });

/** Free-source data feed status + the deal radar queue. */
export const getDataFeeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [runs, deals, fx] = await Promise.all([
      context.supabase.from("data_feed_runs").select("*").order("ran_at", { ascending: false }).limit(60),
      context.supabase
        .from("deal_candidates")
        .select("id, headline, url, publisher, published_at, issuer_guess, country, currency, size_amount, stage, status")
        .eq("status", "new")
        .order("published_at", { ascending: false })
        .limit(60),
      context.supabase.from("fx_rates").select("currency, rate_to_usd, as_of, source").order("currency"),
    ]);
    return { runs: runs.data ?? [], deals: deals.data ?? [], fx: fx.data ?? [] };
  });

export const setDealStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status: "new" | "tracked" | "dismissed" }) => data)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("deal_candidates")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
