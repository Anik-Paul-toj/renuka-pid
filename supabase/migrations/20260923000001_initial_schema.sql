-- ==============================================================================
-- Art & Soul Studio (webrenuka) - Phase 2 Canonical Schema Migration
-- ==============================================================================
-- IMPORTANT:
-- This file represents the final Phase 2 schema/security state after verification.
-- It is the canonical migration for a fresh database.
-- Do NOT rerun it wholesale against the already-migrated project database.
-- Apply future changes as incremental patches.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Generic updated_at Trigger Function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Table: admin_users (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor')),
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Table: courses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_price_paise INTEGER NOT NULL CHECK (original_price_paise >= 0),
  offer_price_paise INTEGER NOT NULL CHECK (offer_price_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  duration_minutes INTEGER NOT NULL DEFAULT 120 CHECK (duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(is_active);

-- ------------------------------------------------------------------------------
-- 5. Table: cohort_batches
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cohort_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  seats_booked INTEGER NOT NULL DEFAULT 0 CHECK (seats_booked >= 0 AND seats_booked <= total_seats),
  is_enrollment_open BOOLEAN NOT NULL DEFAULT true,
  zoom_join_url TEXT,
  zoom_passcode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_cohort_batches_updated_at
BEFORE UPDATE ON public.cohort_batches
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_cohort_batches_course_id ON public.cohort_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_cohort_batches_start_date ON public.cohort_batches(start_date);
CREATE INDEX IF NOT EXISTS idx_cohort_batches_enrollment ON public.cohort_batches(is_enrollment_open);

-- ------------------------------------------------------------------------------
-- 6. Table: customers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(lower(email));
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON public.customers(whatsapp_phone);

-- ------------------------------------------------------------------------------
-- 7. Table: bookings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.cohort_batches(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  seat_released BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_batch_status ON public.bookings(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON public.bookings(expires_at) WHERE status = 'pending';

-- ------------------------------------------------------------------------------
-- 8. Table: payments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  idempotency_key TEXT UNIQUE,
  payload_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON public.payments(idempotency_key);

-- ------------------------------------------------------------------------------
-- 9. Table: landing_content (Draft -> Preview -> Published Lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  content_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'preview', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by UUID REFERENCES public.admin_users(id),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_landing_content_updated_at
BEFORE UPDATE ON public.landing_content
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enforce exactly one active published record per section
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_content_unique_published
ON public.landing_content (section_key)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_landing_content_section_status ON public.landing_content(section_key, status);

-- ------------------------------------------------------------------------------
-- 10. Table: media_assets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL DEFAULT 'media',
  file_path TEXT UNIQUE NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
  alt_text TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON public.media_assets(category);

-- ------------------------------------------------------------------------------
-- 11. Table: message_templates
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_message_templates_slug ON public.message_templates(slug);

-- ------------------------------------------------------------------------------
-- 12. Table: broadcasts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),
  target_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  content TEXT NOT NULL,
  total_recipients INTEGER NOT NULL DEFAULT 0 CHECK (total_recipients >= 0),
  successful_sends INTEGER NOT NULL DEFAULT 0 CHECK (successful_sends >= 0),
  failed_sends INTEGER NOT NULL DEFAULT 0 CHECK (failed_sends >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'processing', 'completed', 'failed')),
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_broadcasts_updated_at
BEFORE UPDATE ON public.broadcasts
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ------------------------------------------------------------------------------
-- 13. Table: notification_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  message_type TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_booking ON public.notification_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer ON public.notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);

-- ==============================================================================
-- 14. ATOMIC CONCURRENCY FUNCTIONS
-- ==============================================================================

-- 14.1 Reserve Seat Atomically
CREATE OR REPLACE FUNCTION public.reserve_seat_atomic(
  p_batch_id UUID,
  p_customer_id UUID,
  p_amount_paise INTEGER,
  p_booking_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_batch public.cohort_batches%ROWTYPE;
  v_booking_id UUID;
BEGIN
  -- 1. Lock the target cohort batch row pessimistically
  SELECT * INTO v_batch
  FROM public.cohort_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'BATCH_NOT_FOUND',
      'message', 'Cohort batch does not exist.'
    );
  END IF;

  -- 2. Verify enrollment status
  IF NOT v_batch.is_enrollment_open THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ENROLLMENT_CLOSED',
      'message', 'Enrollment is currently closed for this batch.'
    );
  END IF;

  -- 3. Verify seat availability
  IF v_batch.seats_booked >= v_batch.total_seats THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SOLD_OUT',
      'message', 'This batch is completely sold out.'
    );
  END IF;

  -- 4. Atomically increment seats_booked
  UPDATE public.cohort_batches
  SET seats_booked = seats_booked + 1,
      updated_at = now()
  WHERE id = p_batch_id;

  -- 5. Insert pending booking record (with 15 minute expiry)
  INSERT INTO public.bookings (
    booking_reference,
    customer_id,
    batch_id,
    status,
    amount_paise,
    seat_released,
    expires_at
  )
  VALUES (
    p_booking_reference,
    p_customer_id,
    p_batch_id,
    'pending',
    p_amount_paise,
    false,
    now() + interval '15 minutes'
  )
  RETURNING id INTO v_booking_id;

  -- 6. Return success with updated remaining seats count
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'seats_remaining', (v_batch.total_seats - (v_batch.seats_booked + 1))
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Any unexpected failure will abort and roll back all mutations
    RAISE;
END;
$$;

-- 14.2 Strictly Idempotent Seat Release
CREATE OR REPLACE FUNCTION public.release_seat_atomic(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'cancelled'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
BEGIN
  -- 1. Lock the booking row for update
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'BOOKING_NOT_FOUND',
      'message', 'Booking not found.'
    );
  END IF;

  -- 2. Idempotency Check: if seat is already released, do not decrement again
  IF v_booking.seat_released THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_released', true,
      'message', 'Seat was already released for this booking.'
    );
  END IF;

  -- 3. Mark booking as released with new status (cancelled/refunded)
  UPDATE public.bookings
  SET status = CASE 
        WHEN p_reason IN ('cancelled', 'refunded') THEN p_reason 
        ELSE 'cancelled' 
      END,
      seat_released = true,
      updated_at = now()
  WHERE id = p_booking_id;

  -- 4. Safely decrement seats_booked on cohort batch (never below 0)
  UPDATE public.cohort_batches
  SET seats_booked = GREATEST(0, seats_booked - 1),
      updated_at = now()
  WHERE id = v_booking.batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_released', false,
    'message', 'Seat released successfully.'
  );
