import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWatchlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("watchlist")
      .select("instrument_id, instruments(*, issuer:issuers(*))")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleWatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; watched: boolean }) => data)
  .handler(async ({ context, data }) => {
    if (data.watched) {
      const { error } = await context.supabase
        .from("watchlist")
        .delete()
        .eq("user_id", context.userId)
        .eq("instrument_id", data.instrumentId);
      if (error) throw new Error(error.message);
      return { watched: false };
    }
    const { error } = await context.supabase
      .from("watchlist")
      .insert({ user_id: context.userId, instrument_id: data.instrumentId });
    if (error) throw new Error(error.message);
    return { watched: true };
  });

export const submitEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; subject: string; message: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("enquiries").insert({
      user_id: context.userId,
      instrument_id: data.instrumentId,
      subject: data.subject.slice(0, 200),
      message: data.message.slice(0, 2000),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; amount: number; currency: string; notes: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("subscription_requests").insert({
      user_id: context.userId,
      instrument_id: data.instrumentId,
      amount: data.amount,
      currency: data.currency,
      notes: data.notes.slice(0, 2000),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getHoldings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("holdings")
      .select("*, instruments(*, issuer:issuers(*))")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; nominal: number; price: number }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("holdings").insert({
      user_id: context.userId,
      instrument_id: data.instrumentId,
      nominal: data.nominal,
      purchase_price: data.price,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("holdings")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [enquiries, requests, profile] = await Promise.all([
      context.supabase.from("enquiries").select("*, instruments(name, slug)").eq("user_id", context.userId),
      context.supabase
        .from("subscription_requests")
        .select("*, instruments(name, slug)")
        .eq("user_id", context.userId),
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);
    return {
      enquiries: enquiries.data ?? [],
      requests: requests.data ?? [],
      profile: profile.data ?? null,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { fullName: string; country: string; preferredLanguage: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName.slice(0, 120),
        country: data.country.slice(0, 80),
        preferred_language: data.preferredLanguage,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSavedScreens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_screens")
      .select("id, name, search, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveScreen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { name: string; search: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("saved_screens").insert({
      user_id: context.userId,
      name: data.name.slice(0, 120) || "Screen",
      search: data.search.slice(0, 2000),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedScreen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("saved_screens")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts")
      .select("id, metric, direction, threshold, is_active, instrument_id, instruments(name, slug)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; metric: string; direction: string; threshold: number }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("alerts").insert({
      user_id: context.userId,
      instrument_id: data.instrumentId,
      metric: data.metric,
      direction: data.direction,
      threshold: data.threshold,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("alerts").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const registerInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { instrumentId: string; partnerId: string | null; message: string }) => data)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("enquiries").insert({
      user_id: context.userId,
      instrument_id: data.instrumentId,
      partner_id: data.partnerId,
      subject: "Register interest",
      message: data.message.slice(0, 2000),
      routed_at: data.partnerId ? new Date().toISOString() : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
