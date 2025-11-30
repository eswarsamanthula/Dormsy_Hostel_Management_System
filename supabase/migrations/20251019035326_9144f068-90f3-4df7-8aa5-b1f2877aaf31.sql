-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the keep-alive function to run daily at 10:00 AM UTC
-- This will prevent the project from being paused due to inactivity
SELECT cron.schedule(
  'keep-alive-daily',
  '0 10 * * *', -- Every day at 10:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://ksxpgnjeqpiuxedilufi.supabase.co/functions/v1/keep-alive',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeHBnbmplcXBpdXhlZGlsdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDYzMzYsImV4cCI6MjA3MTc4MjMzNn0.gmPH7PIV5kA6dGtI4TzOA4Abz8lr5mXpHVc0ZzYeUJo"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);