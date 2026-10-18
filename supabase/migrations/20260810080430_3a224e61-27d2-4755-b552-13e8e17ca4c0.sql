-- 1. Remove bonds
DELETE FROM public.watchlist WHERE instrument_id IN (SELECT id FROM public.instruments WHERE instrument_type = 'bond');
DELETE FROM public.holdings WHERE instrument_id IN (SELECT id FROM public.instruments WHERE instrument_type = 'bond');
DELETE FROM public.subscription_requests WHERE instrument_id IN (SELECT id FROM public.instruments WHERE instrument_type = 'bond');
DELETE FROM public.enquiries WHERE instrument_id IN (SELECT id FROM public.instruments WHERE instrument_type = 'bond');
DELETE FROM public.instruments WHERE instrument_type = 'bond';
DELETE FROM public.issuers i WHERE NOT EXISTS (SELECT 1 FROM public.instruments x WHERE x.issuer_id = i.id);

-- 2. Locale-keyed translations
CREATE TABLE public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('instrument','issuer')),
  entity_id uuid NOT NULL,
  locale text NOT NULL,
  name text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, locale)
);
GRANT SELECT ON public.content_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_translations TO authenticated;
GRANT ALL ON public.content_translations TO service_role;
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Translations are publicly readable" ON public.content_translations FOR SELECT USING (true);
CREATE POLICY "Admins manage translations" ON public.content_translations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- backfill existing ar/ms columns
INSERT INTO public.content_translations (entity_type, entity_id, locale, name, description)
SELECT 'instrument', id, 'ar', name_ar, description_ar FROM public.instruments WHERE name_ar IS NOT NULL OR description_ar IS NOT NULL;
INSERT INTO public.content_translations (entity_type, entity_id, locale, name, description)
SELECT 'instrument', id, 'ms', name_ms, description_ms FROM public.instruments WHERE name_ms IS NOT NULL OR description_ms IS NOT NULL;
INSERT INTO public.content_translations (entity_type, entity_id, locale, name)
SELECT 'issuer', id, 'ar', name_ar FROM public.issuers WHERE name_ar IS NOT NULL;
INSERT INTO public.content_translations (entity_type, entity_id, locale, name)
SELECT 'issuer', id, 'ms', name_ms FROM public.issuers WHERE name_ms IS NOT NULL;

-- 3. Price history
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  price numeric,
  yield_to_maturity numeric,
  spread_bps numeric,
  source text NOT NULL DEFAULT 'manual',
  as_of timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instrument_id, as_of)
);
CREATE INDEX price_history_instrument_asof_idx ON public.price_history (instrument_id, as_of DESC);
GRANT SELECT ON public.price_history TO anon;
GRANT SELECT ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price history is publicly readable" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Admins manage price history" ON public.price_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.instruments
  ADD COLUMN price_as_of timestamptz,
  ADD COLUMN price_source text NOT NULL DEFAULT 'curated';

-- 4. Distribution partners
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  country text NOT NULL,
  country_code text NOT NULL,
  regulator text,
  contact_email text,
  website text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO anon;
GRANT SELECT ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners are publicly readable" ON public.partners FOR SELECT USING (is_active);
CREATE POLICY "Admins manage partners" ON public.partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.partners (slug, name, country, country_code, regulator, website) VALUES
  ('uae-desk', 'Gulf Islamic Capital Desk', 'United Arab Emirates', 'AE', 'SCA / DFSA', NULL),
  ('ksa-desk', 'Riyadh Fixed Income Desk', 'Saudi Arabia', 'SA', 'CMA', NULL),
  ('my-desk', 'Kuala Lumpur Sukuk Desk', 'Malaysia', 'MY', 'Securities Commission Malaysia', NULL),
  ('id-desk', 'Jakarta Syariah Desk', 'Indonesia', 'ID', 'OJK', NULL),
  ('qa-desk', 'Doha Capital Markets Desk', 'Qatar', 'QA', 'QFMA', NULL),
  ('bh-desk', 'Manama Islamic Finance Desk', 'Bahrain', 'BH', 'CBB', NULL),
  ('kw-desk', 'Kuwait Investment Desk', 'Kuwait', 'KW', 'CMA Kuwait', NULL),
  ('tr-desk', 'Istanbul Participation Desk', 'Türkiye', 'TR', 'CMB', NULL),
  ('pk-desk', 'Karachi Islamic Desk', 'Pakistan', 'PK', 'SECP', NULL),
  ('om-desk', 'Muscat Capital Desk', 'Oman', 'OM', 'FSA Oman', NULL);

ALTER TABLE public.enquiries
  ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN routed_at timestamptz;

-- 5. Saved screens
CREATE TABLE public.saved_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  search text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_screens TO authenticated;
GRANT ALL ON public.saved_screens TO service_role;
ALTER TABLE public.saved_screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved screens" ON public.saved_screens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Alerts
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  metric text NOT NULL DEFAULT 'yield' CHECK (metric IN ('yield','price')),
  direction text NOT NULL DEFAULT 'above' CHECK (direction IN ('above','below')),
  threshold numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own alerts" ON public.alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_content_translations_updated_at BEFORE UPDATE ON public.content_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_screens_updated_at BEFORE UPDATE ON public.saved_screens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Seed price history from current indicative levels
INSERT INTO public.price_history (instrument_id, price, yield_to_maturity, spread_bps, source, as_of)
SELECT id, indicative_price, yield_to_maturity, spread_bps, 'curated', now()
FROM public.instruments WHERE indicative_price IS NOT NULL OR yield_to_maturity IS NOT NULL;
UPDATE public.instruments SET price_as_of = now() WHERE indicative_price IS NOT NULL OR yield_to_maturity IS NOT NULL;