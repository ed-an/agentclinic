# Agent Dashboard — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm Phase 7 conventions and the Phase 8 contract

1. Review Appointment schema and migration, booking transactions, active availability queries, controlled clock, timezone configuration/formatting, API DTOs, Agent directory links, interactive UI patterns, and Playwright fixtures.
2. Confirm the approved upcoming and cancellation response fields and the absolute prohibition on visitor name, visitor email, idempotency key, and internal fields.
3. Define and document the validated cancellation-cutoff configuration with a 24-hour default and exact-boundary eligibility.
4. Confirm that route-based Agent selection is explicitly a demo mechanism and adds no authentication state or security claim.

**Checkpoint:** the implementation contract is the smallest Phase 8 slice and has no staff, authentication, history, rescheduling, notification, or other later-phase behavior.

## 2. Migrate Appointment lifecycle and slot relations safely

1. Add `CANCELLED` and nullable UTC `cancelledAt` while preserving all Phase 7 fields and data.
2. Change the slot relation from one-to-one to the minimum history-preserving relation.
3. Replace absolute `availabilitySlotId` uniqueness with a SQLite partial unique index for `status = 'CONFIRMED'` through the approved Prisma migration workflow.
4. Retain foreign keys and add only justified indexes for upcoming and cancellation queries.
5. Validate clean migration, completed Phase 7 upgrade, prior-record preservation, database status enforcement, repeated no-op deployment, and zero seeded Appointments.
6. Exercise direct database cases for one active booking, multiple cancelled histories, rebooking, and rejection of a second active booking.

**Checkpoint:** the database preserves history, allows rebooking, and remains the final active-booking concurrency safeguard.

## 3. Add and validate cancellation configuration

1. Add the documented server environment value with a 24-hour default and explicit unit/range.
2. Integrate it with established startup configuration validation.
3. Add focused tests for default, valid override, malformed, nonfinite, negative, and unsupported values.
4. Centralize deadline and eligibility calculations around the Phase 6 controlled clock.
5. Prove the exact cutoff boundary succeeds and any instant inside it fails.

**Checkpoint:** every cancellation decision uses one validated duration and deterministic server time.

## 4. Build the upcoming appointments read model

1. Implement `GET /agents/:agentId/appointments/upcoming` with thin controller, strict UUID validation, service logic, and explicit repository query.
2. Verify the Agent exists before returning the collection.
3. Query only the selected Agent's future `CONFIRMED` appointments.
4. Sort by slot start ascending and Appointment ID ascending.
5. Derive approved Therapy, UTC time, duration, timezone, deadline, and eligibility fields.
6. Add focused success, empty, malformed, unknown, filtering, ordering, clock-boundary, DTO privacy, and safe-error tests.

**Checkpoint:** the endpoint returns a deterministic minimal view and no private booking data.

## 5. Implement transactional idempotent cancellation

1. Implement `POST /agents/:agentId/appointments/:appointmentId/cancel` through thin controller, application service, and persistence boundary.
2. Validate identifiers and enforce non-revealing `404` behavior for unknown or mismatched resources.
3. Evaluate future-time and cutoff rules inside an explicit transaction with the controlled clock.
4. Use a conditional `CONFIRMED`-to-`CANCELLED` transition that sets `cancelledAt` once.
5. Return equivalent safe `200` results for initial cancellation and replays; return `409` for a matching ineligible confirmed appointment.
6. Handle concurrent requests so one transition occurs and all successful/replay results agree.
7. Map persistence failures safely and prove rollback leaves status and `cancelledAt` unchanged.
8. Add API, service, real-database concurrency, privacy, and logging tests.

**Checkpoint:** cancellation is boundary-correct, atomic, idempotent, ownership-safe, and free of partial state.

## 6. Update availability and preserve booking guarantees

1. Change availability reads and booking eligibility to exclude only active `CONFIRMED` occupancy.
2. Prove cancellation restores an administratively available future slot immediately.
3. Prove administratively unavailable and past slots remain excluded.
4. Rebook a cancelled slot into a new Appointment without altering cancelled history.
5. Exercise concurrent rebooking and prove database-level active uniqueness permits exactly one winner.
6. Re-run Phase 7 idempotency, confirmation privacy, double-booking, and rollback tests.

**Checkpoint:** cancellation releases only eligible capacity while every Phase 7 concurrency guarantee remains intact.

## 7. Build the accessible Agent dashboard

1. Add dashboard navigation from `/agents` and `/agents/[id]/dashboard` using authoritative route and Agent data.
2. Display the temporary-demo-selection notice without claiming authentication or production security.
3. Render upcoming appointment cards or rows with only approved operational information and centralized local-time formatting.
4. Add meaningful loading, empty, not-found, and safe retryable error states.
5. Add focused route, API-client, semantic rendering, privacy, and state tests.

**Checkpoint:** a selected Agent can understand upcoming care without private visitor data or ambiguous identity claims.

## 8. Add accessible cancellation interaction

1. Use the simplest established inline confirmation or native dialog pattern associated with one appointment.
2. Name the Therapy and appointment time and require explicit confirmation.
3. Implement keyboard behavior, Escape where applicable, focus placement/return, status announcements, and disabled pending action.
4. On success, remove the item immediately and transition to the empty state when appropriate.
5. Present cutoff conflict, stale-state refresh/recovery, and safe retryable failure feedback.
6. Add focused interaction tests for eligibility, confirmation, repeated action prevention, focus, success, conflicts, errors, and privacy.

**Checkpoint:** keyboard and pointer users can cancel once, understand the outcome, and recover safely.

## 9. Automate the critical browser journey and regressions

1. Add Playwright coverage for Agent selection, dashboard navigation, upcoming filtering, explicit cancellation, immediate removal, and restored availability/rebooking.
2. Cover empty, loading where observable, not-found, cutoff conflict, stale state, and retryable failure.
3. Validate keyboard-only operation, focus management, status announcements, and no serious or critical axe violations.
4. Exercise 320px/400%-zoom-equivalent and 1440px layouts without horizontal overflow.
5. Inspect rendered HTML, URLs, console output, errors, screenshots, and traces for prohibited personal data.
6. Run every Phase 2–7 migration, seed, API, controlled-time, timezone, UI, accessibility, smoke, concurrency, privacy, and browser regression.
7. Prove no authentication, staff queue, history UI, rescheduling, notification, or later-phase behavior was introduced.

**Checkpoint:** browser and automated evidence covers the complete Phase 8 journey and all prior capabilities remain usable.

## 10. Final review

1. Use Node 24.19.0 and the previously successful Playwright environment.
2. Run Prisma generation, formatting, linting, strict type checking, root validation tests, production builds, smoke tests, complete Playwright, and `git diff --check`.
3. Review implementation against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
4. Confirm the migration preserves Phase 7 data and status, seeds create no Appointments, and active-only uniqueness is database-enforced.
5. Confirm no visitor or internal data appears in APIs, HTML, URLs, logs, errors, console output, screenshots, traces, or fixtures.
6. Confirm the diff contains no database, generated client, build output, coverage, Playwright artifact, temporary file, secret, log, roadmap completion change, or unrelated edit.
7. Report environmental limitations as blocked; never use `sudo`, silently skip checks, or mark unexecuted checks as passing.

**Checkpoint:** every required check passes with no unresolved correctness, concurrency, privacy, accessibility, architecture, scope, or regression issue before merge.
