-- ==============================================================================
-- Renuka Art Studio (webrenuka) - Migration: Two Watercolour Courses & Details
-- ==============================================================================
-- Adds structured course support and seeds the two primary courses:
-- 1. WATERCOLOUR FOUNDATION (slug: watercolour-foundation)
-- 2. WATERCOLOUR ARTISTRY + FOUNDATION COURSE (slug: watercolour-artistry-foundation)
-- ==============================================================================

-- 1. Seed Course: WATERCOLOUR FOUNDATION
INSERT INTO public.courses (
  id,
  slug,
  title,
  description,
  original_price_paise,
  offer_price_paise,
  currency,
  duration_minutes,
  is_active
) VALUES (
  'e1111111-2222-3333-4444-555555555555',
  'watercolour-foundation',
  'WATERCOLOUR FOUNDATION',
  '{"cardSubtitle":"2 Live Sessions • 90 Minutes Each","cardSummary":"Master the Fundamentals of Watercolour Painting","cardDescription":"Master the Fundamentals of Watercolour Painting","subjects":"Materials • Techniques • Colour Mixing • Wash","cardPriceLabel":"₹990/-","sessionCountText":"2 Live Interactive Sessions","sessionDurationText":"90 Minutes Each","durationMonthsText":"1 Week","fullDescription":"A focused 2-session foundation program designed to help you understand the essentials of watercolour before moving into detailed painting projects.","learningOutcomesHeading":"What You’ll Learn","learningOutcomesSubheading":"Essential Foundation Topics Covered","learningOutcomes":["Introduction to Watercolour","Complete Material Knowledge","Understanding Papers, Brushes & Colours","Essential Watercolour Techniques","Different Wash Techniques","Colour Theory for Watercolour","Shade Chart & Colour Mixing","Understanding Watercolour Brands & Products","The Right Way to Set Up Your Palette","Practical Tips for Choosing Art Materials","Guided Mini Activity"],"whyHeading":"Why This Course?","whyDescription":"Starting watercolour can be confusing—which paper, which brushes, which colours, how much water, and which techniques to use?\n\nThis foundation course gives you the right knowledge and direction from the beginning, helping you avoid unnecessary purchases and common beginner mistakes.","whyCallout":"A strong foundation before you start creating.","scheduleHeading":"Session Details","scheduleItems":[{"label":"Session 1","detail":"Material Knowledge, Understanding Papers, Brushes, Colours & Essential Washes (90 Mins)"},{"label":"Session 2","detail":"Colour Theory, Shade Chart Mixing, Palette Setup & Guided Mini Activity (90 Mins)"}],"scheduleNote":"Live interactive atelier sessions on Zoom with personal feedback and guidance.","ctaText":"Enrol in Foundation Course"}',
  199000,
  99000,
  'INR',
  180,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_price_paise = EXCLUDED.original_price_paise,
  offer_price_paise = EXCLUDED.offer_price_paise,
  duration_minutes = EXCLUDED.duration_minutes,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 2. Seed Batch for WATERCOLOUR FOUNDATION
INSERT INTO public.cohort_batches (
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
  is_enrollment_open
) VALUES (
  'b1111111-2222-3333-4444-555555555555',
  'e1111111-2222-3333-4444-555555555555',
  'Watercolour Foundation — Upcoming Live Batch',
  '2026-11-01',
  '2026-11-02',
  '6:30 PM',
  '8:00 PM',
  'Asia/Kolkata',
  100,
  0,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Course: WATERCOLOUR ARTISTRY + FOUNDATION COURSE
INSERT INTO public.courses (
  id,
  slug,
  title,
  description,
  original_price_paise,
  offer_price_paise,
  currency,
  duration_minutes,
  is_active
) VALUES (
  'e2222222-2222-3333-4444-555555555555',
  'watercolour-artistry-foundation',
  'WATERCOLOUR ARTISTRY + FOUNDATION COURSE',
  '{"cardSubtitle":"Landscape • Floral • Still Life","cardSummary":"24 Live Interactive Sessions","cardDescription":"A Complete 3-Months Watercolour Learning Journey.","subjects":"Landscape • Floral • Still Life","cardPriceLabel":"Course Fee: ₹9,990/-","sessionCountText":"24 Live Classes","sessionDurationText":"90 Minutes Each","durationMonthsText":"3 Months","fullDescription":"The course focuses on 3 major subjects: Landscape | Still Life | Floral. You will explore each subject from the very beginning—starting from scratch and gradually developing complete artworks. Understand how…","learningOutcomesHeading":"What You Will Learn","learningOutcomesSubheading":"The course focuses on 3 major subjects: Landscape | Still Life | Floral","learningOutcomes":["Explore Landscape, Floral, and Still Life from the very beginning","Start from scratch and gradually develop complete, layered artworks","Understand tonal values, atmospheric perspective and depth in landscapes","Master delicate botanical and floral wash layering techniques","Still life light, shadow and composition mastery","Understand how…"],"whyHeading":"A Complete 3-Months Watercolour Learning Journey","whyDescription":"Designed for artists and creative learners who want to go beyond the basics. Through 24 structured interactive classes over three months, you will develop confidence, technique, and your own unique artistic voice across three timeless painting subjects.","whyCallout":"Master Landscape, Floral & Still Life with guided mentorship.","scheduleHeading":"3 Months | 24 Live Classes","scheduleItems":[{"label":"2 Foundation Classes","detail":"to build a strong understanding of the basics before moving into painting."},{"label":"18 Demo Classes","detail":"6 live sessions every month, scheduled on Tuesdays & Thursdays according to the monthly calendar."},{"label":"3 Discussion Sessions","detail":"1 dedicated discussion session every month for interaction, feedback and guidance."},{"label":"1 Complimentary Black Ink Demo Session","detail":"Special bonus exploration session."}],"scheduleNote":"The detailed class schedule will be shared every month after enrolment.","ctaText":"Enrol in Artistry + Foundation Course"}',
  1499000,
  999000,
  'INR',
  2160,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  original_price_paise = EXCLUDED.original_price_paise,
  offer_price_paise = EXCLUDED.offer_price_paise,
  duration_minutes = EXCLUDED.duration_minutes,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 4. Seed Batch for WATERCOLOUR ARTISTRY + FOUNDATION COURSE
INSERT INTO public.cohort_batches (
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
  is_enrollment_open
) VALUES (
  'b2222222-2222-3333-4444-555555555555',
  'e2222222-2222-3333-4444-555555555555',
  'Watercolour Artistry — 3-Month Live Journey Batch',
  '2026-11-05',
  '2027-02-05',
  '6:30 PM',
  '8:00 PM',
  'Asia/Kolkata',
  50,
  0,
  true
)
ON CONFLICT (id) DO NOTHING;
