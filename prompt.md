# Art & Soul Studio — Backend Build Prompt

## 0. ROLE

You are the backend implementation AI for the existing **Art & Soul Studio / webrenuka** project.

Your job is to add a complete production-ready backend **step by step** while preserving the existing frontend exactly as it is.

The existing frontend is already assembled and operational. It uses:

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS v4
- Vanilla CSS design tokens
- GSAP 3 + `@gsap/react` + ScrollTrigger
- lucide-react
- Existing reusable landing-page components
- Existing `content.ts` content architecture
- Existing `RegistrationModal.tsx`
- Existing image assets

The current landing page contains these sections/components:

1. Navbar
2. Hero
3. CountdownTimer
4. InstructorIntro
5. AudienceSection
6. VideoSection
7. Transformation
8. MethodSection
9. CoreConcepts
10. Outcomes
11. InstructorStory
12. Bonuses
13. FitCheck
14. IncludedSection
15. FAQ
16. FinalCTA
17. Footer
18. StickyBottomBar
19. RegistrationModal
20. GSAPProvider

Reference the existing project instead of recreating any of these.

---

# 1. NON-NEGOTIABLE RULES

## 1.1 DO NOT CHANGE THE EXISTING UI

The current frontend is approved.

You MUST NOT:

- redesign the landing page
- change spacing
- change typography
- change colors
- change animations
- change section order
- change responsive behavior
- replace components
- remove existing sections
- change existing visual hierarchy
- change existing CTA appearance
- change the current registration modal design unless backend wiring strictly requires a minimal functional change
- replace existing assets unnecessarily
- rewrite `content.ts` into a different UI structure without preserving all current content and behavior

Backend work must be additive.

If backend integration requires a frontend change, make the **smallest possible functional change** and preserve the exact existing UI.

Before modifying any frontend file, explain:
1. Why the change is required.
2. What file will change.
3. What UI behavior will remain unchanged.

---

# 2. DATABASE / BACKEND CONSTRAINT

Use **Supabase only** for the backend database and backend infrastructure.

Use:

- Supabase
- Supabase Database
- Supabase Auth where required
- Supabase Storage where required
- Supabase Row Level Security
- Supabase JavaScript client
- Supabase SSR integration where appropriate

DO NOT introduce a separate PostgreSQL server or PostgreSQL hosting.

Do not add:

- MongoDB
- Firebase database
- Prisma
- Drizzle
- Neon
- PlanetScale
- MySQL
- a separate PostgreSQL installation
- another database service

Supabase's managed database is the database layer for this project.

---

# 3. CORE BUSINESS REQUIREMENT

This is a course/workshop selling platform.

The public user flow is:

Landing Page
→ Book / Register
→ Student details
→ Course / Batch selection where applicable
→ Date / Time selection where applicable
→ Razorpay payment
→ Payment verification
→ Booking confirmation
→ Confirmation modal
→ Email confirmation
→ WhatsApp confirmation

The admin flow is:

Admin Login
→ Admin Dashboard
→ Manage landing page
→ Manage course/workshop
→ Manage batches
→ Manage gallery/media
→ Manage students/bookings
→ Manage automated messages
→ Create promotional/reminder broadcasts
→ Send to selected students
→ View communication logs
→ Manage settings

---

# 4. CRITICAL CMS REQUIREMENT

The admin must be able to change **ALL EDITABLE CONTENT PRESENT ON THE CURRENT LANDING PAGE** without editing source code.

The existing frontend content currently lives partly in `content.ts`.

Do NOT simply duplicate the content into a new CMS and leave the frontend hardcoded.

The target architecture is:

Admin Panel
→ Supabase
→ Server/API layer
→ Existing frontend components
→ Existing UI

The visual components remain the same.

Only their data source becomes dynamic.

---

# 5. ADMIN SIDEBAR

The admin portal must be organized with a left-side tab/sidebar navigation.

Required sections:

- Dashboard
- Landing Page
- Course / Workshop
- Batches / Schedule
- Gallery / Media
- Students
- Bookings
- Payments
- Messages
- Broadcast
- Notifications / Logs
- Settings

