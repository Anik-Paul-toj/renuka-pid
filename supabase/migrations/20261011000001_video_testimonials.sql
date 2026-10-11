-- ==============================================================================
-- Migration: 20261011000001_video_testimonials.sql
-- Description: Creates video_testimonials table for student YouTube stories.
--              Includes display ordering, publication toggle, course attribution,
--              and Row Level Security policies.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.video_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  description TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  course_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for public landing page retrieval (published items sorted by display_order, created_at)
CREATE INDEX IF NOT EXISTS idx_video_testimonials_published_order
  ON public.video_testimonials(is_published, display_order ASC, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public visitors can only view published testimonials
DROP POLICY IF EXISTS "Public read published video testimonials" ON public.video_testimonials;
CREATE POLICY "Public read published video testimonials"
  ON public.video_testimonials FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Policy 2: Admin users full access
DROP POLICY IF EXISTS "Admin full access video testimonials" ON public.video_testimonials;
CREATE POLICY "Admin full access video testimonials"
  ON public.video_testimonials FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Comments for documentation integrity
COMMENT ON TABLE public.video_testimonials IS 'Curated student video testimonials hosted on YouTube.';
COMMENT ON COLUMN public.video_testimonials.student_name IS 'Student name or display name.';
COMMENT ON COLUMN public.video_testimonials.description IS 'Short testimonial quote or narrative reflection.';
COMMENT ON COLUMN public.video_testimonials.youtube_url IS 'Original YouTube URL submitted by admin.';
COMMENT ON COLUMN public.video_testimonials.youtube_video_id IS 'Sanitized 11-character YouTube video identifier.';
COMMENT ON COLUMN public.video_testimonials.course_name IS 'Optional course or workshop the student attended.';
COMMENT ON COLUMN public.video_testimonials.display_order IS 'Sort order for landing page presentation (ascending).';
COMMENT ON COLUMN public.video_testimonials.is_published IS 'Publication visibility toggle.';
