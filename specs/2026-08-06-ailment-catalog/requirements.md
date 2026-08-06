# Ailment Catalog — Requirements

## Context

This feature delivers Phase 4, **Ailment catalog**, from [the roadmap](../roadmap.md). Phase 2 established server-owned SQLite persistence through Prisma, and Phase 3 added the Agent directory. This phase adds a small read-only catalog that lets visitors find an ailment by name and read its description without introducing therapies, recommendations, or personalized care behavior.

The work supports [the mission](../mission.md) by helping agents describe concerns in neutral, respectful language while avoiding medical diagnosis or advice. It follows [the technical constitution](../tech-stack.md): Prisma and SQLite remain inside the NestJS server, the Next.js application consumes the HTTP API, pages render on the server by default, untrusted input is validated at the API boundary, and the experience remains accessible and responsive.

## Goal

Provide a focused ailment catalog in which:

- deterministic Ailment records can be migrated and seeded without disturbing Agent records;
- the server exposes read-only, searchable list and detail APIs;
- visitors can browse or search the catalog and open a separate detail page; and
- required persistence, API, UI, accessibility, responsive, boundary, and regression checks prove the slice is merge-ready.

## Decisions

1. Implement exactly the Phase 4 roadmap scope: a minimal Ailment model and deterministic seed data, read-only searchable list and detail APIs, and connected catalog and detail pages.
2. Use these Ailment fields unless an existing repository constraint requires an equivalent representation:
   - `id`: stable UUID;
   - `name`: required name;
   - `summary`: concise catalog description; and
   - `description`: fuller detail-page content.
3. Use stable, repeat-safe, realistic, fictional seed records written in neutral educational language. Catalog content must not present itself as diagnosis, personalized advice, or real medical guidance.
4. Follow existing repository conventions and the Phase 3 Agent directory patterns where applicable. Do not modify Agent functionality unless a small shared improvement is strictly necessary and is reported before implementation.
5. Expose `GET /ailments` and `GET /ailments/:id`, following the repository's existing API versioning convention, and web routes `/ailments` and `/ailments/[id]`.
6. Accept search through `GET /ailments?q=<term>`. Trim surrounding whitespace; treat absent, empty, and whitespace-only values as an unfiltered list; search case-insensitively across `name` and `summary`; and return an empty list for a valid query with no matches.
7. Apply one reasonable, documented maximum length to `q` at the NestJS boundary. Reject excessive input with a safe `400` response. Do not truncate it silently.
8. Return list results in explicit `name ASC`, then `id ASC`, order for both complete and filtered lists.
9. Use parameterized Prisma queries only. Do not construct raw SQL.
10. Keep Prisma and SQLite access exclusively in the NestJS server. The Next.js application obtains Ailment data only through the server HTTP API.
11. Represent the submitted search term in the page URL so filtered results are linkable and survive refresh.
12. Prefer server-rendered pages and reuse the existing shell, navigation, visual tokens, status patterns, API conventions, and responsive and accessibility approaches.

## Functional requirements

### Ailment persistence and seed data

- Extend the Prisma schema with only the four approved Ailment fields and constraints needed for stable identity and valid display data.
- Store `id` as a stable UUID and require `name`, `summary`, and `description`.
- Create a named migration that upgrades a completed Phase 3 database without rewriting prior migration history or losing Agent records.
- Extend the existing server-owned seed workflow with a small deterministic set of demonstration Ailments.
- Use stable IDs and repeat-safe writes so repeated seeds do not duplicate or drift records.
- Preserve all Phase 3 Agent seed records and behavior.
- Do not add speculative fields or relationships.

### Read-only server API

