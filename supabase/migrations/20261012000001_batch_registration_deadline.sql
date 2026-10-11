-- ==============================================================================
-- Renuka Art Studio (webrenuka) - Migration: Batch Registration Deadline
-- ==============================================================================
-- Adds `last_registration_date` column to `public.cohort_batches`
-- Updates `public.public_cohort_batches` view to safely expose the deadline.
-- ==============================================================================

-- 1. Add last_registration_date column if not already present
ALTER TABLE public.cohort_batches
ADD COLUMN IF NOT EXISTS last_registration_date DATE;

-- 2. Backfill existing batches with default deadline (equal to start_date)
UPDATE public.cohort_batches
SET last_registration_date = start_date
WHERE last_registration_date IS NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_cohort_batches_last_reg_date 
ON public.cohort_batches(last_registration_date);

-- 4. Re-create public safe view including last_registration_date
CREATE OR REPLACE VIEW public.public_cohort_batches AS
SELECT 
  id,
  course_id,
  batch_name,
  start_date,
  end_date,
  last_registration_date,
  start_time,
  end_time,
  timezone,
  total_seats,
  seats_booked,
  is_enrollment_open,
  created_at,
  updated_at
FROM public.cohort_batches
WHERE is_enrollment_open = true;

-- 5. Ensure grants are intact
GRANT SELECT ON public.public_cohort_batches TO anon, authenticated, service_role;
