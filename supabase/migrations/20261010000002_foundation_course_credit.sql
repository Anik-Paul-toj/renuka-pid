-- ==============================================================================
-- Renuka Art Studio (webrenuka) - Migration: Foundation Course Credit System
-- ==============================================================================
-- Implements One-Way Foundation Course Credit for Artistry + Foundation:
-- 1. Table: course_credit_rules (Configurable admin rules for course discounts)
-- 2. Columns on bookings: original_amount_paise, discount_amount_paise, credit_applied
-- 3. Table: booking_credits (Atomic reservations and permanent consumption tracking)
-- 4. Partial unique index on booking_credits(source_booking_id) WHERE status IN ('reserved', 'consumed')
--    guaranteeing strict double-use protection against concurrent checkout requests.
-- 5. Updated reserve_seat_atomic and release_seat_atomic RPCs.
-- ==============================================================================

-- 1. Create course_credit_rules Table
CREATE TABLE IF NOT EXISTS public.course_credit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  target_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  credit_amount_paise INTEGER NOT NULL CHECK (credit_amount_paise > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_source_target_course_rule UNIQUE (source_course_id, target_course_id)
);

-- 2. Extend bookings Table with Authoritative Discount Snapshots
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS original_amount_paise INTEGER,
  ADD COLUMN IF NOT EXISTS discount_amount_paise INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_applied BOOLEAN NOT NULL DEFAULT false;

-- Backfill original_amount_paise for existing bookings
UPDATE public.bookings
SET original_amount_paise = amount_paise
WHERE original_amount_paise IS NULL;

-- 3. Create booking_credits Table
CREATE TABLE IF NOT EXISTS public.booking_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.course_credit_rules(id) ON DELETE SET NULL,
  source_booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  target_booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  credit_amount_paise INTEGER NOT NULL CHECK (credit_amount_paise > 0),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'consumed', 'released')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Atomic Concurrency & Double-Use Protection Indexes
-- This partial unique index guarantees at database-level that a source Foundation booking
-- can NEVER have more than one active ('reserved' or 'consumed') credit allocation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_credit_source 
  ON public.booking_credits(source_booking_id) 
  WHERE status IN ('reserved', 'consumed');

-- Guarantees a target Artistry booking cannot have more than one active credit attached
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_credit_target 
  ON public.booking_credits(target_booking_id) 
  WHERE status IN ('reserved', 'consumed');

CREATE INDEX IF NOT EXISTS idx_booking_credits_customer 
  ON public.booking_credits(customer_id);

CREATE INDEX IF NOT EXISTS idx_booking_credits_target_status 
  ON public.booking_credits(target_booking_id, status);

-- 4b. Table: credit_token_redemptions for Persistent, Distributed Single-Use Token Tracking
-- Guarantees atomic, single-use token redemption across multiple Vercel instances
CREATE TABLE IF NOT EXISTS public.credit_token_redemptions (
  token_nonce UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  source_booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  target_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_token_redemptions_expires 
  ON public.credit_token_redemptions(expires_at);

-- 5. Seed Default One-Way Credit Rule: Foundation (₹990) -> Artistry + Foundation (₹9,990)
INSERT INTO public.course_credit_rules (
  id,
  source_course_id,
  target_course_id,
  credit_amount_paise,
  is_active,
  description
) VALUES (
  'c1111111-3333-4444-5555-666666666666',
  'e1111111-2222-3333-4444-555555555555', -- WATERCOLOUR FOUNDATION
  'e2222222-2222-3333-4444-555555555555', -- WATERCOLOUR ARTISTRY + FOUNDATION COURSE
  99000, -- ₹990 credit
  true,
  'One-way Foundation course credit of ₹990 toward Artistry + Foundation'
) ON CONFLICT (source_course_id, target_course_id) DO UPDATE SET
  credit_amount_paise = EXCLUDED.credit_amount_paise,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 6. Updated Atomic Seat & Credit Reservation RPC
-- Explicitly drop previous function overloads to prevent signature collisions in PostgreSQL
DROP FUNCTION IF EXISTS public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT, UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT, UUID, UUID, INTEGER, UUID);

