# Production Readiness — Requirements

## Context

This feature delivers Phase 11, **Production readiness**, from [the roadmap](../roadmap.md) as one feature package split into independently verifiable task groups and merge checkpoints. It follows [the mission](../mission.md) by making care workflows trustworthy, private, recoverable, accessible, and easy to demonstrate. It follows [the technical constitution](../tech-stack.md): NestJS remains the authoritative operational and data boundary, Next.js consumes the versioned HTTP API, SQLite remains the durable store, production output is safe, and automated evidence covers critical journeys.

Phase 11 establishes local operational foundations that a later deployment may connect to an external platform. It does not deploy infrastructure or select an observability vendor.

## Inspected baseline and constraints

The specification is based on the current implementation, lockfile, documentation, and runtime assumptions:

- The server currently exposes only `GET /health`, which always returns `{ "status": "ok" }`; there is no separate liveness/readiness or migration-state check.
- NestJS uses Fastify with an 8 KiB body limit, credentialed CORS, and configured/default local origins. Startup has no unified production configuration validation, explicit fatal-exit policy, trusted-proxy policy, request correlation, structured HTTP logging, or graceful shutdown hooks.
- Prisma owns application database access through `@prisma/adapter-better-sqlite3`; its `PrismaService` connects/disconnects on module lifecycle. The installed `better-sqlite3@12.11.1` provides a supported online backup API, but Prisma does not expose its underlying connection. Backup tooling therefore needs an explicit, narrowly scoped SQLite operational boundary rather than reaching through Prisma internals.
- Next.js has no configured response-security headers. Auth cookies become `Secure` only when `NODE_ENV=production`; trusted origins, proxy/TLS state, HSTS, cookie security, and production deployment topology are not yet validated together.
- Smoke and Playwright orchestration use isolated temporary SQLite databases and production builds, but there is no committed performance harness, backup/restore harness, production-readiness browser journey, or shutdown proof.
- The resolved production tree contains `@nestjs/platform-fastify@11.1.28` / `fastify@5.10.0` / `find-my-way@9.6.0`. `find-my-way@9.7.0` is fixed and already resolves elsewhere in the tree, but the supported non-breaking Fastify/Nest resolution must be proven before changing the lockfile.
- Next `15.5.22` bundles `postcss@8.4.31` and `sharp@0.34.5`. Their current reachability and upgrade constraints remain those recorded in [security-known-risks.md](../../docs/security-known-risks.md). A major Next.js upgrade requires explicit approval.
- The repository targets Node 24.19.0 for this phase and uses the previously successful Playwright environment. Environmental limitations are blockers, not passes.

These findings are constraints, not permission to use unsupported overrides, expose adapter internals, weaken Phase 10 security, or operate on `apps/server/prisma/dev.db`.

## Goal

Make the completed Phase 2–10 application operationally ready for a production-like environment by adding safe local observability, health and lifecycle behavior, validated production configuration, compatible browser/server security headers, evidence-based dependency handling, deterministic performance and accessibility gates, safe SQLite backup/restore tooling, and actionable deployment/incident runbooks.

## Scope and decisions

### Structured logging and request correlation

1. Emit newline-delimited structured JSON to stdout/stderr in production. An optional readable development renderer may change presentation but not the canonical field set or redaction rules. Do not create or rotate application log files.
2. Use stable event names for request completion, safe errors, startup, readiness changes/failures, shutdown, and fatal startup/configuration failures.
3. Every HTTP request receives an effective `requestId`. Accept `X-Request-ID` only under one documented strict character set and maximum length; otherwise generate a cryptographically random identifier. Return it in `X-Request-ID` and propagate it through NestJS handling and error reporting.
4. HTTP completion events contain only UTC timestamp, severity, stable event name, request ID, method, route template rather than raw URL, status, `durationMs`, service name, and environment. Error events may add a safe error class/code and the same request ID.
5. Concurrent requests must not mix correlation context. Dynamic path values and query strings must not appear as route templates.
6. Never log request/response bodies, raw query strings, visitor names/emails, passwords/hashes, Cookie, Set-Cookie, Authorization, CSRF, Idempotency-Key, session/token values or hashes, database URLs, secrets, or full environment/configuration. Sanitize control characters so attacker input cannot forge log lines.
7. Public errors contain only stable safe codes/messages and request IDs. Stack traces never enter API responses; internal stacks may appear only under the documented controlled-log policy.

