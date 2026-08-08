# Book an Appointment — Requirements

## Context

This feature delivers Phase 7, **Book an appointment**, from [the roadmap](../roadmap.md). Phase 6 established persisted read-only AvailabilitySlots with controlled UTC rules. Phase 7 adds the first write journey: an unauthenticated visitor selects one eligible slot and an existing Agent, supplies minimal contact information, and receives a safe confirmed booking.

The work supports [the mission](../mission.md) by making care coordination clear and reassuring while preventing ambiguous or duplicate bookings. It follows [the technical constitution](../tech-stack.md): NestJS owns validation, transactions, persistence, idempotency, concurrency and privacy rules; SQLite provides final uniqueness safeguards through Prisma migrations; Next.js consumes HTTP APIs; UTC remains authoritative; and the critical journey receives accessible, responsive browser coverage.

## Goal

Provide one reliable booking journey in which:

- an eligible AvailabilitySlot can create exactly one confirmed Appointment for one selected Agent;
- idempotent retries return the same result while competing bookings cannot double-book;
- Therapy and time information always comes from the authoritative slot;
- visitor data is minimal, normalized, private, and absent from confirmations; and
- persistence, transactional, API, UI, privacy, accessibility, browser, and Phase 2–6 regression evidence proves merge readiness.

## Decisions

1. Implement exactly Phase 7: select one available slot and existing Agent, collect visitor name and email, create one atomic confirmed Appointment, and show safe confirmation.
2. Appointment persists only:
   - `id`: server-generated UUID;
   - `availabilitySlotId`: required and unique relation;
   - `agentId`: required Agent relation;
   - `visitorName`: required normalized name;
   - `visitorEmail`: required normalized email;
   - `status`: required and only `CONFIRMED` in Phase 7;
   - `idempotencyKey`: required unique UUID; and
   - `createdAt`: server-generated UTC timestamp.
3. Do not duplicate Therapy ID, start, duration, ending, or timezone in Appointment. Derive them through AvailabilitySlot.
4. Do not change `AvailabilitySlot.isAvailable` during booking. Administrative availability and booking occupancy remain separate meanings.
5. A slot is discoverable only when administratively available, future under the controlled clock, within the approved range, and unrelated to any Appointment.
6. The unique `availabilitySlotId` constraint is the final concurrency safeguard.
7. Use one database transaction for booking validation and creation. Convert slot or idempotency uniqueness races into safe `409` behavior.
8. `CONFIRMED` is the sole status; do not implement transitions.
9. `POST /appointments` requires approved JSON fields and a UUID `Idempotency-Key` header.
10. First creation returns `201`; same-key, same-normalized-payload replay returns the original confirmation with `200`; same key with a different normalized payload returns `409`.
11. Add `GET /appointments/:id` and `/appointments/[id]` for refresh-safe, non-personal confirmation.
12. Add the smallest read-only slot-context endpoint necessary for `/appointments/book?slotId=<uuid>` to resolve authoritative Therapy and time data directly from the slot ID.
13. Use `/appointments/book?slotId=<uuid>` for the form journey. Ignore and reject any attempt to supply authoritative Therapy, time, duration, or timezone values to booking APIs.
14. Reuse `GET /agents` for the selector; all existing Agents are eligible in this phase.
15. Display with the Phase 6 IANA timezone helper, defaulting to `America/Sao_Paulo`, while persistence and API values remain UTC.
16. Keep Prisma and SQLite exclusive to NestJS and preserve all Phase 2–6 data and behavior.

## Functional requirements

### Appointment persistence

- Add only the approved Appointment fields and the required AvailabilitySlot and Agent relations.
- Generate Appointment UUID and `createdAt` on the server; do not accept them from clients.
- Require one unique Appointment per AvailabilitySlot and one unique Appointment per idempotency key.
- Enforce required foreign keys and `CONFIRMED` status at the SQLite boundary where practical.
- Add only relation indexes justified by the specified booking and confirmation queries.
- Create a named migration that upgrades a completed Phase 6 database without rewriting prior history or changing Agent, Ailment, Therapy, association, or AvailabilitySlot records.
- Support clean migration, Phase 6 upgrade, and repeated no-op deployment.
- Do not create Appointment seed records or alter established deterministic seed output except where reporting the unchanged zero Appointment count is useful.

### Input normalization and privacy

- Accept exactly `availabilitySlotId`, `agentId`, `visitorName`, and `visitorEmail` in the JSON body.
- Reject unknown properties rather than ignoring them.
- Require UUID slot and Agent identifiers.
- Trim visitor name; reject empty or whitespace-only values; apply one documented reasonable maximum.
- Trim and lowercase visitor email; validate a practical email shape; apply one documented reasonable maximum.
- Reject missing, malformed, repeated, or non-UUID `Idempotency-Key` headers.
- Compare idempotent payloads only after normalization.
- Never log visitor name, visitor email, idempotency key, or the complete request body.
- Never include visitor email or visitor name in confirmation APIs or pages.
- Collect no phone, address, health history, symptom, note, password, payment, or other personal field.

### Availability and booking context

