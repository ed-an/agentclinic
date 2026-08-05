# AgentClinic Technical Constitution

## Standard stack

- **Language:** TypeScript in strict mode across server, web, and test code.
- **Server runtime:** Node.js using an active Long-Term Support release.
- **Server framework:** NestJS, organized as a modular monolith and using the Fastify adapter.
- **Web framework:** Next.js with React and the App Router.
- **Database:** SQLite as the durable system of record, keeping local setup lightweight for courses and conference demos.
- **Data access:** Prisma ORM, including versioned schema migrations.
- **Styling:** Tailwind CSS with a small set of reusable design tokens and accessible UI primitives.
- **Validation:** NestJS validation pipes and explicit DTO schemas at every server boundary; Zod may be used for shared web form schemas.
- **Testing:** Vitest and Testing Library for focused tests; Playwright for critical browser journeys.
- **Quality controls:** ESLint, Prettier, type checking, and automated tests in continuous integration.

Dependencies should be kept current, but exact versions belong in the package manifest and lockfile rather than this constitution.

## Architecture rules

1. Build the server as one NestJS modular monolith. Do not split it into microservices without measured operational or scaling evidence.
2. Organize server modules around domain capabilities such as agents, ailments, therapies, appointments, and access control—not around generic technical layers alone.
3. Keep controllers thin. Put business rules in injectable application services and keep persistence behind explicit repository boundaries.
4. Treat the NestJS server as the authoritative boundary for business rules, persistence, authentication, and authorization.
5. The Next.js application consumes the server's versioned HTTP API. It must not connect directly to SQLite or duplicate server business rules.
6. Render web pages on the server by default. Add client components only where browser state or interaction requires them.
7. Validate all untrusted input in NestJS even when equivalent web validation exists.
8. Store dates in UTC and present them in the user's timezone. Appointment operations must handle concurrent updates safely.
9. Apply authorization in NestJS. Agent and staff responses must expose only the data allowed for their role.
10. Make database changes through committed migrations and provide seed data for local development.
11. Prefer NestJS, Node.js, and web-platform primitives before adding a new dependency.

## Why NestJS

NestJS is the recommended server framework because it is TypeScript-first and supplies consistent conventions for modules, dependency injection, request validation, authorization guards, testing, and operational integrations. Those conventions suit a reliable clinic system whose domain will grow across several related workflows. Fastify is the preferred HTTP adapter for its low overhead; NestJS keeps that adapter choice behind its framework abstractions.

This recommendation does not authorize premature microservices. AgentClinic starts as a modular monolith so domain boundaries are clear without adding distributed-system complexity.

## Domain model

The initial domain consists of:

- **Agent:** identity, display information, and relevant care context.
- **Ailment:** a named condition with a description and symptoms.
- **Therapy:** a treatment offering associated with one or more ailments.
- **Appointment:** an agent, therapy, scheduled time, status, and audit timestamps.
- **Staff member:** an authorized clinic operator who manages care and appointments.

The database enforces required relationships and uniqueness. TypeScript types complement these constraints but do not replace them.

## Experience requirements

- Support the current and previous major versions of evergreen browsers.
- Meet WCAG 2.2 AA for the implemented journeys.
- Provide useful loading, empty, validation, success, and failure states.
- Use responsive layouts suitable for phones and desktop staff dashboards.
- Keep the visual voice warm and appealing while maintaining readable contrast and predictable controls.

## Verification rules

- Every change must pass formatting, linting, type checking, and relevant tests.
- Business rules require focused automated tests.
- Critical journeys—finding therapy, booking an appointment, and staff appointment management—require browser-level coverage once introduced.
- Schema migrations must be tested against a clean database and an existing development database.
- Security, accessibility, or data-loss regressions block release.

## Operations

- Configuration and secrets come from environment variables and are validated at startup.
- Production logs must be structured and must not contain sensitive agent details.
- Errors should be observable by staff while giving agents safe, actionable messages.
- SQLite database backups and a tested restore procedure are required before production launch.