The exact UI can be designed later, but the architecture must support these areas.

---

# 6. LANDING PAGE CMS TABS

Inside **Landing Page**, provide section-level management matching the existing frontend.

Required tabs/sections:

- Navbar
- Hero
- Countdown
- Instructor Intro
- Audience
- Video
- Transformation
- Method
- Core Concepts
- Outcomes
- Instructor Story
- Bonuses
- Fit Check
- Included
- FAQ
- Final CTA
- Footer
- Sticky Bottom Bar

Every editable field from the current UI must eventually be represented in the CMS.

Do not invent a new structure that causes existing frontend content to disappear.

---

# 7. COURSE / WORKSHOP MANAGEMENT

The admin must be able to manage:

- Course name
- Course description
- Original price
- Offer price
- Currency
- Duration
- Course status
- Registration status
- Course image
- Course-related content
- Number of seats
- Remaining seats where applicable

Use integer paise for INR monetary values.

Example:

₹9,999
→ 999900 paise

Never use floating-point values for money.

---

# 8. BATCH / SCHEDULE MANAGEMENT

Admin must be able to create and manage batches.

A batch may contain:

- Course
- Batch name
- Start date
- End date if applicable
- Start time
- End time
- Timezone
- Total seats
- Remaining seats / derived availability
- Enrollment status
- Zoom meeting information if required
- Recording/access information if required

Do not expose private meeting information publicly.

---

# 9. GALLERY / MEDIA MANAGEMENT

Admin must be able to:

- upload images
- replace images
- delete images where safe
- reorder gallery items
- add alt text
- add captions where required
- manage instructor images
- manage story images
- manage video thumbnail/poster
- manage other landing-page media

Use Supabase Storage.

Do not store large binary image files directly inside database rows.

Store metadata and Storage paths/URLs in database records.

---

# 10. STUDENT MANAGEMENT

A student/customer record should support:

- full name
- email
- WhatsApp number
- phone number where different
- course
- batch
- booking reference
- payment status
- booking status
- registration date
- communication status

Avoid unnecessary collection of sensitive personal information.

Validate all input.

Normalize email before uniqueness checks.

---

# 11. BOOKING SYSTEM

Booking lifecycle must be explicit.

Recommended states:

- pending
- confirmed
- cancelled
- refunded

Do not mark a booking confirmed merely because a Razorpay order was created.

Correct flow:

Student submits details
→ server validates data
→ booking created as pending
→ Razorpay order created
→ payment attempted
→ Razorpay payment verified
→ booking becomes confirmed
→ notification workflow triggered

---

# 12. RAZORPAY

Razorpay integration must be server-controlled.

Never trust:

- price sent by browser
- payment status sent by browser
- course ID alone from client
- batch availability sent by browser

Server must fetch/derive:

- actual course
- actual batch
- actual price
- current availability

Then create the Razorpay order.

Payment verification must validate the Razorpay signature/server response.

Use webhook support where appropriate.

Handle:

- successful payment
- failed payment
- abandoned payment
- duplicate callback
- duplicate webhook
- delayed webhook
- payment mismatch
- amount mismatch
- wrong booking reference
- already-confirmed booking

The payment system must be idempotent.

---

# 13. EMAIL SYSTEM

Email should support:

## Transactional messages

Examples:

- booking confirmation
- payment confirmation
- course details
- class reminder
- cancellation/refund message

## Admin-created templates

Admin should be able to write/edit templates.

Support variables such as:

- `{{student_name}}`
- `{{course_name}}`
- `{{batch_name}}`
- `{{date}}`
- `{{time}}`
- `{{booking_reference}}`
- `{{amount}}`
- `{{zoom_link}}`

Only allow approved variables.

Never execute arbitrary code from message templates.

---

# 14. WHATSAPP SYSTEM

WhatsApp messaging must be implemented through an approved WhatsApp Business API/provider.

Support:

- booking confirmation
- payment confirmation
- reminders
- promotional broadcasts

