# Agent Directory — Requirements

## Context

This feature delivers Phase 3, **Agent directory**, from [the roadmap](../roadmap.md). Phase 2 established server-owned SQLite persistence through Prisma. This phase adds the first domain model and gives clinic staff a small, read-only directory backed by deterministic local data.

The work supports [the mission](../mission.md) by presenting agent information with warmth, clarity, and respect while remaining easy for students to understand and quick to demonstrate. It follows [the technical constitution](../tech-stack.md): Prisma and SQLite remain inside the NestJS server, the Next.js application consumes the server HTTP API, pages render on the server by default, and the experience is responsive and accessible.

## Goal

Provide a focused staff-facing agent directory in which:

- deterministic agent records can be migrated and seeded;
- the server exposes read-only agent list and detail APIs;
- staff can open a responsive list and navigate to a separate detail page; and
- automated validation covers persistence, API, UI, accessibility, and prior-phase behavior.

## Decisions

1. Implement Phase 3 exactly as defined in the roadmap: the Agent model, deterministic seed records, read-only list and detail APIs, and corresponding list and detail pages.
2. Use the smallest useful Agent model supported by the roadmap, mission, existing UI, and acceptance criteria. Each persisted field must be displayed, required for stable identity or routing, or needed for clear seeded demonstrations.
3. Follow existing repository conventions for NestJS modules, routes, API versioning, Next.js routes and components, styling, errors, and validation. Do not create a new convention for this phase.
4. Return agents in one explicit deterministic default order, with a stable secondary key when needed. Seed insertion order must not control API behavior.
5. Keep all Prisma and SQLite access in the NestJS server. The web application obtains agent data only through the server API.
6. Prefer direct, capability-focused services over speculative generic repository abstractions unless an existing architecture boundary requires one.
7. Provide clear loading, empty, not-found, and server-error experiences using accessible semantic markup and keyboard-operable navigation.
8. Use a professional, concise visual tone consistent with the existing warm clinic shell.

## Functional requirements

### Agent persistence and seed data

- Extend the Prisma schema with an `Agent` model containing only the fields necessary for a useful read-only directory and stable detail route.
- Enforce required values and stable uniqueness in the database where appropriate.
- Create and commit a named migration that upgrades the Phase 2 schema without replacing or rewriting its migration history.
- Extend the existing server-owned seed workflow with a small, deterministic set of fictional agents suitable for course and conference demonstrations.
- Use stable identifiers and values so repeated seeds result in the same records and do not create duplicates.
- Do not store real medical information or imply real medical advice.

### Read-only server API

- Add an Agent domain module following the server's existing organization and API conventions.
- Expose a list operation that returns all seeded agents in the documented deterministic order.
- Expose a detail operation that resolves one agent by the stable route identifier.
- Return the established not-found response when the requested agent does not exist.
- Return explicit response DTOs containing only the approved Agent fields; do not expose Prisma records implicitly.
- Keep controllers thin, input validated at the NestJS boundary, and database queries inside the server.
- Do not add create, update, delete, search, filtering, pagination, authentication, or authorization behavior.

### Agent list page

- Add a responsive agent directory page at the route selected by existing web conventions.
- Fetch agent data through the NestJS API and never through Prisma or SQLite.
- Present agents as a semantic list with meaningful links to their detail pages.
- Preserve the server's deterministic ordering.
- Reuse the existing shell, page-container patterns, design tokens, and status patterns.
- Provide clear loading, empty, and server-error states.
- Keep content usable from 320 CSS pixels through desktop widths without horizontal page scrolling.

### Agent detail page

- Add a separate dynamic detail page for one agent.
- Fetch the selected agent through the NestJS detail API.
- Display the approved fields with an accessible heading structure and concise labels.
- Provide an obvious keyboard-operable route back to the directory.
- Render a clear not-found experience for an unknown agent and a distinct server-error experience when the API fails.
- Reuse the existing responsive layout and avoid unnecessary client components.

### States and failure handling

- Loading feedback is announced or otherwise exposed appropriately to assistive technology where the existing rendering model produces a visible wait.
- Empty results explain that no agents are available without suggesting that an error occurred.
- Not-found responses identify the missing directory entry without leaking implementation details.
- Server failures provide a safe, actionable message and preserve navigation.
- No failure state exposes database paths, stack traces, secrets, or raw internal errors.

## Quality requirements

- Use strict TypeScript and the existing formatting, linting, build, and test conventions.
- Meet WCAG 2.2 AA for the implemented list and detail journeys, including semantic structure, visible focus, keyboard navigation, contrast, and meaningful link text.
- Validate responsive behavior at representative mobile and desktop viewports and at 400% zoom where applicable.
- Add focused automated tests for Agent persistence behavior, list and detail API behavior, deterministic ordering, seeded and empty results, not-found responses, and safe failures.
- Add focused web tests for list and detail content, links, empty, not-found, loading, and server-error states.
- Use browser coverage for the directory-to-detail journey and critical responsive and keyboard behavior, following existing repository commands.
- Preserve clean migration, repeated migration, repeat-safe seed, and server-only persistence guarantees established in Phase 2.

## Out of scope

- Creating, editing, deleting, searching, filtering, sorting interactively, or paginating agents.
- Authentication, authorization, staff identity, or role enforcement; these belong to Phase 10.
- Ailments, therapies, appointments, schedules, availability, booking, or care history.
- Private or real user data and detailed clinical records.
- Web access to Prisma, SQLite, generated Prisma clients, or filesystem database artifacts.
- A generic data-access framework introduced solely for anticipated later models.
- Unrelated redesign of the clinic shell or a new API versioning scheme.

## Completion outcome

A contributor can migrate a clean database, seed it repeatedly with the same fictional agents, start the applications, open the agent directory, and navigate by keyboard to a seeded agent's detail page. Empty, unknown, and failed requests are handled clearly, the web application remains isolated from the database, and all required repository checks pass.
