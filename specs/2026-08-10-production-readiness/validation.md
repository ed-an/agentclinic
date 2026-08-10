# Production Readiness — Validation

Phase 11 is merge-ready only when every required check passes. Use Node 24.19.0 and the previously successful Playwright environment. Environmental limitations are blocked, never passed; do not use `sudo`, silently skip checks, or touch `apps/server/prisma/dev.db` in automated operational tests.

## Logging, correlation, errors, and privacy

- [ ] Every request receives a format-valid effective request ID and returns it in `X-Request-ID`.
- [ ] Valid incoming IDs propagate; malformed, oversized, or injected IDs are replaced with cryptographically random IDs.
- [ ] Concurrent requests and errors retain their own IDs without context mixing.
- [ ] Success, 4xx, 5xx, startup, readiness failure/change, shutdown, and fatal events are one-line structured parseable JSON with stable names.
- [ ] Request events contain exactly the approved operational fields, correct UTC timestamp/status/duration, service/environment, and route template rather than raw URL, query, or dynamic values.
- [ ] Public errors contain only safe message/code and request ID; no stack, exception, path, configuration, database, or secret detail appears.
- [ ] Logs contain no bodies, raw query values, visitor names/emails, credentials, cookies, auth/CSRF/idempotency values, session/token hashes, database URLs, secrets, or complete environment.
- [ ] Control characters and multiline attacker input cannot forge or split log events.
- [ ] stdout/stderr behavior and external integration boundaries are documented; no application log files or rotation are added.

## Health, configuration, startup, and shutdown

- [ ] `/health/live` returns the small approved `200` body independently of SQLite/readiness.
- [ ] `/health/ready` returns the approved `200` only after valid configuration, minimal SQLite query, current required migrations, and completed startup.
- [ ] Database, migration, and configuration failures return safe readiness `503` without paths, versions, migration names, values, hosts, exceptions, or secrets.
- [ ] Legacy `/health` behavior and every smoke/Playwright/deployment probe are deliberately migrated or documented.
- [ ] Production startup rejects missing/invalid origins, wildcard credentialed CORS, invalid timezone/session/cancellation values, unsafe demo-auth seeding, invalid database URL, inconsistent cookie/HTTPS/proxy settings, and every other required Phase 2–10 setting.
- [ ] Configuration failures never print rejected values or complete configuration and exit non-zero before accepting traffic.
- [ ] Proxy trust is disabled by default and works only for the documented explicit topology.
- [ ] SIGTERM and SIGINT mark not-ready, stop new work, close HTTP and Prisma resources, and terminate within the documented timeout.
- [ ] Shutdown/fatal events are safe and deterministic; no database lock, listener, child, or hanging Node process remains.

## Headers, cookies, and browser security

- [ ] Exact production headers are asserted on NestJS API success/error/health responses and Next.js public, sign-in, authenticated Agent/Staff, error, and static-asset responses where applicable.
- [ ] Enforced CSP matches actual production Next.js requirements, includes `frame-ancestors`, and does not break rendering, assets, authentication, CSRF, Playwright, or existing journeys.
- [ ] Any required nonce is fresh per response and safely propagated; every `unsafe-inline`/`unsafe-eval` exception is proven, minimized, and documented.
- [ ] Framing is blocked, MIME sniffing is disabled, referrer and permissions policies are present, obsolete headers are absent, and unnecessary framework disclosure is removed.
- [ ] HSTS appears only under approved production HTTPS/proxy conditions and is absent for local/plain HTTP.
- [ ] Phase 10 cookie attributes, credentialed CORS, Origin, CSRF, and return-path protections still pass for trusted and untrusted cases.

## Dependency security

- [ ] `npm audit --omit=dev` and targeted `npm ls` results are recorded against the installed production tree.
- [ ] Supported non-breaking `find-my-way` remediation is applied if available, and the runtime tree proves the fixed version; otherwise the blocker/evidence is explicit.
- [ ] Complete server and browser checks pass after any dependency-resolution change.
- [ ] PostCSS and Sharp build/runtime reachability is reassessed against actual application use.
- [ ] No unsupported transitive override or automatic `npm audit fix` is used, and no major Next.js upgrade occurs without explicit approval.
- [ ] Fixed/unresolved advisories record reachability, reason, owner, and reassessment trigger; no new or reachable high/critical issue is silently accepted.

## Performance

- [ ] The committed harness uses production builds, isolated seeded Phase 10 data, warm-up exclusion, small controlled concurrency, documented samples/environment, hard timeouts, and deterministic cleanup.
- [ ] Approved public/authenticated critical APIs and SSR pages report p50, p95, maximum, throughput, failures/error rate, sample size, and concurrency.
- [ ] Both consecutive runs have zero failed requests.
- [ ] Critical read API p95 is at most 300 ms; protected queue/dashboard API p95 is at most 400 ms; warmed critical SSR page p95 is at most 1,000 ms.
- [ ] No tested request exceeds the documented hard timeout.
- [ ] No material regression exceeds 20% against the reproducible baseline without explanation and approval.
- [ ] Failure or environmental flakiness blocks the gate; output does not claim internet latency or full load-test coverage.

