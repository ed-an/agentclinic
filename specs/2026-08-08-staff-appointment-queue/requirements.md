# Staff Appointment Queue — Requirements

## Context

This feature delivers Phase 9, **Staff appointment queue**, from [the roadmap](../roadmap.md). Phase 8 established confirmed and cancelled appointment lifecycle behavior, Agent cancellation, active-slot database protection, and the upcoming Agent dashboard. Phase 9 adds a temporary demonstration-only staff workflow for reviewing pending requests and confirming or cancelling appointments while keeping staff, Agent, availability, and booking views consistent.

The work supports [the mission](../mission.md) by giving clinic staff an accurate, understandable coordination workflow without exposing unnecessary Agent information. It follows [the technical constitution](../tech-stack.md): NestJS owns validation, time and transition rules, transactions, persistence, and response shaping; SQLite remains the final double-booking safeguard; Next.js consumes the versioned HTTP API; UTC is authoritative; and critical staff management behavior receives browser coverage.

## Goal

Provide one reliable staff queue journey in which:

- staff can view and filter appointments at `/staff/appointments`;
- new visitor bookings enter `PENDING` and immediately block their slot;
- staff can confirm future pending appointments or cancel future pending or confirmed appointments;
- state changes are transactional, idempotent, auditable, and immediately consistent across the queue, Agent dashboard, availability, and booking behavior; and
- migration, privacy, accessibility, concurrency, regression, and browser evidence proves merge readiness.

## Decisions

1. Appointment statuses are `PENDING`, `CONFIRMED`, and terminal `CANCELLED`.
2. New bookings start as `PENDING`; migration preserves every existing `CONFIRMED` or `CANCELLED` status.
3. `PENDING` and `CONFIRMED` are active and block their AvailabilitySlot. `CANCELLED` does not block availability.
4. The database permits at most one active Appointment per slot and multiple cancelled historical Appointments. A SQLite partial unique index covering `PENDING` and `CONFIRMED` is the final safeguard.
5. The default queue contains upcoming `PENDING` and `CONFIRMED` Appointments ordered by slot `startsAt ASC`, then Appointment `id ASC`.
6. The only filters are status, Agent, Therapy, and an inclusive `from`/exclusive `to` slot-time range.
7. Staff may see only Appointment reference, status, Agent ID/name, Therapy ID/name, slot start/end, duration, configured display timezone, `createdAt`, latest status-change time, and whether confirmation or cancellation is allowed.
8. `visitorName` and `visitorEmail` must not appear in the staff API, rendered HTML, URLs, browser output, logs, or errors. Responses also exclude `idempotencyKey`, raw relations, and internal fields.
9. `/staff/appointments` is an unauthenticated demonstration route and must display a clear production-unsuitability notice. Phase 9 adds no authentication, authorization, accounts, roles, sessions, credentials, permissions, or staff identity selector.
10. Preferred endpoints are `GET /staff/appointments`, `POST /staff/appointments/:appointmentId/confirm`, and `POST /staff/appointments/:appointmentId/cancel`.
11. Queue input is strictly validated: unknown parameters, malformed UUIDs/timestamps, invalid or conflicting repetitions, invalid ranges, and ranges above the established maximum are rejected safely.
12. Confirmation allows future `PENDING -> CONFIRMED`. Repeating confirmation of `CONFIRMED` returns the same safe result with `200`; cancelled, past, or otherwise ineligible confirmation returns `409`.
13. Staff cancellation allows future `PENDING -> CANCELLED` and `CONFIRMED -> CANCELLED`, including inside the Agent 24-hour cutoff but never at or after `startsAt`. Repeating cancellation returns the same safe result with `200`.
14. Staff cancellation requires one controlled reason code: `STAFF_UNAVAILABLE`, `SCHEDULE_CHANGE`, `DUPLICATE_BOOKING`, or `OTHER_OPERATIONAL`. Free text is prohibited.
15. Store UTC `cancelledAt`, `cancellationSource` (`AGENT` or `STAFF`), and `cancellationReasonCode`; the reason is required for staff cancellation and null for Agent cancellation.
16. Existing Agent cancellation keeps its 24-hour cutoff and records `cancellationSource = AGENT` without a reason.
17. Append-only AppointmentStatusEvent records contain ID, Appointment ID, nullable prior status, resulting status, actor type (`VISITOR`, `AGENT`, `STAFF`, or `SYSTEM`), nullable reason code, and UTC `createdAt`.
18. New bookings create an initial `PENDING`/`VISITOR` event. Staff and Agent transitions create one corresponding event. Migration creates exactly one `SYSTEM` snapshot per existing Appointment without changing its status or original timestamps.
19. Rejected and idempotent replay operations create no duplicate status event. Complete history is not exposed in Phase 9; the queue may show only the latest event timestamp.
20. Every transition uses the controlled server clock, conditional updates, and a transaction. Database constraints remain the final concurrency safeguard.
21. The centralized IANA timezone formatter handles display. Prisma and SQLite remain exclusive to NestJS.

