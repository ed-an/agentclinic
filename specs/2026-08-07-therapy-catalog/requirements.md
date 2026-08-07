# Therapy Catalog — Requirements

## Context

This feature delivers Phase 5, **Therapy catalog**, from [the roadmap](../roadmap.md). Phase 2 established server-owned SQLite persistence through Prisma, Phase 3 added the Agent directory, and Phase 4 added the read-only Ailment catalog. This phase adds Therapies and simple informational associations so an agent can browse Therapies independently or move from an Ailment to related Therapy information.

The work supports [the mission](../mission.md) by helping agents understand available care in a warm, clear, and respectful experience. Associations are informational only and must not imply diagnosis, prescription, guaranteed effectiveness, or personalized medical advice. The work follows [the technical constitution](../tech-stack.md): NestJS owns persistence and business rules, Next.js consumes the versioned HTTP API, pages render on the server by default, and all journeys remain accessible, responsive, and testable.

## Goal

Provide a focused Therapy catalog in which:

- deterministic Therapy records and Ailment associations migrate and seed without disturbing existing Agent or Ailment data;
- the server exposes read-only Therapy list, detail, and Ailment-association data;
- visitors can browse a Therapy catalog, open Therapy details, and follow associated Therapy links from an Ailment detail page; and
- persistence, API, UI, accessibility, responsive, architectural, and regression checks prove the slice is merge-ready.

## Decisions

1. Implement exactly Phase 5: a minimal Therapy model with deterministic seed data, a read-only catalog and detail view, many-to-many Ailment associations, navigation from Ailment detail to associated Therapies, and complete loading, empty, not-found, and safe error states.
2. Therapy contains only:
   - `id`: stable UUID;
   - `name`: required and unique;
   - `summary`: concise catalog description; and
   - `description`: fuller detail content.
3. Model Ailment and Therapy as many-to-many because each Ailment may relate to multiple Therapies and each Therapy may relate to multiple Ailments.
4. Use the simplest Prisma relationship satisfying current requirements. The association has no metadata such as ranking, effectiveness, priority, recommendation reason, timestamps, or ownership.
5. Use stable identifiers and deterministic, repeat-safe seed data and associations. Repeated seeds must not duplicate or unexpectedly change Therapy, Ailment, Agent, or association records.
6. Follow established Agent and Ailment conventions where applicable and preserve all existing behavior unless a strictly necessary shared change is reported before implementation.
7. Prefer `GET /therapies`, `GET /therapies/:id`, and `GET /ailments/:id/therapies`. The relationship may instead be included in the Ailment detail response only when that is demonstrably simpler and consistent with existing API conventions.
8. Add `/therapies` and `/therapies/[id]`. The Ailment detail page links to its associated Therapies.
9. Therapy detail may list associated Ailments only when it remains a simple informational list and does not create a second or more complex recommendation workflow.
10. Order Therapies and any displayed associated Ailments by `name ASC`, then `id ASC`.
11. Keep Prisma and SQLite access exclusively in the NestJS server. The web application consumes only the server API.
12. Prefer server-rendered pages and reuse the established shell, navigation, design tokens, status patterns, API conventions, and accessibility and responsive approaches.
13. Use neutral educational wording. Associations mean related informational content only.

## Functional requirements

### Therapy persistence and associations

- Add the four approved Therapy fields and no speculative fields.
- Store `id` as a stable UUID; require `name`, `summary`, and `description`; enforce unique Therapy names.
- Add a simple many-to-many relationship between Ailment and Therapy with database-enforced association integrity and no association metadata.
- Create a named migration that upgrades a completed Phase 4 database without rewriting migration history or losing Agent or Ailment records.
- The complete migration chain must work against a clean database, upgrade a completed Phase 4 database, and redeploy as a no-op.
- Extend the existing server seed workflow with a small deterministic set of fictional Therapies and stable associations.
- Repeat-safe writes must prevent duplicate Therapies and association rows and preserve established Agent and Ailment data.
- Seed coverage must include an Ailment with multiple Therapies, a Therapy with multiple Ailments, and an Ailment with no Therapies. Include a Therapy with no Ailments if the selected Prisma model permits it without added complexity.

### Read-only server API

- Add a Therapy domain capability following existing NestJS module, controller, service, repository-boundary, DTO, validation, and error conventions.
- `GET /therapies` returns approved list fields in explicit `name ASC`, then `id ASC`, order and returns a successful empty list when no Therapies exist.
- `GET /therapies/:id` validates UUID input at the NestJS boundary and returns approved detail fields for a known Therapy.
- A malformed Therapy identifier returns a safe `400`; an unknown valid Therapy identifier returns a safe `404`.
- Expose associated Therapies for a known Ailment through `GET /ailments/:id/therapies` unless the documented Ailment-detail response approach is simpler and matches repository conventions.
- The relationship contract returns associated Therapies in `name ASC`, then `id ASC`, order and returns a successful empty collection for an Ailment with no associations.
- Malformed and unknown Ailment identifiers retain safe `400` and `404` behavior; unexpected failures return a safe `500`.
- If Therapy detail contains associated Ailments, expose only the minimal linkable representation in `name ASC`, then `id ASC`, order.
- Safe failures expose no stack traces, database details, filesystem paths, secrets, raw queries, or other internal data.
- Controllers remain thin; Prisma and SQLite remain behind NestJS persistence boundaries.
- No Therapy or association mutation endpoint is added.

