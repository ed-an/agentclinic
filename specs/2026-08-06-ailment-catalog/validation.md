# Ailment Catalog — Validation

## Merge standard

This feature can be merged only when every required check passes on the feature branch and in CI. A failed required check blocks merge. A check that cannot run because of an environmental limitation must be reported as blocked with the limitation and available evidence; it must not be skipped silently or treated as passing.

## 1. Scope and model review

Inspect the Prisma schema, migration, seed data, API contract, routes, pages, and dependencies.

Confirm that:

1. Ailment contains only stable UUID `id`, required `name`, `summary`, and `description` fields, except for an explicitly justified repository requirement;
2. every exposed field is required for identity, routing, catalog display, or detail content;
3. only read-only list and detail operations exist;
4. no mutation endpoint, advanced filter, category, fuzzy search, ranking, autocomplete, pagination, recommendation, relationship, appointment, authentication, or analytics behavior exists; and
5. Agent functionality is unchanged unless a strictly necessary shared improvement was reported before implementation.

**Success:** the implementation is the smallest useful Phase 4 slice and contains no speculative or later-phase functionality.

## 2. Migration compatibility and Agent preservation

Using isolated temporary SQLite databases:

1. generate the Prisma client with the documented command;
2. apply all migrations to a clean database;
3. prepare a separate completed Phase 3 database with its Agent records;
4. upgrade the Phase 3 database through Phase 4;
5. compare the resulting Ailment schema and migration history;
6. verify the pre-upgrade Agent IDs, values, and count remain unchanged; and
7. redeploy migrations to both databases.

**Success:** clean and upgraded databases have the expected schema, prior migration history and Agent records are preserved, and migration redeployment succeeds as a no-op.

## 3. Deterministic, repeat-safe seed

Against an isolated migrated database:

1. run the documented seed command;
2. capture all Ailment IDs, values, count, and order-relevant data, plus the Agent records;
3. run the same seed command again; and
4. compare the complete relevant database state.

**Success:** both runs exit zero, create no duplicates, produce the same stable Ailments, preserve the same Agents, leave migration history unchanged, and contain only neutral demonstration content.

## 4. Complete Ailment list API

Exercise `GET /ailments` with focused automated tests for:

1. the complete seeded result;
2. an empty database;
3. explicit `name ASC`, then `id ASC`, ordering, including tie cases;
4. the approved response shape and exclusion of internal fields; and
5. a simulated unexpected database or service failure.

**Success:** populated and empty responses follow the contract, ordering is deterministic, and failures return a safe `500` without internal-data leakage.

## 5. Ailment search API

Exercise `GET /ailments?q=<term>` with focused automated tests for:

1. case-insensitive matches by `name`;
2. case-insensitive matches by `summary`;
3. surrounding-whitespace trimming;
4. absent, empty, and whitespace-only queries returning the complete list;
5. a valid query with no matches returning a successful empty list;
6. filtered results retaining `name ASC`, then `id ASC`, ordering;
7. input exactly at the documented maximum length;
8. input exceeding the maximum length returning a safe `400` response; and
9. query values containing SQL metacharacters being handled as data through Prisma parameters.

**Success:** search follows the exact normalization, matching, ordering, length, safety, and empty-result contract without raw SQL, fuzzy behavior, or ranking.

## 6. Ailment detail API

Exercise `GET /ailments/:id` with focused automated tests for:

1. a valid seeded UUID;
2. an unknown valid UUID;
3. malformed identifiers, including representative boundary cases;
4. approved response fields only; and
5. a simulated unexpected database or service failure.

**Success:** a known record returns the approved DTO, malformed input returns safe `400`, an unknown UUID returns safe `404`, and unexpected failure returns safe `500`, with no stack trace, query, path, secret, or database detail exposed.

## 7. Catalog page states and search behavior

Use focused UI tests and browser validation to confirm:

1. the complete catalog renders in API order within the existing shell;
2. the search form has a persistent visible label, text input, and keyboard-operable submit action;
3. filtered results reflect the submitted query;
4. the search term is encoded in the URL and restored in the input and results after refresh or direct navigation;
5. each result is a meaningful, keyboard-focusable detail link;
6. no-results and empty-catalog messages are distinct;
7. loading feedback is accessible where visibly rendered; and
8. a server failure produces a safe, actionable, retryable state that preserves navigation.

**Success:** complete, filtered, no-results, empty, loading, and error states render as specified, and search remains usable and linkable without a pointer device.

## 8. Detail page states

Use focused UI tests and browser validation to confirm:

1. approved content for a seeded Ailment renders with semantic headings and structure;
2. the page includes an obvious keyboard-focusable route back to the catalog;
3. loading feedback is accessible where visibly rendered;
4. an unknown Ailment renders the established not-found experience; and
5. a server failure renders a distinct safe, actionable, retryable error state.

**Success:** valid detail, loading, not-found, and error states are unambiguous, safe, and keyboard navigable.

## 9. Accessibility and responsive behavior

Validate the complete catalog, filtered results, no-results, empty catalog, loading, detail, not-found, and error experiences at representative mobile and desktop viewports, including 320 CSS pixels and 400% zoom where required by existing conventions.

