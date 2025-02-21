
-- Enable the pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the function to run every hour
select cron.schedule(
  'check-reveals-hourly',
  '0 * * * *',
  $$
  select
    net.http_post(
      url:='https://cnongijjpbsgysdophin.supabase.co/functions/v1/check-reveals',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub25naWpqcGJzZ3lzZG9waGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxNDM4MDQsImV4cCI6MjA1NTcxOTgwNH0.pomn_hxQ2cLe4At-42YqJsSSeGZMMDvwuI6bbwhq6VA"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
