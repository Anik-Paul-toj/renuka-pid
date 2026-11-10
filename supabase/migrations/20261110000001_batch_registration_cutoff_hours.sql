-- ==============================================================================
-- Renuka Art Studio (webrenuka) - Migration: Batch Registration Cutoff Hours
-- ==============================================================================
-- Adds `registration_closes_before_hours` column to `public.cohort_batches`
-- with support for 1, 2, 3, 4, 6, 12, or 24 hours prior to batch start.
-- Default is 2 hours.
-- Also ensures `last_registration_date` is present and updates `public_cohort_batches` view.
-- ==============================================================================

-- 1. Ensure last_registration_date and cover_image columns exist
ALTER TABLE public.cohort_batches
ADD COLUMN IF NOT EXISTS last_registration_date DATE,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_public_id TEXT;

-- 2. Add registration_closes_before_hours column with allowed values check
ALTER TABLE public.cohort_batches
ADD COLUMN IF NOT EXISTS registration_closes_before_hours INTEGER NOT NULL DEFAULT 2
CONSTRAINT valid_registration_cutoff_hours CHECK (registration_closes_before_hours IN (1, 2, 3, 4, 6, 12, 24));

-- 3. Backfill any nulls with default 2 hours
UPDATE public.cohort_batches
SET registration_closes_before_hours = 2
WHERE registration_closes_before_hours IS NULL;

-- 4. Re-create public safe view including registration_closes_before_hours
DROP VIEW IF EXISTS public.public_cohort_batches CASCADE;

CREATE VIEW public.public_cohort_batches AS
SELECT 
  id,
  course_id,
  batch_name,
  start_date,
  end_date,
  last_registration_date,
  registration_closes_before_hours,
  start_time,
  end_time,
  timezone,
  total_seats,
  seats_booked,
  is_enrollment_open,
  cover_image_url,
  created_at,
  updated_at
FROM public.cohort_batches
WHERE is_enrollment_open = true;

-- 5. Ensure grants are intact
GRANT SELECT ON public.public_cohort_batches TO anon, authenticated, service_role;