CREATE OR REPLACE FUNCTION public.reserve_seat_atomic(
  p_batch_id UUID,
  p_customer_id UUID,
  p_amount_paise INTEGER,
  p_booking_reference TEXT,
  p_source_booking_id UUID DEFAULT NULL,
  p_rule_id UUID DEFAULT NULL,
  p_discount_amount_paise INTEGER DEFAULT 0,
  p_token_nonce UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_batch public.cohort_batches%ROWTYPE;
  v_course public.courses%ROWTYPE;
  v_booking_id UUID;
  v_orig_price INTEGER;
  v_expected_amount INTEGER;
  v_source_booking public.bookings%ROWTYPE;
  v_existing_credit public.booking_credits%ROWTYPE;
BEGIN
  -- 1. Pessimistically lock target batch
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

  -- 4. Retrieve course price for authoritative validation
  SELECT * INTO v_course
  FROM public.courses
  WHERE id = v_batch.course_id;

  v_orig_price := v_course.offer_price_paise;

  -- 5. Credit verification if credit requested
  IF p_source_booking_id IS NOT NULL AND p_discount_amount_paise > 0 THEN
    -- Check that source Foundation booking exists, belongs to this customer, is confirmed, and unreleased
    SELECT * INTO v_source_booking
    FROM public.bookings
    WHERE id = p_source_booking_id
    FOR UPDATE;

    IF NOT FOUND OR v_source_booking.customer_id <> p_customer_id OR v_source_booking.status <> 'confirmed' OR v_source_booking.seat_released THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'INVALID_CREDIT_SOURCE',
        'message', 'Source booking is not eligible for course credit.'
      );
    END IF;

    -- Concurrency check: Ensure credit has not already been reserved or consumed
    SELECT * INTO v_existing_credit
    FROM public.booking_credits
    WHERE source_booking_id = p_source_booking_id
      AND status IN ('reserved', 'consumed')
    FOR UPDATE;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'CREDIT_ALREADY_USED',
        'message', 'This course credit has already been used or reserved.'
      );
    END IF;

    -- Authoritative payable amount calculation
    v_expected_amount := GREATEST(0, v_orig_price - p_discount_amount_paise);
    IF p_amount_paise <> v_expected_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'PRICE_MISMATCH',
        'message', 'Discrepancy detected in discounted booking amount calculation.'
      );
    END IF;

    -- Concurrency check: Single-Use Token Redemption across distributed Vercel instances
    IF p_token_nonce IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM public.credit_token_redemptions WHERE token_nonce = p_token_nonce) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'TOKEN_ALREADY_REDEEMED',
          'message', 'Credit verification token has already been redeemed.'
        );
      END IF;
    END IF;
  ELSE
    v_expected_amount := v_orig_price;
  END IF;

  -- 6. Atomically increment seats_booked
  UPDATE public.cohort_batches
  SET seats_booked = seats_booked + 1,
      updated_at = now()
  WHERE id = p_batch_id;

  -- 7. Insert pending booking record
  INSERT INTO public.bookings (
    booking_reference,
    customer_id,
    batch_id,
    status,
    amount_paise,
    original_amount_paise,
    discount_amount_paise,
    credit_applied,
    seat_released,
    expires_at
  )
  VALUES (
    p_booking_reference,
    p_customer_id,
    p_batch_id,
    'pending',
    p_amount_paise,
    v_orig_price,
    CASE WHEN p_source_booking_id IS NOT NULL THEN p_discount_amount_paise ELSE 0 END,
    (p_source_booking_id IS NOT NULL AND p_discount_amount_paise > 0),
    false,
    now() + interval '15 minutes'
  )
  RETURNING id INTO v_booking_id;

  -- 8. Reserve credit atomically
  IF p_source_booking_id IS NOT NULL AND p_discount_amount_paise > 0 THEN
    INSERT INTO public.booking_credits (
      customer_id,
      rule_id,
      source_booking_id,
      target_booking_id,
      credit_amount_paise,
      status
    ) VALUES (
      p_customer_id,
      p_rule_id,
      p_source_booking_id,
      v_booking_id,
      p_discount_amount_paise,
      'reserved'
    );

    -- 8b. Persist token redemption atomically in the same database transaction
    IF p_token_nonce IS NOT NULL THEN
      INSERT INTO public.credit_token_redemptions (
        token_nonce,
        customer_id,
        source_booking_id,
        target_booking_id,
        redeemed_at,
        expires_at
      ) VALUES (
        p_token_nonce,
        p_customer_id,
        p_source_booking_id,
        v_booking_id,
        now(),
        now() + interval '15 minutes'
      );
    END IF;
  END IF;

  -- 9. Return success
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'seats_remaining', (v_batch.total_seats - (v_batch.seats_booked + 1)),
    'credit_applied', (p_source_booking_id IS NOT NULL AND p_discount_amount_paise > 0),
    'amount_paise', p_amount_paise
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 7. Updated Seat & Credit Release Function (Strictly Idempotent)
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

  -- 3. Mark booking as released with new status
  UPDATE public.bookings
  SET status = CASE 
        WHEN p_reason IN ('cancelled', 'refunded') THEN p_reason 
        ELSE 'cancelled' 
      END,
      seat_released = true,
      updated_at = now()
  WHERE id = p_booking_id;

  -- 4. Release any reserved credit associated with this pending booking
  -- Note: Only 'reserved' credits are released; 'consumed' credits remain intact
  UPDATE public.booking_credits
  SET status = 'released',
      updated_at = now()
  WHERE target_booking_id = p_booking_id
    AND status = 'reserved';

  -- 4b. Remove token redemption on release so customer can retry if pending booking expired/cancelled
  DELETE FROM public.credit_token_redemptions
  WHERE target_booking_id = p_booking_id;

  -- 5. Safely decrement seats_booked on cohort batch (never below 0)
  UPDATE public.cohort_batches
  SET seats_booked = GREATEST(0, seats_booked - 1),
      updated_at = now()
  WHERE id = v_booking.batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_released', false,
    'message', 'Seat and any reserved credit released successfully.'
  );
END;
$$;

-- 8. Enable Row Level Security & Policies
ALTER TABLE public.course_credit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_token_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active credit rules"
  ON public.course_credit_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage credit rules"
  ON public.course_credit_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on credit rules"
  ON public.course_credit_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on booking credits"
  ON public.booking_credits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on credit token redemptions"
  ON public.credit_token_redemptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke execute from public/anon and grant to service_role
REVOKE EXECUTE ON FUNCTION public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT, UUID, UUID, INTEGER, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_seat_atomic(UUID, UUID, INTEGER, TEXT, UUID, UUID, INTEGER, UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_seat_atomic(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_seat_atomic(UUID, TEXT) TO service_role;