Confirm that:

1. content and controls reflow without horizontal page scrolling or loss of functionality;
2. landmarks, headings, forms, labels, lists, links, and status messages use semantic markup;
3. focus order and focus indication are logical and visible;
4. search and navigation work entirely by keyboard;
5. accessible names, announcements, and color contrast meet WCAG 2.2 AA; and
6. browser accessibility checks report no blocking violations.

**Success:** all catalog and detail states are usable by keyboard and at mobile, desktop, and required zoom conditions with no blocking accessibility defect.

## 10. Server-only database ownership

Inspect manifests, imports, build output, server queries, and web data fetching, and run the existing automated boundary checks.

Confirm that:

1. Prisma schema, generated client, migrations, seed logic, and database queries remain under the NestJS server;
2. the web application obtains Ailment data only from the server HTTP API;
3. the web application has no Prisma or SQLite dependency or import;
4. no database path, connection configuration, query, or generated artifact is exposed to browser code; and
5. search uses parameterized Prisma operations rather than constructed raw SQL.

**Success:** source review and automated checks prove SQLite remains exclusively server-owned and untrusted search input cannot become executable SQL.

## 11. Phase 2 and Phase 3 regression

Run the established persistence and Agent directory validation workflows, including:

1. clean migration, repeated migration, and repeat-safe seed;
2. server-owned Prisma queries and temporary-artifact cleanup;
3. Agent list and detail API tests;
4. Agent directory list, detail, loading, empty, not-found, and error tests; and
5. the existing Agent browser journey and accessibility checks.

**Success:** Phase 2 persistence and Phase 3 Agent directory behavior pass unchanged, Agent data is preserved, and no new process, locked file, or cleanup regression appears.

## 12. Absence of mutation and later-phase behavior

Inspect registered routes, API tests, UI controls, Prisma relations, and source changes.

Confirm that:

1. no POST, PUT, PATCH, or DELETE Ailment route is registered;
2. no create, edit, or delete control appears in the UI;
3. no Agent-to-Ailment or Therapy relationship exists;
4. no recommendation, appointment, authentication, filter, category, pagination, or analytics behavior is present; and
5. no unrelated Agent change or speculative shared abstraction was introduced.

**Success:** route inspection, automated checks, and source review demonstrate strict Phase 4 scope.

## 13. Repository quality and runtime checks

Run the repository's existing documented commands for:

1. Prisma client generation;
2. formatting verification;
3. linting;
4. strict TypeScript checking;
5. unit, focused, integration, and root validation tests;
6. production server and web builds;
7. runtime smoke tests;
8. browser tests; and
9. `git diff --check`.

**Success:** every required command exits zero locally where the environment supports it and in CI. Any environmental limitation is explicitly reported as blocked, never passed, and no required check is silently skipped.

## 14. Mission and constitutional review

Confirm that:

- catalog language is warm, respectful, neutral, educational, and does not imply diagnosis or personalized medical advice as required by [the mission](../mission.md);
- the implementation follows [the technical constitution](../tech-stack.md), including strict TypeScript, NestJS authority, validated boundaries, server-only Prisma access, server-rendered pages by default, responsive design, and WCAG 2.2 AA;
- the work meets every item in [requirements.md](requirements.md);
- the workflow remains straightforward for students and quick to demonstrate; and
- no unexplained deviation or later roadmap phase was introduced.

**Success:** review finds no unresolved requirement, architectural violation, misleading health claim, or scope expansion.

## Merge checklist

- [ ] The Ailment model contains only stable UUID `id`, required `name`, `summary`, and `description`, unless an equivalent representation is explicitly justified.
- [ ] Clean and completed Phase 3 databases migrate to the same Phase 4 schema.
- [ ] Migration redeployment succeeds as a no-op and prior history remains intact.
- [ ] Seeding twice produces identical stable Ailments without duplicates and preserves Agents.
- [ ] The complete list API passes populated, empty, ordering, contract, and safe-failure tests.
- [ ] Search passes case-insensitive name and summary, trimming, blank, no-result, ordering, length-boundary, excessive-input, and parameter-safety tests.
- [ ] Detail passes valid, malformed, unknown, contract, and safe-failure tests.
- [ ] Safe `400`, `404`, and `500` responses expose no internal data.
- [ ] Catalog tests cover complete, filtered, no-results, empty, loading, and retryable error states.
- [ ] Detail tests cover valid, loading, not-found, and retryable error states.
- [ ] Search terms persist in linkable URLs and survive refresh.
- [ ] Keyboard navigation, search labeling, browser accessibility checks, responsive layouts, and required 400% zoom checks pass.
- [ ] Automated checks preserve NestJS-only database ownership and parameterized Prisma access.
- [ ] Phase 2 persistence and Phase 3 Agent directory regressions pass.
- [ ] No mutation endpoint or later-phase functionality is present.
- [ ] Prisma generation, formatting, linting, strict type checking, validation tests, builds, smoke tests, browser tests, and `git diff --check` all pass.
- [ ] Branch CI passes the complete required command sequence.
- [ ] Environmental limitations, if any, are reported as blocked and are not marked as passes.
- [ ] Requirements, mission, technical constitution, and scope reviews pass.