Do not assume arbitrary free-form WhatsApp messages can always be sent outside the provider's permitted/template rules.

Store provider message ID and delivery status where available.

Handle:

- sent
- delivered
- read
- failed

---

# 15. BROADCAST SYSTEM

Admin must be able to create a message and choose audience.

Audience filters:

- all students
- specific course
- specific batch
- confirmed bookings
- selected students

Channels:

- Email
- WhatsApp
- both

Example:

Admin writes:

"Your class starts tomorrow at 7 PM. Please keep your materials ready."

Then:

Select Batch
→ Select Email/WhatsApp
→ Preview
→ Confirm
→ Send

Do not immediately send when the admin accidentally clicks a draft/save button.

Use a clear confirmation step.

---

# 16. NOTIFICATION LOGGING

Every communication attempt should be logged.

Suggested information:

- student
- booking
- channel
- message type
- template
- provider message ID
- status
- failure reason
- sent time
- delivered time where available
- read time where available
- retry count

This allows the admin to identify failed notifications.

---

# 17. SECURITY

Implement:

- Supabase Auth for admin authentication
- protected admin routes
- Row Level Security
- server-side authorization
- service-role key ONLY on server
- never expose service-role credentials to browser
- environment variables
- input validation
- output validation where appropriate
- rate limiting for sensitive endpoints where practical
- secure webhook validation
- authorization checks on every admin mutation

Do not rely on hiding an admin route as security.

---

# 18. ADMIN AUTHORIZATION

Define an explicit admin authorization mechanism.

Possible approach:

- authenticated Supabase user
- admin role/profile record
- server-side authorization helper
- RLS policies

A normal customer must never gain access to:

- admin dashboard
- all students
- all bookings
- payment records
- message templates
- broadcast system
- notification logs
- private Zoom information

---

# 19. DATA INTEGRITY

Design relationships carefully.

Core conceptual entities:

- courses
- cohort_batches
- customers
- bookings
- payments
- landing page content
- media/gallery
- message templates
- broadcasts
- notification logs
- admin users/profiles

Use:

- primary keys
- foreign keys
- unique constraints
- check constraints
- indexes
- timestamps

Use UUIDs where appropriate.

Use database constraints in addition to application validation.

---

# 20. EDGE CASES

You MUST actively test edge cases during every relevant phase.

Minimum cases:

1. User refreshes during payment.
2. User clicks Pay multiple times.
3. Razorpay callback arrives twice.
4. Webhook arrives before frontend callback.
5. Frontend callback arrives before webhook.
6. Payment succeeds but confirmation API fails.
7. Payment succeeds but email fails.
8. Payment succeeds but WhatsApp fails.
9. Payment amount differs from expected amount.
10. Course becomes unavailable during checkout.
11. Last seat is booked by two users simultaneously.
12. Admin changes price while someone is checking out.
13. Admin changes batch availability during checkout.
14. Student enters invalid email.
15. Student enters invalid WhatsApp number.
16. Same email registers twice.
17. Same payment is attached to two bookings.
18. Student refreshes confirmation page.
19. Admin sends broadcast twice accidentally.
20. Broadcast partially fails.
21. One student's WhatsApp fails while email succeeds.
22. Image upload fails halfway.
23. Admin deletes media currently used by frontend.
24. Admin saves incomplete landing-page content.
25. Admin opens two editing sessions and overwrites newer data.
26. Unauthorized user calls admin API directly.
27. Service-role key accidentally appears in client bundle.
28. Public API exposes private Zoom information.
29. A deleted/disabled course is accessed through an old URL.
30. Timezone causes incorrect class date/time.
31. Countdown receives an invalid/expired date.
32. Message template contains unsupported variables.
33. Notification provider is temporarily unavailable.
34. Retry accidentally sends duplicate messages.
35. Refund occurs after confirmation was already sent.

For concurrency-sensitive operations, use database-safe logic rather than only frontend checks.

---

# 21. CONTENT VERSION / PUBLISH SAFETY

Landing-page edits should not unexpectedly break the live site.

Where useful, support:

- draft
- published

