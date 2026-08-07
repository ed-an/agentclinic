# Appointment Availability — Requirements

## Context

This feature delivers Phase 6, **Appointment availability**, from [the roadmap](../roadmap.md). Phase 5 established Therapies and their Ailment associations. Phase 6 adds a small persisted schedule that lets an agent see available times for one Therapy, without reserving, booking, or creating an Appointment.

The work supports [the mission](../mission.md) by making the next care step clear and reassuring while keeping clinic information consistent. It follows [the technical constitution](../tech-stack.md): NestJS owns persistence and availability rules, SQLite stores UTC timestamps through Prisma migrations, Next.js consumes the HTTP API, and the experience remains accessible, responsive, deterministic, and easy to demonstrate.

## Goal

Provide read-only Therapy availability in which:

- deterministic persisted slots can migrate and seed without disturbing Phase 2–5 data;
- the server returns only matching available times under strict UTC and range rules;
- an agent can view clearly grouped local times from a Therapy journey; and
- automated persistence, temporal, API, UI, accessibility, architectural, and regression checks prove the slice is merge-ready.

## Decisions

1. Implement exactly Phase 6: persisted read-only availability for Therapies. Do not add booking behavior.
2. `AvailabilitySlot` contains only:
   - `id`: stable UUID;
   - `therapyId`: required Therapy relation;
   - `startsAt`: required UTC timestamp;
   - `durationMinutes`: required positive integer; and
   - `isAvailable`: required boolean.
3. Derive ending time from `startsAt + durationMinutes`; do not persist it.
4. Model one Therapy to many AvailabilitySlots, with each slot belonging to exactly one Therapy.
5. Prevent duplicate slots with a unique constraint on `therapyId` and `startsAt`. Add only concrete Therapy/time/availability query indexes.
6. Persist individual slots. Do not add recurring clinic hours or automatic generation.
7. Store and return timestamps as ISO 8601 UTC instants. UTC remains authoritative for comparisons and ordering.
8. Display times in one application-configured IANA timezone, defaulting to `America/Sao_Paulo`. Display its name or abbreviation clearly; do not infer browser location or add user preferences.
9. Centralize deterministic timezone formatting and local-calendar grouping using web-platform internationalization primitives.
10. Use an injectable current-time provider for server rules and controlled clocks in tests.
11. Seed fixed stable future timestamps within a documented long-lived demo horizon. Never derive seed dates from the runtime date.
12. Expose `GET /therapies/:id/availability` with optional `from` and `to` range parameters.
13. Do not expose `includeUnavailable`: the roadmap requires available times only. Persisted unavailable slots exist for filtering and validation but are never shown as actionable.
14. Prefer showing availability from `/therapies/[id]`; add `/therapies/[id]/availability` only when a separate view is necessary for a clear complete list under existing UI conventions.
15. Keep Prisma and SQLite exclusively inside NestJS and preserve Phase 2–5 behavior and data.

## Functional requirements

### Persistence and seed data

- Add the five approved fields and no speculative slot, booking, capacity, ownership, or recurrence fields.
- Require valid Therapy ownership, a UTC start instant, a positive duration, and explicit availability.
- Enforce referential integrity, unique `(therapyId, startsAt)`, and positive `durationMinutes` at the database boundary.
- Add only indexes justified by filtering a Therapy's slots by availability and start time.
- Create a named migration that upgrades a completed Phase 5 database without rewriting prior migration history or changing Agent, Ailment, Therapy, or association records.
- Support clean migration, Phase 5 upgrade, and repeated no-op deployment.
- Seed a small deterministic set using stable UUIDs, fixed UTC timestamps, positive durations, and explicit flags.
- Repeat-safe writes must prevent duplicate slots or drift and preserve all established records and relationships.
- Seed scenarios must include multiple available slots for one Therapy, a Therapy with no slots, a Therapy with only past or unavailable slots relative to the controlled validation clock, and a slot near a configured local-date boundary.

### Time and configuration

- The server uses an injectable time provider wherever the current instant affects availability.
- Production uses the real current instant; automated tests supply a fixed instant.
- The display timezone comes from validated application configuration and defaults to `America/Sao_Paulo`.
- Invalid IANA configuration fails safely and clearly rather than silently falling back to the machine timezone.
- Formatting functions accept explicit instants and timezones and do not read browser location or machine timezone.
- Local date grouping, visible date/time labels, timezone labels, and derived ending times come from centralized helpers.

### Read-only availability API