### Health and lifecycle

8. Expose `GET /health/live` and `GET /health/ready`. Retain, redirect, or remove legacy `GET /health` only after updating internal probes and documenting compatibility.
9. Liveness proves only that the process/event loop can respond. It must not depend on SQLite, migrations, external network access, or secret configuration details.
10. Readiness returns `200` only when required production configuration is valid, SQLite completes a minimal query, required migrations are present/current, and the application can serve traffic. It returns `503` otherwise.
11. Health bodies are small and stable and reveal no paths, versions, migration names, environment values, hosts, exception text, or secrets.
12. Handle `SIGTERM` and `SIGINT`: mark not-ready, stop accepting new work, drain or terminate within a documented timeout, close Prisma and HTTP resources, emit safe lifecycle events, and leave no lock or hanging process. Fatal startup/configuration failures log safely and exit non-zero.

### Production configuration and deployment boundary

13. Validate all required production configuration before accepting traffic, including exact trusted web origins, no wildcard credentialed CORS, valid IANA timezone and cancellation/session values, explicit safe demo-auth policy, valid SQLite `file:` URL, compatible cookie/HTTPS/proxy settings, and every required Phase 2–10 setting.
14. Validation failures name only stable setting/error codes, never values or the complete environment.
15. TLS termination remains infrastructure responsibility. Trust forwarded proxy headers only through an explicit, validated known-topology setting; default to no proxy trust.
16. Define production-safe CORS, Origin checks, cookie attributes, HSTS activation, host/origin assumptions, and return-path behavior consistently across NestJS and Next.js without weakening Phase 10.
17. Document configuration, startup, deployment, rollback, operational probes, logging integration boundaries, and incident response without selecting a provider.

### Security headers

18. Apply compatible policies to NestJS and Next.js responses: CSP including `frame-ancestors`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy, safe framing protection, and removal of unnecessary framework disclosure such as `X-Powered-By`.
19. Emit HSTS only for approved production HTTPS/proxy conditions. Do not create a false HTTPS signal in local HTTP operation.
20. Derive CSP from actual Next.js production behavior. Do not allow `unsafe-inline` or `unsafe-eval` unless a proven framework requirement is minimized and documented. If nonces are required, create a fresh cryptographically random nonce per response and propagate it safely.
21. Do not add obsolete headers. Headers must preserve rendering, static assets, authentication, cookies, CSRF, Playwright, and all existing journeys.

### Dependency security

22. Treat [security-known-risks.md](../../docs/security-known-risks.md) as the starting risk register, then verify the installed production tree with `npm audit --omit=dev` and targeted `npm ls` evidence.
23. Apply the supported non-breaking remediation for `find-my-way` if dependency resolution permits and prove the resolved runtime tree. Do not use unsupported transitive overrides or automatic `npm audit fix`.
24. Reassess PostCSS and Sharp runtime/build-time reachability. Stop and request approval before a major Next.js upgrade; do not claim remediation unless the installed tree proves it.
25. Any newly introduced or production-reachable high/critical advisory blocks merge unless an evidence-based acceptance identifies reachability, reason, owner, and reassessment trigger.

### Deterministic performance validation