Admin should be able to save changes without immediately publishing them if the feature requires it.

At minimum, prevent incomplete data from replacing valid production content.

---

# 22. FRONTEND COMPATIBILITY

Before changing any existing component:

1. Inspect the component.
2. Identify its current props/data structure.
3. Identify which values are hardcoded.
4. Map those values to backend fields.
5. Preserve the existing component API where practical.
6. Replace only the data source.
7. Verify visual output remains unchanged.

Do NOT rebuild the components just to connect Supabase.

---

# 23. EXISTING CONTENT MIGRATION

The current `content.ts` is the source of truth for the existing landing-page content during migration.

First:

- inspect it completely
- identify every editable field
- map each field to the future database model
- identify arrays
- identify nested objects
- identify images
- identify pricing
- identify dates
- identify FAQs
- identify bonuses
- identify audience cards
- identify instructor statistics

Then create a migration/seed process.

Do not manually lose any current content.

After migration:

Current UI content
≈
Supabase-backed UI content

The visual result must remain equivalent.

---

# 24. DEVELOPMENT PROCESS

You MUST work in phases.

DO NOT build the entire backend in one response.

For every phase:

### Step A — Explain

Tell me:

- what we are building
- why it is needed
- files that will change/create
- database objects involved
- expected behavior
- risks/edge cases

### Step B — Wait for my approval

Ask me to approve the phase.

### Step C — Implement

Only after approval, implement the phase.

### Step D — Self-test

Run:

- type checking
- linting if configured
- build validation where appropriate
- database validation
- API validation
- security checks relevant to that phase

### Step E — Report

Tell me:

- files changed
- what was implemented
- tests performed
- tests passed/failed
- known limitations
- manual verification steps

### Step F — STOP

Do NOT automatically continue to the next phase.

Ask me:

> "Please verify this phase. If everything works correctly, reply `APPROVED` and I will proceed to the next phase."

Never proceed without my explicit approval.

---

# 25. PHASE PLAN

## PHASE 0 — Project Audit

Do not modify code.

Inspect:

- package.json
- app structure
- components
- content.ts
- existing environment files
- registration modal
- current frontend data flow
- existing API files if any
- existing Supabase files if any
- image/media structure

Produce:

- current architecture
- frontend-to-backend mapping
- editable-content inventory
- dependency inventory
- risks
- proposed backend structure

Then STOP.

---

## PHASE 1 — Supabase Foundation

Set up only the backend foundation.

Create/configure:

- Supabase client
- browser client if needed
- server client
- environment variables
- `.env.example`
- server-only admin/service client if required
- basic health check
- base error handling

Do NOT build payments or notifications.

Do NOT redesign UI.

Validate:

- environment configuration
- Supabase connection
- server/client separation
- no service-role key leakage

STOP for approval.

---

## PHASE 2 — Database Schema

Design and implement the Supabase schema.

Start with:

- courses
- cohort_batches
- customers
- bookings
- payments
- admin profiles/roles

Then content/CMS tables needed for the landing page.

Then:

- media/gallery
- message templates
- broadcasts
- notification logs

Implement:

- relationships
- constraints
- indexes
- timestamps
- status fields
- RLS

Do not create unnecessary tables.

Before migration, explain the schema and relationship diagram.

STOP for approval after validation.

---

## PHASE 3 — Existing Content Migration

Take the current `content.ts` data and migrate it into Supabase without changing its visual meaning.

Create seed/migration logic.

Validate that:

- all existing sections are represented
- no text is lost
- no pricing is lost
- no FAQ is lost
- no instructor data is lost
- no audience cards are lost
- no bonuses are lost
- no image references are lost

Do NOT switch the frontend yet unless explicitly approved for this phase.

STOP for approval.

---

## PHASE 4 — Admin Authentication

Implement:

- Supabase Auth
- admin login
- admin authorization
- protected admin routes
- admin profile/role
- logout
- session handling

Test unauthorized access.

STOP for approval.

---

## PHASE 5 — Admin Dashboard Shell

Create the admin portal UI.

Important:

This is a NEW admin UI.

