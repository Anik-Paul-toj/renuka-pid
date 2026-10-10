-- ==============================================================================
-- Migration: 20261010000003_gallery_media_assets.sql
-- Description: Extend media_assets table with gallery display order, publication
--              status, and JSON metadata. Preserves all existing records.
-- ==============================================================================

-- 1. Add columns to media_assets if they do not already exist
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Index for efficient retrieval of published gallery items sorted by display_order
CREATE INDEX IF NOT EXISTS idx_media_assets_gallery_published
  ON public.media_assets(category, is_published, display_order)
  WHERE category = 'gallery';

-- 3. Comments for documentation integrity
COMMENT ON COLUMN public.media_assets.is_published IS 'Visibility flag for public display (e.g. landing page gallery).';
COMMENT ON COLUMN public.media_assets.display_order IS 'Sort order for curated gallery layouts (ascending).';
COMMENT ON COLUMN public.media_assets.metadata IS 'Flexible JSON metadata for Cloudinary details, dimensions, and photographer notes.';
