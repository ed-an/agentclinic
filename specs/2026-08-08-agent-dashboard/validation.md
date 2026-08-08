# Agent Dashboard — Validation

## Merge standard

This feature can be merged only when every required check passes on the feature branch and in CI. A failed check blocks merge. An environmental limitation must be reported as blocked with available evidence; it must not be skipped silently or counted as passing. Do not use `sudo` to bypass a limitation.

## 1. Scope and security-boundary review

Inspect schema, migrations, configuration, APIs, DTOs, services, routes, pages, controls, logs, tests, dependencies, and the complete diff.

Confirm that:

1. only the Phase 8 Agent dashboard and cancellation capability was added;
2. route-based Agent selection is clearly documented as a temporary demo mechanism, not authentication or authorization;
3. no cookie, local storage, password, session, API key, impersonation token, placeholder authentication, or production-security claim exists;
4. no visitor data is exposed; and
5. no history page, rescheduling, restore, notification, schedule management, staff UI, bulk action, fee, reason, extra audit infrastructure, or later-phase feature exists.

**Success:** the implementation is exactly the smallest honest Phase 8 slice.

## 2. Configuration and temporal boundaries

With the controlled server clock, validate the documented cancellation-cutoff configuration.

Confirm that:

1. the default is 24 hours;
2. a documented valid override is honored;
3. malformed, nonnumeric, nonfinite, negative, ambiguous, and unsupported values fail startup validation;
4. browser time never determines eligibility;
5. cancellation more than 24 hours before `startsAt` succeeds;
6. cancellation exactly at `now + 24 hours` succeeds;
7. cancellation inside that boundary returns `409`; and
8. cancellation at or after `startsAt` returns `409`.

**Success:** configuration is safe and every time boundary is deterministic and exact.

## 3. Migration compatibility and preservation

Using isolated SQLite databases:

1. generate Prisma with Node 24.19.0;
2. apply all migrations to a clean database;
3. prepare a completed Phase 7 database containing confirmed Appointments;
4. upgrade it through Phase 8;
5. verify all Phase 2–7 IDs, values, timestamps, records, and relationships remain unchanged;
6. verify existing Appointments remain `CONFIRMED` with `cancelledAt = null`;
7. confirm no status is altered by migration or seed; and
8. redeploy migrations and confirm a no-op.

**Success:** clean and upgrade paths converge without data loss, status drift, or migration replay.

## 4. Database status, timestamp, and active uniqueness rules

Exercise SQLite directly and inspect schema/index metadata.

Confirm that:

1. only `CONFIRMED` and `CANCELLED` statuses are accepted;
2. `cancelledAt` is nullable;
3. confirmed rows use null `cancelledAt` and successful cancellation records UTC time;
4. at most one `CONFIRMED` Appointment can reference a slot;
5. multiple `CANCELLED` Appointments can reference one slot;
6. a slot with cancelled history can receive one new `CONFIRMED` Appointment;
7. a second active booking remains blocked at database level; and
8. foreign keys and necessary relations remain enforced.

**Success:** SQLite preserves lifecycle history and remains the final active-booking concurrency safeguard.

## 5. Seed stability

Run the documented seed twice against an isolated migrated database and compare complete established state.

**Success:** all Phase 2–7 seed data remains deterministic, no Appointment is created, and no status or relation changes.

## 6. Upcoming dashboard query

Using a controlled clock and records spanning Agents, statuses, and times, call `GET /agents/:agentId/appointments/upcoming`.

Confirm that:

1. only future `CONFIRMED` appointments belonging to the selected Agent are returned;
2. past, exact-now, cancelled, and other Agents' appointments are excluded;
3. ordering is `startsAt ASC`, then Appointment `id ASC`;
4. a known Agent with no upcoming appointments returns `[]`;
5. malformed Agent ID returns `400`;
6. unknown Agent returns `404`; and
7. timestamps are UTC ISO values with the configured display timezone.

**Success:** the endpoint provides the exact deterministic Phase 8 dashboard collection.

## 7. Dashboard response privacy and safe failures

Inspect success, empty, `400`, `404`, and simulated `500` responses and logs.

Confirm that only appointment reference, Therapy ID/name, slot start/end, duration, status, cancellation eligibility, deadline, and display timezone are exposed. Confirm `visitorName`, `visitorEmail`, `idempotencyKey`, raw relations, database details, stack traces, secrets, and internal fields are absent.