### Therapy catalog page

- Add `/therapies` using existing App Router and page-container conventions.
- Fetch only through the NestJS API and preserve API ordering.
- Render Therapies as a semantic list with meaningful, keyboard-focusable links to detail pages.
- Distinguish a genuinely empty catalog from loading and server failure.
- Provide loading feedback where visibly applicable and a safe, actionable, retryable error state that preserves useful navigation.

### Therapy detail page

- Add `/therapies/[id]` using the same stable UUID as the API.
- Fetch the Therapy only through the NestJS detail API.
- Display the approved fields with semantic headings and clear content structure.
- Provide obvious keyboard-operable navigation back to the catalog.
- Distinguish an unknown Therapy from a server failure and provide loading, not-found, and safe retryable error states.
- If associated Ailments are shown, present them only as a small informational semantic list with meaningful links and neutral wording.

### Ailment-to-Therapy journey

- Extend the existing Ailment detail page with an associated Therapies section sourced from the NestJS API.
- Render associated Therapies in deterministic API order with semantic headings, lists, and meaningful links.
- A visitor can follow an associated Therapy link to `/therapies/[id]` and access the full informational detail.
- An Ailment with no associated Therapies receives a distinct, reassuring empty-association message rather than a blank area or error.
- Unknown Ailments retain the established not-found experience; server failures remain distinct, safe, actionable, and retryable.
- Existing Ailment detail content and navigation remain intact.

### Experience and content

- The catalog, Therapy detail, and associated-Therapy section use semantic headings, lists, links, landmarks, and status communication.
- Every route and state is usable by keyboard with logical focus order and visible focus indication.
- Layouts reflow from 320 CSS pixels through desktop widths without horizontal page scrolling or loss of functionality, including required 400% zoom checks.
- Loading, empty catalog, no associations, not-found, and safe error states are visually and semantically distinct.
- Content is fictional, warm, neutral, and educational. It does not claim diagnosis, prescription, guaranteed treatment, effectiveness, risk, or personalized guidance.

## Quality requirements

- Use strict TypeScript and existing formatting, linting, build, smoke, validation, and Playwright conventions.
- Use Node 24.19.0 and the previously successful Playwright environment for required checks.
- Meet WCAG 2.2 AA for the implemented journeys, including semantic structure, keyboard operation, focus, status communication, contrast, and meaningful links.
- Add focused tests for migration compatibility, repeat-safe seeding, duplicate prevention, Agent and Ailment preservation, API response contracts, deterministic ordering, association cardinalities, boundary validation, and safe `400`, `404`, and `500` responses.
- Add UI tests for catalog and detail content, Ailment-to-Therapy navigation, empty catalog, no associations, loading, not-found, and retryable errors.
- Add complete browser coverage for the critical Phase 5 journeys, automated accessibility checks, representative mobile and desktop layouts, and required 400% zoom behavior.
- Preserve Phase 2 persistence, Phase 3 Agent directory, and Phase 4 Ailment catalog validation.
- Treat an environmental limitation as blocked and report it. Do not use `sudo`, silently skip required checks, or count unexecuted or failed checks as passing.

## Out of scope

- Treatment plans, clinical recommendations, effectiveness scores, risk classifications, ranking, priority, or recommendation reasons.
- Personalized advice, user assessments, diagnosis, prescription, or real medical guidance.
- Appointment availability, scheduling, booking, Appointment models, or other later roadmap phases.
- Agent-to-Therapy relationships.
- Create, update, delete, or any other mutation operation for Therapies or associations.
- Authentication or authorization.
- Advanced filtering, search, fuzzy matching, sorting controls, pagination, categories, or analytics.
- Association metadata or a complex reverse recommendation workflow from Therapy to Ailment.
- Direct web access to Prisma, SQLite, generated clients, migrations, seed code, or database files.
- Unrelated Agent or Ailment changes, shell redesigns, API-version changes, or speculative abstractions.

## Completion outcome

A contributor can migrate a clean or completed Phase 4 database, seed it repeatedly without duplicates or loss of prior records, browse a deterministically ordered Therapy catalog, open a Therapy detail, and move from an Ailment to its associated Therapies. Visitors can distinguish loading, empty, no-association, missing, and failed states; all database access remains server-only; no mutation or later-phase capability is present; and every required repository check passes.
