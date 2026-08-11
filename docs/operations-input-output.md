# Operations input and output catalog

Run npm commands from the repository root unless a workspace is explicitly
named. Validation must use temporary databases and must never migrate, seed,
back up, restore, replace or delete `apps/server/prisma/dev.db`.

## Environment variables

Values below are safe examples, not current environment values.

| Group/name                                     | Owner; applicability            | Requirement/default/validation                                                                                | Secret and effect                                                                |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`                                 | server, Prisma, release scripts | optional dev (`file:./prisma/dev.db`); required safe production `file:/data/agentclinic.db`; nonempty `file:` | sensitive operational path; restart; migrations/seed act on it                   |
| `NODE_ENV`                                     | server/web                      | development default; development/test/production only server-side                                             | nonsecret; production enables Secure cookies, HSTS/config guards; restart        |
| `PORT`                                         | server/web                      | positive number; server 3001, web 3000 defaults                                                               | nonsecret; restart                                                               |
| `AGENTCLINIC_API_URL`                          | Next build/runtime, preflight   | default `http://localhost:3001`; absolute URL expected by consumers/preflight                                 | nonsecret; build-time for CSP and server fetches; rebuild/restart                |
| `AGENTCLINIC_WEB_ORIGIN`                       | API CORS/auth/preflight         | dev defaults localhost list; required exact HTTP(S) origins in production; `*` rejected                       | security-critical, nonsecret; restart                                            |
| `AGENTCLINIC_TRUST_PROXY`                      | server                          | `false` default or `loopback`                                                                                 | security-critical; restart                                                       |
| `AGENTCLINIC_HTTPS`                            | server/web/preflight            | `false` unless literal `true`; production requires true                                                       | controls HSTS/security assertion; restart/rebuild web                            |
| `AGENTCLINIC_TIME_ZONE`                        | API/web/preflight               | default `America/Sao_Paulo`; valid IANA zone                                                                  | nonsecret; restart                                                               |
| `AGENTCLINIC_CANCELLATION_CUTOFF_HOURS`        | server                          | default 24; operational config requires positive; policy parser allows 0–8760                                 | conflict: zero accepted by policy parser but rejected by startup config; restart |
| `AGENTCLINIC_SHUTDOWN_TIMEOUT_MS`              | server                          | default 10000; positive number                                                                                | graceful-shutdown bound; restart                                                 |
| `AGENTCLINIC_INSTANCE_COUNT`                   | server/preflight                | default/required integer 1                                                                                    | single-instance guard; startup fails otherwise                                   |
| `AGENTCLINIC_SQLITE_WRITER`                    | server/preflight                | default/required `single`                                                                                     | single-writer guard; startup fails otherwise                                     |
| `AGENTCLINIC_ENABLE_DEMO_ACCOUNTS`             | seed/startup                    | only literal `true`; forbidden in production                                                                  | nonsecret switch; seed impact/restart                                            |
| `AGENTCLINIC_DEMO_PASSWORD_HASHES`             | seed                            | required complete encoded JSON/map when demo accounts enabled                                                 | **secret-equivalent password hashes**; never log/track                           |
| `AGENTCLINIC_E2E_PASSWORD`                     | Playwright/auth helper          | required for authenticated E2E paths                                                                          | **secret test credential**; never track/log                                      |
| `CI`                                           | Playwright                      | conventional Boolean presence                                                                                 | changes test server reuse/retries; nonsecret                                     |
| `SMOKE_SERVER_PORT`, `SMOKE_WEB_PORT`          | smoke                           | numeric; defaults 3101/3100                                                                                   | temporary listeners                                                              |
| `BROWSER_SERVER_PORT`                          | browser helper                  | numeric; default 3201                                                                                         | temporary listener                                                               |
| `OPERATIONS_PORT`                              | operational smoke               | numeric; default 3401                                                                                         | temporary listener                                                               |
| `PERFORMANCE_API_PORT`, `PERFORMANCE_WEB_PORT` | performance                     | numeric; adjacent internal defaults                                                                           | temporary listeners                                                              |
| `SOURCE_DATE_EPOCH`                            | release manifest                | integer Unix epoch                                                                                            | reproducible timestamp; invalid fails                                            |
| `RELEASE_VERSION`, `RELEASE_REVISION`          | manifest                        | explicit release identity strings                                                                             | nonsecret; output manifest identity                                              |
| `RELEASE_MANIFEST_PATH`                        | manifest                        | output path; default repository `release-manifest.json`                                                       | generated file; must not be committed unintentionally                            |
| `RELEASE_SERVER_URL`, `RELEASE_WEB_URL`        | post-deploy check               | required absolute target URLs                                                                                 | production target metadata; network check                                        |
| `RELEASE_TARGET`, `RELEASE_ARTIFACT`           | deploy guard                    | required explicit identifiers                                                                                 | nonsecret identifiers; no action without authorization                           |
| `RELEASE_DEPLOY_AUTHORIZED`                    | deploy guard                    | must equal implemented authorization literal                                                                  | safety control, not a credential                                                 |
| `RELEASE_DEPLOY_COMMAND`                       | deploy guard                    | explicit command string after authorization                                                                   | high-risk operator input; executed only when all guards pass                     |
| `RELEASE_ROLLBACK_REVISION`                    | rollback guard                  | required prior revision                                                                                       | rollback identity                                                                |
| `RELEASE_ROLLBACK_AUTHORIZED`                  | rollback guard                  | required authorization literal                                                                                | safety control                                                                   |
| `RELEASE_ROLLBACK_COMMAND`                     | rollback guard                  | explicit command after guards                                                                                 | high-risk operator input                                                         |

