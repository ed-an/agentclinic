# Appointment Availability — Validation

## Merge standard

This feature can be merged only when every required check passes on the feature branch and in CI. A failed required check blocks merge. An environmental limitation must be reported as blocked with available evidence; it must not be skipped silently or treated as passing. Do not use `sudo` to bypass a limitation.

## 1. Scope and model review

Inspect the Prisma schema, migration, seed, API contracts, routes, pages, controls, dependencies, and source diff.

Confirm that:

1. `AvailabilitySlot` contains only `id`, `therapyId`, `startsAt`, `durationMinutes`, and `isAvailable`;
2. ending time is derived rather than persisted;
3. the relationship is many slots to exactly one Therapy;
4. only read-only availability behavior exists; and
5. no Appointment, booking, reservation, locking, capacity, recurrence, authentication, mutation, notification, payment, waiting-list, or other later-phase behavior exists.

**Success:** the implementation is the smallest useful Phase 6 slice with no speculative or Phase 7 functionality.

## 2. Migration compatibility and prior-data preservation

Using isolated temporary SQLite databases:

1. generate the Prisma client under Node 24.19.0;
2. apply all migrations to a clean database;
3. prepare a separate completed Phase 5 database with Agent, Ailment, Therapy, and association records;
4. upgrade it through Phase 6;
5. compare schema and migration history;
6. verify all prior IDs, values, counts, and associations remain unchanged; and
7. redeploy migrations to both databases.

**Success:** both paths reach the expected schema, prior history and data are preserved, and repeated deployment is a no-op.

## 3. Constraints, foreign keys, and indexes

Inspect the migrated SQLite schema and exercise database constraints directly.

Confirm that:

1. every slot references an existing Therapy;
2. deleting or changing a Therapy follows the explicitly selected safe relation behavior;
3. duplicate `(therapyId, startsAt)` records are rejected;
4. zero and negative durations are rejected;
5. required fields reject null values; and
6. only justified Therapy/start/availability indexes exist and support the specified query.

**Success:** SQLite, not TypeScript alone, enforces identity, relationship, uniqueness, required values, and positive duration.

## 4. Deterministic, repeat-safe seed

Against an isolated migrated database with a documented fixed test clock:

1. run the seed command;
2. capture all slots and complete Phase 2–5 records and associations;
3. run the seed command again; and
4. compare the complete relevant database state.

**Success:** both runs exit zero, produce identical fixed UUIDs and UTC values, create no duplicate Therapy/start pairs, preserve all prior data, and do not depend on the execution date or machine timezone.

## 5. Default upcoming availability

With an injected fixed current instant, exercise `GET /therapies/:id/availability` without a range.

Confirm that:

1. upcoming available slots are returned;
2. a slot starting exactly at the current instant is included;
3. past slots are excluded;
4. explicitly unavailable slots are excluded;
5. a Therapy with no slots returns `[]`;
6. a Therapy with only past or unavailable slots returns `[]`; and
7. results use `startsAt ASC`, then `id ASC`, ordering.

**Success:** default results contain every and only upcoming available slot under a clock-controlled deterministic rule.

## 6. Explicit range behavior

Exercise valid `from` and `to` combinations with focused service and HTTP tests.

Confirm that:

1. `from` is inclusive;
2. `to` is exclusive;
3. either optional boundary works according to the contract;
4. both boundaries correctly intersect with `isAvailable = true`;
5. past slots may be returned only when a valid explicit past `from` requests them;
6. empty valid ranges return `[]`; and
7. ordering remains deterministic.

**Success:** every valid range follows exact inclusive/exclusive, availability, and ordering semantics.

## 7. Query and identifier validation

Exercise the API with:

1. malformed, date-only, offset-free, ambiguous, and impossible timestamps;
2. repeated `from` or `to` parameters;
3. `from` equal to `to`;
4. `from` later than `to`;
5. a range exactly at the documented maximum;
6. a range beyond the maximum;
7. malformed Therapy IDs; and
8. unknown valid Therapy IDs.

**Success:** valid boundary values are accepted, invalid query input and malformed IDs return safe `400`, and unknown Therapies return safe `404`, without coercion or silent truncation.

## 8. API response and failure safety

Inspect populated and empty response bodies and simulate persistence or service failures.

Confirm that:

1. `startsAt` and derived `endsAt` are normalized ISO 8601 UTC strings;
2. `durationMinutes` is positive and consistent with the derived ending instant;
3. only `id`, `therapyId`, `startsAt`, `durationMinutes`, and `endsAt` are exposed;
4. raw `isAvailable` and internal fields are absent;
5. safe `400`, `404`, and `500` bodies contain no stack trace, raw query, schema detail, filesystem path, secret, database URL, or internal record; and
6. no availability or booking mutation route is registered.

**Success:** all responses follow the approved public contract and failure behavior leaks no internal data.

## 9. UTC authority and timezone formatting

Run focused tests under differing machine timezone settings and explicit configured IANA timezones.

Confirm that:

1. stored and API timestamps remain the same UTC instants;
2. `America/Sao_Paulo` is the documented and tested default display timezone;
3. the visible timezone name or abbreviation is clear;
4. a UTC slot near midnight appears under the correct local calendar date;
5. a DST-observing test timezone formats instants around spring-forward and fall-back transitions correctly;
6. nonexistent and repeated local clock labels cannot change UTC ordering; and
7. invalid timezone configuration fails safely rather than using the host timezone.

**Success:** UTC remains authoritative while local display and grouping are deterministic, configured, and correct at boundary conditions.

## 10. Therapy availability UI states

Use focused UI tests and browser validation to confirm:

