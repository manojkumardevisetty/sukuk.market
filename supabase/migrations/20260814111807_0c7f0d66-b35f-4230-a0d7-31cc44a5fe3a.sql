
CREATE TABLE public.benchmark_curves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curve text NOT NULL,
  tenor_years numeric NOT NULL,
  rate numeric NOT NULL,
  as_of date NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (curve, tenor_years, as_of)
);
GRANT SELECT ON public.benchmark_curves TO anon, authenticated;
GRANT ALL ON public.benchmark_curves TO service_role;
ALTER TABLE public.benchmark_curves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Curves are public" ON public.benchmark_curves FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.fx_rates (
  currency text PRIMARY KEY,
  rate_to_usd numeric NOT NULL,
  as_of date NOT NULL,
  source text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fx_rates TO anon, authenticated;
GRANT ALL ON public.fx_rates TO service_role;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FX is public" ON public.fx_rates FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.deal_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  url text NOT NULL UNIQUE,
  publisher text,
  published_at timestamptz,
  issuer_guess text,
  country text,
  currency text,
  size_amount numeric,
  stage text NOT NULL DEFAULT 'announced',
  status text NOT NULL DEFAULT 'new',
  instrument_id uuid REFERENCES public.instruments(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.deal_candidates TO authenticated;
GRANT ALL ON public.deal_candidates TO service_role;
ALTER TABLE public.deal_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read deal radar" ON public.deal_candidates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update deal radar" ON public.deal_candidates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_deal_candidates_updated_at BEFORE UPDATE ON public.deal_candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.data_feed_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL,
  records integer NOT NULL DEFAULT 0,
  message text,
  ran_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.data_feed_runs TO authenticated;
GRANT ALL ON public.data_feed_runs TO service_role;
ALTER TABLE public.data_feed_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read feed runs" ON public.data_feed_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_data_feed_runs_ran_at ON public.data_feed_runs (ran_at DESC);
