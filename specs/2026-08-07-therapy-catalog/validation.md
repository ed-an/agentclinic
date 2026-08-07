# Therapy Catalog — Validation

## Merge standard

This feature can be merged only when every required check passes on the feature branch and in CI. A failed required check blocks merge. A check that cannot run because of an environmental limitation must be reported as blocked with the limitation and available evidence; it must not be skipped silently or treated as passing. Do not use `sudo` to bypass an environment limitation.

## 1. Scope and model review

Inspect the Prisma schema, migration, seeds, API contracts, routes, pages, controls, and dependencies.

Confirm that:

1. Therapy contains only stable UUID `id`, required unique `name`, `summary`, and `description`;
2. Ailment and Therapy use the simplest sufficient many-to-many relationship with no association metadata;
3. only read-only list, detail, and association behavior exists;
4. any associated Ailments shown on Therapy detail remain a small informational list rather than a second recommendation workflow; and
5. no treatment plans, effectiveness or risk data, personalization, Agent relationship, appointment, mutation, authentication, advanced filtering, pagination, analytics, or other later-phase behavior exists.

**Success:** the implementation is the smallest useful Phase 5 slice and contains no speculative or later-phase functionality.

## 2. Migration compatibility and prior-data preservation

Using isolated temporary SQLite databases:

1. use Node 24.19.0 and generate the Prisma client with the documented command;
2. apply all migrations to a clean database;
3. prepare a separate completed Phase 4 database containing its established Agent and Ailment records;
4. upgrade the Phase 4 database through Phase 5;
5. compare the resulting schema and migration history;
6. verify all pre-upgrade Agent and Ailment IDs, values, and counts remain unchanged; and
7. redeploy migrations to both databases.

**Success:** clean and upgraded databases have the expected Therapy and association schema, prior records and migration history are preserved, and migration redeployment succeeds as a no-op.

## 3. Deterministic, repeat-safe seed

Against an isolated migrated database:

1. run the documented seed command;
2. capture all Therapy and association IDs or compound keys, values, and counts, plus all Agent and Ailment records;
3. run the same seed command again;
4. compare the complete relevant state; and
5. inspect content and associations for scope and neutral wording.

**Success:** both runs exit zero; produce identical stable Therapies and associations; contain no duplicate Therapy names or association rows; preserve Agent and Ailment records; leave migration history unchanged; and introduce no diagnosis, prescription, effectiveness, or personalized-advice claims.

## 4. Therapy list API

Exercise `GET /therapies` with focused automated tests for:

1. the complete seeded result;
2. an empty database;
3. explicit `name ASC`, then `id ASC`, ordering, including tie-relevant fixtures where possible;
4. approved response fields and exclusion of internal fields; and
5. a simulated unexpected database or service failure.

**Success:** populated and empty responses follow the contract, ordering is deterministic, and unexpected failure returns a safe `500` without internal-data leakage.

## 5. Therapy detail API

Exercise `GET /therapies/:id` with focused automated tests for:

1. a valid seeded UUID;
2. an unknown valid UUID;
3. malformed identifiers and representative boundary cases;
4. approved response fields only;
5. associated Ailment ordering and minimal shape if included; and
6. a simulated unexpected database or service failure.

**Success:** a known Therapy returns the approved DTO; malformed input returns safe `400`; an unknown UUID returns safe `404`; and unexpected failure returns safe `500`, with no stack trace, query, path, secret, or database detail exposed.

## 6. Ailment-to-Therapy API

Exercise `GET /ailments/:id/therapies`, or the documented equivalent Ailment detail contract, with focused tests for:

1. a known Ailment associated with multiple Therapies;
2. explicit Therapy ordering by `name ASC`, then `id ASC`;
3. a Therapy associated with multiple Ailments;
4. a known Ailment with no associated Therapies returning a successful empty collection;
5. a Therapy with no associated Ailments if allowed by the model;
6. an unknown valid Ailment UUID;
7. malformed Ailment identifiers; and
8. a simulated unexpected database or service failure.

**Success:** all required cardinalities and empty associations follow the deterministic contract, malformed and unknown inputs return safe `400` and `404` responses, and unexpected failures return safe `500` without internal-data leakage.

