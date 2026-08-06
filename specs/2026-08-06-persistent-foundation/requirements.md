# Persistent Foundation — Requirements

## Context

This feature delivers Phase 2, **Persistent foundation**, from [the roadmap](../roadmap.md). The workspace already contains the NestJS server and Next.js web application established in Phases 0 and 1. This phase gives the server a durable local data foundation before Phase 3 introduces the first domain model.

The work must support [the mission](../mission.md) by remaining straightforward for course students to understand and quick for conference demonstrations to reset. It must follow [the technical constitution](../tech-stack.md): SQLite is the durable system of record, Prisma owns data access and versioned migrations, only the NestJS server may access the database, and database setup must be reproducible.

## Goal

Establish a server-owned Prisma and SQLite foundation in which:

- a clean local database can be created by applying committed migrations;
- the documented seed command runs deterministically and safely more than once;
- NestJS accesses Prisma through one shared service boundary; and
- automated validation proves that database access is confined to the server.

## Decisions

1. Keep this phase foundation-only. Do not introduce Agent or any other roadmap domain model before its scheduled phase.
2. Install and configure Prisma only in `apps/server`; the web application and repository root must not instantiate Prisma or open SQLite.
3. Expose the generated Prisma client to NestJS through a shared `PrismaModule` and injectable `PrismaService` with explicit connection lifecycle handling.
4. Store the development SQLite file outside tracked source and configure its URL through a validated environment variable with a documented local default.
5. Commit a named baseline migration even though domain tables are deferred. The migration establishes reproducible schema history without inventing a placeholder product model.
6. Provide a deterministic, repeat-safe seed entry point. Until Phase 3 adds seedable domain records, it validates database connectivity and completes without inserting placeholder data.
7. Exercise persistence through the server boundary in tests; do not add a browser or web route merely to demonstrate database access.
8. Use isolated temporary SQLite databases for automated tests so validation never changes a developer's database.

## Functional requirements

### Prisma and SQLite configuration

- `apps/server` owns the Prisma schema, migration history, generated client configuration, and seed entry point.
- The Prisma datasource uses SQLite and reads its database URL from configuration rather than hard-coding a machine-specific absolute path.
- The local database file, SQLite journal files, generated test databases, and other runtime persistence artifacts are ignored by Git.
- The committed baseline migration can be applied to a new database using a non-interactive command suitable for local validation and CI.
- Prisma client generation is available through documented workspace and root commands and occurs where required by installation, build, or validation workflows.

### NestJS persistence boundary

- A shared `PrismaModule` provides one injectable `PrismaService` to server modules.
- `PrismaService` owns client initialization and clean application shutdown behavior.
- Server application code does not construct additional `PrismaClient` instances outside this persistence infrastructure and the isolated seed process.
- The server can execute a minimal database connectivity query through the Prisma service without exposing a new public domain endpoint.
- A missing, malformed, or unusable database configuration fails with a clear, actionable server or command-line error.

### Migration workflow

- A root command applies committed migrations to a configured database without creating uncommitted migration files.
- The first committed migration is a baseline for Phase 2 and does not create Agent, Ailment, Therapy, Appointment, Staff, or placeholder product tables.
- Running the migration command against an already migrated database succeeds without destructive changes.
- The README explains the difference between creating migrations during development and applying committed migrations.

### Seed workflow

- A root command runs the server-owned Prisma seed entry point against the configured database.
- The seed requires the schema to be migrated and verifies that Prisma can query the configured SQLite database.
- With no Phase 2 domain records to create, the seed reports that the foundation is ready and exits successfully without inserting placeholder data.
- Repeating the seed against the same migrated database produces the same database state and succeeds.
- Seed failures return a non-zero exit code and a useful error without printing secrets or machine-sensitive connection details.

### Documentation and developer workflow

- The README documents prerequisites, environment configuration, database location, client generation, migration, seed, reset, and verification commands.
- The shortest local setup path remains appropriate for a student or live demonstration.
- Reset instructions target only the documented local development database and warn that reset is destructive.
- Existing formatting, linting, strict type checking, Vitest validation tests, builds, and CI continue to pass.

## Quality requirements

- Database commands must be non-interactive when used by automated validation or CI.
- Tests must be deterministic, independent of execution order, and safe to run concurrently where the existing test setup permits.
- Temporary database paths must be unique per test run and cleaned up after validation.
- Migration and seed code must use TypeScript where supported by the selected Prisma version and remain easy to follow.
- No new dependency may be added to the web application for persistence.
- Error handling must close Prisma connections and avoid leaving locked SQLite files or hanging Node.js processes.

## Out of scope

- Agent models, Agent seed records, repositories, endpoints, list pages, or detail pages; these belong to Phase 3.
- Ailment, Therapy, Appointment, or Staff persistence.
- Generic repository abstractions before a domain capability needs them.
- Web access to Prisma, SQLite, or a database API.
- Authentication, authorization, production backups, restore procedures, or production database deployment.
- A database administration UI or public endpoint added solely as a connectivity probe.

## Completion outcome

A contributor can configure a local SQLite database, apply the committed Prisma baseline, run the deterministic seed repeatedly, and start the NestJS server with a working shared Prisma service. Automated checks prove the same flow on a clean temporary database and prevent database ownership from leaking into the web application.
