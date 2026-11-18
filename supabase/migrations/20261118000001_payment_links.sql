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