Request correlation has no environment variable: `x-request-id` is accepted or
generated per request. Session lifetime, cookie names, CSRF header, throttle
limit/window and scrypt parameters are code constants, not supported env input.
External provider/log/alert/secret-store/remote-backup variables do not yet
exist because provisioning is gated.

## Root commands

| Command                                   | Inputs/output and exit                                              | Safety/database behavior                                           |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `npm ci`                                  | lockfile → installed workspaces; 0 success                          | filesystem dependency install; no DB                               |
| `npm run dev` / `dev:server` / `dev:web`  | starts watchers on configured ports; logs until signal              | server defaults to dev.db unless safe override supplied            |
| `npm run prisma:generate`                 | schema → ignored generated TS client                                | non-destructive; no DB                                             |
| `npm run db:migrate:deploy`               | committed migrations + `DATABASE_URL` → migration table/schema      | **mutates selected DB**; never validation dev.db                   |
| `npm run db:migrate:dev -- --name <name>` | schema/name/DB → new migration and changed DB                       | **destructive-capable development command**                        |
| `npm run db:seed`                         | seed + DB + optional demo hash input → repeat-safe catalog/accounts | **mutates selected DB**                                            |
| `npm run db:reset`                        | selected DB → drop/recreate/migrate/seed                            | **destructive**; never production or preserved DB                  |
| `npm run format` / `format:check`         | source tree → rewritten files / diagnostics                         | write/read-only respectively; no DB                                |
| `npm run lint`, `typecheck`               | source/config → diagnostics                                         | read-only except generated Prisma prehooks                         |
| `npm run test:validation`                 | both Vitest suites → pass/fail report                               | tests use temporary DBs; cleanup expected                          |
| `npm run build`                           | source → ignored `dist`/`.next`                                     | prebuild generates Prisma; no DB                                   |
| `npm run smoke`                           | production builds, temporary DB and ports → probes/report           | migrates/seeds only temp DB; cleans processes/files                |
| `npm run test:browser`                    | builds + Playwright → report/artifacts on failure                   | helper uses temporary DB; authenticated tests require E2E password |
| `npm run test:operations`                 | temp DB/port → headers, logs, health, shutdown checks               | temporary and cleaned                                              |
| `npm run performance:validate`            | baseline/builds/temp DB → measured thresholds                       | temp data/processes; fails regression                              |
| `npm run test:production-readiness`       | operations + backup/restore + performance                           | aggregate local validation; temporary resources only               |
| `npm run ci`                              | formatting through browser suite                                    | aggregate, non-deploying                                           |

Workspace commands are their direct implementations: server `dev/start/build/
lint/typecheck/test/prisma:generate/db:*`; web `dev/start/build/lint/typecheck/
test/test:browser`. Server `predev`, `prebuild`, `pretypecheck` and `pretest`
generate the Prisma client automatically. Web `pretest:browser` builds the
server before the browser command.

## SQLite backup and restore

`npm run backup:sqlite -- --database <temporary.db> --output <backup.db>` runs
the implemented online SQLite backup, verifies integrity/checksum metadata and
refuses unsafe/missing arguments. `npm run restore:sqlite -- --backup
<backup.db> --output <new-temporary.db>` restores to a new path, checks source
integrity/checksum and refuses overwrite. Backup is read-only to its source;
restore creates output. `npm run test:backup-restore` exercises only temporary
paths and cleanup. Exact accepted flags and refusal codes are defined in
`scripts/sqlite-ops.mjs` and `scripts/lib/sqlite-operations.mjs`; `--help`
prints usage. Never point validation at dev.db.

## Release and deployment commands

| Command                     | Contract                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run release:manifest`  | hashes/version-identifies approved artifacts into `RELEASE_MANIFEST_PATH`; reproducibility uses version, revision and `SOURCE_DATE_EPOCH`; generated runtime manifest is not source |
| `npm run release:preflight` | validates production env, absolute URLs, SQLite path, one instance/writer, HTTPS/timezone and migration/readiness prerequisites; use only a temporary DB before provider selection  |
| `npm run release:check`     | requires web/server URLs and probes post-deployment web, liveness/readiness and security expectations; network read-only                                                            |
| `npm run release:deploy`    | refuses unless target, artifact, explicit authorization and explicit command are present; then invokes operator command; potentially external/destructive                           |
| `npm run release:rollback`  | refuses unless target, previous revision, explicit authorization and command are present; potentially external/destructive                                                          |

Successful scripts exit 0; validation/refusal/failure exits nonzero and emits a
safe diagnostic to stderr. Deployment/rollback refusal is a passing safety
property, not a deployment. No such command is authorized by this catalog.

## Containers and Compose

`docker compose up --build -d` builds Node 24.19 images, initializes ownership
of named volume `agentclinic-data`, runs migration and repeat-safe seed one-shot
containers, then starts one API writer on host 3001 and one web instance on 3000. Healthchecks use `/health/ready` and `/`. `docker compose down` removes
containers/network but preserves the volume. `docker volume rm
agentclinic-data` is **destructive**. Dockerfiles build immutable server/web
artifacts, run runtime containers as user `node`, mount `/data`, and handle
SIGTERM. Local Compose is HTTP/development configuration, not production.

## Temporary-path examples

```sh
DATABASE_URL=file:/tmp/agentclinic-catalog-test.db npm run db:migrate:deploy
npm run test:backup-restore
RELEASE_MANIFEST_PATH=/tmp/agentclinic-manifest.json \
  RELEASE_VERSION=example RELEASE_REVISION=example SOURCE_DATE_EPOCH=0 \
  npm run release:manifest
```

The migration example intentionally mutates its `/tmp` target; remove it only
after independently confirming the exact temporary path.
