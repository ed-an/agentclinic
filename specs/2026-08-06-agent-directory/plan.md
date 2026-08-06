# Agent Directory — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Define the minimal Agent domain

1. Review the existing shell, route conventions, API conventions, and status-state components that Phase 3 must reuse.
2. Select the smallest useful set of Agent fields, documenting why each field is required for identity, routing, directory display, or detail display.
3. Add the Prisma `Agent` model with appropriate required fields and uniqueness constraints.
4. Create a named Phase 3 migration without changing the Phase 2 migration history.
5. Apply all migrations to a clean temporary database and to an existing Phase 2 database.

**Checkpoint:** both database paths reach the same Agent-capable schema, and no later-phase model or unnecessary field is present.

## 2. Add deterministic Agent seed records

1. Define a small set of fictional, professional Agent records with stable identifiers and values.
2. Extend the existing server seed entry point using repeat-safe writes.
3. Make seed output concise and avoid printing private configuration or database details.
4. Run the seed twice against the same migrated temporary database.
5. Compare records, identifiers, counts, and ordering inputs after both runs.

**Checkpoint:** repeated seeding succeeds without duplicates or drift and produces a predictable demonstration dataset.

## 3. Build the read-only Agent API

1. Add an Agent capability module following existing NestJS organization and API versioning.
2. Add explicit response DTOs for the approved Agent fields.
3. Implement the list query with explicit deterministic ordering and a stable tie-breaker.
4. Implement the detail query using the stable route identifier.
5. Map missing records and internal failures to existing safe HTTP response conventions.
6. Add focused tests for populated and empty lists, ordering, valid detail, not-found detail, and failure behavior.

**Checkpoint:** the read-only API returns only approved fields, behaves consistently for every required scenario, and performs all database access inside NestJS.

## 4. Build the responsive Agent list page

1. Add the directory route using existing Next.js and page-container conventions.
2. Fetch the Agent list through the server API with the repository's established server-side data-fetching approach.
3. Render a semantic, responsively reflowing list with meaningful links to agent details.
4. Implement clear loading, empty, and server-error states using existing patterns.
5. Add focused UI tests for content, deterministic presentation, links, and each page state.

**Checkpoint:** the list is readable and keyboard operable on mobile and desktop, contains no direct persistence access, and remains useful when data is empty or unavailable.

## 5. Build the responsive Agent detail page

1. Add the dynamic detail route using the same stable identifier as the API.
2. Fetch one Agent through the server API and display the approved fields with semantic headings and labels.
3. Add a clear keyboard-operable path back to the directory.
4. Implement distinct not-found and server-error experiences using existing conventions.
5. Add focused UI tests for a valid agent, an unknown identifier, failure handling, and directory navigation.

**Checkpoint:** a staff user can open a seeded agent, understand the displayed information, return to the list, and distinguish missing data from a service failure.

## 6. Automate the Phase 3 acceptance journey

1. Extend validation coverage to migrate a clean database and seed it twice before exercising the directory.
2. Add or extend browser coverage for navigating from the populated directory to a detail page and back by keyboard.
3. Exercise list and detail layouts at representative mobile and desktop viewports.
4. Add basic automated accessibility checks for both pages and their required states.
5. Add source-boundary validation proving the web application does not access Prisma or SQLite.
6. Verify the Phase 2 clean migration, repeated migration, repeat-safe seed, and server-only query workflow still passes.

**Checkpoint:** automated validation proves the core journey, required states, accessibility basics, responsive behavior, and persistence boundary without altering developer data.

## 7. Final review

1. Run the repository's existing formatting, linting, strict type checking, automated tests, production builds, smoke tests, and browser tests.
2. Review the implementation against [requirements.md](requirements.md), [validation.md](validation.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
3. Confirm the API is read-only and no later-phase capability, speculative abstraction, new versioning convention, or unnecessary Agent field was introduced.
4. Confirm migration and seed validation works from both clean and Phase 2 database states.
5. Record environmental limitations separately; do not mark an unexecuted or failed required check as passing.

**Checkpoint:** every required check passes with reviewable evidence and no unresolved failure remains before merge.
