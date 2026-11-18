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