## Functional requirements

### Persistence and migration

- Add `PENDING` without altering existing Appointment IDs, relationships, booking data, timestamps, `CONFIRMED`/`CANCELLED` statuses, or `cancelledAt` values.
- Add and database-enforce valid cancellation source/reason combinations where practical.
- Add the append-only AppointmentStatusEvent relation and indexes justified by queue and latest-event reads.
- Create one `SYSTEM` snapshot event per preexisting Appointment, using the original status and timestamp convention without changing Appointment data.
- Replace the Phase 8 partial unique index with a documented manually managed SQLite index applying when status is `PENDING` or `CONFIRMED`.
- Preserve foreign keys and make migrations work from clean state, a completed Phase 8 database, and repeated no-op deployment.
- Keep seeds deterministic and create no Appointment or status event.

### Staff queue API

- `GET /staff/appointments` accepts only `status`, `agentId`, `therapyId`, `from`, and `to` according to existing query conventions.
- Status accepts the approved repeatable or comma-separated convention and only the three Appointment statuses.
- `from` is an inclusive ISO 8601 instant; `to` is exclusive; `from` must precede `to`; the established maximum range applies.
- UUIDs and timestamps receive strict boundary validation, and unknown or malformed parameters return safe `400` responses.
- Apply Agent, Therapy, status, and range filters separately or together. Follow existing API behavior for valid but unknown Agent or Therapy IDs.
- With no filters, return only appointments with active status and `startsAt` later than controlled current time.
- Explicit `CANCELLED` filtering returns matching cancelled records, including records outside the default active set when otherwise within supplied filters.
- Sort deterministically by `startsAt ASC`, then Appointment `id ASC`; return `[]` for a valid empty result.
- Derive action eligibility from authoritative status and server time and expose only approved operational fields.
- Safe failures and logging reveal no personal data, database detail, raw query, stack, or internal field.

### Confirmation

- `POST /staff/appointments/:appointmentId/confirm` strictly validates the UUID and returns a safe `404` for an unknown Appointment.
- Only a future `PENDING` Appointment transitions to `CONFIRMED`.
- The first confirmation and a replay against the resulting `CONFIRMED` Appointment return equivalent safe results with `200`.
- A `CANCELLED`, past, current-boundary, or otherwise ineligible Appointment returns `409` without mutation.
- Perform the conditional status update and one `PENDING -> CONFIRMED`/`STAFF` event in one transaction.
- Concurrent confirmation requests converge on one transition and one event. Failure rolls back both status and event.
- Confirmation keeps the slot unavailable and makes the Appointment immediately visible on the Agent dashboard.

### Staff cancellation

