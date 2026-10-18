# Sukuk Marketplace — UAE first, global-ready

A clean, trilingual (English / العربية / Bahasa Melayu) marketplace for discovering sukuk, with a secondary section for regional conventional bonds. Users can browse, open a full data sheet, save to a watchlist, submit an enquiry, place a subscription request, and track holdings in a portfolio. Tokenized instruments come later — the data model leaves room for them.

## What gets built

### 1. Public marketplace
- **Home** — clear value proposition, market snapshot tiles (total listings, live issues, average yield, countries covered), featured/newest sukuk, entry points to Sukuk and Bonds.
- **Sukuk marketplace** — the core screen. A dense but calm listing table/cards with instant filters: country, issuer type (sovereign / quasi-sovereign / corporate / financial institution), sukuk structure (Ijarah, Murabahah, Mudarabah, Musharakah, Wakalah, Salam, Istisna', hybrid, Manfa'ah), currency, tenor, rating, ESG/green, status (open for subscription / listed / matured), yield range. Sort by yield, maturity, size. Search by issuer or ISIN.
- **Bonds section** — same engine, filtered to conventional regional bonds, visually separated so the Islamic-finance focus stays obvious.
- **Instrument detail page** — everything on one page, organised in tabs/sections: key terms (ISIN, issuer, obligor, structure, profit rate & frequency, issue/maturity date, size, min investment, currency, listing venue, governing law), pricing (indicative price, yield to maturity, spread), ratings (Moody's / S&P / Fitch), Shariah information (structure explainer, Shariah board / advisor, AAOIFI compliance, underlying asset), use of proceeds & green/ESG framework, issuer profile, key dates timeline, documents, and a comparable-issues strip.
- **Compare** — pick up to 4 instruments, side-by-side terms.
- **Learn** — short explainers: what a sukuk is, each structure type, sukuk vs bond, how subscription works.
- **About / Contact / Legal** — including a "not investment advice, indicative data" disclaimer surfaced site-wide.

### 2. Accounts & investor workflows
- Email + password and Google sign-in. Profile holds name, country, preferred language, investor type.
- **Watchlist** — star any instrument, view in one place with live-ish figures.
- **Enquiry** — form on each instrument, goes to an enquiries table, visible in the user's account.
- **Subscription request** — for instruments open for subscription: amount, currency, notes → creates a request with status flow (submitted → under review → allocated → rejected/withdrawn). No payment rails in v1.
- **Portfolio** — manually added or allocation-derived holdings: nominal held, purchase price/date, computed cost, accrued profit estimate, next profit payment date, maturity countdown, allocation charts by structure / country / currency.
- **Alerts (light)** — email-free in-app flags for new issues matching saved filters.

### 3. Admin
- Role-gated admin area (roles in a separate `user_roles` table) to create/edit/archive issuers and instruments, manage the seed catalogue, and review enquiries and subscription requests.

### 4. Trilingual + RTL
- Language switcher in the header, persisted per user and in local storage.
- Full RTL flip for Arabic (direction, mirrored layout, numerals, date formats).
- All UI strings in `en` / `ar` / `ms` translation files. Instrument names and issuer names carry optional Arabic and Malay fields; anything untranslated falls back to English.

## Seed catalogue (from research)

Around 50–60 real instruments, all clearly marked as indicative reference data:
- **UAE** — Federal T-Sukuk programme (AED, MoF auction calendar), Emirates NBD, First Abu Dhabi Bank, DP World, Emirates Islamic, Dubai Islamic Bank, Aldar, Tabreed's USD 700m green sukuk, Majid Al Futtaim green sukuk, Emaar, DIFC-listed issues.
- **Saudi Arabia** — Saudi sovereign local & international sukuk, PIF, Aramco, Saudi Electricity green sukuk, Al Rajhi.
- **Qatar / Kuwait / Bahrain / Oman** — QIB, Kuwait Finance House, Bahrain sovereign sukuk ijarah & salam, Oman sovereign sukuk.
- **Malaysia** — Government of Malaysia global sukuk (USD 1.5bn Manafae, 2026), MGII, Khazanah, Petronas, Cagamas, Tenaga, MAHB.
- **Indonesia / Turkey / Pakistan / UK / Hong Kong** — sovereign global sukuk, plus Indonesia's green sukuk, for the "not confined to one region" story.
- **Bonds section** — GCC sovereign and blue-chip conventional bonds (UAE T-Bonds, Saudi, Qatar, Abu Dhabi, Kuwait corporates).

Each record: issuer, country, structure, currency, size, coupon/profit rate, issue & maturity date, rating, listing venue, ESG flag, status, and a plain-language description.

## Design direction

Clean and institutional — closer to a modern fintech data terminal than a brochure site. Restrained palette anchored in deep green and warm sand with a neutral base, generous whitespace, strong tabular typography, subtle Islamic-geometry motif used sparingly as texture only. Data density where it matters, quiet everywhere else. Fully responsive; the listing table collapses to cards on mobile.

## Technical notes

- Lovable Cloud for the database, auth, and storage. Tables: `issuers`, `instruments` (sukuk + bonds, `instrument_type` discriminator, plus nullable `tokenization` fields for later), `instrument_translations`, `watchlist`, `enquiries`, `subscription_requests`, `holdings`, `profiles`, `user_roles`.
- RLS on everything: catalogue readable by anyone; watchlist/enquiries/requests/holdings scoped to `auth.uid()`; admin writes gated by a `has_role` security-definer function.
- Seed data ships as literal INSERTs in the migration so the marketplace is populated on first load.
- TanStack Router routes per section with per-route SEO metadata; TanStack Query for reads; filters live in URL search params so any filtered view is shareable.
- Tokenization and live market feeds are explicitly out of scope for this build, with the schema and UI leaving space for both.

## Build order

1. Cloud enable, schema + RLS + seeded catalogue.
2. i18n foundation with RTL, design system, shell and navigation.
3. Marketplace list, filters, and instrument detail.
4. Bonds section, compare, learn pages.
5. Auth, profile, watchlist.
6. Enquiries, subscription requests, portfolio.
7. Admin area, SEO pass, responsive/RTL QA.
