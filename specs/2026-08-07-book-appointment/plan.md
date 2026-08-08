# Book an Appointment — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm conventions and the minimal booking contract

1. Review Phase 3 Agent APIs, Phase 5 Therapy details, Phase 6 availability, controlled-clock and timezone helpers, NestJS DTO validation, Prisma transaction patterns, error mapping, forms, status states, and browser tests.
2. Confirm the seven persisted Appointment values: server UUID `id`, unique `availabilitySlotId`, `agentId`, normalized `visitorName`, normalized `visitorEmail`, unique `idempotencyKey`, `CONFIRMED` status, and server UTC `createdAt`.
3. Confirm the required read-only booking-context endpoint for resolving one slot by `slotId`, since the booking page must not trust Therapy or time values from query parameters.
4. Select and document reasonable maximum lengths for visitor name, email, and the complete request body where existing boundary conventions require one.
5. Confirm `POST /appointments` returns `201` for creation and `200` for a same-key, same-normalized-payload replay.
6. Confirm `GET /appointments/:id` and `/appointments/[id]` expose a refresh-safe confirmation without visitor email or other personal data.

**Checkpoint:** the contract supports one atomic booking and safe confirmation with no dashboard, lifecycle transition, authentication, or other later-phase behavior.

## 2. Add the Appointment schema migration

1. Add the minimal Prisma `Appointment` model and required relations to exactly one AvailabilitySlot and one Agent.
2. Enforce unique `availabilitySlotId` and unique `idempotencyKey` as the final database safeguards.
3. Add only the relation indexes concretely needed by booking and confirmation queries.
4. Represent `CONFIRMED` as the only accepted Phase 7 status and enforce it at the SQLite boundary where practical.
5. Create a named Phase 7 migration without modifying prior migration history.
6. Apply all migrations to a clean isolated database and upgrade a separate completed Phase 6 database.
7. Verify all Phase 2–6 records and relationships remain unchanged, no Appointment is created automatically, and repeated migration deployment is a no-op.
8. Exercise foreign keys, uniqueness, required fields, and status enforcement directly against SQLite.

**Checkpoint:** both migration paths reach the same schema, prior data is preserved, invalid rows are rejected by the database, and no placeholder Appointment exists.

## 3. Define normalized input and safe response contracts

1. Add strict NestJS validation for `availabilitySlotId`, `agentId`, `visitorName`, and `visitorEmail`, rejecting missing, empty, malformed, oversized, repeated, or unexpected values.
2. Trim visitor name and trim plus lowercase visitor email before persistence and idempotency comparison.
3. Validate `Idempotency-Key` as one scalar UUID header and reject missing, malformed, or repeated values.
4. Define a safe confirmation DTO containing only appointment reference, `CONFIRMED` status, Therapy and Agent identities and names, authoritative UTC start/end and duration, configured display timezone, and UTC `createdAt`.
5. Exclude visitor email, visitor name, idempotency key, raw slot internals, and Prisma fields from confirmation responses.
6. Add focused DTO, normalization, header, unknown-property, and privacy tests.

**Checkpoint:** all untrusted input is normalized and validated at the server boundary, and public responses contain only approved non-personal confirmation data.

## 4. Build authoritative booking-context reads

1. Add the smallest read-only endpoint needed for `/appointments/book?slotId=<uuid>` to resolve one AvailabilitySlot directly from its ID.
2. Derive Therapy identity and name, UTC start/end, duration, configured display timezone, administrative availability, booking state, and future eligibility exclusively on the server.
3. Return safe `400`, `404`, and conflict responses for malformed, unknown, administratively unavailable, past, or already-booked slots as appropriate.
4. Reuse `GET /agents` for the complete existing Agent selector; do not add Agent–Therapy relationships.
5. Update Phase 6 availability reads to exclude slots with an Appointment while leaving `isAvailable` unchanged.
6. Add focused tests proving booked slots disappear immediately and all other eligible slots remain available.

**Checkpoint:** the web can render authoritative review information from `slotId` alone, and booked availability is excluded without changing administrative state.

## 5. Implement transactional and idempotent booking