- Add `GET /therapies/:id/availability` following existing NestJS module, controller, service, DTO, pipe, and error conventions.
- Validate `:id` as a UUID at the NestJS boundary. A malformed ID returns safe `400`; an unknown valid Therapy returns safe `404`.
- Accept optional scalar `from` and `to` values as strict ISO 8601 timestamps identifying an instant. Normalize output to UTC ISO 8601.
- Reject malformed, ambiguous, date-only, offset-free, or repeated parameter values with safe `400` responses.
- Treat `from` as inclusive and `to` as exclusive.
- When `from` is absent, use the current-time provider as the inclusive lower boundary.
- When `to` is absent, apply no upper boundary unless repository constraints require the documented maximum range to establish one.
- Require `from < to` when both are supplied.
- Select and document one reasonable maximum explicit range. Reject larger ranges with safe `400` rather than truncating them.
- Always require `isAvailable = true`, so past and explicitly unavailable slots are excluded by default and from explicit ranges.
- Return a successful empty list for a known Therapy with no matching slots, including Therapies with no records or only past/unavailable records.
- Return slots ordered by `startsAt ASC`, then `id ASC`.
- Expose only `id`, `therapyId`, `startsAt`, `durationMinutes`, and derived `endsAt`. Do not expose `isAvailable` because every returned record is available, or any internal Prisma field.
- Unexpected failures return safe `500` responses without stack traces, queries, paths, configuration, secrets, or database details.
- No POST, PUT, PATCH, or DELETE availability or booking route is added.

### Therapy availability journey

- Extend `/therapies/[id]` with upcoming availability or a clear link to a complete `/therapies/[id]/availability` view when the latter is justified during convention review.
- Fetch all availability through the NestJS API.
- Display slots grouped by calendar date in the configured IANA timezone.
- Show local date, start time, derived end time or duration, and timezone clearly.
- Use semantic headings, lists, links, and machine-readable `time` elements with UTC `dateTime` values.
- Preserve deterministic API ordering inside local date groups.
- Distinguish no slot records or no matching available slots from loading, validation failure, unknown Therapy, and server failure.
- Provide safe actionable retry behavior and useful navigation where applicable.
- Do not render booking, reserve, select, confirm, capacity, waiting-list, or other action controls.
- Persisted unavailable slots must never be presented as bookable or selectable.

## Quality requirements

- Use strict TypeScript, Prisma migrations, NestJS boundary validation, existing DTO/repository patterns, server-rendered Next.js pages by default, and current status components.
- Use Node 24.19.0 and the previously successful Playwright environment.
- Meet WCAG 2.2 AA for every implemented availability state, including semantic time information, headings, keyboard operation, focus, status communication, and contrast.
- Reflow from 320 CSS pixels through desktop widths without horizontal scrolling or lost functionality, including the existing 400%-zoom-equivalent validation.
- Add focused tests for migrations, constraints, indexes, seeds, preservation, current-time filtering, explicit ranges, strict validation, ordering, DTO fields, safe failures, and route absence.
- Test local-date grouping near midnight and use a DST-observing IANA timezone to prove nonexistent and repeated local clock times cannot corrupt UTC ordering.
- Tests must not depend on the real date, machine timezone, browser geolocation, or mutable seed timestamps.
- Preserve all Phase 2 persistence, Phase 3 Agent, Phase 4 Ailment, and Phase 5 Therapy and association validation.
- Treat environmental limitations as blocked and report them. Do not use `sudo`, silently skip a check, or count an unexecuted or failed check as passing.

## Out of scope

- Appointment records, booking, confirmation, reservation, locking, or double-booking transactions.
- Agent/customer/patient data on slots.
- Authentication, authorization, ownership, or privacy policy changes.
- Cancellation, rescheduling, reminders, notifications, waiting lists, or payments.
- Capacity greater than one.
- Recurring schedules, clinic-hours models, automatic generation, or staff CRUD.
- Mutation endpoints or administrative controls.
- User-selectable or browser-inferred timezones.
- Persisted ending timestamps.
- Availability ranking, recommendations, pagination, advanced filtering, analytics, or unrelated catalog changes.
- Placeholder Appointment or booking data, routes, controls, services, or abstractions.

## Completion outcome

A contributor can migrate a clean or completed Phase 5 database, seed it repeatedly without duplicates or prior-data changes, request one Therapy's deterministically ordered available UTC slots, and view them grouped in the configured local timezone. Past and unavailable slots are consistently excluded, all temporal and error boundaries are tested with a controlled clock, no booking capability exists, and every required repository check passes.
