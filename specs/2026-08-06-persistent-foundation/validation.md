# Persistent Foundation — Validation

## Merge standard

This feature can be merged only when every required automated check passes on the feature branch and in CI. Commands that mutate a database must use an isolated temporary SQLite file during validation; they must never depend on or alter a contributor's development database.

## 1. Dependency and ownership review

Inspect workspace manifests, the lockfile, and source imports.

Confirm that:

1. Prisma CLI and client dependencies are owned by `apps/server`;
2. the web application has no Prisma, generated-client, or SQLite dependency;
3. the Prisma schema, migrations, and seed entry point live under the server workspace; and
4. no database artifact is tracked outside committed schema and migration files.

**Success:** persistence ownership is visibly confined to the NestJS server and automated source-boundary checks pass.

## 2. Clean database migration

Using a unique temporary directory and SQLite database URL:

1. generate the Prisma client using the documented command;
2. apply all committed migrations non-interactively;
3. inspect migration status and SQLite schema; and
4. apply the committed migrations a second time.

**Success:** the first application creates the expected Prisma migration history, the second reports no pending migration, no domain or placeholder product table exists, and both commands exit zero.

## 3. Deterministic repeated seed

Against the migrated temporary database:

1. capture its schema and data state;
2. run the documented root seed command;
3. capture state again;
4. run the same seed command a second time; and
5. capture and compare the final state.

**Success:** both runs exit zero with a concise readiness message, neither inserts placeholder or domain data, migration history remains unchanged, and the two post-seed states are equivalent.

## 4. Server-only connectivity

Run a focused Vitest validation test that builds a NestJS testing module with the shared Prisma module and the temporary migrated database.

The test must prove that:

1. `PrismaService` resolves through NestJS dependency injection;
2. a minimal database query completes through that service;
3. the module closes without a hanging process or locked SQLite file; and
4. no additional public HTTP endpoint is required for the check.

**Success:** the server query test passes and the temporary database can be removed immediately after module shutdown.

## 5. Configuration failures

Exercise representative invalid configurations without exposing their values in output:

1. a missing required database URL when no documented local default applies;
2. a malformed or unsupported datasource URL; and
3. a database path that cannot be opened.

**Success:** each case fails promptly with a useful non-zero result, does not print secrets, and leaves no hanging Prisma process.

## 6. Temporary-database isolation

Review and exercise the persistence validation harness.

Confirm that:

1. each run uses a unique path beneath the operating system's temporary directory;
2. the configured development database is never opened or modified;
3. cleanup runs after both passing and deliberately failing checks; and
4. no SQLite database, journal, or lock file remains in the repository.

**Success:** repeated and failed validation runs leave the working tree and development database unchanged.

## 7. Repository quality checks

Run the documented root commands for:

1. formatting verification;
2. linting;
3. strict TypeScript checking;
4. `npm run test:validation`;
5. production builds; and
6. existing runtime and browser smoke checks required by prior phases.

**Success:** every command exits zero, persistence validation is included in the root validation suite, and existing server and web behavior has no regression.

## 8. Contributor workflow review

Follow the README as a new course student:

1. configure or accept the documented local database URL;
2. generate the Prisma client;
3. apply committed migrations;
4. run the seed twice;
5. start and stop the NestJS server; and
6. locate the safe local reset instructions without inspecting package internals.

**Success:** the workflow is understandable, commands work as written, the no-record seed behavior is explained, and reset instructions clearly identify their destructive target.

## 9. Scope and constitutional review

Confirm that:

- the implementation meets every requirement in [requirements.md](requirements.md);
- SQLite, Prisma, committed migrations, and server ownership align with [the technical constitution](../tech-stack.md);
- the setup remains lightweight and teachable as required by [the mission](../mission.md);
- no Agent or later domain model, record, repository, endpoint, or user interface was pulled forward;
- no generic repository abstraction was introduced before a domain capability needs it; and
- the change adds no authentication, production backup, deployment, or administration scope.

**Success:** there are no unexplained deviations or later-phase additions.

## Merge checklist

- [ ] Prisma generation succeeds from the documented root command.
- [ ] A clean temporary SQLite database accepts all committed migrations.
- [ ] Reapplying migrations is a successful no-op.
- [ ] The seed succeeds twice and preserves equivalent database state.
- [ ] NestJS queries the migrated database through the shared `PrismaService`.
- [ ] Prisma connections close without locked files or hanging processes.
- [ ] Automated checks prevent database access from entering the web application.
- [ ] Invalid database configuration fails clearly without exposing secrets.
- [ ] Temporary database cleanup leaves the repository and development database unchanged.
- [ ] Formatting, linting, strict type checking, validation tests, builds, and prior smoke checks pass.
- [ ] README database setup and reset instructions work as written.
- [ ] Branch CI passes the complete root check sequence.
- [ ] Requirements, mission, technical constitution, and scope reviews pass.