1. Implement `POST /appointments` in a thin controller backed by an injectable booking service and explicit persistence boundary.
2. Begin one database transaction and validate that the slot exists, is administratively available, is in the future under the controlled server clock, has no Appointment, and references authoritative Therapy data.
3. Validate that the selected Agent exists inside the booking operation.
4. Create one server-generated UUID Appointment with normalized visitor data, the header idempotency key, `CONFIRMED`, and server-generated UTC `createdAt`.
5. Keep unique `availabilitySlotId` as the final double-booking safeguard and map its uniqueness conflict to safe HTTP `409`.
6. On an existing idempotency key, compare the normalized persisted payload: return the original confirmation with `200` when identical and `409` when different.
7. Handle simultaneous same-key retries safely, including uniqueness races, without duplicate Appointments.
8. Ensure any validation, conflict, persistence, or simulated mid-transaction failure rolls back completely and consumes neither slot nor idempotency key.
9. Do not log visitor name, email, idempotency key, request body, or raw persistence errors.
10. Add focused unit and HTTP tests for success, every rejection, privacy, rollback, idempotency, and concurrency.

**Checkpoint:** one eligible slot produces exactly one confirmed Appointment, retries are deterministic, different-key races have one winner, and failed operations leave no partial state.

## 6. Build refresh-safe confirmation reads

1. Implement `GET /appointments/:id` with UUID validation and the same safe confirmation DTO used after booking.
2. Return safe `400`, `404`, and `500` responses without personal or internal-data leakage.
3. Add `/appointments/[id]` as a refresh-safe confirmation page using only the appointment reference.
4. Display Therapy, Agent, configured local date/time, duration, timezone, `CONFIRMED` status, and a concise reference while keeping UTC authoritative.
5. Add loading, not-found, and safe retryable error states using existing conventions.
6. Add focused API-client and UI tests confirming visitor email and name never render.

**Checkpoint:** a successful booking can be refreshed safely without exposing personal details or requiring authentication prematurely.

## 7. Build the accessible booking form journey

1. Link each eligible slot on `/therapies/[id]` to `/appointments/book?slotId=<uuid>` without making unavailable or booked slots actionable.
2. Build the booking page from authoritative slot context plus the existing Agent list API.
3. Display the selected Therapy, Agent choice, configured local date/time, duration, timezone, and neutral informational guidance.
4. Add labeled visitor name and email fields with accessible descriptions, reasonable length limits, and field-associated validation errors.
5. Provide an explicit review step before submission.
6. Generate one UUID idempotency key per booking attempt, preserve it across safe retry of the same normalized payload, and prevent duplicate clicks with pending/disabled state.
7. Submit only approved fields and the header; never submit Therapy, time, duration, timezone, or unapproved personal data.
8. On success, navigate to the refresh-safe confirmation page.
9. Provide distinct malformed/unknown slot, validation, stale/already-booked conflict, pending, and safe retryable server-error states with recovery paths.
10. Add concise non-emergency guidance consistent with the mission without implying diagnosis, guaranteed treatment, or emergency care.

**Checkpoint:** a keyboard or pointer user can review and submit one authoritative booking and understand success, validation, conflict, missing, and failed outcomes.

## 8. Automate the critical booking journey and regressions

1. Add Playwright coverage for selecting an available slot, choosing an Agent, entering visitor data, reviewing, submitting once, seeing confirmation, and refreshing it.
2. Cover duplicate-click prevention, stale/already-booked conflict recovery, malformed and unknown slots, and browser-relevant safe error states.
3. Validate keyboard-only operation, focus behavior, field error association, semantic structure, status announcements, and no serious or critical axe violations.
4. Exercise 320px/400%-zoom-equivalent and 1440px layouts without horizontal overflow.
5. Extend persistence and source-boundary checks for Phase 7 while preserving server-only Prisma and SQLite ownership.
6. Run all Phase 2–6 migration, seed, API, temporal, timezone, UI, accessibility, smoke, and browser regression suites.
7. Add route and source review proving cancellation, rescheduling, dashboards, authentication, notifications, payments, capacity, recurrence, administrative CRUD, and other later-phase behavior are absent.

**Checkpoint:** browser and automated evidence cover the complete booking journey, concurrency rules, privacy, accessibility, responsiveness, architecture, and all prior behavior.

## 9. Final review

1. Use Node 24.19.0 and the previously successful Playwright environment.
2. Run Prisma generation, formatting, linting, strict type checking, root validation tests, production builds, smoke tests, the complete Playwright suite, and `git diff --check`.
3. Review implementation against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
4. Confirm Appointment stores no duplicated Therapy, time, duration, timezone, or other unapproved field.
5. Confirm logs, errors, responses, pages, screenshots, traces, and test fixtures do not expose visitor email or unnecessary personal data.
6. Confirm the diff contains no database, generated client, build output, coverage, Playwright artifact, temporary file, secret, log, or unrelated change.
7. Report environmental limitations as blocked; do not use `sudo`, silently skip checks, or mark failed or unexecuted checks as passing.

**Checkpoint:** every required check passes with no unresolved correctness, concurrency, privacy, accessibility, architectural, scope, or regression issue before merge.
