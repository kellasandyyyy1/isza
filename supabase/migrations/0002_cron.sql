-- Run after deploying, with YOUR_DOMAIN replaced by the real domain.
-- First store CRON_SECRET in Supabase Vault under the name cron_secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'isza-send-reminders',
  '*/5 * * * *',
  $$ select net.http_post(
    url := 'https://YOUR_DOMAIN/api/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) $$
);