## Accessibility and critical browser journeys

- [ ] Production-mode browser coverage completes public discovery/search, availability/booking, Agent sign-in/dashboard/cancellation, Staff sign-in/queue/confirmation/cancellation, session expiry/sign-out, and error recovery.
- [ ] Critical pages have correct semantic structure, accessible names/descriptions, useful form errors and status announcements, and logical keyboard-only completion.
- [ ] Focus is visible and intentionally placed/restored through navigation, dialogs/errors, mutations, expiry, and recovery.
- [ ] Automated axe checks report no serious or critical violations.
- [ ] Contrast checks and the documented manual WCAG 2.2 AA-oriented checklist pass without claiming formal certification.
- [ ] 320px/400%-zoom-equivalent and 1440px layouts preserve content/actions with no horizontal page overflow.
- [ ] Any keyboard blocker, missing label, unrecoverable focus, serious/critical axe issue, or overflow blocks merge.

## Backup, restore, and runbooks

- [ ] All automated cases use explicit temporary SQLite databases and never back up, restore, migrate, seed, replace, delete, or open `apps/server/prisma/dev.db`.
- [ ] Representative Phase 10 data includes authentication/session structures, every appointment/status-event form, relationships, and the active-slot partial index.
- [ ] Backup uses the supported SQLite online backup mechanism rather than a naive live-file copy.
- [ ] Root, home, broad, unresolved, same, active, and otherwise unsafe source/destination paths are rejected; overwrite is refused by default.
- [ ] Backup permissions are restrictive where supported and the manifest contains only UTC creation time, app/schema version, migration state, size, and cryptographic checksum.
- [ ] Manifest, logs, and output contain no credentials, tokens, database URLs, record contents, or personal/authentication details.
- [ ] Restore defaults to a new explicit target, validates checksum first, and requires a separate explicit destructive confirmation for active-database replacement.
- [ ] SQLite integrity and foreign-key checks, migration compatibility, and safe table-count comparison pass.
- [ ] Authentication data, status events, relations, and the `PENDING`/`CONFIRMED` active-slot partial index remain intact without printing records.
- [ ] Corrupt/tampered input, unsafe paths, unauthorized overwrite, and injected failure are rejected without a partial target.
- [ ] Backup/restore repeats successfully and cleans all temporary files on success and failure.
- [ ] Runbooks cover deployment, preflight, migrations, probes, TLS/proxy assumptions, shutdown, rollback, logs/request IDs, incidents, backup/restore/recovery, and external encryption/access/retention/secure deletion.

## Phase 2–10 regression and final commands

- [ ] Clean and existing-database migrations, repeated deploy, Prisma generation/schema consistency, deterministic seeds, integrity, and foreign keys pass.
- [ ] Agent, Ailment, and Therapy catalogs and relationships remain correct.
- [ ] UTC storage, configured timezone display, availability, cancellation cutoffs, and controlled-clock boundaries pass.
- [ ] Booking idempotency/concurrency, active-slot uniqueness for `PENDING`/`CONFIRMED`, cancellation, availability restoration, and append-only status events pass.
- [ ] Agent and Staff dashboards, confirmation/cancellation, authentication, sessions, ownership, CSRF, CORS, redirects, cookies, cache, and privacy pass.
- [ ] Existing responsive, accessibility, unit, API, integration, validation, smoke, and complete Playwright suites pass.
- [ ] `npm run prisma:generate`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:validation`, migration/schema/integrity checks, `npm run build`, `npm run smoke`, `npm run test:browser`, dependency audit/tree checks, performance validation twice, backup/restore validation, and `git diff --check` pass.
- [ ] All checks run on Node 24.19.0 in the approved environment; no required check is skipped or represented as passed when blocked.
- [ ] Reports, logs, responses, manifests, screenshots, traces, and tracked files contain no prohibited secrets or excess personal data, and temporary processes/data are cleaned.

## Merge gate

- [ ] Every numbered plan checkpoint and every checklist item above has reproducible evidence.
- [ ] The implementation contains no external observability platform, infrastructure deployment, unsupported override, unapproved Next major upgrade, SQLite replacement, formal WCAG claim, or later-roadmap feature.
- [ ] Any remaining accepted dependency risk has explicit evidence, owner, and reassessment trigger; all other blockers are resolved.
- [ ] Phase 11 remains unmarked in the roadmap until a later authorized implementation passes this gate and is ready to merge.