Do NOT modify the existing public landing page design.

Create sidebar tabs:

- Dashboard
- Landing Page
- Course / Workshop
- Batches
- Gallery / Media
- Students
- Bookings
- Payments
- Messages
- Broadcast
- Notifications
- Settings

At this phase, focus on structure/navigation.

STOP for approval.

---

## PHASE 6 — Landing Page CMS

Implement each landing-page section as an admin-editable tab.

For each tab:

- load current content
- edit
- validate
- save
- reload
- confirm persistence

Sections:

- Navbar
- Hero
- Countdown
- Instructor
- Audience
- Video
- Transformation
- Method
- Core Concepts
- Outcomes
- Story
- Bonuses
- Fit Check
- Included
- FAQ
- Final CTA
- Footer
- Sticky Bar

Do not change the public UI.

STOP after validating every section.

---

## PHASE 7 — Public Frontend CMS Integration

Now connect the existing landing page to Supabase.

Important:

Do NOT redesign.

Replace hardcoded/static content with backend data while preserving:

- exact layout
- styling
- animation
- typography
- spacing
- responsive behavior
- component structure

Implement safe fallback behavior where appropriate.

If Supabase content fails, do not crash the entire page unnecessarily.

STOP for visual verification.

---

## PHASE 8 — Course & Batch Management

Admin can:

- create course
- edit course
- disable course
- create batch
- edit batch
- set date/time
- set price
- set seats
- manage enrollment status

Connect public course/batch data.

Test sold-out and disabled states.

STOP for approval.

---

## PHASE 9 — Gallery / Media CMS

Implement Supabase Storage.

Admin can:

- upload
- replace
- delete
- reorder
- add metadata

Protect media operations.

Ensure deleting media does not silently break a live page.

STOP for approval.

---

## PHASE 10 — Booking System

Connect the existing `RegistrationModal`.

Preserve its UI.

Implement:

Student details
→ validation
→ course/batch selection
→ booking creation
→ pending status

Do not integrate Razorpay yet unless required for testing.

Test duplicate submissions and invalid input.

STOP for approval.

---

## PHASE 11 — Razorpay

Implement:

- order creation
- amount validation
- payment
- signature verification
- webhook
- idempotency
- payment state handling

Never trust frontend price/payment state.

Test all payment edge cases.

STOP for approval.

---

## PHASE 12 — Booking Confirmation

After verified payment:

- update booking
- update payment
- show existing confirmation UI
- expose only safe confirmation information

Prevent duplicate confirmation actions.

STOP for approval.

---

## PHASE 13 — Email Notifications

Implement email service.

Create:

- confirmation template
- payment confirmation template
- reminder template
- cancellation/refund template

Admin-editable templates.

Add notification logs.

STOP for approval.

---

## PHASE 14 — WhatsApp Notifications

Integrate the approved WhatsApp Business API/provider.

Implement:

- confirmation
- reminders
- template handling
- provider response tracking
- delivery/failure logs
- safe retry

STOP for approval.

---

## PHASE 15 — Admin Broadcast System

Implement:

- create message
- save draft
- audience selection
- preview
- confirmation
- send
- progress/status
- logs
- retry failed messages

Prevent accidental duplicate sends.

STOP for approval.

---

## PHASE 16 — Scheduled Reminders

Implement scheduled messages for:

- upcoming class
- class day
- other admin-defined reminders

Respect timezone.

Prevent duplicate reminder sends.

STOP for approval.

---

## PHASE 17 — Dashboard / Analytics

Show useful operational information:

- total students
- confirmed bookings
- pending bookings
- revenue
- upcoming batches
- seats remaining
- failed notifications
- recent bookings

Do not expose unnecessary sensitive data.

STOP for approval.

---

## PHASE 18 — Security Audit

Perform a dedicated security review.

Check:

- RLS
- admin authorization
- API authorization
- service-role leakage
- webhook security
- input validation
- rate limiting
- sensitive data exposure
- public/private fields
- Zoom/private links
- storage permissions
- authentication/session handling

STOP and provide security report.

---

