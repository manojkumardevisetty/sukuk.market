import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const quoteSchema = z.object({
  isin: z.string().min(6),
  price: z.number().nullable().optional(),
  yield_to_maturity: z.number().nullable().optional(),
  spread_bps: z.number().nullable().optional(),
  as_of: z.string().optional(),
});

const payloadSchema = z.object({
  source: z.string().min(1).max(64).default("vendor"),
  quotes: z.array(quoteSchema).min(1).max(1000),
});

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/ingest/prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PRICE_INGEST_SECRET"];
        const provided = request.headers.get("x-ingest-secret") ?? "";
        if (!secret || !timingSafeEqual(provided, secret)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let payload: z.infer<typeof payloadSchema>;
        try {
          payload = payloadSchema.parse(await request.json());
        } catch (err) {
          return new Response(JSON.stringify({ error: "Invalid payload", detail: String(err) }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const isins = payload.quotes.map((q) => q.isin.toUpperCase());
        const { data: instruments, error: lookupError } = await supabaseAdmin
          .from("instruments")
          .select("id, isin")
          .in("isin", isins);
        if (lookupError) {
          return new Response(JSON.stringify({ error: lookupError.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const byIsin = new Map((instruments ?? []).map((row) => [row.isin?.toUpperCase(), row.id]));
        const matched: { id: string; quote: z.infer<typeof quoteSchema>; asOf: string }[] = [];
        const unmatched: string[] = [];

        for (const quote of payload.quotes) {
          const id = byIsin.get(quote.isin.toUpperCase());
          if (!id) {
            unmatched.push(quote.isin);
            continue;
          }
          matched.push({ id, quote, asOf: quote.as_of ?? new Date().toISOString() });
        }

        if (matched.length) {
          const { error: insertError } = await supabaseAdmin.from("price_history").insert(
            matched.map(({ id, quote, asOf }) => ({
              instrument_id: id,
              price: quote.price ?? null,
              yield_to_maturity: quote.yield_to_maturity ?? null,
              spread_bps: quote.spread_bps ?? null,
              source: payload.source,
              as_of: asOf,
            })),
          );
          if (insertError) {
            return new Response(JSON.stringify({ error: insertError.message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            });
          }

          await Promise.all(
            matched.map(({ id, quote, asOf }) =>
              supabaseAdmin
                .from("instruments")
                .update({
                  ...(quote.price != null ? { indicative_price: quote.price } : {}),
                  ...(quote.yield_to_maturity != null ? { yield_to_maturity: quote.yield_to_maturity } : {}),
                  price_source: payload.source,
                  price_as_of: asOf,
                })
                .eq("id", id),
            ),
          );
        }

        // Evaluate active alerts against the freshly ingested values.
        let triggered = 0;
        if (matched.length) {
          const { data: alerts } = await supabaseAdmin
            .from("alerts")
            .select("id, instrument_id, metric, direction, threshold")
            .eq("is_active", true)
            .in(
              "instrument_id",
              matched.map((m) => m.id),
            );

          const latest = new Map(matched.map((m) => [m.id, m.quote]));
          const hits = (alerts ?? []).filter((alert) => {
            const quote = latest.get(alert.instrument_id);
            if (!quote) return false;
            const value = alert.metric === "price" ? quote.price : quote.yield_to_maturity;
            if (value == null) return false;
            return alert.direction === "below" ? value <= alert.threshold : value >= alert.threshold;
          });

          if (hits.length) {
            triggered = hits.length;
            await supabaseAdmin
              .from("alerts")
              .update({ last_triggered_at: new Date().toISOString() })
              .in(
                "id",
                hits.map((h) => h.id),
              );
          }
        }

        return new Response(
          JSON.stringify({ ok: true, ingested: matched.length, unmatched, alerts_triggered: triggered }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
