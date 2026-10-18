# Rebrand to “Sukuk Market”

The product name is now **Sukuk Market**. This plan updates every user-facing reference from the current “Sukuk Souq” / “Sukuk Souq — Global Sukuk & Bond Marketplace” branding.

## What will change

1. **Translation dictionary** (`src/i18n/translations.ts`)
   - English: `brand.name` → `Sukuk Market`; `brand.tagline` → `The global sukuk market`.
   - Arabic: keep `brand.name` as `سوق الصكوك` (already means “Sukuk Market”); keep tagline `السوق العالمية للصكوك`.
   - Malay: `brand.name` → `Sukuk Market`; `brand.tagline` → `Pasaran sukuk global`.
   - Update `market.title` from “Sukuk marketplace” to “Sukuk market” in all three languages to match the new name.

2. **Route head metadata** (all `src/routes/*.tsx` files)
   - Replace `Sukuk Souq` with `Sukuk Market` in every `<title>`, `og:title`, and `og:description`.
   - Affected routes: `__root.tsx`, `index.tsx`, `market.tsx`, `bonds.tsx`, `learn.tsx`, `compare.tsx`, `about.tsx`, `auth.tsx`, `instrument.$slug.tsx`, and the authenticated routes (`watchlist`, `portfolio`, `account`, `admin`).

3. **About page body copy** (`src/routes/about.tsx`)
   - Replace “Sukuk Souq” with “Sukuk Market” in the English, Arabic, and Malay paragraphs.

4. **Language persistence key** (`src/i18n/index.tsx`)
   - Rename `STORAGE_KEY` from `sukuk-souq-lang` to `sukuk-market-lang` so the saved preference aligns with the new brand.

5. **Verification**
   - Run the build/typecheck to confirm no broken references.
   - Spot-check the header, home page, and about page in the preview to confirm the new brand renders correctly in EN, AR, and MS.
