-- Migration: 20261118000003_whatsapp_template_purposes.sql
-- Description: Adds internal template_purpose ('confirmation', 'upcoming_batches', 'batch_reminder')
--              and course/default assignment mechanism for automatic WhatsApp booking confirmation.

-- 1. Add template_purpose column if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'whatsapp_message_templates' 
          AND column_name = 'template_purpose'
    ) THEN
        ALTER TABLE public.whatsapp_message_templates
        ADD COLUMN template_purpose TEXT NOT NULL DEFAULT 'batch_reminder'
        CHECK (template_purpose IN ('confirmation', 'upcoming_batches', 'batch_reminder'));
    END IF;
END $$;

-- 2. Add assigned_course_id column for course-specific confirmation templates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'whatsapp_message_templates' 
          AND column_name = 'assigned_course_id'
    ) THEN
        ALTER TABLE public.whatsapp_message_templates
        ADD COLUMN assigned_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add is_default_confirmation column for studio-wide fallback confirmation template
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'whatsapp_message_templates' 
          AND column_name = 'is_default_confirmation'
    ) THEN
        ALTER TABLE public.whatsapp_message_templates
        ADD COLUMN is_default_confirmation BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- 4. Unique constraints to prevent duplicate active confirmation assignments
-- Enforce at most one template assigned per course
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_assigned_course 
ON public.whatsapp_message_templates(assigned_course_id) 
WHERE (template_purpose = 'confirmation' AND assigned_course_id IS NOT NULL);

-- Enforce at most one studio-wide default confirmation template
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_default_confirmation 
ON public.whatsapp_message_templates(is_default_confirmation) 
WHERE (template_purpose = 'confirmation' AND is_default_confirmation = TRUE);

-- Index on template_purpose for fast broadcast and admin filtering
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_purpose 
ON public.whatsapp_message_templates(template_purpose);

-- 5. Backfill existing templates if present
UPDATE public.whatsapp_message_templates
SET template_purpose = 'confirmation', is_default_confirmation = TRUE
WHERE meta_template_name = 'booking_confirmation';

UPDATE public.whatsapp_message_templates
SET template_purpose = 'batch_reminder'
WHERE meta_template_name = 'upcoming_class_reminder';
