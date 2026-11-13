-- Migration: 20261113000001_notification_status_expansion.sql
-- Purpose: Support 'pending' and 'skipped' statuses in notification_logs for complete WhatsApp template state tracking.
-- Additive and backward-compatible.

DO $$
BEGIN
  -- Drop existing status check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notification_logs_status_check' 
      AND conrelid = 'public.notification_logs'::regclass
  ) THEN
    ALTER TABLE public.notification_logs DROP CONSTRAINT notification_logs_status_check;
  END IF;

  -- Add updated check constraint including 'pending' and 'skipped'
  ALTER TABLE public.notification_logs 
    ADD CONSTRAINT notification_logs_status_check 
    CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending', 'skipped'));
END $$;

