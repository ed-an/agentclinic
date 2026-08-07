# Therapy Catalog — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm conventions and the minimal Therapy domain

1. Review the Phase 2 persistence, Phase 3 Agent directory, and Phase 4 Ailment catalog conventions for Prisma, seeding, NestJS APIs, Next.js routes, status states, accessibility, and tests.
2. Confirm the four-field Therapy model (`id`, `name`, `summary`, and `description`) and a simple many-to-many Ailment relationship without association metadata.
3. Confirm the relationship API shape: prefer `GET /ailments/:id/therapies` unless extending the existing Ailment detail response is demonstrably simpler and remains consistent with established contracts.
4. Decide whether Therapy detail will show associated Ailments; include it only if it stays a simple informational list and adds no second recommendation workflow.
5. Identify any strictly necessary shared change to existing Agent or Ailment behavior and report it before implementation; otherwise leave prior-phase behavior unchanged.

**Checkpoint:** the approach follows repository conventions, supports both required journeys, and introduces no later-phase concept.

## 2. Add the Therapy schema and Ailment association migration

1. Add the minimal Prisma `Therapy` model with a stable UUID and required unique `name`, `summary`, and `description` fields.
2. Add the simplest Prisma many-to-many relationship between Ailment and Therapy that meets the current requirements, with no ranking, effectiveness, priority, reason, or other association metadata.
3. Add only constraints and indexes required for identity, uniqueness, association integrity, and deterministic behavior.
4. Create a named Phase 5 migration without modifying prior migration history.
5. Apply all migrations to a clean isolated database and upgrade a separate completed Phase 4 database.
6. Verify existing Agent and Ailment records are preserved, then redeploy migrations and prove the operation is a no-op.

**Checkpoint:** clean and upgraded databases reach the same Phase 5 schema, prior records and history are intact, and repeated migration deployment is harmless.

## 3. Add deterministic Therapy and association seeds

1. Define a small set of fictional Therapies with stable UUIDs and neutral educational content.
2. Define stable associations covering an Ailment with multiple Therapies, a Therapy associated with multiple Ailments, and an Ailment with no Therapies; include an unassociated Therapy if the chosen model allows it.
3. Extend the existing server seed entry point with repeat-safe Therapy and association writes.
4. Seed an isolated migrated database twice and compare Therapy, association, Ailment, and Agent IDs, values, and counts after each run.
5. Verify that neither seed run creates duplicates, changes established records unexpectedly, or implies diagnosis, prescription, effectiveness, or personalized advice.

**Checkpoint:** repeated seeding produces identical records and associations, preserves earlier-phase data, and contains only approved informational content.

## 4. Build the read-only Therapy API

1. Add a Therapy NestJS capability following existing module, controller, service, repository-boundary, DTO, and API-version conventions.
2. Implement `GET /therapies` with explicit `name ASC`, then `id ASC`, ordering and approved response fields only.
3. Implement `GET /therapies/:id` with UUID boundary validation and an approved detail response.
4. Expose the Ailment-to-Therapy relationship through `GET /ailments/:id/therapies` or the documented simpler Ailment-detail contract, preserving deterministic Therapy ordering.
5. If Therapy detail includes associated Ailments, return only their minimal linkable informational representation in `name ASC`, then `id ASC`, order.
6. Map malformed identifiers, unknown records, and unexpected failures to safe `400`, `404`, and `500` responses without internal-data leakage.
7. Add focused tests for populated and empty lists, ordering, known, malformed, and unknown IDs, every required relationship cardinality, safe failures, and the absence of mutation routes.

**Checkpoint:** the API is read-only, deterministic, safely validated, and supports both catalog and Ailment-to-Therapy journeys with server-only persistence.

## 5. Build the Therapy catalog and detail pages

1. Add `/therapies` using existing server-rendered App Router, shell, and page-container conventions.
2. Fetch Therapy data only through the NestJS API and render an ordered semantic list with meaningful detail links.
3. Implement distinct loading, empty-catalog, and safe retryable server-error states.
4. Add `/therapies/[id]`, fetch through the detail API, and display the approved fields with semantic headings and neutral educational wording.
5. If approved in Task Group 1, render associated Ailments as a small informational list of links without recommendation claims.
6. Implement distinct detail loading, not-found, and safe retryable server-error states, plus clear catalog navigation.
7. Add focused UI tests for content, ordering, navigation, and every specified state.

**Checkpoint:** visitors can browse Therapies, open a detail, navigate by keyboard, and distinguish empty, missing, loading, and failed states.

## 6. Connect Ailment detail to associated Therapies

1. Extend the existing Ailment detail page to obtain associations through the selected NestJS contract.
2. Render associated Therapies in deterministic order using semantic headings, lists, and meaningful links.
3. Provide a distinct, reassuring state when an Ailment has no associated Therapies.
4. Preserve existing Ailment loading, not-found, and error behavior, including an unknown-Ailment state distinct from a server failure.
5. Use neutral language that describes related informational content without diagnosis, prescription, guarantee, or personalized advice.
6. Add focused UI tests for one and multiple associations, no associations, navigation to Therapy detail, unknown Ailments, and safe retryable failures.

**Checkpoint:** an agent can move from an Ailment to each related Therapy, while all existing Ailment states remain clear and reliable.

## 7. Automate Phase 5 acceptance and regression coverage

1. Extend validation for clean migration, Phase 4 upgrade, no-op redeployment, repeat-safe seeding, duplicate prevention, and Agent and Ailment preservation.
2. Add browser coverage for the standalone Therapy catalog/detail journey and Ailment-to-Therapy navigation.
3. Cover empty, loading, not-found, no-association, and retryable error states at browser level where practical.
4. Validate semantic structure, keyboard navigation, automated accessibility checks, representative mobile and desktop viewports, and required 400% zoom behavior.
5. Extend source-boundary checks proving Prisma and SQLite remain exclusive to NestJS.
6. Run Phase 2 persistence, Phase 3 Agent directory, and Phase 4 Ailment catalog regression suites.
7. Add route and source review proving mutation endpoints and later-phase functionality are absent.

**Checkpoint:** automated evidence covers the full Phase 5 contract, architectural boundaries, accessibility, responsiveness, persistence safety, and prior behavior.

## 8. Final review

1. Use Node 24.19.0 and the previously successful Playwright environment.
2. Run the repository's documented Prisma client generation, formatting, linting, strict type checking, validation tests, production builds, smoke tests, complete Playwright suite, and `git diff --check` commands.
3. Review the implementation against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
4. Confirm the implementation contains only the approved fields, associations, read-only APIs, routes, pages, and states.
5. Confirm earlier-phase data and behavior remain intact and no appointment, authentication, mutation, personalization, or other later-phase capability exists.
6. Report environmental limitations as blocked; do not use `sudo`, silently skip a check, or mark an unexecuted or failed check as passing.

**Checkpoint:** all required checks pass with reviewable evidence and no unresolved scope, correctness, accessibility, architectural, or regression issue remains before merge.
