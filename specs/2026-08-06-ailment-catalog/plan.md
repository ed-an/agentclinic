# Ailment Catalog — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Confirm conventions and define the minimal Ailment domain

1. Review the existing Prisma, seed, NestJS API, Next.js route, status-state, accessibility, and test conventions established through Phase 3.
2. Confirm the four-field model (`id`, `name`, `summary`, and `description`) and document any repository-driven representation detail.
3. Select and document a reasonable maximum length for the `q` parameter, applying the same value in validation and tests.
4. Identify any strictly necessary shared change that would affect Agent functionality and report it before implementation; otherwise leave Agent code unchanged.

**Checkpoint:** the implementation approach uses existing conventions, every field and validation rule is justified, and no later-phase concept is included.

## 2. Add the Ailment schema migration

1. Add the minimal Prisma `Ailment` model with a stable UUID and required `name`, `summary`, and `description` fields.
2. Add only the constraints and indexes concretely needed by the specified contract.
3. Create a named Phase 4 migration without modifying earlier migration history.
4. Apply all migrations to a clean isolated database.
5. Upgrade a separate completed Phase 3 database and verify existing Agent records remain unchanged.
6. Redeploy migrations to both databases and verify the operation is a no-op.

**Checkpoint:** clean and upgraded databases reach the same Ailment-capable schema, Phase 3 data and history are preserved, and migration redeployment is harmless.

## 3. Add deterministic Ailment seed records

1. Define a small set of realistic, fictional Ailments with stable UUIDs and neutral educational copy.
2. Extend the existing server seed entry point with repeat-safe writes.
3. Seed an isolated migrated database twice.
4. Compare Ailment IDs, values, counts, and order-relevant fields after each run.
5. Confirm seeded Agent records remain present and unchanged.

**Checkpoint:** repeated seeding produces the same demonstration records without duplicates or drift, preserves Agents, and introduces no medical-advice or later-phase data.

## 4. Build the read-only searchable Ailment API

1. Add the Ailment NestJS capability using existing module, controller, service, persistence-boundary, DTO, and API version conventions.
2. Implement `GET /ailments` with optional `q` validation, trimming, unfiltered handling for absent or blank input, and parameterized Prisma conditions across `name` and `summary`.
3. Apply case-insensitive matching using the repository's supported Prisma and SQLite approach without raw SQL.
4. Order every result by `name ASC`, then `id ASC`.
5. Implement `GET /ailments/:id` with UUID boundary validation and approved response fields only.
6. Map excessive queries, malformed IDs, unknown records, and unexpected failures to safe `400`, `404`, and `500` responses.
7. Add focused API tests for the complete contract, empty data, deterministic ordering, all specified search cases, detail cases, and safe failures.
8. Prove that no mutation route exists.

**Checkpoint:** both endpoints are read-only, validate all input, return deterministic approved data, distinguish expected failures safely, and access persistence only inside NestJS.

## 5. Build the searchable catalog page

1. Add `/ailments` using existing server-rendered App Router and page-container conventions.
2. Fetch complete and filtered data only through the NestJS list API.
3. Add a semantically labeled search form with a text input and submit action.
4. Represent the submitted term in the URL and restore the visible input and results from direct navigation or refresh.
5. Render a semantic, ordered list with meaningful detail links.
6. Implement distinct complete-catalog, filtered-results, no-results, empty-catalog, loading, and safe retryable error states.
7. Add focused UI tests for content, ordering, search form semantics, URL persistence, navigation, and every state.

**Checkpoint:** visitors can browse and search with keyboard or pointer, share and refresh filtered URLs, and clearly understand every result and failure state.

## 6. Build the Ailment detail page

1. Add `/ailments/[id]` using the stable API identifier and existing dynamic-route conventions.
2. Fetch one Ailment through the NestJS detail API and display only approved fields with semantic structure.
3. Add a clear keyboard-operable route back to the catalog.
4. Implement distinct loading, unknown-Ailment, and safe retryable server-error states.
5. Add focused UI tests for valid detail content, malformed or unknown routes as applicable, failure handling, and catalog navigation.

**Checkpoint:** a visitor can open an Ailment, understand the neutral educational content, return to the catalog, and distinguish missing data from service failure.

## 7. Automate Phase 4 acceptance and regression coverage

1. Extend validation to cover clean migration, Phase 3 upgrade, no-op migration redeployment, repeat-safe seed, and Agent preservation.
2. Add browser coverage for catalog search, URL persistence, opening a detail, returning to the catalog, and all browser-relevant states.
3. Validate keyboard navigation, accessible search labeling, semantic status communication, and automated accessibility checks.
4. Exercise representative mobile and desktop viewports and 400% zoom according to existing validation conventions.
5. Add or extend source-boundary checks proving the web application never accesses Prisma or SQLite.
6. Run Phase 2 persistence and Phase 3 Agent directory regression suites.
7. Add a scope check or review proving mutation endpoints and later-phase functionality are absent.

**Checkpoint:** automated evidence covers the full Phase 4 contract, persistence safety, accessibility, responsiveness, architectural boundaries, and prior-phase behavior.

## 8. Final review

1. Run the repository's documented Prisma client generation, formatting, linting, strict type checking, validation tests, production builds, smoke tests, browser tests, and `git diff --check` commands.
2. Review the implementation against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
3. Confirm only the approved model fields, routes, query behavior, pages, and states were introduced.
4. Confirm Agent functionality was not changed, or that any previously reported strictly necessary shared change is minimal and regression-tested.
5. Confirm no mutation, relationship, recommendation, authentication, pagination, analytics, or later-phase behavior exists.
6. Record environmental limitations as blocked; do not mark any unexecuted or failed command as passing.

**Checkpoint:** all required checks pass with reviewable evidence and no unresolved scope, correctness, accessibility, architectural, or regression issue remains before merge.
