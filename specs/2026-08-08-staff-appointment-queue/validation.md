# Staff Appointment Queue — Validation

## Merge standard

Phase 9 can be merged only when every required check passes on the feature branch and in CI. Failed checks block merge. Environmental limitations must be reported as blocked with available evidence and must not be skipped or counted as passing. Do not use `sudo`.

## 1. Scope, security boundary, and privacy

Inspect schema, migrations, APIs, DTOs, routes, UI, logs, tests, dependencies, and the complete diff.

**Success:** only Phase 9 exists; `/staff/appointments` visibly states that it is unauthenticated demonstration behavior; no authentication or later feature exists; and visitor name/email, idempotency keys, raw relations, and internal data appear in no staff API, HTML, URL, browser output, log, or error.

## 2. Clean migration, Phase 8 upgrade, and replay

Apply migrations to a clean database, upgrade a completed Phase 8 database containing confirmed and cancelled Appointments, and deploy migrations again.

**Success:** IDs, relationships, booking data, statuses, `cancelledAt`, and original timestamps are unchanged; one `SYSTEM` snapshot event exists per prior Appointment; no snapshot is duplicated; seeds create no Appointment/event; Prisma diff and schema checks pass; and the manual partial index is documented and preserved.

## 3. Database lifecycle and active-slot invariants

Exercise SQLite directly for every status, cancellation source/reason combination, timestamp rule, and slot-history case.

**Success:** one pending or one confirmed Appointment per slot succeeds; any second active Appointment is rejected; multiple cancelled histories may share a slot; cancelling permits one new active booking; invalid values are rejected where practical; and the partial unique index—not application logic alone—protects active occupancy.

## 4. Queue defaults, filters, ordering, and empty results

With controlled time and varied records, exercise no filters and every approved filter separately and together.

**Success:** default output contains only future pending and confirmed Appointments; explicit cancelled filtering works; Agent, Therapy, inclusive `from`, and exclusive `to` behave exactly; ordering is `startsAt ASC`, then ID; valid no-match queries return `[]`; and unknown Agent/Therapy IDs follow existing API convention.

## 5. Queue validation and safe responses

Exercise malformed UUIDs/timestamps, unknown parameters, invalid status, repetitions, conflicts, reversed/equal ranges, excessive ranges, and simulated server failures.

**Success:** invalid input receives a safe `400`; safe `500` responses and logs expose no personal, query, database, stack, or internal details; and successful DTOs contain only approved operational fields.

## 6. Confirmation correctness, idempotency, and rollback

Confirm future pending, repeated confirmed, cancelled, past, current-boundary, unknown, and failure-injected Appointments.

**Success:** future `PENDING -> CONFIRMED` returns `200`; replay returns the same safe result; ineligible operations return `409`, unknown returns safe `404`; exactly one event is created; transaction failure changes neither status nor events; the dashboard shows the confirmed Appointment; and the slot remains unavailable.

## 7. Staff cancellation correctness and controlled reasons

Cancel future pending and confirmed Appointments, including inside the Agent cutoff; test at/after start, all approved reasons, missing/unknown/free-text reasons, replay, and injected failures.

**Success:** eligible cancellation returns `200` and atomically records immutable UTC `cancelledAt`, `STAFF` source, approved reason, and one event; invalid input is rejected; at/after start returns `409`; replay changes nothing; rollback is complete; eligible availability returns; and past or administratively unavailable slots remain unavailable.

## 8. Agent cancellation regression

Exercise the exact 24-hour boundary, inside-cutoff rejection, ownership privacy, replay, and failure behavior.

**Success:** Phase 8 behavior remains unchanged except successful first cancellation also records `AGENT` source, null reason, and one event; replay creates no event or timestamp change; and no privacy regression occurs.

## 9. Booking and availability regression

Book normally, replay idempotently, race booking attempts, cancel and rebook, and inspect confirmation content.

**Success:** new booking is `PENDING`, creates one `VISITOR` event, uses pending-request wording, blocks immediately, remains idempotent, produces one concurrent winner, leaks no personal data, sends no notification, and allows one later active booking after eligible cancellation.

## 10. Agent dashboard consistency

