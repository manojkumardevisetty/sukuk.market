CREATE TABLE public.crawler_hits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot text NOT NULL,
  path text NOT NULL,
  user_agent text,
  hit_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX crawler_hits_hit_at_idx ON public.crawler_hits (hit_at DESC);
CREATE INDEX crawler_hits_bot_idx ON public.crawler_hits (bot);

GRANT ALL ON public.crawler_hits TO service_role;
GRANT SELECT ON public.crawler_hits TO authenticated;

ALTER TABLE public.crawler_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read crawler hits"
ON public.crawler_hits FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));