## 7. Therapy catalog page states

Use focused UI tests and browser validation to confirm:

1. the catalog renders in API order within the existing shell;
2. each Therapy is represented in a semantic list with a meaningful keyboard-focusable detail link;
3. an empty catalog displays a distinct explanatory state;
4. loading feedback is accessible wherever visibly rendered; and
5. a server failure displays a safe, actionable, retryable state that preserves navigation.

**Success:** populated, empty, loading, and error states are distinct, semantically correct, and usable without a pointer.

## 8. Therapy detail page states

Use focused UI tests and browser validation to confirm:

1. approved Therapy content renders with semantic headings and structure;
2. the page includes an obvious keyboard-focusable route back to the catalog;
3. associated Ailments, if included, use neutral wording, semantic markup, deterministic order, and meaningful links;
4. loading feedback is accessible wherever visibly rendered;
5. an unknown Therapy renders the established not-found experience; and
6. a server failure renders a distinct safe, actionable, retryable state.

**Success:** valid detail, loading, not-found, and error states are unambiguous, safe, and keyboard navigable, with no complex reverse recommendation workflow.

## 9. Ailment-to-Therapy page journey

Use focused UI tests and complete Playwright coverage to confirm:

1. a known Ailment detail displays all associated Therapies in deterministic order;
2. an Ailment with multiple Therapies displays each one exactly once;
3. each association is a meaningful, keyboard-focusable link;
4. following a link opens the correct Therapy detail;
5. an Ailment with no Therapies displays the distinct no-association state;
6. unknown Ailment behavior remains a not-found state;
7. loading feedback is accessible wherever visibly rendered; and
8. association-fetch failure produces a safe, actionable, retryable state without exposing internals.

**Success:** an agent can reliably move from an Ailment to related Therapy information and distinguish no associations, missing content, loading, and service failure.

## 10. Accessibility and responsive behavior

Using the previously successful Playwright environment, validate catalog, Therapy detail, associated-Therapy, empty, no-association, loading, not-found, and error experiences at representative mobile and desktop viewports, including 320 CSS pixels and 400% zoom where required by existing conventions.

Confirm that:

1. content and controls reflow without horizontal page scrolling or loss of functionality;
2. landmarks, headings, lists, links, and status messages use semantic markup;
3. focus order and indication are logical and visible;
4. catalog and cross-resource navigation work entirely by keyboard;
5. accessible names, announcements, and contrast meet WCAG 2.2 AA; and
6. browser accessibility checks report no blocking violation.

**Success:** every Phase 5 state is usable by keyboard at mobile, desktop, and required zoom conditions with no blocking accessibility defect.

## 11. Server-only database ownership

Inspect manifests, imports, build output, server queries, and web data fetching, and run existing automated boundary checks.

Confirm that:

1. Prisma schema, generated client, migrations, seeds, relations, and database queries remain under the NestJS server;
2. the web application obtains Therapy and association data only from the server HTTP API;
3. the web application has no Prisma or SQLite dependency or import; and
4. no database path, configuration, query, or generated artifact reaches browser code.

**Success:** source review and automated checks prove all Prisma and SQLite access remains exclusively server-owned.

## 12. Phase 2, Phase 3, and Phase 4 regression

Run the established validation workflows for:

1. clean and repeated migration and repeat-safe seed behavior;
2. server-owned persistence and temporary-artifact cleanup;
3. Agent list and detail APIs and web journeys;
4. Ailment list, search, detail, APIs, page states, and browser journey;
5. prior accessibility and responsive checks; and
6. existing smoke tests and source-boundary checks.

**Success:** Phase 2 persistence, Phase 3 Agent directory, and Phase 4 Ailment catalog pass unchanged, their data is preserved, and Phase 5 causes no cleanup, locked-file, contract, or behavior regression.

## 13. Failure safety

Exercise or simulate all relevant boundary and service failures and inspect response bodies and rendered messages.

Confirm that:

1. malformed Therapy and Ailment identifiers produce safe `400` responses;
2. unknown valid identifiers produce safe `404` responses;
3. unexpected failures produce safe `500` responses;
4. no stack trace, raw query, schema detail, filesystem path, secret, connection string, or sensitive record data is exposed; and
5. web errors are actionable and retryable while preserving useful navigation.

