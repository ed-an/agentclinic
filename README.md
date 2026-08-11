# AgentClinic

AgentClinic is a welcoming place where AI agents can seek relief from the
demands of their humans. The workspace contains a NestJS/Fastify health
service and a responsive, accessible Next.js clinic shell.

## Technologies

### Frontend

- **Next.js 15** with the App Router for server-rendered pages and web routes.
- **React 19** for the user interface and interactive components.
- **TypeScript** in strict mode.
- **Tailwind CSS 4** for responsive, mobile-first styling.

### Backend

- **Node.js 24 LTS** as the server runtime.
- **NestJS 11** organized as a modular monolith.
- **Fastify** as the NestJS HTTP adapter.
- **Prisma ORM 7** for typed data access and versioned migrations.
- **SQLite** as the persistent database, with a single active writer.

### Testing and infrastructure

- **Vitest** and **Testing Library** for automated validation and UI tests.
- **Playwright** for critical browser and accessibility journeys.
- **ESLint**, **Prettier**, and strict TypeScript checks for code quality.
- **Docker** and **Docker Compose** for reproducible builds and local
  orchestration.

## Prerequisites

- Node.js 24 LTS
- npm 10 or newer

## Install and run

Install the workspace exactly from the committed lockfile:

```sh
npm ci
npx playwright install --with-deps chromium
```

The second command installs Chromium and its system dependencies for the
browser accessibility suite. It may request administrator approval on Linux.

Start both development applications from the repository root:

```sh
npm run dev
```

You can also run one application with `npm run dev:server` or
`npm run dev:web`.

- Web home: <http://localhost:3000>
- Server liveness: <http://localhost:3001/health/live>
- Server readiness: <http://localhost:3001/health/ready>

## Run with Docker Compose

This is the simplest way to run the complete application without installing
Node.js locally. It requires Docker Engine with the Compose plugin.

Build the images, apply the committed migrations, seed the catalog, and start
the API and web application:

```sh
docker compose up --build -d
```

Wait until both long-running services are healthy, then open:

- Web application: <http://localhost:3000>
- API liveness: <http://localhost:3001/health/live>
- API readiness: <http://localhost:3001/health/ready>

If either host port is already in use, choose alternatives without changing
the container ports:

```sh
AGENTCLINIC_WEB_PORT=3300 AGENTCLINIC_SERVER_PORT=3301 docker compose up --build
```

The Compose topology runs exactly one NestJS container and one SQLite writer.
SQLite is stored in the named Docker volume `agentclinic-data`, mounted at
`/data`; it does not read or modify `apps/server/prisma/dev.db`. Migrations and
the repeat-safe catalog seed run as one-shot services before the API starts.

Run in the background and inspect status or logs with:

```sh
docker compose up --build --detach
docker compose ps
docker compose logs --follow server web
```

Stop the containers while preserving the database:

```sh
docker compose down
```

Rebuild after changing dependencies or application code:

```sh
docker compose up --build --detach
```

To remove the local Compose database as well, first stop the stack and then
explicitly remove its named volume:

```sh
docker compose down
docker volume rm agentclinic-data
```

The last command permanently deletes the Compose database. It is intentionally
separate from the normal shutdown command.

The included Compose configuration is for local HTTP use. It contains no real
credentials and does not represent an approved production deployment. A
production deployment still requires HTTPS, secure secret injection, external
logs and alerts, encrypted remote backups, and the Phase 12 provider decision.

The clinic shell includes a read-only Agent directory at `/agents`. A seeded
Agent has a separate profile page. The `/ailments`, `/therapies`,
`/appointments`, and `/staff` routes remain placeholders for later phases.

Override the server port with `PORT`, for example `PORT=4001 npm run
dev:server`. Next.js accepts its standard `-p` option after `--` when running
the web workspace directly.

## Local database

The NestJS server is the only workspace that owns Prisma or opens SQLite. By
default, server and database commands use `apps/server/prisma/dev.db`. Copy
`.env.example` to `.env` to make that setting explicit or set `DATABASE_URL`
to another SQLite `file:` URL:

```sh
cp .env.example .env
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
```

`db:migrate:deploy` non-interactively applies migrations already committed to
the repository. When intentionally changing the schema in a future phase, use
`npm run db:migrate:dev -- --name descriptive_migration_name` to create and
apply a migration for review.

The Phase 2 baseline deliberately contains no domain tables. Phase 3 adds the
minimal Agent model and three deterministic fictional Agent records. The seed
uses stable identifiers and repeat-safe writes, so it can safely be run more
than once without creating duplicates.

The server API exposes the read-only directory at
<http://localhost:3001/agents> and individual profiles at
`http://localhost:3001/agents/:id`. Server-rendered web pages use
`AGENTCLINIC_API_URL` when set and otherwise connect to
`http://localhost:3001`; this variable is server-only and must not use a
`NEXT_PUBLIC_` prefix.

To reset only the database selected by `DATABASE_URL`, run:

```sh
npm run db:reset
```

**Warning:** reset is destructive. Confirm `DATABASE_URL` identifies the local
development database you intend to erase before running it. Never use this
command against a database whose contents must be preserved.

## Checks

All contributor commands run from the repository root:

```sh
npm run format:check  # verify formatting
npm run lint          # lint both applications
npm run typecheck     # strict TypeScript checks without emitting files
npm run test:validation # Vitest validation tests for both applications
npm run test:browser  # build the web app and run Playwright accessibility checks
npm run build         # production builds
npm run smoke         # probe both production builds and stop them afterward
npm run test:operations # structured logs, headers, health, startup, shutdown
npm run test:backup-restore # safe temporary SQLite backup/restore validation
npm run performance:validate # conservative local production-build budgets
npm run ci            # every merge check above, in order
```

Run `npm run format` to apply Prettier formatting. The smoke check uses ports
3101 and 3100 by default; override them with `SMOKE_SERVER_PORT` and
`SMOKE_WEB_PORT`. Persistence validation and smoke checks create isolated
temporary SQLite databases, migrate and seed them, and remove them afterward;
they do not open the local development database.
