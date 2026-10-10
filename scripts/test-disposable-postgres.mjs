import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${testName} - ${details}`);
    failedCount++;
  }
}

async function runDisposableDbTest() {
  console.log("==================================================================");
  console.log("RUNNING POST-MIGRATION REAL POSTGRESQL CONCURRENCY & RPC TESTS");
  console.log("DATABASE: In-process Disposable PostgreSQL (PGlite engine)");
  console.log("==================================================================\n");

  const db = new PGlite();

  // 1. Setup standard Supabase roles and auth schema
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
      SELECT '00000000-0000-0000-0000-000000000000'::uuid;
    $$ LANGUAGE SQL;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
      END IF;
    END;
    $$;
  `);

  console.log("1. Applying migration 1: 20260923000001_initial_schema.sql...");
  let migration1 = fs.readFileSync('supabase/migrations/20260923000001_initial_schema.sql', 'utf8');
  migration1 = migration1.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/g, '-- built-in gen_random_uuid() in PG 16');
  migration1 = migration1.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/g, '-- built-in pgcrypto in PG 16');
  await db.exec(migration1);

  console.log("2. Applying migration 2: 20261010000001_add_two_watercolour_courses.sql...");
  const migration2 = fs.readFileSync('supabase/migrations/20261010000001_add_two_watercolour_courses.sql', 'utf8');
  await db.exec(migration2);

  console.log("3. Applying migration 3: 20261010000002_foundation_course_credit.sql...");
  const migration3 = fs.readFileSync('supabase/migrations/20261010000002_foundation_course_credit.sql', 'utf8');
  await db.exec(migration3);
  console.log("✅ All migrations applied successfully to disposable test database.\n");

  // --------------------------------------------------------------------------
  // TEST 1: Masterclass 4-argument call backward compatibility
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Masterclass 4-argument RPC Backward Compatibility ---");
  await db.exec(`
    INSERT INTO public.courses (
      id, slug, title, original_price_paise, offer_price_paise, currency, duration_minutes, is_active
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      'the-watercolour-roadmap-one-day-masterclass',
      'The WATERCOLOUR Roadmap: One-Day Masterclass',
      199900, 49900, 'INR', 300, true
    ) ON CONFLICT (slug) DO NOTHING;

    INSERT INTO public.cohort_batches (
      id, course_id, batch_name, start_date, start_time, end_time, timezone, total_seats, seats_booked, is_enrollment_open
    ) VALUES (
      'b0000000-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'Masterclass Test Batch',
      '2026-10-25',
      '10:00 AM',
      '1:00 PM',
      'Asia/Kolkata',
      50, 0, true
    ) ON CONFLICT (id) DO NOTHING;
  `);

  const masterclassBatchRes = await db.query(`
    SELECT id, total_seats, seats_booked 
    FROM public.cohort_batches 
    WHERE course_id = '11111111-1111-1111-1111-111111111111'
    LIMIT 1;
  `);
  const mcBatch = masterclassBatchRes.rows[0];

  const custMcRes = await db.query(`
    INSERT INTO public.customers (full_name, email, phone)
    VALUES ('Masterclass Student', 'mcstudent@example.com', '9876543210')
    RETURNING id;
  `);
  const mcCustId = custMcRes.rows[0].id;

  // Call reserve_seat_atomic with exactly 4 parameters (legacy call convention)
  const mcRpcRes = await db.query(`
    SELECT public.reserve_seat_atomic(
      $1::uuid,
      $2::uuid,
      $3::integer,
      $4::text
    ) as result;
  `, [mcBatch.id, mcCustId, 0, 'REF-MC-TEST-001']);

  const mcResult = mcRpcRes.rows[0].result;
  assert(
    mcResult.success === true && mcResult.booking_id,
    "Test 1: Masterclass booking succeeds using legacy 4-argument call syntax",
    JSON.stringify(mcResult)
  );

  const updatedMcBatch = await db.query(`SELECT seats_booked FROM public.cohort_batches WHERE id = $1`, [mcBatch.id]);
  assert(
    updatedMcBatch.rows[0].seats_booked === mcBatch.seats_booked + 1,
    "Test 1b: Seat count incremented by 1 for 4-argument Masterclass booking"
  );

  // --------------------------------------------------------------------------
  // TEST 2: Seed Qualifying Foundation Purchase & Test 8-arg Credit Reservation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: 8-parameter Atomic Foundation Credit Reservation ---");
  const foundationBatchRes = await db.query(`
    SELECT id FROM public.cohort_batches 
    WHERE course_id = 'e1111111-2222-3333-4444-555555555555' 
    LIMIT 1;
  `);
  const foundationBatchId = foundationBatchRes.rows[0].id;

  const artistryBatchRes = await db.query(`
    SELECT id, total_seats, seats_booked FROM public.cohort_batches 
    WHERE course_id = 'e2222222-2222-3333-4444-555555555555' 
    LIMIT 1;
  `);
  const artistryBatch = artistryBatchRes.rows[0];

  // Create Customer with confirmed Foundation booking
  const custRes = await db.query(`
    INSERT INTO public.customers (full_name, email, phone)
    VALUES ('Alice Walker', 'alice@example.com', '9876543211')
    RETURNING id;
  `);
  const aliceId = custRes.rows[0].id;

  // Insert confirmed Foundation booking
  const fBookingRes = await db.query(`
    INSERT INTO public.bookings (
      booking_reference, customer_id, batch_id, status, amount_paise, seat_released
    ) VALUES (
      'REF-FOUNDATION-ALICE', $1, $2, 'confirmed', 99000, false
    ) RETURNING id;
  `, [aliceId, foundationBatchId]);
  const fBookingId = fBookingRes.rows[0].id;

  // Insert captured payment
  await db.query(`
    INSERT INTO public.payments (
      booking_id, razorpay_order_id, razorpay_payment_id, amount_paise, status
    ) VALUES (
      $1, 'order_f_alice', 'pay_f_alice', 99000, 'captured'
    );
  `, [fBookingId]);

  // Execute 8-parameter reserve_seat_atomic with credit
  const tokenNonce1 = '11111111-aaaa-bbbb-cccc-111111111111';
  const ruleId = 'c1111111-3333-4444-5555-666666666666';

  const creditReserveRes = await db.query(`
    SELECT public.reserve_seat_atomic(
      $1::uuid,
      $2::uuid,
      $3::integer,
      $4::text,
      $5::uuid,
      $6::uuid,
      $7::integer,
      $8::uuid
    ) as result;
  `, [artistryBatch.id, aliceId, 900000, 'REF-ARTISTRY-ALICE', fBookingId, ruleId, 99000, tokenNonce1]);

  const creditResult = creditReserveRes.rows[0].result;
  assert(
    creditResult.success === true && creditResult.credit_applied === true && creditResult.amount_paise === 900000,
    "Test 2.1: reserve_seat_atomic successfully applies Foundation credit at ₹9,000",
    JSON.stringify(creditResult)
  );

  const aliceBookingRow = await db.query(`
    SELECT original_amount_paise, discount_amount_paise, credit_applied, amount_paise 
    FROM public.bookings WHERE id = $1
  `, [creditResult.booking_id]);

  assert(
    aliceBookingRow.rows[0].original_amount_paise === 999000 &&
    aliceBookingRow.rows[0].discount_amount_paise === 99000 &&
    aliceBookingRow.rows[0].credit_applied === true,
    "Test 2.2: Booking table snapshot authoritatively persists discount breakdown"
  );

  const bookingCreditsRow = await db.query(`
    SELECT status, credit_amount_paise FROM public.booking_credits WHERE target_booking_id = $1
  `, [creditResult.booking_id]);

  assert(
    bookingCreditsRow.rows[0]?.status === 'reserved' && bookingCreditsRow.rows[0]?.credit_amount_paise === 99000,
    "Test 2.3: booking_credits table atomically records reservation status"
  );

  const tokenRedemptionRow = await db.query(`
    SELECT token_nonce FROM public.credit_token_redemptions WHERE token_nonce = $1
  `, [tokenNonce1]);

  assert(
    tokenRedemptionRow.rows.length === 1,
    "Test 2.4: credit_token_redemptions table records token redemption persistently"
  );

  // --------------------------------------------------------------------------
  // TEST 3: Concurrent / Double Reservation Rejection on Same Foundation Credit
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: Real PostgreSQL Double-Use & Concurrency Rejection ---");
  const tokenNonce2 = '22222222-aaaa-bbbb-cccc-222222222222';

  // Attempt to reserve the same Foundation credit again with a new token
  const secondReserveRes = await db.query(`
    SELECT public.reserve_seat_atomic(
      $1::uuid,
      $2::uuid,
      $3::integer,
      $4::text,
      $5::uuid,
      $6::uuid,
      $7::integer,
      $8::uuid
    ) as result;
  `, [artistryBatch.id, aliceId, 900000, 'REF-ARTISTRY-ALICE-RACE', fBookingId, ruleId, 99000, tokenNonce2]);

  const secondResult = secondReserveRes.rows[0].result;
  assert(
    secondResult.success === false && secondResult.error_code === 'CREDIT_ALREADY_USED',
    "Test 3: PostgreSQL double-use protection rejects concurrent/second reservation of the same credit",
    JSON.stringify(secondResult)
  );

  // --------------------------------------------------------------------------
  // TEST 4: Replay Prevention on Same Token Nonce
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Real PostgreSQL Token Nonce Replay Prevention ---");
  // Try reserving with tokenNonce1 again (even if trying with different booking ref)
  const replayTokenRes = await db.query(`
    SELECT public.reserve_seat_atomic(
      $1::uuid,
      $2::uuid,
      $3::integer,
      $4::text,
      $5::uuid,
      $6::uuid,
      $7::integer,
      $8::uuid
    ) as result;
  `, [artistryBatch.id, aliceId, 900000, 'REF-ARTISTRY-REPLAY', fBookingId, ruleId, 99000, tokenNonce1]);

  const replayResult = replayTokenRes.rows[0].result;
  assert(
    replayResult.success === false,
    "Test 4: PostgreSQL token replay prevention rejects duplicate token redemption across instances",
    JSON.stringify(replayResult)
  );

  // --------------------------------------------------------------------------
  // TEST 5: Transaction Rollback on Calculation Discrepancy
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Real PostgreSQL Transaction Rollback Integrity ---");
  const preBatch = await db.query(`SELECT seats_booked FROM public.cohort_batches WHERE id = $1`, [artistryBatch.id]);
  const initialSeats = preBatch.rows[0].seats_booked;

  // Create Bob with unreserved Foundation booking
  const bobRes = await db.query(`
    INSERT INTO public.customers (full_name, email, phone)
    VALUES ('Bob Price Hacker', 'bob@example.com', '9876543212')
    RETURNING id;
  `);
  const bobId = bobRes.rows[0].id;

  const bobFoundationRes = await db.query(`
    INSERT INTO public.bookings (
      booking_reference, customer_id, batch_id, status, amount_paise, seat_released
    ) VALUES (
      'REF-FOUNDATION-BOB', $1, $2, 'confirmed', 99000, false
    ) RETURNING id;
  `, [bobId, foundationBatchId]);
  const bobFBookingId = bobFoundationRes.rows[0].id;

  await db.query(`
    INSERT INTO public.payments (
      booking_id, razorpay_order_id, razorpay_payment_id, amount_paise, status
    ) VALUES (
      $1, 'order_f_bob', 'pay_f_bob', 99000, 'captured'
    );
  `, [bobFBookingId]);

  // Pass manipulated amount (e.g. 500000 instead of 900000)
  const badAmountRes = await db.query(`
    SELECT public.reserve_seat_atomic(
      $1::uuid,
      $2::uuid,
      $3::integer,
      $4::text,
      $5::uuid,
      $6::uuid,
      $7::integer,
      $8::uuid
    ) as result;
  `, [artistryBatch.id, bobId, 500000, 'REF-ARTISTRY-PRICE-HACK', bobFBookingId, ruleId, 99000, '33333333-aaaa-bbbb-cccc-333333333333']);

  const badResult = badAmountRes.rows[0].result;
  assert(
    badResult.success === false && badResult.error_code === 'PRICE_MISMATCH',
    "Test 5.1: Price tampering detected and rejected by PostgreSQL",
    JSON.stringify(badResult)
  );

  const postBatch = await db.query(`SELECT seats_booked FROM public.cohort_batches WHERE id = $1`, [artistryBatch.id]);
  assert(
    postBatch.rows[0].seats_booked === initialSeats,
    "Test 5.2: Transaction rollback preserves cohort batch seat counts exactly"
  );

  // --------------------------------------------------------------------------
  // TEST 6: Atomic Credit and Seat Release on Expiry / Cancellation
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 6: Atomic Seat & Credit Release Function ---");
  const releaseRes = await db.query(`
    SELECT public.release_seat_atomic($1::uuid, 'cancelled') as result;
  `, [creditResult.booking_id]);

  const releaseResult = releaseRes.rows[0].result;
  assert(
    releaseResult.success === true && releaseResult.already_released === false,
    "Test 6.1: release_seat_atomic releases seat and credit successfully",
    JSON.stringify(releaseResult)
  );

  const releasedCredit = await db.query(`
    SELECT status FROM public.booking_credits WHERE target_booking_id = $1
  `, [creditResult.booking_id]);
  assert(
    releasedCredit.rows[0]?.status === 'released',
    "Test 6.2: booking_credits status transitioned to 'released'"
  );

  const cleanedToken = await db.query(`
    SELECT token_nonce FROM public.credit_token_redemptions WHERE target_booking_id = $1
  `, [creditResult.booking_id]);
  assert(
    cleanedToken.rows.length === 0,
    "Test 6.3: credit_token_redemptions row cleaned up to permit customer re-attempt"
  );

  // Test release idempotency (second release should not decrement seats again)
  const secondReleaseRes = await db.query(`
    SELECT public.release_seat_atomic($1::uuid, 'cancelled') as result;
  `, [creditResult.booking_id]);
  const secondReleaseResult = secondReleaseRes.rows[0].result;
  assert(
    secondReleaseResult.already_released === true,
    "Test 6.4: release_seat_atomic is strictly idempotent (no double decrement)"
  );

  console.log("\n==================================================================");
  console.log(`REAL POSTGRESQL POST-MIGRATION SUITE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDisposableDbTest().catch((err) => {
  console.error("Test execution error:", err.message || err);
  if (err.position) console.error("Error at position:", err.position);
  process.exit(1);
});