**Success:** API and web failure behavior is correctly classified, safe, understandable, and free of internal-data leakage.

## 14. Absence of mutation and later-phase behavior

Inspect registered routes, API tests, UI controls, Prisma relations, source changes, and dependencies.

Confirm that:

1. no POST, PUT, PATCH, or DELETE Therapy or association route is registered;
2. no create, edit, delete, rank, score, assess, recommend, schedule, or book control appears;
3. no Agent-to-Therapy, Appointment, authentication, treatment-plan, personalization, filtering, pagination, or analytics behavior exists;
4. the association contains no metadata; and
5. no unrelated Agent or Ailment change or speculative abstraction was introduced.

**Success:** route inspection, automated checks, and source review demonstrate strict Phase 5 scope.

## 15. Repository quality and runtime checks

With Node 24.19.0 and the previously successful Playwright environment, run the repository's existing documented commands for:

1. Prisma client generation;
2. formatting verification;
3. linting;
4. strict TypeScript checking;
5. automated unit, focused, integration, and root validation tests;
6. production server and web builds;
7. runtime smoke tests;
8. the complete Playwright browser suite; and
9. `git diff --check`.

**Success:** every required command exits zero locally where supported and in CI. Environmental limitations are explicitly reported as blocked, never passed; no check is silently skipped and `sudo` is not used.

## 16. Mission and constitutional review

Confirm that:

- language is warm, respectful, neutral, and educational and never implies diagnosis, prescription, guaranteed treatment, or personalized medical advice as required by [the mission](../mission.md);
- the implementation follows [the technical constitution](../tech-stack.md), including strict TypeScript, NestJS authority, server-only Prisma, validated boundaries, server-rendered pages by default, responsive design, and WCAG 2.2 AA;
- both standalone Therapy and Ailment-to-Therapy journeys meet [requirements.md](requirements.md);
- the workflow remains straightforward for students and quick to demonstrate; and
- no unexplained deviation or later roadmap phase was introduced.

**Success:** review finds no unresolved requirement, architectural violation, misleading health claim, or scope expansion.

## Merge checklist

- [ ] Therapy contains only stable UUID `id`, required unique `name`, `summary`, and `description`.
- [ ] Ailment and Therapy use a simple many-to-many relation with no association metadata.
- [ ] Clean and completed Phase 4 databases migrate to the same Phase 5 schema.
- [ ] Migration redeployment is a no-op and prior history remains intact.
- [ ] Seeding twice produces identical Therapies and associations without duplicates or drift.
- [ ] Existing Agent and Ailment records and behavior are preserved.
- [ ] Therapy list passes populated, empty, deterministic-order, contract, and safe-failure tests.
- [ ] Therapy detail passes valid, malformed, unknown, contract, and safe-failure tests.
- [ ] Ailment-to-Therapy behavior covers multiple, shared, absent, malformed, unknown, and failure cases.
- [ ] Safe `400`, `404`, and `500` responses expose no internal data.
- [ ] Catalog tests cover populated, empty, loading, and retryable error states.
- [ ] Detail tests cover valid, loading, not-found, and retryable error states.
- [ ] Ailment detail tests cover associated links, no associations, navigation, loading, not-found, and retryable errors.
- [ ] Keyboard navigation, semantic accessibility, Playwright accessibility checks, responsive layouts, and required 400% zoom checks pass.
- [ ] Automated checks preserve NestJS-only Prisma and SQLite ownership.
- [ ] Phase 2 persistence, Phase 3 Agent directory, and Phase 4 Ailment catalog regressions pass.
- [ ] No mutation, association metadata, personalization, appointment, authentication, or other later-phase functionality exists.
- [ ] Prisma generation, formatting, linting, strict type checking, validation tests, production builds, smoke tests, complete Playwright tests, and `git diff --check` all pass.
- [ ] Branch CI passes the complete required command sequence.
- [ ] Environmental limitations are reported as blocked and are never marked as passes.
- [ ] Requirements, mission, technical constitution, and scope reviews pass.
