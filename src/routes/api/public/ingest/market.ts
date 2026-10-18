import { createFileRoute } from "@tanstack/react-router";

function authorised(request: Request) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  const provided = request.headers.get("apikey") ?? "";
  return Boolean(key) && provided === key;
}

async function run(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { runAllFeeds } = await import("@/lib/marketdata.server");
  const result = await runAllFeeds();
  return Response.json({ ok: true, ran_at: new Date().toISOString(), result });
}

export const Route = createFileRoute("/api/public/ingest/market")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});
