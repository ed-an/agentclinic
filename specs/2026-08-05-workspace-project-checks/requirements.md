# Workspace and Project Checks — Requirements

## Context

This feature specifies Phase 0, **Workspace and project checks**, from [the roadmap](../roadmap.md). The repository is currently a minimal single-package TypeScript starter. This work turns it into a small, understandable workspace that can support the AgentClinic server and web application.

The result must follow [the mission](../mission.md), especially its goal of being easy for course students to understand and quick for conference presenters to demonstrate. It must also follow [the technical constitution](../tech-stack.md), including strict TypeScript, NestJS with Fastify, Next.js, automated checks, and server-owned business logic.

## Goal

Establish a reliable npm workspace in which:

- a NestJS server exposes a health endpoint;
- a Next.js web application renders a minimal AgentClinic page;
- both applications can be developed, tested, and built from the repository root; and
- continuous integration applies the same checks used locally.

## Decisions

1. Use npm workspaces; do not add Turborepo or another monorepo orchestrator.
2. Put the applications in `apps/server` and `apps/web`.
3. Keep shared commands at the repository root so a learner can discover the workflow from `package.json`.
4. Use strict TypeScript in both applications.
5. Use NestJS with the Fastify adapter for the server.
6. Use Next.js with the App Router for the web application.
7. Deliver the work as thin checkpoints: workspace checks, server health, web page, tests, and CI.
8. Require automated static checks, tests, production builds, runtime smoke checks, and a passing CI run before merge.

## Functional requirements

### Workspace

- The root `package.json` declares `apps/*` as npm workspaces and remains private.
- A clean dependency installation uses the committed lockfile.
- Root commands cover formatting verification, linting, type checking, testing, production builds, and the complete CI sequence.
- The README explains the prerequisites and the shortest path to install, run, check, test, and build the workspace.

### Server

- `apps/server` is a NestJS application written in TypeScript.
- NestJS runs through its Fastify adapter.
- `GET /health` returns HTTP `200` and a small JSON response that clearly indicates the service is healthy.
- The health route has an automated test exercising the HTTP boundary.
- The server has no database dependency or domain endpoints in this phase.

### Web

- `apps/web` is a Next.js application written in TypeScript and uses the App Router.
- Its root route is a server-rendered AgentClinic home page.
- The home page includes an `AgentClinic` primary heading, a short mission-aligned introduction, and a clear indication that the clinic serves AI agents.
- The document has a descriptive title and uses semantic page structure that works with keyboard and assistive-technology navigation.
- The home page remains intentionally minimal: it has no dashboard data, booking controls, navigation system, or final visual design. The accessible clinic shell belongs to Phase 1.
- A focused automated test proves that the home page renders its primary heading and introductory content.

### Continuous integration

- CI installs dependencies from the lockfile without modifying it.
- CI runs formatting verification, linting, strict type checking, tests, and production builds from the root.
- CI performs runtime smoke checks for both the server health endpoint and the rendered web page.
- CI fails when any required command or smoke check fails.

## Quality requirements

- Commands must work on an active Node.js LTS release.
- Local and CI commands must share the same underlying scripts rather than duplicating check logic.
- Default ports and required environment variables must be documented and easy to override.
- Tests and checks must not depend on external services or network access after dependencies are installed.
- Generated build output, local environment files, logs, and dependency directories must not be committed.
- The setup must favor framework defaults and straightforward configuration suitable for teaching and live demos.

## Out of scope

- SQLite, Prisma, migrations, or seed data; these begin in Phase 2.
- Domain models or endpoints for agents, ailments, therapies, or appointments.
- Authentication or authorization.
- Shared domain packages or a general-purpose component library.
- A complete navigation system, responsive clinic shell, or polished visual design; these belong to Phase 1.
- Deployment infrastructure, production monitoring, and release automation.
- Microservices, containers, or monorepo orchestration beyond npm workspaces.

## Completion outcome

A new contributor can clone the repository, install dependencies once, start both applications, and run every required check from the root. The server reports healthy, the browser shows a minimal AgentClinic home page, and CI independently proves that the same foundation is mergeable.
