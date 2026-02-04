-- Auto-run discovery every 2 hours using pg_cron + pg_net
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qfffuuqldmjtxxihynug/sql

-- 1. Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule discovery every 2 hours
SELECT cron.schedule(
  'mysellguid-discovery',
  '0 */2 * * *',
  $$
    SELECT net.http_post(
      url := 'https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/discovery?action=run',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- 3. Verify it's scheduled
-- SELECT * FROM cron.job WHERE jobname = 'mysellguid-discovery';

-- To remove later:
-- SELECT cron.unschedule('mysellguid-discovery');
