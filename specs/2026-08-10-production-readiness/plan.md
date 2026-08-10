# Production Readiness — Plan

The numbered task groups are independent merge checkpoints within the single Phase 11 feature package. Complete and verify each group before moving on, preserve a usable application, and do not mark the roadmap complete until the final gate passes.

## 1. Freeze the operational contract and evidence baseline

1. Inventory server/web routes, production commands, environment settings, cookies, CORS/Origin/CSRF rules, probes, Prisma lifecycle, migrations, Playwright orchestration, and Phase 2–10 checks.
2. Record the approved log schema/event names, request-ID grammar, error codes, health bodies, readiness dependencies, shutdown timeout, proxy topology setting, header matrix, performance route set, backup manifest schema, and unsafe-path policy.
3. Capture two reproducible pre-change production-build performance baselines where the current application can support them; label unsupported checks as baseline gaps rather than fabricated passes.
4. Update the known-risk evidence with exact installed production paths and reachability without changing dependencies yet.

**Checkpoint:** one reviewed contract defines every observable behavior, redaction boundary, budget, and test surface.

## 2. Centralize and validate production configuration

1. Introduce one typed server configuration boundary covering environment, service identity, port, SQLite URL, timezone, cancellation/session settings, demo-auth policy, trusted origins, credentials/CORS, cookie security, HTTPS, and explicit proxy trust.
2. Reject missing/invalid production values, wildcard credentialed CORS, unsafe demo seeding, inconsistent cookie/TLS/proxy settings, and invalid inherited Phase 2–10 settings before listen/readiness.
3. Return stable safe failure codes without printing values, URLs, secrets, or the environment.
4. Add the corresponding server-side-only Next.js production configuration/header assumptions and document TLS termination ownership.

**Checkpoint:** unsafe production configuration fails non-zero before traffic, while documented local/test configurations remain usable.

## 3. Add correlation and privacy-safe structured logging

1. Implement strict incoming `X-Request-ID` validation, cryptographically random fallback, response propagation, and request-scoped correlation that remains isolated under concurrency.
2. Emit canonical newline-delimited JSON request events with only approved fields, route templates, accurate status/duration, UTC timestamps, service, and environment.
3. Normalize safe application/startup/error/readiness/shutdown event names and error codes; define controlled stack-trace behavior.
4. Add redaction and log-injection tests covering bodies, queries, dynamic routes, personal data, headers, tokens, hashes, database URLs, secrets, control characters, and concurrent failures.
5. Document stdout/stderr integration boundaries and optional field-preserving development presentation.

**Checkpoint:** success, 4xx, 5xx, and concurrent requests produce parseable correlated logs with no prohibited content.

## 4. Split health checks and implement lifecycle behavior

1. Add minimal `/health/live` and safe `/health/ready` contracts and update smoke/Playwright probes from legacy `/health` according to the compatibility decision.
2. Make readiness depend on validated configuration, a minimal SQLite query, current required migration state, and completed startup.
3. Make readiness return `503` during dependency/configuration failure and shutdown without exposing diagnostics publicly.
4. Enable NestJS shutdown hooks and implement SIGTERM/SIGINT draining, stop-accepting behavior, Prisma/Fastify closure, safe lifecycle logs, timeout enforcement, and non-zero fatal startup exit.
5. Test signals in child production processes and prove no lock, listener, or Node process remains.

**Checkpoint:** orchestration can distinguish live/not-ready/ready, and termination is bounded and clean.

## 5. Apply compatible server and web security headers

1. Observe Next.js production responses/assets and design the narrow CSP actually required, including `frame-ancestors`; prefer nonces if dynamic inline execution requires them.
2. Apply CSP, nosniff, referrer, permissions, framing, disclosure-removal, and conditional HSTS policies consistently to server and web surfaces.
3. Validate trusted proxy/HTTPS interpretation so HSTS and secure-cookie behavior activate only under approved conditions.
4. Exercise public, authenticated Agent/Staff, API success/error, and static asset responses; reprove authentication, CSRF, Origin, CORS, redirect, cookie, and rendering behavior.

**Checkpoint:** exact production headers enforce the policy without breaking any browser journey or weakening Phase 10.

## 6. Resolve and document dependency security posture

1. Run `npm audit --omit=dev` and targeted `npm ls` for every affected package and record production/build reachability.
2. Attempt only the package-manager-supported non-breaking `find-my-way` remediation compatible with NestJS/Fastify; prove the resolved tree and rerun server/browser suites.
3. Reassess Next-bundled PostCSS and Sharp. Do not override transitives or start a Next major upgrade; request approval if a major upgrade is the only supported resolution.
4. Record fixed and unresolved advisories, owner, acceptance rationale, and reassessment trigger. Block new or reachable high/critical risk without explicit evidence-based acceptance.