**Success:** dashboard APIs remain operationally useful and non-personal in every state.

## 8. Successful cancellation and persistence

Cancel a matching eligible confirmed Appointment.

Confirm that:

1. the first request returns `200`;
2. status changes to `CANCELLED`;
3. `cancelledAt` is set to the controlled current UTC time;
4. `createdAt`, booking data, IDs, and relations remain unchanged;
5. the response is a safe approved cancellation DTO; and
6. the Appointment disappears from the upcoming query immediately.

**Success:** one eligible cancellation creates one durable, historical, safely represented transition.

## 9. Idempotent and concurrent cancellation

Repeat and race cancellation requests against the same eligible Appointment using real database-backed operations.

Confirm that:

1. every replay returns `200` with the same safe `CANCELLED` result;
2. `cancelledAt` never changes after the first transition;
3. simultaneous requests produce exactly one state transition;
4. all equivalent successful/replay responses agree; and
5. no raw uniqueness, transaction, or database information leaks.

**Success:** retries and races converge on one immutable cancelled state.

## 10. Cancellation identifiers, ownership, and conflicts

Exercise separate requests for malformed IDs, unknown resources, mismatched ownership, cutoff conflict, and nonfuture slots.

Confirm that:

1. malformed Agent or Appointment ID returns `400`;
2. unknown Appointment returns safe `404`;
3. Agent/Appointment mismatch returns the same non-revealing `404` shape;
4. the response does not reveal that an Appointment belongs to another Agent;
5. a confirmed appointment inside the cutoff returns `409`;
6. a confirmed appointment at or after `startsAt` returns `409`; and
7. every rejected request preserves status and `cancelledAt`.

**Success:** invalid, mismatched, and ineligible requests fail safely without mutation or ownership disclosure.

## 11. Transaction rollback

Simulate failures before the conditional update, during persistence, and before commit.

Confirm that:

1. status remains `CONFIRMED`;
2. `cancelledAt` remains null;
3. no other Appointment or slot state changes;
4. a later valid retry succeeds; and
5. errors and logs contain no personal or database information.

**Success:** a cancellation either commits completely or leaves no partial state.

## 12. Availability restoration

Capture availability before booking, after booking, and after cancellation.

Confirm that:

1. a confirmed booking removes the slot;
2. cancelling restores it when administratively available and future;
3. a cancelled Appointment alone never blocks it;
4. an administratively unavailable slot remains unavailable after cancellation;
5. a past slot remains unavailable after cancellation; and
6. other slots retain their deterministic behavior.

**Success:** active occupancy, administrative availability, and time eligibility remain distinct and correct.

## 13. Rebooking and concurrent active uniqueness

Rebook a restored slot and run concurrent rebooking attempts.

Confirm that:

1. rebooking creates a new `CONFIRMED` Appointment;
2. cancelled history remains unchanged and queryable in persistence;
3. availability excludes the slot again;
4. concurrent attempts permit exactly one active winner;
5. the loser receives the established safe booking conflict; and
6. the database, not only application logic, blocks a second active row.

**Success:** released capacity can be used again without losing history or weakening double-booking protection.

## 14. Agent selection and dashboard UI states

Use focused UI and API-client tests to confirm:

1. `/agents` provides meaningful dashboard navigation;
2. `/agents/[id]/dashboard` uses route identity and authoritative Agent data;
3. the temporary demo-selection notice is clear and visible;
4. only upcoming appointments render;
5. local date, time, duration, timezone, deadline, status, and eligibility are understandable;
6. the empty dashboard is useful;
7. loading, not-found, and retryable errors are distinct; and
8. no private visitor field renders.

**Success:** the dashboard communicates identity, state, time, and recovery without pretending to authenticate the Agent.

## 15. Cancellation interaction and state recovery

Use focused UI and browser tests to confirm:

1. eligible and ineligible actions are visibly distinct;
2. explicit confirmation names the Therapy and appointment time;
3. pending submission disables repeated action;
4. success feedback is announced and the item disappears immediately;
5. cancelling the final item reveals the empty state;
6. cutoff conflict explains that the state changed and offers recovery;
7. stale state refreshes or reconciles safely;
8. retryable failure preserves a valid retry path; and
9. dialog Escape and focus return work when a dialog is used, or equivalent focus behavior works for an inline pattern.

**Success:** users can cancel deliberately and always understand success, conflict, stale data, or failure.

