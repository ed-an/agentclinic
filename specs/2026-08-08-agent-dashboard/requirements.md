# Agent Dashboard — Requirements

## Context

This feature delivers Phase 8, **Agent dashboard**, from [the roadmap](../roadmap.md). Phase 7 established private, transactional appointment booking and confirmed-slot exclusion. Phase 8 gives a deliberately selected demo Agent a focused view of upcoming appointments and permits eligible cancellations while retaining history and safely returning cancelled slots to availability.

The work supports [the mission](../mission.md) by making appointment state and the next action clear, kind, reliable, and accessible. It follows [the technical constitution](../tech-stack.md): NestJS owns validation, time rules, transactions, persistence, and safe response shaping; SQLite remains the final concurrency safeguard through Prisma migrations; Next.js consumes HTTP APIs; UTC is authoritative; and the critical dashboard and cancellation journey receives browser coverage.

## Goal

Provide one reliable dashboard journey in which:

- `/agents` can lead to an explicitly selected Agent's dashboard;
- the dashboard shows only that Agent's future `CONFIRMED` appointments;
- eligible appointments can be cancelled explicitly and idempotently;
- cancellation preserves history and immediately restores qualifying slot availability; and
- persistence, API, UI, privacy, accessibility, concurrency, and regression evidence proves merge readiness.

## Decisions

1. Implement exactly Phase 8: an Agent dashboard, upcoming appointments, and eligible cancellation.
2. Appointment statuses are `CONFIRMED` and `CANCELLED`.
3. An upcoming appointment is `CONFIRMED` and has a slot whose `startsAt` is later than the controlled server time.
4. Cancellation is eligible only when the Appointment belongs to the route Agent, remains `CONFIRMED`, its slot is future, and cancellation occurs at least the configured cutoff before `startsAt`.
5. The cutoff is validated server configuration with a documented 24-hour default. The exact `now + 24 hours` boundary is eligible; any appointment starting sooner is ineligible.
6. First eligible cancellation changes status to `CANCELLED`, records `cancelledAt` once using the controlled UTC clock, and returns `200`.
7. Repeating cancellation returns the same safe cancelled result with `200` and never changes `cancelledAt`.
8. Concurrent cancellation requests produce one transition and equivalent safe results.
9. A confirmed but ineligible appointment returns `409`. Unknown appointments and Agent/Appointment mismatches return the same non-revealing `404`.
10. Cancelled Appointment records retain all booking data, `createdAt`, and relationships. No cancellation reason is collected.
11. Replace absolute slot uniqueness with a database-enforced rule allowing at most one `CONFIRMED` Appointment per AvailabilitySlot while permitting multiple historical `CANCELLED` Appointments. Prefer a SQLite partial unique index compatible with committed Prisma migrations.
12. Change the Prisma AvailabilitySlot–Appointment relation only as much as needed to retain cancelled history and permit a later confirmed booking.
13. Availability excludes slots only when an active `CONFIRMED` Appointment exists. Cancellation restores a slot only when it is also administratively available and future.
14. Use `GET /agents/:agentId/appointments/upcoming` and `POST /agents/:agentId/appointments/:appointmentId/cancel`.
15. The route Agent ID is a temporary demo selection mechanism, not authentication or authorization. Do not add cookies, local storage, passwords, sessions, API keys, impersonation tokens, or placeholder authentication.
16. Dashboard and cancellation representations expose only appointment reference, Therapy ID/name, UTC slot start/end, duration, status, cancellation eligibility, cancellation deadline, and configured display timezone.
17. Do not expose `visitorName`, `visitorEmail`, `idempotencyKey`, raw relations, or internal fields in APIs, HTML, URLs, logs, console output, or errors.
18. Store and return timestamps as UTC ISO 8601 and display them with the centralized IANA formatter using the established `America/Sao_Paulo` default.
19. Keep Prisma and SQLite exclusive to NestJS and preserve all Phase 2–7 behavior.

## Functional requirements

### Configuration and controlled time

- Add one server configuration value for the cancellation cutoff, measured in hours or an equally explicit duration unit.
- Default the cutoff to 24 hours and document the environment variable, unit, accepted range, and default.
- Validate configuration at startup; reject missing-invalid, nonnumeric, nonfinite, negative, ambiguous, or unsupported values rather than silently coercing them.
- Compute eligibility and the cancellation deadline from the Phase 6 controlled server clock, never browser time.
- Treat `startsAt - now >= cutoff` as eligible, provided the slot is future and every other condition holds.
- Return UTC ISO timestamps and the centralized configured display timezone.

### Appointment persistence and migration

- Add `CANCELLED` to the database-enforced Appointment status set and add nullable `cancelledAt`.
- Preserve every Phase 7 Appointment field, value, relationship, ID, and `createdAt` during migration.
- Keep existing confirmed appointments `CONFIRMED` with `cancelledAt = null`; migration and seeds must not change any status.
- Replace one-to-one slot ownership with the minimum relation that permits cancelled history and a later active booking.
- Remove the absolute unique constraint on `availabilitySlotId` only as part of replacing it with database-level active-only uniqueness.
- Enforce at most one row per slot where status is `CONFIRMED`, preferably with a SQLite partial unique index declared in the migration.
- Permit multiple `CANCELLED` rows for one slot and one later `CONFIRMED` row.
- Preserve foreign keys and add only query-supporting indexes justified by upcoming reads and cancellation.
- Support clean migration, upgrade from a completed Phase 7 database, and repeated no-op deployment.
- Seeds create no Appointments.

