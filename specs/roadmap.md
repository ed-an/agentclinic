# AgentClinic Roadmap

## Delivery rule

Work proceeds in the following order. Each phase is intentionally small, must leave the application usable, and is complete only when its acceptance checks are automated where practical. Learning may refine later details, but a later phase must not be pulled forward if it depends on unfinished foundations.

## Phase 0 — Workspace and project checks

**Status:** Complete

- Establish a workspace containing a NestJS TypeScript server and Next.js TypeScript web application.
- Add formatting, linting, type checking, and a root Vitest validation-test command.
- Add a continuous-integration check for those commands.
- Ensure the initial web page reflows cleanly on phone and desktop viewports.

**Done when:** the server health endpoint responds, a minimal page renders, and all checks pass in CI.

## Phase 1 — Accessible clinic shell

**Status:** Complete

- Extend the responsive global layout with navigation, design tokens, and reusable page-container patterns.
- Establish the warm AgentClinic voice and basic loading, empty, and error patterns.

**Done when:** keyboard users can navigate the shell and its automated accessibility smoke check passes.

## Phase 2 — Persistent foundation

**Status:** Complete

- Connect the NestJS server to SQLite through Prisma.
- Add the first migration and deterministic local seed command.

**Done when:** a clean database can be migrated and seeded, and only the server can query it.

## Phase 3 — Agent directory

**Status:** Complete

- Add the Agent model and seed records.
- Add read-only agent list and detail endpoints to the server.
- Show staff a read-only list of agents and an agent detail page using those endpoints.

**Done when:** staff can open a seeded agent from the directory and focused tests cover the query and views.

## Phase 4 — Ailment catalog

**Status:** Complete

- Add the Ailment model and seed records.
- Add read-only, searchable ailment endpoints and connect the catalog and detail pages to them.

**Done when:** an ailment can be found by name and its symptoms can be read.

## Phase 5 — Therapy catalog

**Status:** Complete

- Add the Therapy model and its relationship to ailments.
- Expose therapies recommended for an ailment and show them in the web application.

**Done when:** an agent can move from an ailment to a relevant therapy and tests cover the association.

## Phase 6 — Appointment availability

**Status:** Complete

- Define clinic appointment slots and availability rules.
- Show available times for one therapy without allowing booking yet.

**Done when:** unavailable or past slots are excluded consistently.

## Phase 7 — Book an appointment

**Status:** Complete

- Add the Appointment model and a transactional NestJS booking operation.
- Let an agent select an available slot and see confirmation.

**Done when:** the booking journey works end to end and simultaneous requests cannot double-book a slot.

## Phase 8 — Agent dashboard

**Status:** Complete

- Show an agent's upcoming appointments.
- Allow an agent to cancel an eligible appointment.

**Done when:** booking state and cancellation state are visible and covered by a browser test.

## Phase 9 — Staff appointment queue

**Status:** Complete

- Show staff the appointment queue with useful filters.
- Allow staff to confirm or cancel an appointment with a recorded status change.

**Done when:** staff changes are immediately reflected in both staff and agent views.

## Phase 10 — Access control

- Add authentication for agents and staff.
- Enforce role and record ownership rules with NestJS guards and server-side policy checks.

**Done when:** unauthorized access tests prove that agents cannot see other agents' records or staff controls.

Authentication is scheduled after the core flows so early product learning stays fast; no deployment with private or real user data may occur before this phase is complete.

## Phase 11 — Production readiness

- Add structured logging, error monitoring, security headers, and operational health checks.
- Validate performance, accessibility, backup, and restore procedures.

**Done when:** critical journeys meet agreed checks in a production-like environment and the restore drill succeeds.

## Phase 12 — First release

- Run a small staff and agent usability review.
- Fix release-blocking findings and publish the initial production release.

**Done when:** an agent can find a therapy and book care, staff can manage the appointment, and no known critical issue remains.

## Later candidates

Only prioritize these after evidence from the first release:

- appointment rescheduling and reminders;
- staff-managed catalog editing;
- richer care history and notes;
- therapy capacity and practitioner scheduling; and
- product analytics that avoid sensitive agent content.
