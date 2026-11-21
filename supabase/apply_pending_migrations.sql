-- Migration: 20261118000001_payment_links.sql
-- Description: Creates table and indexes for shareable direct payment links with cryptographic verification.

-- 1. Payment Links Table
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.cohort_batches(id) ON DELETE CASCADE,
    student_name TEXT,
    student_email TEXT,
    student_phone TEXT,
    amount_paise BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'expired', 'revoked')),
    paid_booking_reference TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast token lookup and admin filters
CREATE INDEX IF NOT EXISTS idx_payment_links_token ON public.payment_links(token);
CREATE INDEX IF NOT EXISTS idx_payment_links_course_batch ON public.payment_links(course_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_links_student ON public.payment_links(student_email, student_phone);

-- RLS Policies (Service role full access)
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'payment_links' AND policyname = 'service_role_all_payment_links'
    ) THEN
        CREATE POLICY service_role_all_payment_links ON public.payment_links
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;


-- Migration: 20261118000002_whatsapp_message_templates.sql
-- Description: Creates table, indexes, and RLS policies for Meta WhatsApp Cloud API Message Templates.

CREATE TABLE IF NOT EXISTS public.whatsapp_message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_title TEXT NOT NULL,
    meta_template_name TEXT NOT NULL,
    meta_template_id TEXT,
    category TEXT NOT NULL CHECK (category IN ('UTILITY', 'MARKETING', 'AUTHENTICATION')),
    language TEXT NOT NULL DEFAULT 'en_US',
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    variable_definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
    meta_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (meta_status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED', 'IN_APPEAL', 'DELETED')),
    meta_rejection_reason TEXT,
    meta_quality_score TEXT,
    submission_status TEXT NOT NULL DEFAULT 'unsubmitted' CHECK (submission_status IN ('unsubmitted', 'submitted', 'failed', 'synced')),
    submitted_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_whatsapp_template_name_lang UNIQUE (meta_template_name, language)
);

-- Indexes for fast status checks, admin filtering, and broadcast integration
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_meta_status ON public.whatsapp_message_templates(meta_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON public.whatsapp_message_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON public.whatsapp_message_templates(meta_template_name);

-- RLS Policy: Service role has full access; admin has full access via authenticated server endpoints
ALTER TABLE public.whatsapp_message_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'whatsapp_message_templates' AND policyname = 'service_role_all_whatsapp_templates'
    ) THEN
        CREATE POLICY service_role_all_whatsapp_templates ON public.whatsapp_message_templates
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;


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