- `POST /staff/appointments/:appointmentId/cancel` strictly validates the UUID and controlled reason-code body.
- Reject missing, unknown, malformed, additional, or free-text reason input safely.
- A future `PENDING` or `CONFIRMED` Appointment may transition to `CANCELLED`, even inside the Agent cutoff; at or after `startsAt` returns `409`.
- The first cancellation records controlled UTC `cancelledAt`, `cancellationSource = STAFF`, the approved reason, and exactly one status event in one transaction.
- A replay returns the same safe cancelled result with `200` without changing stored values or adding events.
- Concurrent cancellations converge on one transition. Failure rolls back every change.
- Cancellation restores a slot only when it remains administratively available and future; past or administratively unavailable slots remain unavailable.

### Agent cancellation regression

- Preserve the established 24-hour boundary, ownership privacy, safe errors, and idempotent response behavior.
- On first successful Agent cancellation, record `cancellationSource = AGENT`, null reason, and one `CONFIRMED -> CANCELLED`/`AGENT` event transactionally.
- Replays add no event and do not change `cancelledAt`.

### Booking and availability

- New bookings create `PENDING` Appointments and one initial `PENDING`/`VISITOR` event transactionally.
- Confirmation UI copy says the request was received and awaits staff confirmation; no email or notification is sent.
- Preserve booking idempotency, privacy, rollback, and concurrent-one-winner guarantees.
- Availability and booking checks exclude a slot with either a `PENDING` or `CONFIRMED` Appointment.
- A pending booking blocks the slot immediately. Cancellation permits one later active booking when the slot is otherwise eligible.

### Agent dashboard consistency

- Continue showing only upcoming `CONFIRMED` Appointments.
- A pending Appointment remains hidden until staff confirmation; confirmation makes it appear immediately.
- Staff cancellation removes a confirmed Appointment immediately.
- Do not add pending or history tabs.

### Staff queue experience

- Render `/staff/appointments` with a visible notice that access is unauthenticated demonstration behavior and unsuitable for production.
- Represent every approved filter in the URL, preserve filters on refresh, and provide a clear-filter action.
- Show only approved operational data and centrally formatted local times with the configured timezone.
- Provide distinct loading, default-empty, filtered-empty, success, conflict, stale, not-found, and safe retryable-error states.
- Require explicit confirmation before confirm; require explicit confirmation and a controlled reason selection before cancel.
- Prevent duplicate submission, announce outcomes, manage focus correctly, and refresh or reconcile the queue immediately.
- Make staff changes immediately observable in Agent dashboard, availability, and booking behavior.

## Quality requirements

- Use strict TypeScript, thin NestJS controllers, application services, explicit repositories, boundary DTO validation, explicit Prisma transactions, and server-rendered Next.js pages except where interaction requires client state.
- Meet WCAG 2.2 AA with keyboard-only operation, meaningful focus placement/return, status announcements, and no serious or critical axe violations.
- Reflow at 320 CSS pixels/400%-zoom-equivalent through 1440px without horizontal overflow or lost function.
- Add focused tests for migration, database constraints, DTO privacy, query validation, ordering, temporal boundaries, transitions, status events, rollback, idempotency, concurrency, restored availability, and regressions.
- Add Playwright coverage for the critical staff management journey and immediate cross-view consistency.
- Use Node 24.19.0 and the previously successful Playwright environment. Environmental limitations are blocked, never passed; do not use `sudo` or silently skip required checks.

## Out of scope

- Authentication, authorization, staff accounts, roles, permissions, login, sessions, credentials, or identity selectors.
- Visitor name or email exposure in staff surfaces.
- Free-text search, sorting controls, pagination, saved filters, bulk actions, past-appointment reporting, metrics, exports, or analytics.
- Complete status-history APIs or pages, pending/history Agent dashboard tabs, notification or email delivery, rescheduling, reminders, catalog editing, or later roadmap work.

## Completion outcome

Staff can use a clearly labelled demonstration queue to filter operational appointment data and safely confirm or cancel eligible appointments. New bookings remain pending until confirmed, active-slot uniqueness covers pending and confirmed records, lifecycle events are append-only and non-personal, all views update consistently, and every required migration, API, UI, accessibility, privacy, concurrency, browser, and Phase 2–8 regression check passes.
