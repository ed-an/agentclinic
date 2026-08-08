# Staff Appointment Queue — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm the Phase 9 contract and existing conventions

1. Review Phase 8 schema, migrations, partial index documentation, booking and cancellation transactions, controlled clock, timezone formatter, query validation, error shapes, UI patterns, and Playwright environment.
2. Fix the approved queue DTO, filter convention, maximum date range, controlled reason codes, transition matrix, event fields, and unauthenticated-demo notice wording.
3. Establish privacy boundary tests prohibiting visitor data, idempotency keys, raw relations, and internal fields from staff surfaces.
4. Confirm no Phase 10 authentication or later functionality is included.

**Checkpoint:** one exact Phase 9 contract is documented against established conventions.

## 2. Migrate lifecycle, audit events, and active-slot protection

1. Add `PENDING`, cancellation source/reason fields, and AppointmentStatusEvent with database checks where practical.
2. Preserve completed Phase 8 records and create exactly one `SYSTEM` snapshot event per existing Appointment.
3. Replace the manually managed partial unique index so both `PENDING` and `CONFIRMED` are active.
4. Add only justified queue/event indexes and preserve foreign keys.
5. Validate clean migration, Phase 8 upgrade, data preservation, repeated no-op deployment, schema diff, and zero Appointment/event seeds.
6. Exercise direct database cases for active uniqueness, cancelled history, valid source/reason combinations, and timestamp constraints.

**Checkpoint:** persistence preserves old data, records lifecycle safely, and remains the final double-booking safeguard.

## 3. Update booking, availability, and Agent cancellation

1. Change new booking status to `PENDING` and create its initial `VISITOR` event in the booking transaction.
2. Update confirmation copy to pending-request language without adding notification delivery.
3. Treat both active statuses as occupancy in all availability and booking queries.
4. Extend Agent cancellation to record `AGENT` source and one event while retaining its 24-hour cutoff and idempotency.
5. Re-run booking, availability, rebooking, privacy, rollback, idempotency, and concurrency tests.

**Checkpoint:** pending requests block immediately and every existing booking and Agent cancellation guarantee remains intact.

## 4. Build the strictly validated staff queue API

1. Implement `GET /staff/appointments` through thin controller, application service, and repository boundary.
2. Validate only the approved status, Agent, Therapy, inclusive-from, and exclusive-to parameters, including repetitions and maximum range.
3. Implement the upcoming-active default and explicit cancelled filtering with deterministic ordering.
4. Shape the minimal operational DTO and compute action eligibility from authoritative time and status.
5. Add focused combined-filter, empty, malformed, unknown, excessive-range, privacy, and safe-error tests.

**Checkpoint:** the API returns a deterministic, minimal queue without personal data.

## 5. Implement transactional confirmation

1. Add `POST /staff/appointments/:appointmentId/confirm` with strict UUID validation.
2. Conditionally transition only a future `PENDING` Appointment and append one `STAFF` event atomically.
3. Return equivalent `200` results for first success and confirmed replay; return safe `404`/`409` results as specified.
4. Prove rollback and confirm/confirm concurrency create no duplicate event or partial state.
5. Prove the slot remains blocked and the Agent dashboard reflects confirmation immediately.

**Checkpoint:** confirmation is future-only, atomic, idempotent, convergent, and cross-view consistent.

## 6. Implement transactional staff cancellation

1. Add `POST /staff/appointments/:appointmentId/cancel` with strict controlled-reason validation and no free text.
2. Conditionally cancel a future `PENDING` or `CONFIRMED` Appointment, recording UTC time, `STAFF` source, reason, and one event atomically.
3. Preserve stored cancellation values on replay and return an equivalent safe `200` result.
4. Return `409` at or after `startsAt`; prove rollback and cancel/cancel concurrency behavior.
5. Verify eligible slot restoration and continued exclusion for past or administratively unavailable slots.

**Checkpoint:** staff cancellation is atomic, idempotent, auditable, and releases only eligible capacity.

## 7. Build the accessible staff queue

1. Add `/staff/appointments` with the prominent unauthenticated demonstration notice.
2. Render approved operational data, centralized timezone display, URL-backed filters, refresh preservation, and clear-filter behavior.
3. Implement loading, empty, filtered-empty, not-found, conflict, stale, success, and retryable-error states.
4. Add explicit confirm and controlled-reason cancel interactions with duplicate-submit protection, announcements, and correct focus behavior.
5. Reconcile successful mutations immediately and add focused rendering, interaction, privacy, keyboard, and responsive tests.

**Checkpoint:** staff can understand, filter, and act on the queue accessibly without a false security claim.

## 8. Prove cross-view behavior and concurrency

1. Verify confirmation reveals the Appointment on the Agent dashboard while retaining slot occupancy.
2. Verify cancellation removes a confirmed Appointment and restores eligible availability and booking.
3. Race confirm/confirm, cancel/cancel, confirm/cancel, and booking against cancellation-based restoration using real database operations.
4. Assert one valid final state, no duplicate events, no partial transaction, and intact active-slot uniqueness.
5. Inspect all API, HTML, URL, log, console, screenshot, trace, and error surfaces for prohibited data.

**Checkpoint:** concurrent operations converge and every consumer sees one authoritative state.

## 9. Automate the browser journey and regressions

1. Cover default queue, every approved filter, filter refresh/clear, explicit confirmation, controlled cancellation, and immediate updates in Playwright.
2. Cover loading where observable, both empty states, success, conflict, stale, not-found, and retryable failure.
3. Validate keyboard-only use, focus management, announcements, axe results, 320px/400%-zoom-equivalent and 1440px layouts, and overflow.
4. Run every Phase 2–8 persistence, API, UI, browser, accessibility, timezone, controlled-clock, booking, idempotency, privacy, availability, rebooking, and dashboard regression.
5. Prove no authentication or later-scope behavior was introduced.

**Checkpoint:** automated evidence covers the critical staff-management journey and all earlier behavior remains usable.

## 10. Final review

1. Use Node 24.19.0 and the previously successful Playwright environment.
2. Run Prisma generation, formatting, linting, strict type checking, validation tests, production builds, smoke tests, complete Playwright, migration/schema checks, and `git diff --check`.
3. Review against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
4. Inspect migrations, partial-index documentation, privacy boundaries, complete diff, and repository status.
5. Confirm no generated artifacts, databases, secrets, roadmap edits, unrelated changes, or later functionality remain.
6. Report environmental limitations as blocked; never use `sudo`, skip a required check, or count an unexecuted check as passing.

**Checkpoint:** all required evidence passes with no unresolved scope, correctness, privacy, concurrency, accessibility, architecture, or regression issue.
