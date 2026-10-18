/** AI + search crawler detection and logging (server only). */

const BOTS: { name: string; pattern: RegExp }[] = [
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "ChatGPT-User", pattern: /ChatGPT-User/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "Perplexity-User", pattern: /Perplexity-User/i },
  { name: "ClaudeBot", pattern: /ClaudeBot|Claude-SearchBot|anthropic-ai|Claude-User/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  { name: "Googlebot", pattern: /Googlebot/i },
  { name: "Bingbot", pattern: /bingbot/i },
  { name: "Applebot", pattern: /Applebot/i },
  { name: "Bytespider", pattern: /Bytespider/i },
  { name: "Amazonbot", pattern: /Amazonbot/i },
  { name: "Meta", pattern: /meta-externalagent|facebookexternalhit|FacebookBot/i },
  { name: "CCBot", pattern: /CCBot/i },
  { name: "DuckAssistBot", pattern: /DuckAssistBot|DuckDuckBot/i },
  { name: "cohere-ai", pattern: /cohere-ai/i },
  { name: "MistralAI-User", pattern: /MistralAI/i },
  { name: "YouBot", pattern: /YouBot/i },
  { name: "Diffbot", pattern: /Diffbot/i },
  { name: "Timpibot", pattern: /Timpibot/i },
];

export function detectBot(userAgent: string | null): string | null {
  if (!userAgent) return null;
  return BOTS.find((bot) => bot.pattern.test(userAgent))?.name ?? null;
}

const IGNORED = /\.(css|js|mjs|map|png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/i;

/** Fire-and-forget: records a crawler visit. Never throws into the request path. */
export async function logCrawlerHit(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent");
    const bot = detectBot(userAgent);
    if (!bot) return;

    const url = new URL(request.url);
    if (IGNORED.test(url.pathname) || url.pathname.startsWith("/_")) return;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("crawler_hits").insert({
      bot,
      path: url.pathname,
      user_agent: userAgent?.slice(0, 500) ?? null,
    });
  } catch (error) {
    console.error("[crawler-log]", error);
  }
}
