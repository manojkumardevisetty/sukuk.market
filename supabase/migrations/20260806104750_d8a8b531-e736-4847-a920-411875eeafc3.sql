-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.instrument_kind AS ENUM ('sukuk','bond');
CREATE TYPE public.issuer_kind AS ENUM ('sovereign','quasi_sovereign','corporate','financial_institution','supranational');
CREATE TYPE public.instrument_status AS ENUM ('open','listed','matured','upcoming');
CREATE TYPE public.request_status AS ENUM ('submitted','under_review','allocated','rejected','withdrawn');

-- ISSUERS
CREATE TABLE public.issuers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_ar text,
  name_ms text,
  country text NOT NULL,
  country_code text NOT NULL,
  issuer_type public.issuer_kind NOT NULL DEFAULT 'corporate',
  sector text,
  description text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.issuers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issuers TO authenticated;
GRANT ALL ON public.issuers TO service_role;
ALTER TABLE public.issuers ENABLE ROW LEVEL SECURITY;

-- INSTRUMENTS
CREATE TABLE public.instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_ar text,
  name_ms text,
  issuer_id uuid NOT NULL REFERENCES public.issuers(id) ON DELETE CASCADE,
  instrument_type public.instrument_kind NOT NULL DEFAULT 'sukuk',
  structure text,
  isin text,
  currency text NOT NULL DEFAULT 'USD',
  size_amount numeric,
  profit_rate numeric,
  rate_type text DEFAULT 'fixed',
  payment_frequency text DEFAULT 'semi-annual',
  issue_date date,
  maturity_date date,
  min_investment numeric,
  listing_venue text,
  governing_law text,
  rating_moodys text,
  rating_sp text,
  rating_fitch text,
  indicative_price numeric,
  yield_to_maturity numeric,
  spread_bps numeric,
  is_esg boolean NOT NULL DEFAULT false,
  use_of_proceeds text,
  shariah_advisor text,
  aaoifi_compliant boolean NOT NULL DEFAULT false,
  underlying_asset text,
  status public.instrument_status NOT NULL DEFAULT 'listed',
  description text,
  description_ar text,
  description_ms text,
  is_tokenized boolean NOT NULL DEFAULT false,
  token_standard text,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX instruments_type_idx ON public.instruments (instrument_type);
CREATE INDEX instruments_issuer_idx ON public.instruments (issuer_id);
GRANT SELECT ON public.instruments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instruments TO authenticated;
GRANT ALL ON public.instruments TO service_role;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  country text,
  investor_type text,
  preferred_language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- WATCHLIST
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, instrument_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- ENQUIRIES
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id uuid REFERENCES public.instruments(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  contact_email text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- SUBSCRIPTION REQUESTS
CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  status public.request_status NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_requests TO authenticated;
GRANT ALL ON public.subscription_requests TO service_role;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- HOLDINGS
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
  nominal numeric NOT NULL,
  purchase_price numeric NOT NULL DEFAULT 100,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holdings TO authenticated;
GRANT ALL ON public.holdings TO service_role;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- POLICIES: catalogue
CREATE POLICY "Issuers are publicly readable" ON public.issuers FOR SELECT USING (true);
CREATE POLICY "Admins manage issuers" ON public.issuers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Instruments are publicly readable" ON public.instruments FOR SELECT USING (true);
CREATE POLICY "Admins manage instruments" ON public.instruments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POLICIES: user data
CREATE POLICY "Own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Own watchlist" ON public.watchlist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own enquiries" ON public.enquiries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read enquiries" ON public.enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own subscription requests" ON public.subscription_requests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read subscription requests" ON public.subscription_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Own holdings" ON public.holdings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROFILE AUTO-CREATE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();