Observe pending, confirmed, and staff-cancelled Appointments through the Agent dashboard.

**Success:** pending remains hidden, staff confirmation makes it appear immediately, staff cancellation removes it immediately, only upcoming confirmed appointments display, and no pending/history tab exists.

## 11. Queue UI states and filter behavior

Use focused UI and browser tests for the default queue, every filter, combined filters, URL refresh, clear action, loading, empty, filtered-empty, success, conflict, stale, not-found, and retryable failure.

**Success:** state and recovery are distinct and understandable, URL filters are stable, only approved information renders, centralized timezone formatting is used, and the unauthenticated-demo notice remains visible.

## 12. Staff actions, accessibility, and responsive layout

Complete confirm and cancel by keyboard with explicit confirmation, controlled reason selection, pending-submit protection, success announcement, conflict/retry recovery, and focus return.

**Success:** controls and feedback meet WCAG 2.2 AA; no serious or critical axe violation exists; 320px/400%-zoom-equivalent and 1440px layouts retain all function without horizontal overflow; and no personal data appears in browser artifacts.

## 13. Concurrency convergence

Using real database-backed operations, race confirm/confirm, cancel/cancel, confirm/cancel, and booking against staff cancellation that restores a slot.

**Success:** each race reaches exactly one valid final state with no duplicate event or partial transaction, response semantics remain safe, and the database active-slot invariant stays intact.

## 14. Cross-view critical browser journey

In the established Playwright environment, filter the staff queue, confirm a pending request, observe it on the Agent dashboard, cancel an eligible appointment with a reason, observe removal and restored availability, and verify booking behavior.

**Success:** staff queue, Agent dashboard, availability, and booking immediately converge on authoritative state with correct focus, announcements, responsive behavior, privacy, and safe errors.

## 15. Phase 2–8 regressions and later-scope absence

Run all existing persistence, API, UI, browser, accessibility, timezone, controlled-clock, booking, idempotency, concurrency, privacy, availability, rebooking, and Agent-dashboard tests. Inspect source and routes for excluded features.

**Success:** every Phase 2–8 guarantee passes and no authentication, history UI, search, sorting controls, pagination, saved filters, bulk action, reporting, metric, export, analytic, notification, rescheduling, or later feature exists.

## 16. Repository quality and final review

Using Node 24.19.0 and the previously successful Playwright environment, run Prisma generation, formatting, linting, strict type checking, root validation tests, production builds, smoke tests, the complete Playwright suite, migration/schema checks, and `git diff --check`.

**Success:** every command passes locally where supported and in CI; required environmental limitations are reported as blocked; and the diff contains no database, generated client, build output, coverage, browser artifact, temporary file, secret, log, roadmap completion edit, or unrelated change.

## Merge checklist

- [ ] Phase 9 scope and unauthenticated demonstration boundary are exact and visible.
- [ ] No prohibited personal or internal information leaks through any surface.
- [ ] Clean, Phase 8 upgrade, replay, snapshot, seed, diff, and schema checks pass.
- [ ] Status, cancellation metadata, event, timestamp, and active-slot constraints pass at database level.
- [ ] Queue defaults, filters, combinations, ordering, empty, validation, privacy, and safe errors pass.
- [ ] Confirmation is future-only, transactional, idempotent, convergent, and creates one event.
- [ ] Staff cancellation validates controlled reasons, is transactional and idempotent, and restores only eligible capacity.
- [ ] Agent cancellation preserves its cutoff and privacy while recording source and one event.
- [ ] New pending booking preserves idempotency, concurrency, privacy, and immediate slot blocking.
- [ ] Agent dashboard, availability, booking, and queue update consistently.
- [ ] Queue states, URL filters, explicit actions, duplicate-submit protection, focus, and recovery pass.
- [ ] Keyboard, axe, 320px/400%-zoom-equivalent, 1440px, and overflow checks pass.
- [ ] All four concurrency races converge without duplicate events or partial state.
- [ ] All Phase 2–8 regressions pass and no Phase 10 or later scope exists.
- [ ] Prisma generation, format, lint, type checking, tests, builds, smoke, Playwright, migration/schema checks, and `git diff --check` pass.
- [ ] Environmental limitations are reported as blocked, never passed.
