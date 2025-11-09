-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily attendance generation at 12:01 AM every day
SELECT cron.schedule(
  'daily-attendance-generation',
  '1 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ksxpgnjeqpiuxedilufi.supabase.co/functions/v1/daily-attendance-generator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeHBnbmplcXBpdXhlZGlsdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDYzMzYsImV4cCI6MjA3MTc4MjMzNn0.gmPH7PIV5kA6dGtI4TzOA4Abz8lr5mXpHVc0ZzYeUJo"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Schedule attendance notifications every hour from 6 AM to 9 PM
SELECT cron.schedule(
  'hourly-attendance-notifications', 
  '0 6-21 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ksxpgnjeqpiuxedilufi.supabase.co/functions/v1/attendance-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeHBnbmplcXBpdXhlZGlsdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDYzMzYsImV4cCI6MjA3MTc4MjMzNn0.gmPH7PIV5kA6dGtI4TzOA4Abz8lr5mXpHVc0ZzYeUJo"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);