- Update Phase 6 availability queries to require no related Appointment in addition to all established administrative, current-time, and range rules.
- Booking must not mutate `isAvailable`.
- A booked slot disappears immediately from default and explicit availability results while other eligible slots remain visible.
- The booking page resolves `slotId` through a direct server-owned booking-context read and obtains Agents through the existing server API.
- Booking context derives Therapy ID/name, UTC start/end, duration, configured display timezone, booking state, and eligibility from server persistence.
- Malformed context identifiers return safe `400`, unknown slots return safe `404`, and unavailable, past, or booked slots return an actionable conflict state.
- The page must not trust Therapy, time, duration, timezone, or Agent details supplied through query parameters.

### Transactional booking

- `POST /appointments` validates body and idempotency header at NestJS boundaries before the service operation.
- Inside one database transaction, validate slot existence, administrative availability, future time through the controlled clock, absence of an Appointment, and Agent existence.
- Create one Appointment only after all validation succeeds.
- Unknown slot returns safe `404`; malformed slot ID returns safe `400`.
- Unknown Agent returns safe `404`; malformed Agent ID returns safe `400`.
- Administratively unavailable, past, or already-booked slots return safe `409`.
- Database uniqueness on `availabilitySlotId` remains authoritative under races; map violations to `409` without raw database data.
- A same-key, same-normalized-payload request returns the existing Appointment and never creates a second row.
- A same-key, different-normalized-payload request returns `409`.
- Simultaneous same-key retries converge on one Appointment and equivalent safe confirmations.
- Simultaneous different-key requests for one slot create exactly one Appointment; the loser receives `409`.
- Any failed transaction leaves no Appointment, does not book the slot, and does not consume the idempotency key.

### Confirmation API

- Successful POST and `GET /appointments/:id` use a safe DTO containing only:
  - appointment ID/reference;
  - `CONFIRMED` status;
  - Therapy ID and name;
  - Agent ID and name;
  - `startsAt` and derived `endsAt` as UTC ISO strings;
  - positive `durationMinutes`;
  - configured display timezone; and
  - `createdAt` as UTC ISO string.
- Do not expose visitor name, visitor email, idempotency key, `isAvailable`, raw relation records, or internal fields.
- Validate appointment UUIDs and return safe `400`, `404`, and `500` responses.

### Booking form and confirmation pages

- Eligible slots on Therapy detail provide meaningful links to `/appointments/book?slotId=<uuid>`.
- The booking page shows authoritative Therapy, local date/time, duration, timezone, and available Agent choices.
- Provide persistent labels for Agent, visitor name, and visitor email.
- Associate validation errors with their fields and provide an accessible summary or status announcement where appropriate.
- Require an explicit review step before submission.
- Generate one client request UUID and reuse it only for safe retry of the same normalized payload.
- Disable submission while pending and prevent duplicate clicks.
- On success, navigate to `/appointments/[id]`.
- Confirmation shows approved non-personal information and remains safe on refresh or direct navigation.
- Distinguish malformed/unknown slot, stale/already-booked conflict, validation failure, pending, success, not-found, and retryable server failure.
- Provide useful navigation back to Therapy information or remaining availability.
- Include concise neutral wording that booking is not diagnosis or guaranteed treatment; when emergency guidance is shown, direct urgent needs to appropriate local emergency services without implying AgentClinic provides emergency care.

## Quality requirements

- Use strict TypeScript, existing NestJS module/service/DTO/error conventions, explicit Prisma transactions, server-generated UUIDs, and server-rendered Next.js pages except where interactive form state requires a client component.
- Use Node 24.19.0 and the previously successful Playwright environment.
- Meet WCAG 2.2 AA for form, review, pending, validation, conflict, confirmation, not-found, and failure states.
- Reflow from 320 CSS pixels through 1440px without horizontal overflow or lost function, including the established 400%-zoom-equivalent check.
- Add focused tests for schema constraints, migration compatibility, normalization, DTO privacy, every business rejection, rollback, idempotency, concurrency, and booked-slot filtering.
- Add complete Playwright coverage for the critical booking journey, confirmation refresh, keyboard use, responsive behavior, duplicate-click protection, conflict recovery, and axe checks.
- Preserve Phase 2 persistence, Phase 3 Agent directory, Phase 4 Ailment catalog, Phase 5 Therapy catalog, and Phase 6 availability, controlled-clock and timezone validation.
- Treat environmental limitations as blocked and report them. Do not use `sudo`, silently skip checks, or count failed or unexecuted checks as passing.

## Out of scope

- Cancellation, rescheduling, or any status transition.
- Agent, visitor, staff, or administrative dashboards and queues.
- Authentication, authorization, accounts, passwords, or ownership policies.
- Email, SMS, push, calendar, reminder, or other notification behavior.
- Payment, waiting-list, recurrence, capacity greater than one, or Agent schedules.
- Treatment plans, clinical notes, health history, symptoms, diagnosis, guaranteed treatment, or emergency-care delivery.
- Administrative CRUD for slots or Appointments.
- Mutation of `AvailabilitySlot.isAvailable` during booking.
- Appointment seed records.
- Therapy, time, duration, ending, or timezone duplication on Appointment.
- Any API or UI for later roadmap phases.

## Completion outcome

A visitor can follow an eligible Therapy slot, choose an existing Agent, enter minimal normalized contact information, review authoritative local-time details, and create exactly one confirmed Appointment. Retries are idempotent, concurrent attempts cannot double-book, failures roll back, booked slots disappear without changing administrative availability, confirmations expose no visitor data, and every required persistence, API, UI, browser, privacy, accessibility, and Phase 2–6 regression check passes.
