-- Migration: 20261111000001_whatsapp_cloud_api_tracking.sql
-- Purpose: Support complete WhatsApp Cloud API tracking for bookings, reminders, and broadcasts

-- 1. Extend notification_logs table with template and broadcast associations
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS broadcast_id UUID REFERENCES public.broadcasts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.cohort_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS error_code TEXT;

-- 2. Add WhatsApp consent tracking on customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN NOT NULL DEFAULT true;

-- 3. Add supporting indexes for fast webhook lookups and audit queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_broadcast ON public.notification_logs(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_batch ON public.notification_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_provider_msg ON public.notification_logs(provider_message_id);