- Add an Ailment domain capability following the existing NestJS module, controller, service, repository-boundary, DTO, and error conventions.
- `GET /ailments` returns all Ailments when `q` is absent, empty, or whitespace-only.
- A non-empty valid `q` is trimmed and matched case-insensitively against both `name` and `summary` using Prisma query parameters.
- Complete and filtered results use `name ASC`, then `id ASC`, ordering.
- A valid query with no matches returns a successful empty list.
- The selected query-length maximum is documented in code and tests; overlong input receives a safe `400` response.
- `GET /ailments/:id` validates the stable UUID at the NestJS boundary, returns one approved response DTO for a known ID, and returns safe `400` and `404` responses for malformed and unknown IDs respectively.
- Unexpected failures return the established safe `500` response without stack traces, database details, filesystem paths, secrets, raw queries, or other internal data.
- Controllers remain thin and persistence stays behind explicit server boundaries.
- No mutation endpoint is added.

### Catalog page

- Add `/ailments` using existing App Router and page-container conventions.
- Fetch data through the NestJS API, never through Prisma or SQLite.
- Render the complete catalog by default and filtered results after a search.
- Provide an accessible search form with a persistent visible label, text input, and submit control.
- Encode the submitted search term in the URL query string and restore it on refresh or direct navigation.
- Preserve API ordering and render results as a semantic list with meaningful links to detail pages.
- Distinguish a genuinely empty catalog from a valid search with no results.
- Provide clear complete-catalog, filtered-results, no-results, empty-catalog, loading, and safe retryable server-error states.

### Detail page

- Add `/ailments/[id]` using the same stable UUID as the API route.
- Fetch the selected Ailment through the NestJS detail API.
- Display the approved fields with semantic headings and clear content structure.
- Provide an obvious keyboard-operable route back to the catalog.
- Distinguish an unknown Ailment from a server failure.
- Provide loading, not-found, and safe retryable error states using existing conventions.

### Experience and failure handling

- Loading feedback is accessible wherever the rendering model produces a visible wait.
- Empty and no-results states explain their distinct conditions without suggesting a server failure.
- Error states are safe, actionable, retryable, and preserve useful navigation.
- Content and seeded examples use warm, neutral educational language and do not imply diagnosis or individualized advice.
- Pages work by keyboard and reflow from 320 CSS pixels through desktop widths without horizontal page scrolling, including at 400% zoom where required by existing validation conventions.

## Quality requirements

- Use strict TypeScript and existing formatting, linting, build, smoke, browser, and validation-test conventions.
- Meet WCAG 2.2 AA for the catalog, search, and detail journeys, including labeling, semantic structure, visible focus, keyboard navigation, status communication, contrast, and meaningful links.
- Add focused tests for migrations, repeat-safe seeding, Agent preservation, list and detail behavior, ordering, every specified query case, boundary validation, and safe `400`, `404`, and `500` responses.
- Add focused UI coverage for complete, filtered, no-results, empty, loading, detail, not-found, and error states, plus URL persistence.
- Add browser coverage for search and detail navigation, accessibility checks, keyboard use, representative mobile and desktop layouts, and 400% zoom where existing conventions require it.
- Preserve the Phase 2 persistence and Phase 3 Agent directory validation suites.
- Treat an environmental limitation as blocked and report it; never count an unexecuted or failed required check as passing.

## Out of scope

- Create, update, delete, or any other mutation operation.
- Authentication or authorization.
- Advanced filters, categories, fuzzy search, ranking, autocomplete, interactive sorting, or pagination.
- Recommendations, diagnosis, personalized medical advice, or real medical content.
- Agent-to-Ailment relationships.
- Therapy models or relationships, appointment behavior, scheduling, booking, or later roadmap functionality.
- Analytics or tracking.
- Direct web access to Prisma, SQLite, generated clients, migrations, or database files.
- Unrelated Agent changes, shell redesigns, API version changes, or speculative abstractions and fields.

## Completion outcome

A contributor can migrate a clean or completed Phase 3 database, seed it repeatedly without duplicates or loss of Agent records, browse or search a deterministically ordered catalog, follow a result to its detail page, and distinguish loading, empty, no-results, missing, and failed states. All database access remains server-only, no later-phase or mutation capability is present, and every required repository check passes.
