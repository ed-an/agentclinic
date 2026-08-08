# Book an Appointment — Validation

## Merge standard

This feature can be merged only when every required check passes on the feature branch and in CI. A failed check blocks merge. An environmental limitation must be reported as blocked with available evidence; it must not be skipped silently or counted as passing. Do not use `sudo` to bypass a limitation.

## 1. Scope and model review

Inspect schema, migration, APIs, DTOs, services, routes, pages, controls, dependencies, logs, tests, and the complete diff.

Confirm that:

1. Appointment stores only the approved fields and relations;
2. Therapy and time values remain derived from AvailabilitySlot;
3. `CONFIRMED` is the only status and no transition exists;
4. booking does not mutate `AvailabilitySlot.isAvailable`; and
5. no cancellation, rescheduling, dashboard, authentication, notification, payment, recurrence, capacity, Agent scheduling, administrative CRUD, or other later-phase behavior exists.

**Success:** the implementation is exactly the smallest Phase 7 booking and confirmation slice.

## 2. Migration compatibility and preservation

Using isolated temporary SQLite databases:

1. generate the Prisma client with Node 24.19.0;
2. apply all migrations to a clean database;
3. prepare a completed Phase 6 database with all established records and relationships;
4. upgrade it through Phase 7;
5. compare schema and migration history;
6. verify all Agent, Ailment, Therapy, association and AvailabilitySlot IDs, values, counts and relations remain unchanged;
7. verify Appointment count is zero; and
8. redeploy migrations to both databases.

**Success:** both paths reach the same Phase 7 schema, earlier data and history are unchanged, no Appointment is seeded, and redeployment is a no-op.

## 3. Database constraints and relations

Exercise SQLite directly and inspect schema metadata.

Confirm that:

1. Appointment requires existing AvailabilitySlot and Agent foreign keys;
2. `availabilitySlotId` is unique;
3. `idempotencyKey` is unique;
4. all required fields reject null;
5. only `CONFIRMED` status is accepted;
6. server defaults or application generation produce UTC `createdAt`; and
7. only justified relation indexes exist.

**Success:** database constraints, rather than application checks alone, prevent invalid status, orphan records, duplicate slot bookings, and duplicate idempotency keys.

## 4. Seed stability

Run the documented seed command twice against an isolated migrated database and compare complete Phase 2–6 state plus Appointment count.

**Success:** established seed records remain identical, no Appointment is created, and no relation or migration state drifts.

## 5. Input normalization and validation

Test the POST boundary with:

1. valid values at documented length limits;
2. trimmed visitor name persistence and comparison;
3. trimmed, lowercased visitor email persistence and comparison;
4. empty, whitespace-only, malformed and oversized values;
5. missing fields;
6. malformed slot and Agent UUIDs;
7. unexpected properties, including Therapy, time, duration, timezone and unapproved personal fields;
8. missing, malformed and repeated `Idempotency-Key`; and
9. malformed JSON or excessive bodies under existing server limits.

**Success:** approved normalized input is accepted, every invalid boundary returns safe `400`, and rejected requests create no Appointment.

## 6. Successful booking

With a controlled clock, submit a valid future, administratively available, unbooked slot, known Agent, normalized visitor data, and new idempotency key.

Confirm that:

1. HTTP status is `201`;
2. exactly one `CONFIRMED` Appointment exists;
3. ID and `createdAt` are server generated;
4. persisted visitor values are normalized;
5. Therapy, start, end and duration derive from the slot;
6. response timestamps are UTC ISO values;
7. configured display timezone is present;
8. response contains only approved confirmation fields; and
9. visitor name, email, idempotency key and internal fields are absent.

**Success:** one valid request creates one authoritative private confirmed booking.

## 7. Slot and Agent rejection

Exercise separate requests for:

1. administratively unavailable slot;
2. already-booked slot;
3. past slot;
4. unknown valid slot ID;
5. malformed slot ID;
6. unknown valid Agent ID; and
7. malformed Agent ID.