### Upcoming dashboard API

- `GET /agents/:agentId/appointments/upcoming` validates the Agent UUID before querying.
- Unknown Agent returns safe `404`; malformed Agent ID returns safe `400`.
- Return only appointments belonging to that Agent whose status is `CONFIRMED` and whose slot starts strictly after controlled current time.
- Exclude past, current-boundary, cancelled, and other Agents' appointments.
- Sort by slot `startsAt ASC`, then Appointment `id ASC`.
- Return `[]` for a known Agent with no upcoming appointments.
- Derive Therapy, time, duration, timezone, cancellation deadline, and current eligibility from authoritative server data.
- Response DTOs contain only the approved operational fields and safe errors leak no personal or database information.

### Transactional cancellation API

- `POST /agents/:agentId/appointments/:appointmentId/cancel` validates both UUID route parameters.
- Verify the route Agent exists and the Appointment belongs to it without revealing another Agent's ownership.
- Unknown Appointment and ownership mismatch return indistinguishable safe `404` responses.
- Return `409` when a matching `CONFIRMED` Appointment is inside the cutoff, at `startsAt`, or past.
- Perform eligibility evaluation and the state change within an explicit transaction using the controlled clock.
- Use a conditional state transition so only `CONFIRMED` can become `CANCELLED` and concurrent requests cannot corrupt status or timestamps.
- Set `cancelledAt` to current UTC exactly once. Never rewrite it during an idempotent replay.
- A first successful cancellation and every replay return an equivalent safe `CANCELLED` result with `200`.
- A transaction or persistence failure rolls back both status and `cancelledAt` and returns a safe retryable error.
- Do not log visitor data, idempotency keys, complete request bodies, raw database errors, or ownership details.

### Availability and rebooking

- Update all availability and booking checks to treat only a related `CONFIRMED` Appointment as active occupancy.
- A cancelled appointment must not by itself exclude its slot.
- After cancellation, an administratively available future slot appears immediately in availability.
- Administrative unavailability and past time continue to exclude a slot after cancellation.
- Rebooking creates a new Appointment and retains cancelled history.
- The database partial uniqueness rule remains the final safeguard under concurrent rebooking; do not reduce protection to an application-only check.
- Preserve Phase 7 idempotency, transaction rollback, confirmation privacy, and booking conflict behavior.

### Dashboard and cancellation experience

- Add a meaningful dashboard link from `/agents` for each selected Agent.
- Render `/agents/[id]/dashboard` from the route ID and authoritative Agent/server data.
- Display a prominent, clear notice that Agent selection is a temporary demonstration mechanism and is not authentication or authorization.
- Show only upcoming appointments, including reference, Therapy name, local date/time, duration, timezone, cancellation deadline, and eligibility state.
- Provide required loading, empty, not-found, and safe retryable error states.
- Use the simplest established accessible inline confirmation section or native dialog associated with the chosen Appointment.
- Require explicit confirmation and name the Therapy and appointment time.
- If a dialog is used, support Escape, initial focus, and focus return; an inline pattern must likewise move and restore focus meaningfully.
- Disable repeated submission while pending.
- On success, announce cancellation and remove the appointment immediately from the upcoming list; if it was the final item, show the empty state.
- Distinguish cutoff conflict, stale state, and retryable failure with safe recovery actions.
- Do not render visitor name, visitor email, idempotency key, or unnecessary personal data.

## Quality requirements

- Use strict TypeScript, established NestJS module/service/repository/DTO/error conventions, explicit Prisma transactions, and server-rendered Next.js pages except where cancellation interaction requires client state.
- Meet WCAG 2.2 AA for navigation, loading, list, empty, confirmation, pending, success, conflict, stale, not-found, and failure states.
- Reflow from 320 CSS pixels through 1440px without horizontal overflow or lost function, including the 400%-zoom-equivalent check.
- Add focused tests for configuration, migration compatibility, database constraints, DTO privacy, ordering, temporal boundaries, ownership, idempotency, rollback, cancellation concurrency, restored availability, and rebooking concurrency.
- Add Playwright coverage for Agent selection, dashboard state, cancellation, immediate update, availability restoration, keyboard use, responsive behavior, recovery states, and axe checks.
- Use Node 24.19.0 and the previously successful Playwright environment.
- Treat environmental limitations as blocked. Do not use `sudo`, silently skip checks, or count failed or unexecuted checks as passing.

## Out of scope

- Authentication, authorization, accounts, roles, sessions, credentials, tokens, or production-secure ownership enforcement.
- Past or cancelled appointment history pages.
- Rescheduling, restoring cancelled appointments, notifications, Agent schedule management, cancellation reasons, fees, bulk cancellation, or visitor self-service cancellation.
- Staff or administrative dashboards, queues, controls, or catalog editing.
- Audit-log infrastructure beyond Appointment timestamps.
- Any later roadmap phase or later-candidate functionality.

## Completion outcome

A deliberately selected demo Agent can open a clear dashboard, see only future confirmed appointments, explicitly cancel an eligible appointment, and immediately see the dashboard and availability reflect the durable cancelled state. The 24-hour default cutoff is server-configured and boundary-correct, cancelled history is preserved, active-slot uniqueness remains database-enforced under concurrency, no visitor data leaks, and all required migration, API, UI, accessibility, browser, and Phase 2–7 regression checks pass.