**Checkpoint:** installed-tree evidence supports every remediation or accepted risk claim.

## 7. Build deterministic production performance checks

1. Create isolated Phase 10 data and start production server/web builds with bounded ports/process cleanup and warm-up requests.
2. Exercise approved public read APIs, protected queue/dashboard APIs, and critical SSR pages with small documented concurrency and samples.
3. Compute p50, p95, maximum, throughput, error rate, environment, sample size, and concurrency; enforce hard timeout and agreed budgets.
4. Require two consecutive passing runs, compare against the committed reproducible baseline, explain/approve regressions over 20%, and clean data/processes on success or failure.

**Checkpoint:** a stable local/CI command proves conservative production-build budgets without claiming load-test coverage.

## 8. Complete accessibility and critical browser evidence

1. Add a production-readiness Playwright journey spanning discovery/search, availability/booking, Agent authentication/dashboard/cancellation, Staff authentication/queue/confirmation/cancellation, expiry/sign-out, and error recovery.
2. Add automated axe coverage with no serious/critical findings and assertions for semantics, labels, form errors, announcements, focus, keyboard completion, and recovery.
3. Validate 320px/400%-zoom-equivalent and 1440px layouts, visible focus, contrast, and absence of horizontal overflow.
4. Publish and execute the manual WCAG 2.2 AA-oriented checklist for behavior automation cannot prove; make blockers explicit without claiming certification.

**Checkpoint:** critical existing journeys are keyboard-usable, responsive, axe-clean, and manually reviewed where required.

## 9. Implement safe SQLite backup operations

1. Build an operational database boundary using the supported SQLite online backup API without reaching through Prisma internals or copying a live file.
2. Parse and resolve explicit source/destination paths; reject unresolved, root/home/broad/same/active/unsafe targets and overwrite by default.
3. Create the backup with restrictive permissions where supported, then generate the safe versioned manifest with UTC time, app/schema version, migration state, size, and checksum.
4. Ensure output/logs contain no database URL, credentials, record contents, or personal/authentication details.

**Checkpoint:** a live temporary Phase 10 database produces a consistent, checksummed, privacy-safe backup and manifest.

## 10. Implement atomic restore and recovery verification

1. Restore only to a new explicit target by default; define a separate destructive confirmation and outage procedure for any active-database replacement.
2. Verify manifest/checksum before restore, restore atomically, and run SQLite integrity, foreign-key, migration compatibility, and safe table-count checks.
3. Prove authentication/session structures, status events, relationships, and the active-slot partial index survive without printing records.
4. Inject corrupt backup, tampered manifest, unsafe path, collision, and mid-restore failure; prove no partial target remains, repeat successfully, and clean temporary artifacts.
5. Document rollback, recovery, encryption/access/retention/secure-deletion responsibilities, and the prohibition on automated use of `apps/server/prisma/dev.db`.

**Checkpoint:** temporary-database restore is repeatable, verified, atomic, and safe by default.

## 11. Write deployment and incident-response runbooks

1. Document production build/start order, migrations, configuration preflight, TLS/proxy boundary, CORS/cookies/headers, readiness cutover, graceful termination, and rollback.
2. Document logging/event integration boundaries, request-ID support workflow, safe diagnostics, readiness/database incidents, failed startup, dependency advisories, and security/privacy incidents.
3. Document backup creation, verification, restore rehearsal, destructive production replacement approval, external encryption/access/retention, and recovery ownership.
4. Keep examples free of real secrets, personal data, database URLs, and provider-specific requirements.

**Checkpoint:** an operator can deploy, diagnose, stop, back up, restore, and roll back safely using provider-neutral instructions.

## 12. Run Phase 2–10 regression and the final merge gate

1. Run clean/existing migration and deterministic seed checks; verify schema, foreign keys, integrity, migration state, and the active-slot partial index.
2. Run all catalog, relationship, UTC/timezone, availability, booking/idempotency/concurrency, cancellation/status-event, dashboard, authentication/session/ownership, CSRF/CORS/privacy, responsive, and accessibility regressions.
3. Run Prisma generation, formatting, linting, strict type checking, root validation, production builds, smoke, complete Playwright, dependency audit/tree checks, two performance runs, backup/restore validation, and `git diff --check` on Node 24.19.0.
4. Inspect logs, responses, manifests, reports, traces, screenshots, and tracked files for prohibited or personal data; confirm all temporary data/processes are removed.
5. Record every result and blocker. Do not silently skip, use `sudo`, treat environment failure as pass, or mark the roadmap complete before review.

**Checkpoint:** all automated and manual evidence is reproducibly green and the implementation branch is ready for review.
