# Agent Directory — Validation

## Merge standard

This feature can be merged only when every required check passes on the feature branch and in CI. A failed required check blocks merge. A check that cannot run because of an environmental limitation must be reported separately with the limitation and available evidence; it must not be treated as passing.

## 1. Scope and model review

Inspect the Prisma schema, migration, seed data, Agent API contract, and pages.

Confirm that:

1. every Agent field is necessary for stable identity, routing, list display, or detail display;
2. the model contains no ailment, therapy, appointment, authentication, scheduling, or speculative clinical fields;
3. the API supports only read-only list and detail operations; and
4. no search, filtering, pagination, create, update, or delete behavior is present.

**Success:** the implementation is the smallest useful Phase 3 slice and contains no later-phase functionality.

## 2. Migration compatibility

Using isolated temporary SQLite databases:

1. apply all committed migrations to a clean database;
2. apply the Phase 2 migrations to another database, then upgrade it through Phase 3;
3. inspect the resulting schema and migration history; and
4. reapply committed migrations to both databases.

**Success:** clean and upgraded databases have the expected Agent schema, Phase 2 history is preserved, and reapplication succeeds as a no-op.

## 3. Deterministic, repeat-safe seed

Against a migrated temporary database:

1. run the documented seed command;
2. capture Agent identifiers, field values, count, and query ordering;
3. run the same seed command again; and
4. compare the resulting records and relevant database state.

**Success:** both runs exit zero, create no duplicates, preserve the same stable records and ordering, and leave migration history unchanged.

## 4. Agent list API

Exercise the list endpoint with focused automated tests for:

1. the complete seeded result;
2. explicit deterministic ordering, including the stable tie-breaker;
3. an empty database;
4. response shape and exclusion of unapproved fields; and
5. a simulated database or service failure.

**Success:** populated and empty responses follow the documented contract and status codes, ordering is stable, and failures produce the existing safe server-error response without internal details.

## 5. Agent detail API

Exercise the detail endpoint with focused automated tests for:

1. each supported form of a valid route identifier;
2. a seeded Agent;
3. an unknown but valid identifier;
4. invalid untrusted input where applicable; and
5. a simulated database or service failure.

**Success:** valid records return only approved fields, missing records use the established not-found response, invalid input is rejected at the NestJS boundary, and failures do not leak internals.

## 6. Agent list page

Use focused UI tests and browser validation to confirm:

1. the page uses the existing shell and exposes one clear page heading;
2. seeded agents appear in deterministic order as a semantic list;
3. every agent has a meaningful, keyboard-focusable detail link;
4. loading feedback is accessible when visibly rendered;
5. the empty state clearly differs from an error; and
6. the server-error state is safe, actionable, and preserves navigation.

**Success:** each state renders as specified and a keyboard user can reach and activate every agent link.

## 7. Agent detail page

Use focused UI tests and browser validation to confirm:

1. a seeded Agent's approved fields render with semantic headings and labels;
2. the page contains an obvious keyboard-focusable route back to the directory;
3. an unknown agent produces the existing not-found experience;
4. a server failure produces a distinct safe error experience; and
5. loading feedback is accessible when visibly rendered.

**Success:** the valid, not-found, loading, and failure scenarios are unambiguous, and directory navigation works without a pointer device.

## 8. Responsive and accessibility review

Validate the populated list, empty list, valid detail, not-found, and server-error experiences at representative mobile and desktop viewports, including a 320 CSS-pixel width and 400% zoom where applicable.

Confirm that:

1. content reflows without horizontal page scrolling or loss of functionality;
2. headings, lists, landmarks, labels, and links use semantic markup;
3. focus order is logical and visible;
4. meaningful controls and status messages have accessible names or announcements;
5. color contrast meets WCAG 2.2 AA; and
6. automated accessibility smoke checks report no blocking violations.

**Success:** the directory and detail journeys are usable by keyboard and at mobile and desktop layouts, with no blocking accessibility defect.

## 9. Server-only database boundary

Inspect manifests, imports, build output, and data-fetching code, and run the existing automated boundary check.

Confirm that:

1. Prisma schema, generated client, migrations, seed, and database queries remain under the NestJS server;
2. the web application obtains Agent data only from the server HTTP API;
3. the web application has no Prisma or SQLite dependency or import; and
4. no database path or connection configuration is exposed to browser code.

**Success:** source review and automated checks prove that only the server accesses SQLite through Prisma.

## 10. Phase 2 persistence regression

Run the established Phase 2 validation workflow with Phase 3 included:

1. generate the Prisma client;
2. migrate a clean temporary database;
3. reapply migrations successfully;
4. run the seed twice;
5. query through the NestJS Prisma boundary; and
6. verify cleanup removes temporary database artifacts and releases connections.

**Success:** the persistence workflow remains repeatable, isolated, server-owned, and free of locked files or hanging processes.

## 11. Repository quality and runtime checks

Run the repository's existing documented commands for:

1. formatting verification;
2. linting;
3. strict TypeScript checking;
4. automated unit, focused, and validation tests;
5. production server and web builds;
6. existing runtime smoke tests; and
7. browser tests, including the Phase 3 directory-to-detail journey.

**Success:** every required command exits zero locally where the environment supports it and in CI; no required failure is waived or reported as passing.

## 12. Mission and constitutional review

Confirm that:

- the experience is warm, professional, concise, and respectful as required by [the mission](../mission.md);
- the implementation follows [the technical constitution](../tech-stack.md), including strict TypeScript, server-rendered pages by default, NestJS authority, server-only Prisma access, responsive design, and WCAG 2.2 AA;
- the work meets every item in [requirements.md](requirements.md);
- the workflow remains straightforward for students and quick to demonstrate; and
- no unexplained deviation or later roadmap phase was introduced.

**Success:** review finds no unresolved requirement, architectural violation, or scope expansion.

## Merge checklist

- [ ] The Agent model contains only justified fields and constraints.
- [ ] Clean and Phase 2 databases migrate successfully to the same Phase 3 schema.
- [ ] Reapplying migrations succeeds without destructive changes.
- [ ] Seeding twice produces the same stable Agents without duplicates.
- [ ] The list API passes populated, empty, ordered, contract, and failure tests.
- [ ] The detail API passes valid, not-found, input-validation, contract, and failure tests.
- [ ] List and detail pages pass valid, loading, empty or not-found, and server-error tests as applicable.
- [ ] Keyboard navigation and basic accessibility checks pass.
- [ ] Mobile and desktop layouts pass responsive validation.
- [ ] Automated checks preserve the NestJS-only database boundary.
- [ ] The complete Phase 2 persistence workflow still passes.
- [ ] Formatting, linting, strict type checking, all automated tests, production builds, smoke tests, and browser tests pass.
- [ ] Branch CI passes the complete required command sequence.
- [ ] Environmental limitations, if any, are reported separately and are not marked as passes.
- [ ] Requirements, mission, technical constitution, and scope reviews pass.