**Success:** conflicts return safe `409`, unknown resources return safe `404`, malformed identifiers return safe `400`, and no rejected request creates an Appointment or consumes an idempotency key.

## 8. Availability after booking

Capture availability before and after a successful booking.

Confirm that:

1. the booked slot disappears immediately from default and explicit-range availability;
2. other eligible slots remain in deterministic order;
3. the booked slot retains `isAvailable = true` in persistence;
4. administratively unavailable slots remain distinct; and
5. booking context for the occupied slot returns the approved conflict state.

**Success:** occupancy is represented only by Appointment and Phase 6 filtering correctly excludes booked slots.

## 9. Idempotent replay

Submit the same idempotency key with normalized-equivalent and different payloads.

Confirm that:

1. first request returns `201`;
2. exact retry returns the original confirmation with `200`;
3. differences only in allowed whitespace or email case normalize to the same payload;
4. no second Appointment is created;
5. same key with a different slot, Agent, normalized name or normalized email returns `409`; and
6. the original Appointment remains unchanged.

**Success:** one key identifies exactly one normalized booking intent and cannot be repurposed.

## 10. Concurrency

Run real concurrent database-backed requests rather than only mocked service calls.

Confirm that:

1. two different keys for one slot produce exactly one `201` winner and one `409` loser;
2. exactly one Appointment row exists for the slot;
3. simultaneous same-key, same-payload requests converge on one Appointment and equivalent confirmations;
4. simultaneous same-key, different-payload requests produce one accepted intent and a safe conflict;
5. uniqueness violations are mapped safely without raw database details; and
6. no request mutates administrative availability.

**Success:** database constraints and transaction handling prevent double booking and duplicate idempotent creation under races.

## 11. Transaction rollback

Simulate failures before creation, during persistence, and before transaction completion.

Confirm that:

1. no partial Appointment remains;
2. the slot remains eligible when no successful competing booking exists;
3. the idempotency key can be used successfully after a failed transaction;
4. visitor data is not left in another table or artifact; and
5. error responses contain no personal or internal data.

**Success:** every failed transaction is atomic and consumes neither slot nor idempotency key.

## 12. Confirmation API and privacy

Exercise POST confirmation and `GET /appointments/:id` for known, malformed and unknown IDs plus simulated failures.

Confirm that:

1. GET reproduces the approved authoritative confirmation;
2. malformed ID returns safe `400` and unknown ID returns safe `404`;
3. unexpected failure returns safe `500`;
4. neither response contains visitor name, email, idempotency key, stack, query, path, database URL, secret, or Prisma details; and
5. logs contain no visitor data or complete request body.

**Success:** confirmation is refresh-safe, useful and non-personal, and failure handling leaks nothing sensitive.

## 13. Booking context and form states

Use focused API-client and UI tests to confirm:

1. `slotId` alone resolves authoritative Therapy and time information;
2. all existing Agents populate the selector;
3. malformed, unknown, past, unavailable and booked slot contexts are distinct;
4. labels, descriptions and field errors are correctly associated;
5. the explicit review step shows Therapy, selected Agent, local date/time, duration and timezone;
6. pending submission disables duplicate action;
7. request contains only approved body fields and one idempotency header;
8. validation, conflict and retryable server failures provide actionable recovery; and
9. no unavailable or booked slot is presented as actionable.

**Success:** every form state uses authoritative data, preserves privacy, and supports a clear recovery path.

## 14. Confirmation page states

Use focused UI and browser tests to confirm:

1. success navigates to `/appointments/[id]`;
2. direct visit and refresh reproduce confirmation;
3. Therapy, Agent, local date/time, duration, timezone, status and reference render semantically;
4. visitor name and email never render;
5. loading, malformed/unknown reference and retryable server-error states are distinct; and
6. useful navigation back to Therapy information remains available.

**Success:** confirmation is safe to refresh, accessible and free of personal data.

## 15. Critical browser journey, accessibility and responsiveness

Using the previously successful Playwright environment, complete the journey entirely by keyboard: open an eligible slot, choose an Agent, enter visitor name and email, review, submit, see confirmation and refresh.

