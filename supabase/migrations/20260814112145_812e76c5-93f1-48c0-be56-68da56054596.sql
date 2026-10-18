
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('sukuk-market-data-2h') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sukuk-market-data-2h');

SELECT cron.schedule(
  'sukuk-market-data-2h',
  '7 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--9a9d4ecc-5442-4989-8222-2c91a58c90bb.lovable.app/api/public/ingest/market',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_W16fQA14aavkF9e54oTP-g_nCYysJgO"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);
