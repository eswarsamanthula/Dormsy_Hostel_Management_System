-- Create cron job for daily attendance generation (runs at midnight)
SELECT cron.schedule(
  'generate-daily-attendance',
  '0 0 * * *', -- Every day at midnight
  $$
  SELECT net.http_post(
    url := 'https://ksxpgnjeqpiuxedilufi.supabase.co/functions/v1/daily-attendance-generator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeHBnbmplcXBpdXhlZGlsdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDYzMzYsImV4cCI6MjA3MTc4MjMzNn0.gmPH7PIV5kA6dGtI4TzOA4Abz8lr5mXpHVc0ZzYeUJo"}'::jsonb
  ) AS request_id;
  $$
);

-- Create cron job for attendance notifications (runs every 2 hours)
SELECT cron.schedule(
  'attendance-notifications',
  '0 */2 * * *', -- Every 2 hours
  $$
  SELECT net.http_post(
    url := 'https://ksxpgnjeqpiuxedilufi.supabase.co/functions/v1/attendance-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzeHBnbmplcXBpdXhlZGlsdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDYzMzYsImV4cCI6MjA3MTc4MjMzNn0.gmPH7PIV5kA6dGtI4TzOA4Abz8lr5mXpHVc0ZzYeUJo"}'::jsonb
  ) AS request_id;
  $$
);