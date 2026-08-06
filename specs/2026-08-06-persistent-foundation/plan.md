# Persistent Foundation — Plan

The numbered task groups are ordered checkpoints. Complete and verify each group before moving to the next, keeping the application usable throughout.

## 1. Establish server-owned Prisma configuration

1. Add compatible Prisma CLI and client dependencies to `apps/server` only.
2. Add the SQLite datasource, client generator, and server-owned Prisma directory structure.
3. Define and validate the database URL used by server startup and database commands, with a documented local development default.
4. Ignore local SQLite files, journal files, and generated test databases without hiding committed migrations.
5. Add discoverable server-workspace and root commands for client generation and database operations.

**Checkpoint:** Prisma configuration loads from the server workspace, client generation succeeds, and neither the root package nor web application owns a persistence dependency.

## 2. Commit the baseline migration

1. Create a clearly named Phase 2 baseline migration using the configured Prisma workflow.
2. Keep the schema free of roadmap domain models and placeholder product tables.
3. Add a non-interactive root command that applies committed migrations.
4. Apply the migration to a clean temporary SQLite database and then apply it again.
5. Confirm only Prisma's migration history changes and the second application is a no-op.

**Checkpoint:** a clean database reaches the committed baseline reproducibly, and an already migrated database remains unchanged.

## 3. Add the NestJS Prisma service boundary

1. Add a shared `PrismaModule` and injectable `PrismaService` in the server.
2. Implement explicit startup connectivity and shutdown cleanup using NestJS lifecycle hooks appropriate to the installed Prisma version.
3. Register the module with the server application without changing the public HTTP API.
4. Add a focused test that resolves the service through NestJS and executes a minimal SQLite connectivity query.
5. Confirm application code does not instantiate Prisma clients outside the persistence infrastructure.

**Checkpoint:** NestJS starts with the configured migrated database, resolves one shared Prisma service, completes a query, and disconnects cleanly.

## 4. Add deterministic seeding

1. Add the server-owned seed entry point and connect it to Prisma's supported seed configuration.
2. Make the seed validate the migrated database through Prisma and report a concise success message.
3. Keep the Phase 2 seed free of domain or placeholder records.
4. Ensure failures set a non-zero exit code, close the client, and avoid exposing the database URL.
5. Run the seed twice against the same migrated temporary database and compare database state.

**Checkpoint:** both seed runs succeed, produce the same database state, and leave no open process or SQLite lock.

## 5. Automate persistence validation

1. Add a validation test or test harness that creates a unique temporary SQLite database.
2. Apply committed migrations, run the seed twice, and query the database through the server's Prisma boundary.
3. Assert that migration history is present and unchanged after the repeated migration and seed operations.
4. Add a source-boundary check proving the web application does not import Prisma packages, generated clients, or SQLite access libraries.
5. Ensure cleanup runs on success and failure and never touches the documented development database.
6. Wire the persistence checks into `npm run test:validation` and the existing CI sequence.

**Checkpoint:** one root validation command proves clean migration, repeat-safe seeding, server-only querying, and isolation from developer data.

## 6. Document the local database workflow

1. Document the default database location and database URL override.
2. Explain the commands for client generation, applying committed migrations, creating future development migrations, seeding, and safe local reset.
3. Provide a short clean-setup sequence suitable for students and conference demonstrations.
4. Explain that Phase 2 intentionally has no domain records and that Phase 3 extends the schema and seed.
5. Verify every documented command from a clean temporary database.

**Checkpoint:** a new contributor can prepare and verify the database using only the README and understands why the initial seed inserts no records.

## 7. Final review

1. Run formatting verification, linting, strict type checking, `npm run test:validation`, production builds, and relevant smoke checks.
2. Review the implementation against [requirements.md](requirements.md), [the mission](../mission.md), and [the technical constitution](../tech-stack.md).
3. Confirm no Agent model, placeholder domain table, web database access, or public database probe was introduced.
4. Confirm local and temporary SQLite artifacts are untracked and cleanup leaves no locked files or processes.
5. Record any intentional deviation in the pull request; unresolved required deviations block merge.

**Checkpoint:** all validation evidence is present, the persistence boundary remains narrow, and the branch is ready for review.