1. Therapy detail provides clear availability content or navigation to the complete view;
2. upcoming slots render in API order grouped by local date;
3. each slot shows date, time, duration or derived end, and timezone;
4. semantic headings, lists, and `time` elements expose correct UTC `dateTime` values;
5. no-slot and no-available-slot conditions have clear non-error messages;
6. loading feedback is accessible wherever visibly rendered;
7. an unknown Therapy renders not-found rather than empty availability;
8. invalid range input renders a validation state if the UI exposes ranges;
9. server failure renders a safe, actionable, retryable state; and
10. no unavailable slot appears actionable and no booking control exists.

**Success:** every populated, empty, loading, validation, missing, and failed availability state is distinct, useful, and faithful to the read-only contract.

## 11. Keyboard, accessibility, and responsive behavior

Using the previously successful Playwright environment, validate all Phase 6 journeys and states at representative mobile and desktop viewports, including 320 CSS pixels as the existing 400%-zoom equivalent.

Confirm that:

1. Therapy-to-availability navigation works by keyboard;
2. focus order and indication are logical and visible;
3. headings, lists, links, times, and statuses are semantic;
4. content reflows without horizontal overflow or lost information;
5. timezone and duration information do not rely on color or visual position alone; and
6. axe reports no serious or critical WCAG violations.

**Success:** the availability journey works without a pointer and at required viewport and zoom-equivalent conditions with no blocking accessibility issue.

## 12. Server-only persistence ownership

Inspect manifests, imports, build output, server queries, and web fetching, and run the automated source-boundary checks.

Confirm that:

1. Prisma schema, migrations, seed, generated client, clock-dependent query rules, and SQLite operations remain inside NestJS;
2. the web obtains availability only through the HTTP API;
3. the web has no Prisma or SQLite dependency or import; and
4. database paths, queries, configuration, and generated artifacts do not reach browser code.

**Success:** source review and automated checks prove all persistence ownership remains server-only.

## 13. Phase 2–5 regression

Run the established persistence, Agent, Ailment, and Therapy validation workflows, including APIs, UI states, browser journeys, accessibility checks, source boundaries, and seed preservation.

**Success:** Phase 2 persistence, Phase 3 Agent directory, Phase 4 Ailment catalog, and Phase 5 Therapy catalog and relationships pass unchanged.

## 14. Absence of Phase 7 and later behavior

Inspect Prisma models, routes, UI controls, services, DTOs, tests, and dependencies.

Confirm that:

1. no Appointment or placeholder booking record exists;
2. no POST, PUT, PATCH, or DELETE slot or booking route is registered;
3. no reserve, select, confirm, cancel, reschedule, lock, capacity, waiting-list, payment, notification, authentication, or Agent-data behavior exists;
4. no recurring schedule or automatic slot generation exists; and
5. no unrelated catalog or shell change was introduced.

**Success:** automated route checks and source review demonstrate strict Phase 6 scope.

## 15. Repository quality and runtime checks

With Node 24.19.0 and the previously successful Playwright environment, run the documented commands for:

1. Prisma client generation;
2. formatting verification;
3. linting;
4. strict TypeScript checking;
5. unit, focused, integration, and root validation tests;
6. production server and web builds;
7. runtime smoke tests;
8. the complete Playwright browser suite; and
9. `git diff --check`.

**Success:** every command exits zero locally where supported and in CI. Environmental limitations are reported as blocked, never passed; nothing is silently skipped and `sudo` is not used.

## 16. Mission and constitutional review

Confirm that:

- the availability journey is warm, clear, respectful, and does not imply diagnosis, prescription, guaranteed treatment, or personalized advice as required by [the mission](../mission.md);
- the implementation follows [the technical constitution](../tech-stack.md), including NestJS authority, UTC storage, strict validation, server-only Prisma, accessibility, and responsive behavior;
- every requirement in [requirements.md](requirements.md) is implemented and evidenced;
- the demo remains deterministic, understandable for students, and quick to present; and
- no unexplained deviation or later roadmap phase was introduced.

**Success:** review finds no unresolved requirement, temporal ambiguity, architectural violation, misleading claim, or scope expansion.

## Merge checklist

- [ ] `AvailabilitySlot` contains only the five approved persisted fields.
- [ ] Ending time is derived and not stored.
- [ ] The Therapy relationship, uniqueness, positive-duration constraint, foreign key, and indexes pass direct checks.
- [ ] Clean and completed Phase 5 databases migrate to the same Phase 6 schema.
- [ ] Migration redeployment is a no-op and all Phase 2–5 records and associations are preserved.
- [ ] Seeding twice produces identical stable slots without duplicates or drift.
- [ ] Default availability excludes past and unavailable slots under a controlled clock.
- [ ] Explicit ranges pass inclusive `from`, exclusive `to`, maximum-range, and empty-result checks.
- [ ] Malformed and repeated parameters, invalid ranges, malformed IDs, and unknown Therapies return the correct safe responses.
- [ ] Response fields, UTC normalization, derived end time, ordering, and safe failures pass.
- [ ] Configured timezone, local-date boundary, DST transition, and host-timezone-independence checks pass.
- [ ] Therapy navigation and populated, empty, loading, validation, not-found, and retryable error states pass.
- [ ] Keyboard, semantic time markup, responsive layouts, 400%-zoom-equivalent overflow, and axe checks pass.
- [ ] Automated checks preserve NestJS-only Prisma and SQLite ownership.
- [ ] Phase 2–5 regression suites pass.
- [ ] No mutation, Appointment, booking, reservation, recurrence, authentication, or other later-phase functionality exists.
- [ ] Prisma generation, formatting, linting, strict type checking, validation tests, builds, smoke tests, complete Playwright tests, and `git diff --check` pass.
- [ ] Environmental limitations are reported as blocked and never counted as passing.
- [ ] Requirements, mission, technical constitution, and scope reviews pass.
