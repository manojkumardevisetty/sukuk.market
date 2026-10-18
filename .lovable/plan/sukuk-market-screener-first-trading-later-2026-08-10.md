# Sukuk Market — Screener First, Trading Later

Reposition the platform as a global sukuk **screener**: fast, data-dense, language-agnostic, free to browse. Accounts exist only to save favourites and set alerts. Bonds are removed. Buying is a later phase and is designed for now as a lead handoff to licensed brokers/banks.

## Phase 1 — Screener (this build)

**Public, no login required**
- Screener as the main surface: dense sortable table, saved-view URLs, column chooser, CSV export.
- Filters: country, issuer type, structure (Ijarah, Wakalah, Murabahah, Mudarabah, Musharakah, hybrid), currency, rating band, yield range, maturity bucket, size, ESG/green, AAOIFI compliance, tokenized flag, status.
- Instrument detail: full terms, pricing panel, price/yield history chart, issuer profile, similar instruments.
- Issuer pages and country pages (Malaysia, Saudi Arabia, UAE, Indonesia, Qatar, Bahrain, Kuwait, Turkey, Pakistan, Oman) with market snapshot stats.
- Market overview: aggregate outstanding, issuance by country/currency/structure, yield curve view.

**Account layer (light)**
- Email/password, Google, and Apple sign-in.
- Favourites/watchlist, saved screens, and price/yield alert preferences.
- Everything else stays public — no wall in front of the data.

**Conversion path (the "push to buy")**
- "Register interest" on any instrument captures the enquiry and routes it to a partner desk. No regulated activity in-app.
- Partner/broker directory per jurisdiction; enquiries record which partner they were routed to.
- Admin queue to triage enquiries and mark them handed off.

## Language-agnostic redesign

Today EN/AR/MS are hardcoded dictionaries. Replace with a locale registry: each locale is a data entry (code, label, direction, number/date locale), so adding Turkish, Indonesian, Urdu or French is a config change, not a code change. Instrument and issuer names/descriptions move from fixed `name_ar` / `name_ms` columns to a translations table keyed by locale, with English fallback. RTL stays automatic from the locale's direction flag.

## Removing bonds

Delete bond rows, the `/bonds` route, its nav entry, and the bond branches in the market components. The `instrument_type` enum stays but the app treats sukuk as the only type, so re-adding later is not blocked.

## Phase 2 — Trading (architecture prepared, not built)

Kept as clean seams so nothing is rewritten later: partner/venue table already present, enquiry status machine already models handoff stages, and an order-intent table can attach to the same instrument records. KYC and order tickets come only once a licensed partner is contracted.

## What live data needs from you

Real-time sukuk pricing is not publicly available; it comes from a licensed vendor. To turn the screener live I need:

1. **A vendor contract and credentials** — LSEG/Refinitiv, Bloomberg (B-PIPE/Data License), ICE, FactSet or SIX. Their sukuk/fixed-income evaluated pricing product with **redistribution rights**, otherwise prices can't be shown publicly.
2. **API credentials** for that vendor, which I'll store as backend secrets — never in code.
3. **Instrument identifiers** to map against: ISIN list (and vendor RIC/FIGI where applicable) for the sukuk universe you want covered.
4. **Refresh cadence and licensing terms** — true real-time streaming is usually restricted and expensive; delayed (15-min) or end-of-day evaluated pricing is what most public screeners are licensed for. Tell me which tier you buy and I'll match the UI (badges showing "delayed 15 min" / "EOD" and the as-of timestamp).

Until a vendor is in place, the screener runs on the curated catalogue with an admin price-update screen, so the product is usable today and the feed drops in behind the same interface.

## Technical notes

- New tables: `instrument_translations` (locale-keyed names/descriptions), `price_history` (instrument, price, yield, as_of, source), `partners` (jurisdiction, name, contact), `saved_screens`, `alerts`. Enquiries gain a `partner_id` and richer status. All with row-level security and grants; catalogue tables stay publicly readable, user tables scoped to the owner.
- Ingestion is built as a provider interface (`fetchQuotes(isins) -> quotes`) with a manual/admin provider first and a vendor provider added later; a scheduled job writes into `price_history` and updates the latest snapshot on `instruments`.
- Screener state lives in URL search params (already the pattern in `market.tsx`), so saved screens are just stored URLs.
- Public reads keep using the publishable-key server client; favourites, saved screens and alerts use authenticated server functions.
- Apple sign-in is added alongside Google through the managed social login configuration.