## 16. Critical browser journey, accessibility, and responsiveness

Using the previously successful Playwright environment, complete by keyboard: choose an Agent, open the dashboard, inspect an appointment, confirm cancellation, observe success and removal, and verify restored availability.

Also confirm:

1. correct focus management and status announcements;
2. semantic list, time, action, confirmation, and feedback markup;
3. no serious or critical axe violations;
4. usable layouts at 320px/400%-zoom-equivalent and 1440px;
5. no horizontal overflow or lost action; and
6. loading, empty, conflict, stale, not-found, and safe error states are covered where browser-observable.

**Success:** the complete Phase 8 journey is keyboard-accessible, responsive, understandable, and WCAG 2.2 AA compliant.

## 17. Privacy and server-only persistence boundaries

Inspect imports, dependencies, network traffic, HTML, URLs, logs, console output, screenshots, traces, errors, build output, and source-boundary tests.

Confirm that:

1. Prisma, SQLite, transactions, and generated clients remain inside NestJS;
2. the web consumes only HTTP APIs;
3. visitor name, visitor email, and idempotency key appear nowhere in Phase 8 outputs;
4. errors reveal no ownership, query, database path, Prisma detail, secret, or stack; and
5. no authentication-like browser state was introduced.

**Success:** server ownership and Phase 7 privacy guarantees remain intact.

## 18. Phase 2–7 regressions and later-scope absence

Run all established persistence, Agent, Ailment, Therapy, availability, clock, timezone, booking, idempotency, concurrency, confirmation, privacy, accessibility, smoke, and browser validation.

Confirm booked-slot exclusion uses active-only uniqueness correctly and inspect source/routes for absence of authentication, staff queues, history UI, rescheduling, restoration, notifications, Agent schedules, reasons, fees, bulk cancellation, and other later-phase behavior.

**Success:** every Phase 2–7 guarantee passes and nothing beyond Phase 8 was introduced.

## 19. Repository quality and final review

With Node 24.19.0 and the previously successful Playwright environment, run:

1. Prisma client generation;
2. formatting verification;
3. linting;
4. strict TypeScript checking;
5. unit, focused, integration, and root validation tests;
6. production builds;
7. runtime smoke tests;
8. the complete Playwright suite; and
9. `git diff --check`.

Review requirements, mission, technical constitution, complete diff, and repository status.

**Success:** every command passes locally where supported and in CI, no required check is skipped, environmental limitations are reported as blocked, and no database, generated client, build output, coverage, Playwright artifact, temporary file, secret, log, roadmap completion edit, or unrelated change remains.

## Merge checklist

- [ ] Scope and temporary demo-selection security boundary are exact and honest.
- [ ] The validated cancellation cutoff defaults to 24 hours and boundary tests pass.
- [ ] Clean and completed Phase 7 databases migrate safely and redeploy as a no-op.
- [ ] `CONFIRMED`, `CANCELLED`, nullable `cancelledAt`, relations, and active-only uniqueness pass at the database level.
- [ ] Seeds remain deterministic and create no Appointments.
- [ ] Upcoming API filtering, ordering, empty, malformed, unknown, privacy, and safe-error behavior pass.
- [ ] Eligible cancellation changes status and sets `cancelledAt` once.
- [ ] Repeated and concurrent cancellation is idempotent and consistent.
- [ ] Cutoff, current/past, malformed, unknown, and ownership-mismatch failures are correct and non-revealing.
- [ ] Transaction failures roll back both status and `cancelledAt`.
- [ ] Cancellation restores only administratively available future slots.
- [ ] Rebooking preserves cancelled history and concurrent active uniqueness.
- [ ] Agent navigation, dashboard, empty, loading, not-found, and error states pass.
- [ ] Confirmation, pending, success, conflict, stale-state, retry, keyboard, and focus behavior pass.
- [ ] 320px/400%-zoom-equivalent and 1440px layouts, overflow, and axe checks pass.
- [ ] No personal data leaks and Prisma/SQLite remain server-only.
- [ ] All Phase 2–7 regressions pass and no later-phase behavior exists.
- [ ] Prisma generation, formatting, linting, type checking, validation tests, builds, smoke, Playwright, and `git diff --check` pass.
- [ ] Environmental limitations are reported as blocked, never passed.
- [ ] Requirements, mission, technical constitution, scope, and complete-diff reviews pass.