Also confirm:

1. duplicate-click protection;
2. stale/already-booked conflict recovery;
3. field validation and focus behavior;
4. malformed and unknown slot handling;
5. safe browser-relevant server-error handling;
6. semantic form, review, status and confirmation markup;
7. no serious or critical axe violations;
8. no horizontal overflow at 320px/400%-zoom-equivalent and 1440px; and
9. no claim of diagnosis, guaranteed treatment or emergency-care delivery.

**Success:** the complete critical booking journey and all material recovery states are keyboard-accessible, responsive and WCAG 2.2 AA compliant.

## 16. Server-only persistence and privacy boundaries

Inspect dependencies, imports, build output, network requests, server logs, screenshots, traces and source-boundary tests.

Confirm that:

1. Prisma, transactions, generated clients, database paths and SQLite stay inside NestJS;
2. the web uses only HTTP APIs and sends no unapproved authoritative or personal field;
3. visitor data appears only in the Appointment persistence fields and approved form inputs;
4. visitor email and name do not enter confirmation pages, URLs, logs, screenshots, traces or error bodies; and
5. no secret or idempotency key is exposed to rendered output.

**Success:** persistence remains server-owned and personal booking data is minimized and contained.

## 17. Phase 2–6 regression and later-scope absence

Run every established persistence, Agent, Ailment, Therapy and Availability workflow, including migration, seed, APIs, temporal boundaries, timezone formatting, UI states, accessibility, responsiveness, smoke and browser tests.

Inspect routes and source to confirm no cancellation, rescheduling, dashboard, staff queue, authentication, notification, payment, recurrence, capacity, Agent scheduling, treatment plan, administrative CRUD or other later-phase functionality exists.

**Success:** Phases 2–6 pass unchanged and the implementation contains no Phase 8 or later behavior.

## 18. Repository quality and final review

With Node 24.19.0 and the previously successful Playwright environment, run:

1. Prisma client generation;
2. formatting verification;
3. linting;
4. strict TypeScript checking;
5. unit, focused, integration and root validation tests;
6. production builds;
7. runtime smoke tests;
8. complete Playwright tests; and
9. `git diff --check`.

Review requirements, mission, technical constitution, complete diff and repository status.

**Success:** every command passes locally where supported and in CI, no required check is skipped, environmental limitations are reported as blocked, and no database, generated client, build output, coverage, Playwright artifact, temporary file, secret, log or unrelated change remains.

## Merge checklist

- [ ] Appointment contains only approved fields and relations.
- [ ] Clean and completed Phase 6 databases migrate safely and redeploy as a no-op.
- [ ] Foreign keys, required values, unique slot, unique idempotency key and `CONFIRMED` enforcement pass.
- [ ] Repeated seed preserves all prior data and creates no Appointment.
- [ ] Input normalization, strict fields, length limits, email and idempotency header validation pass.
- [ ] Valid booking creates one authoritative private `CONFIRMED` Appointment.
- [ ] Unavailable, booked and past conflicts; malformed IDs; and unknown resources return correct safe responses.
- [ ] Booked slots disappear without changing `isAvailable`; other availability remains intact.
- [ ] Same-key replay and different-payload conflict behavior pass.
- [ ] Different-key and same-key concurrency tests prove exactly-once creation.
- [ ] Transaction failures roll back and do not consume keys.
- [ ] Confirmation API and page expose no visitor data and survive refresh.
- [ ] Booking context, Agent selector, form validation, review, pending and recovery states pass.
- [ ] Complete keyboard browser journey, responsive layouts, 400%-zoom-equivalent overflow and axe checks pass.
- [ ] Server-only persistence and visitor privacy boundaries pass.
- [ ] Phase 2–6 regressions pass and no later-phase functionality exists.
- [ ] Prisma generation, formatting, linting, type checking, validation tests, builds, smoke, complete Playwright and `git diff --check` pass.
- [ ] Environmental limitations are reported as blocked, never passed.
- [ ] Requirements, mission, technical constitution, scope and complete-diff reviews pass.