26. Add a local/CI harness against production server and web builds using isolated seeded data, warm-up exclusion, controlled small concurrency, documented environment, sample sizes, hard timeout, and reliable cleanup.
27. Measure public and authenticated critical APIs/pages and report p50, p95, maximum, throughput, failures/error rate, environment, samples, and concurrency.
28. Blocking budgets are zero failures; critical read APIs p95 at most 300 ms; protected queue/dashboard APIs p95 at most 400 ms; critical server-rendered pages after warm-up p95 at most 1,000 ms; and no request beyond the documented hard timeout.
29. Commit a reproducible baseline. A material regression greater than 20% requires explanation and approval. Two consecutive runs must meet the contract. These results are local production-build checks, not internet-latency or full-load claims.

### Accessibility and critical journeys

30. Target WCAG 2.2 AA without claiming certification for public catalog/search, booking, Agent sign-in/dashboard/cancellation, Staff sign-in/queue/confirmation/cancellation, errors, empty states, session expiry, and sign-out.
31. Validate semantics, names/descriptions, keyboard completion, visible focus, focus management, form errors, status announcements, contrast, 320 CSS pixel/400%-zoom-equivalent reflow, 1440px desktop, and absence of horizontal overflow.
32. Automated axe checks must report no serious or critical violations. Document manual checks that automation cannot prove and treat keyboard blockers, missing labels, unrecoverable focus, or overflow as merge blockers.

### SQLite backup, restore, and integrity

33. Add operational commands that use an approved consistent SQLite backup mechanism. Never naively copy a live database and never operate on `apps/server/prisma/dev.db` during automated validation.
34. Require explicit resolved source/destination paths; reject root, home, broad, unresolved, same-file, active-database overwrite, and other unsafe paths. Refuse overwrite by default and create restrictive permissions where supported.
35. A backup manifest contains only UTC creation time, application/schema version, migration state, byte size, and cryptographic checksum—never credentials, URLs, record contents, or personal data.
36. Restore to a new explicit target by default. Overwriting the active database requires a separate explicit destructive confirmation mechanism and documented outage/rollback procedure.
37. Validate checksum before restore, SQLite integrity and foreign keys, migration compatibility, and safe expected table counts. Fail atomically without a partial target and preserve authentication data, status events, relations, and the active-slot partial index.
38. Automated backup/restore tests use temporary databases only, inject corruption/failure, repeat successfully, and clean all artifacts.
39. Runbooks state that backups contain personal/authentication data and require infrastructure-provided encryption at rest, access restriction, retention, and secure deletion. External storage, scheduling, and retention implementation remain out of scope.

### Regression and documentation

40. Revalidate all Phase 2–10 contracts: migrations/seeds, catalogs, relationships, UTC/timezone behavior, booking/idempotency/concurrency, availability/index invariants, cancellation/status events, dashboards, authentication/sessions/ownership, CSRF/CORS/privacy, responsiveness, and accessibility.
41. Add production deployment, health/probe, shutdown, backup/restore, rollback, logging integration, dependency-risk, and incident-response documentation with commands and safe failure behavior.

## Out of scope

- Infrastructure deployment, cloud-provider selection, Kubernetes, CDN/WAF setup, external log aggregation, dashboards, alert delivery, distributed tracing, application metrics backend, or centralized secret management.
- Sentry, Datadog, Grafana, Prometheus, OpenTelemetry, or any required external observability platform.
- Automated backup scheduling, remote retention/storage, regional disaster recovery, horizontal-scaling redesign, or replacing SQLite.
- Penetration-testing certification, formal/complete WCAG certification, unsupported dependency overrides, automatic audit fixes, or an unapproved major Next.js upgrade.
- Catalog editing, rescheduling/reminders, analytics, or any later-roadmap capability.

## Completion outcome

The application starts and stops predictably, exposes safe operational health, produces correlated privacy-safe logs, rejects unsafe production configuration, serves compatible security headers, has an evidence-based dependency posture, meets reproducible local performance and accessibility gates, and can back up and restore SQLite safely through documented commands. Every Phase 2–10 regression remains green. Phase 11 is not complete until implementation and all evidence pass in a later authorized change.
