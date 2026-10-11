-- ==============================================================================
-- Renuka Art Studio Migration: Course and Cohort Batch Cover Images
-- Adds cover_image_url and cover_image_public_id for Cloudinary storage
-- ==============================================================================

-- 1. Add cover image columns to courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_public_id TEXT;

-- 2. Add cover image columns to cohort_batches table
ALTER TABLE public.cohort_batches
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_public_id TEXT;

-- 3. Recreate public_cohort_batches view including cover_image_url
CREATE OR REPLACE VIEW public.public_cohort_batches AS
SELECT 
  cb.id,
  cb.course_id,
  cb.batch_name,
  cb.start_date,
  cb.end_date,
  cb.last_registration_date,
  cb.start_time,
  cb.end_time,
  cb.timezone,
  cb.total_seats,
  cb.seats_booked,
  cb.is_enrollment_open,
  cb.cover_image_url,
  c.title AS course_title,
  c.slug AS course_slug
FROM public.cohort_batches cb
JOIN public.courses c ON cb.course_id = c.id
WHERE c.is_active = true;

GRANT SELECT ON public.public_cohort_batches TO anon, authenticated;
