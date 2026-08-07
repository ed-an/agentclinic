# Appointment Availability — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm conventions and the minimal availability contract

1. Review Phase 2 persistence, Phase 5 Therapy APIs and pages, NestJS validation, Prisma seeding, time formatting, status-state, accessibility, and test conventions.
2. Confirm the five-field `AvailabilitySlot` model (`id`, `therapyId`, `startsAt`, `durationMinutes`, and `isAvailable`) and the required many-to-one Therapy relationship.
3. Select and document a maximum `from`/`to` date-range size that is useful for the demo while preventing unbounded queries.
4. Confirm the configured IANA timezone mechanism with `America/Sao_Paulo` as its documented default and a fail-fast response to invalid configuration.
5. Select fixed UTC seed timestamps within a documented long-lived demo horizon; do not calculate them from the current time.
6. Confirm whether the existing Therapy detail conventions support the complete availability list inline; add `/therapies/[id]/availability` only if a separate view is necessary for a clear complete journey.

**Checkpoint:** the implementation approach is deterministic, testable with a controlled clock, consistent with existing conventions, and contains no booking behavior.

## 2. Add the AvailabilitySlot schema migration

1. Add the minimal Prisma `AvailabilitySlot` model with stable UUID identity, required Therapy relation, UTC `startsAt`, positive integer `durationMinutes`, and required `isAvailable`.
2. Add a database uniqueness constraint on `therapyId` plus `startsAt`.
3. Add only the indexes required for Therapy, time, and availability queries.
4. Create a named Phase 6 migration without modifying prior migration history.
5. Apply all migrations to a clean isolated database and upgrade a separate completed Phase 5 database.
6. Verify Agent, Ailment, Therapy, and Ailment–Therapy association records remain unchanged, then redeploy migrations and prove the operation is a no-op.
7. Verify the foreign key, uniqueness constraint, duration constraint, and indexes directly against SQLite.

**Checkpoint:** clean and upgraded databases reach the same Phase 6 schema, prior data is preserved, invalid durations and duplicate Therapy/start pairs are rejected, and redeployment is harmless.

## 3. Add deterministic AvailabilitySlot seeds

1. Define stable slots with fixed UUIDs and UTC timestamps, positive durations, and explicit availability flags.
2. Cover multiple upcoming available slots for one Therapy, a Therapy with no slots, and a Therapy with only past or unavailable slots relative to the controlled acceptance-test clock.
3. Include UTC times that exercise local-date grouping near midnight in `America/Sao_Paulo`.
4. Extend the existing seed entry point with repeat-safe slot writes that preserve all Phase 2–5 records and associations.
5. Seed an isolated migrated database twice and compare the complete relevant state after each run.

**Checkpoint:** repeated seeding produces identical slots without duplicate Therapy/start pairs or prior-data drift and does not depend on the execution date or machine timezone.

## 4. Build the controlled time and timezone foundations

1. Add a small injectable current-time provider for server availability rules, defaulting to the real current instant in production.
2. Centralize web date, time, duration, timezone-label, and local-calendar grouping behavior using platform internationalization primitives.
3. Read the display timezone from validated application configuration and default it to `America/Sao_Paulo`.
4. Keep UTC authoritative for storage, filtering, response values, and ordering.
5. Add focused tests using fixed instants and explicit IANA timezones, including a DST-observing timezone for nonexistent and repeated local clock transitions.

**Checkpoint:** server rules and UI formatting are deterministic under test and independent of wall-clock time, host timezone, and browser location.

## 5. Build the read-only availability API

1. Implement `GET /therapies/:id/availability` using existing controller, service, DTO, validation, and repository-boundary conventions.
2. Validate the Therapy UUID before querying and distinguish malformed from unknown identifiers.
3. Accept optional scalar `from` and `to` ISO 8601 UTC instants; treat `from` as inclusive and `to` as exclusive.
4. Reject invalid timestamps, repeated query parameters, `from >= to`, and ranges beyond the documented maximum with safe `400` responses.
5. Without `from`, use the injectable current instant as the inclusive lower boundary so past slots are excluded.
6. Always exclude `isAvailable = false`; Phase 6 exposes no `includeUnavailable` option.
7. Return only approved fields with ISO 8601 UTC `startsAt` values and derived `endsAt`, ordered by `startsAt ASC`, then `id ASC`.
8. Return `[]` for a known Therapy with no matching available slots, safe `404` for an unknown Therapy, and safe `500` responses without internal-data leakage.
9. Add focused service and HTTP tests for the full boundary, time, range, ordering, empty, error, and read-only contracts.

**Checkpoint:** the endpoint returns only matching upcoming available slots through a strict, deterministic, safe, read-only contract.

## 6. Add Therapy-to-availability web navigation

1. Extend `/therapies/[id]` with the next available slots or a clear link to the complete availability view selected in Task Group 1.
2. Fetch availability only through the NestJS HTTP API and keep Prisma and SQLite out of the web application.
3. Group slots by configured local calendar date and show local date, time, duration, and timezone clearly using semantic lists and `time` elements.
4. Derive ending time from `startsAt` plus `durationMinutes`; do not persist or duplicate the rule in uncontrolled locations.
5. Implement loading, no-slots, no-available-slots, not-found, validation-error, and safe retryable server-error states as applicable to the chosen route structure.
6. Ensure unavailable slots never appear actionable and add no booking control or placeholder.
7. Add focused API-client and UI tests for navigation, grouping, labels, every state, and invalid API contracts.

**Checkpoint:** an agent can open one Therapy and understand its upcoming available times without seeing or initiating booking behavior.

## 7. Automate Phase 6 acceptance and regression coverage

1. Extend persistence validation for clean migration, Phase 5 upgrade, no-op redeployment, constraints, indexes, repeat-safe seeds, and complete Phase 2–5 data preservation.
2. Add complete browser coverage for Therapy-to-availability navigation, upcoming slots, empty availability, and relevant loading, not-found, validation, and retryable error states.
3. Validate keyboard navigation, semantic headings, lists and `time` elements, timezone communication, and automated WCAG 2.2 AA checks.
4. Exercise representative mobile and desktop viewports plus the existing 320px 400%-zoom-equivalent check with no horizontal overflow.
5. Extend source-boundary checks proving Prisma and SQLite remain exclusive to NestJS.
6. Run Phase 2 persistence, Phase 3 Agent directory, Phase 4 Ailment catalog, and Phase 5 Therapy catalog and relationship regression suites.
7. Add route and source review proving booking, reservation, mutation, authentication, recurring generation, and other later-phase behavior are absent.

**Checkpoint:** automated evidence covers the complete Phase 6 contract, temporal correctness, accessibility, responsiveness, architecture, and prior behavior.

## 8. Final review

1. Use Node 24.19.0 and the previously successful Playwright environment.
2. Run the repository's documented Prisma generation, formatting, linting, strict type checking, validation tests, production builds, smoke tests, complete Playwright suite, and `git diff --check`.
3. Review the implementation against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
4. Confirm the implementation contains only the approved slot fields, relationship, read-only API, Therapy availability journey, and required states.
5. Confirm all date rules use UTC authority, centralized configured-timezone formatting, and controlled clocks in tests.
6. Confirm no database, generated client, build output, temporary artifact, secret, log, or unrelated change is included.
7. Report environmental limitations as blocked; do not use `sudo`, silently skip a check, or mark an unexecuted or failed check as passing.

**Checkpoint:** every required check passes with reviewable evidence and no unresolved scope, temporal, correctness, accessibility, architectural, or regression issue remains before merge.
