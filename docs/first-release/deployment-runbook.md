# Provider-neutral deployment and migration runbook

This procedure is inert until the release owner records a provider decision and separately authorizes provisioning and deployment.

1. Record the immutable revision, version, approved target, domains, artifact digests, owners, and authorization.
2. Build the default runtime targets in `containers/server.Dockerfile` and `containers/web.Dockerfile` with Node 24.19.0, and build the server's explicit `migration` target for committed migrations. Supply only the approved public API URL as the web build argument; inject secrets only at runtime.
3. Generate the manifest with explicit `RELEASE_VERSION`, `RELEASE_REVISION`, and `SOURCE_DATE_EPOCH`; reproduce it from the same inputs and compare bytes.
4. Mount the server's durable volume at `/data`, owned by its non-root runtime user. Set `DATABASE_URL=file:/data/agentclinic.db`, instance count `1`, and writer mode `single`.
5. Run `npm run release:preflight` in the target configuration. Never print values when diagnosing a failure.
6. Stop writes or use the approved candidate/migration sequence; create and verify an online backup before migration.
7. Run committed migrations exactly once from the server `migration` target against the selected database. The default runtime image contains production dependencies only.
8. Start the candidate, verify `/health/live` and `/health/ready`, then atomically switch traffic.
9. Run `npm run release:check` with explicit HTTPS server/web URLs and complete the critical browser/security checklist.
10. Monitor errors, readiness, volume, and backup signals through the approved observation window; communicate status.

The generic `scripts/deploy-target.mjs` refuses to run without explicit target, artifact, authorization, and a separately reviewed provider command. It does not select or implement a provider.