END;
$$;

-- 14.3 Release Expired Pending Bookings (Cron / Background Cleaner)
CREATE OR REPLACE FUNCTION public.release_expired_pending_bookings()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_record IN
    SELECT id
    FROM public.bookings
    WHERE status = 'pending'
      AND seat_released = false
      AND expires_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.release_seat_atomic(v_record.id, 'cancelled');
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'expired_bookings_released', v_count);
END;
$$;

-- ------------------------------------------------------------------------------
-- 14.4 Safe Public View for Cohort Batches (Excludes Zoom join URL & Passcode)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_cohort_batches AS
SELECT 
  id,
  course_id,
  batch_name,
  start_date,
  end_date,
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

-- ==============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is an active admin (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.admin_users WHERE id = auth.uid()),
    false
  );
$$;

-- Helper function to check if caller is an active super admin (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE(
    (SELECT (role = 'super_admin' AND is_active = true) FROM public.admin_users WHERE id = auth.uid()),
    false
  );
$$;

-- 15.1 Courses RLS
CREATE POLICY "Public read active courses"
ON public.courses FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admin full access courses"
ON public.courses FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.2 Cohort Batches RLS (Base table strictly restricted to Admin users)
CREATE POLICY "Admin full access batches"
ON public.cohort_batches FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.3 Landing Content RLS
CREATE POLICY "Public read published landing content"
ON public.landing_content FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Admin full access landing content"
ON public.landing_content FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.4 Media Assets RLS
CREATE POLICY "Public read media assets"
ON public.media_assets FOR SELECT
USING (true);

CREATE POLICY "Admin full access media assets"
ON public.media_assets FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.5 Customers RLS
CREATE POLICY "Admin full access customers"
ON public.customers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.6 Bookings RLS
CREATE POLICY "Admin full access bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.7 Payments RLS
CREATE POLICY "Admin full access payments"
ON public.payments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.8 Admin Users RLS (Protected via is_super_admin and direct auth.uid() check)
CREATE POLICY "Admins view own profile"
ON public.admin_users FOR SELECT
TO authenticated
USING (id = auth.uid() AND is_active = true);

CREATE POLICY "Super admins view all admin users"
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super admins insert admin users"
ON public.admin_users FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins update admin users"
ON public.admin_users FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins delete admin users"
ON public.admin_users FOR DELETE
TO authenticated
USING (public.is_super_admin());

-- 15.9 Message Templates & Broadcasts RLS
CREATE POLICY "Admin full access message templates"
ON public.message_templates FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access broadcasts"
ON public.broadcasts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 15.10 Notification Logs RLS
CREATE POLICY "Admin full access notification logs"
ON public.notification_logs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 16. EXPLICIT FUNCTION & VIEW PERMISSIONS
-- ==============================================================================

-- Public view permissions (Anon & Authenticated can view safe batch fields)
GRANT SELECT ON public.public_cohort_batches TO anon, authenticated, service_role;

-- Revoke direct execution of atomic seat functions from browser/anon clients
REVOKE EXECUTE ON FUNCTION public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_seat_atomic(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_seat_atomic(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_expired_pending_bookings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_pending_bookings() TO service_role;

-- Auth helpers permissions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;