## PHASE 19 — Full Edge-Case Testing

Test the complete system against the edge-case list.

Especially:

- duplicate payment
- duplicate webhook
- concurrent last-seat booking
- price change during checkout
- failed notification
- retry
- duplicate broadcast
- invalid admin request
- expired batch
- timezone issues

Document every result.

STOP for approval.

---

## PHASE 20 — Production Readiness

Final audit:

- typecheck
- lint
- build
- database migration state
- environment variables
- RLS
- API routes
- payment configuration
- email configuration
- WhatsApp configuration
- storage
- error handling
- logging
- deployment configuration

Do not deploy automatically.

Provide final deployment checklist.

STOP.

---

# 26. CODING QUALITY RULES

Use:

- TypeScript strict typing
- reusable services
- reusable validation schemas
- clear API/service boundaries
- descriptive naming
- centralized constants where useful
- server-side validation
- proper error handling
- no duplicated business logic

Avoid:

- `any` unless genuinely unavoidable
- secrets in client code
- database calls scattered randomly through UI components
- trusting browser-provided prices
- trusting browser-provided payment status
- duplicate business rules
- unnecessary dependencies
- unnecessary abstractions

---

# 27. ERROR HANDLING

Every backend operation should have predictable errors.

Use a consistent structure such as:

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_AVAILABLE",
    "message": "This batch is no longer available."
  }
}
```

Do not expose:

- stack traces
- secret keys
- database internals
- provider credentials
- sensitive server information

to normal users.

---

# 28. PERFORMANCE

Do not make every landing-page section perform an independent database request.

Prefer efficient data loading.

Consider:

- server-side fetching
- caching where safe
- one content payload for related sections
- optimized images
- database indexes
- pagination for students/bookings
- pagination for notification logs

Admin tables should not load thousands of records at once.

---

# 29. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

### Public Website

- Existing UI looks unchanged.
- Existing animations work.
- Existing responsive behavior works.
- Existing landing page sections remain present.
- Admin can modify landing-page content.
- Changes appear on the public website.
- Course/batch information is dynamic.
- Booking works.
- Razorpay works.
- Payment verification works.
- Confirmation works.
- Email works.
- WhatsApp works.

### Admin

- Secure login works.
- Sidebar navigation works.
- Landing Page CMS works.
- Course management works.
- Batch management works.
- Gallery works.
- Student management works.
- Booking management works.
- Payment records work.
- Message templates work.
- Broadcast works.
- Notification logs work.
- Settings work.

### Security

- RLS enabled.
- Admin routes protected.
- Service role never exposed.
- Payment verification server-side.
- Webhook protected.
- Private data protected.

### Reliability

- Duplicate payments handled.
- Duplicate webhooks handled.
- Duplicate broadcasts prevented.
- Concurrent seat booking handled.
- Notification failures logged.
- Retries are safe.
- Timezones handled.

---

# 30. MOST IMPORTANT EXECUTION RULE

DO NOT rush.

DO NOT implement multiple phases together.

DO NOT say "I completed the backend" after one large implementation.

The workflow must be:

```text
PHASE
  ↓
EXPLAIN
  ↓
WAIT FOR USER APPROVAL
  ↓
IMPLEMENT
  ↓
TEST
  ↓
REPORT
  ↓
WAIT FOR USER VERIFICATION
  ↓
USER SAYS APPROVED
  ↓
NEXT PHASE
```

At the end of EVERY phase, stop.

The user will manually verify the result.

Only continue when the user explicitly approves.

---

# START NOW

Start with **PHASE 0 — Project Audit**.

Do not modify any files during Phase 0.

Inspect the existing project and produce:

1. Current architecture
2. Existing frontend data flow
3. Complete editable-content inventory
4. Backend requirements
5. Database entity proposal
6. Admin sidebar proposal
7. Frontend-to-database mapping
8. Risks and edge cases
9. Files that will eventually need modification
10. Exact implementation plan for Phase 1

Then STOP and ask the user to verify/approve Phase 0.

Do not implement Phase 1 until the user explicitly says:

`APPROVED`
