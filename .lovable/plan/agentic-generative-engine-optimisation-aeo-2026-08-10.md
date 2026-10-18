# Agentic / Generative Engine Optimisation (AEO)

Goal: when someone asks ChatGPT, Gemini, Perplexity, Claude or an AI search box about sukuk, Islamic fixed income, safe income instruments or regional bonds, Sukuk Market is the source that gets retrieved and cited.

LLM answers come from three places: crawled and indexed pages, live retrieval by AI crawlers, and structured feeds an agent can parse. We build for all three.

## 1. Let the AI crawlers in, explicitly

`robots.txt` today only names Googlebot, Bingbot and two social bots. Rewrite it to explicitly allow the AI crawlers by name — GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-SearchBot, Google-Extended, Applebot-Extended, Bytespider, Amazonbot, meta-externalagent, CCBot, DuckAssistBot, cohere-ai, Diffbot, Timpibot — and point them at the sitemap and the machine-readable feeds below.

## 2. Machine-readable answer surfaces

Endpoints an agent can fetch and quote directly, served from the live catalogue:

- `/llms.txt` — the emerging convention: who we are, what data we hold, jurisdictions covered, licence to cite, and a link list of the key pages and feeds.
- `/llms-full.txt` — a full markdown dump of the catalogue: every sukuk with issuer, country, structure, currency, coupon, yield, maturity, rating and status, plus the explainer content.
- `/sitemap.xml` — generated from the real instrument, issuer and country routes, with lastmod.
- `/api/public/instruments.json` and `/api/public/instruments.csv` — open, no-key, documented, CORS-enabled dataset endpoints so agents (and analysts) can pull the universe.
- `/data` — a human page documenting those feeds, licence terms and attribution wording. Being explicitly citable materially raises citation rate.

## 3. Structured data (JSON-LD) on every page

- Site-wide: `Organization` + `WebSite` with `SearchAction`.
- Instrument pages: `FinancialProduct` (name, ISIN, issuer, currency, yield, maturity, provider) plus `Dataset` semantics for the price history and a `BreadcrumbList`.
- Issuer and country pages: `Organization` / `Dataset` with `about` and `spatialCoverage`.
- Explainer pages: `FAQPage` and `HowTo` where the content fits, and `Article` with `dateModified`.

JSON-LD is what lets a retrieval pipeline extract facts without guessing at the DOM.

## 4. Content built for retrieval, not for keyword stuffing

LLMs quote self-contained, factual, comparison-shaped passages. Add a content layer that answers the actual prompts people type:

- **Question-shaped pages** under `/learn` and a new `/answers` hub: "What is a sukuk?", "Sukuk vs bonds", "Are sukuk safe investments?", "Highest-yielding sukuk right now", "How to invest in UAE sukuk", "Ijarah vs Wakalah vs Murabahah", "Are sukuk halal", "Green sukuk explained", "Sukuk vs fixed deposits".
- **Country pages** (`/market/{country}`) and **structure pages** (`/structure/{type}`): live snapshot stats — number of issues, outstanding size, average yield, top issuers — written as short declarative sentences with a date stamp. Live numbers are what make an answer worth citing over a static blog.
- Every page opens with a 40–60 word direct answer block, then detail. Each page carries a "Key facts" list and an "as of" date — freshness signals strongly influence which source an LLM picks.
- FAQ blocks at the bottom of instrument, country and structure pages, in Q/A form, mirrored into `FAQPage` JSON-LD.

## 5. Crawlability and freshness

- The screener is URL-state driven, so filtered views are already linkable. Add server-rendered, indexable landing routes for the high-intent combinations (country, structure, currency, ESG) instead of leaving them behind query strings only.
- Internal linking mesh: instrument → issuer → country → structure → related instruments, so a crawler reaches everything within two hops.
- `dateModified` from real price/catalogue timestamps in both the head metadata and JSON-LD.
- Canonical tags, `hreflang` for each locale in the registry (EN/AR/MS and any added later) — Arabic-language sukuk queries are a wide-open lane.

## 6. Measurement

- An AI-crawler log view in the admin panel: which bots hit which pages and when, parsed from request headers on the public routes.
- A checklist page listing the prompts we target so we can spot-check citations over time manually.

## Technical notes

- Feeds are TanStack server routes under `src/routes/api/public/*` (already the pattern used by the price ingest route) plus static-path routes for `/llms.txt`, `/llms-full.txt` and `/sitemap.xml`, all reading the catalogue through the existing publishable-key server client and cached with short `s-maxage`.
- JSON-LD is injected via each route's `head()` `scripts` entry, built from loader data so it always matches what's rendered.
- Country/structure/answer routes are file routes with loaders using the existing `sukukQuery` data; no schema change needed. Copy lives in the locale registry so it stays language-agnostic.
- Nothing here touches pricing, auth or the partner handoff flow.
