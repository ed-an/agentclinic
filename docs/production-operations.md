# Production operations

## Deployment boundary

Build with Node 24.19.0, run committed migrations against the selected SQLite database, then start the NestJS server and Next.js production build. TLS termination, secret injection, process supervision, log collection, encryption at rest, and network policy belong to deployment infrastructure. AgentClinic does not trust proxy headers unless `AGENTCLINIC_TRUST_PROXY=loopback` is explicitly selected for a known loopback proxy topology.

Production startup requires an explicit non-development SQLite URL, exact trusted web origins, HTTPS mode, valid timezone/cancellation/shutdown values, and disabled demo-account seeding. Failure emits only a stable JSON error code and exits non-zero before listen. Never print configuration values while diagnosing it.

## Probes and lifecycle

- `GET /health/live` proves only that the process responds.
- `GET /health/ready` returns 200 after configuration, SQLite connectivity, and all nine required migrations are ready; it returns 503 otherwise.
- Probe bodies intentionally omit versions, paths, migrations, environment, hosts, and errors.

On SIGTERM/SIGINT the process becomes unready, stops accepting traffic, closes Fastify and Prisma, and exits within `AGENTCLINIC_SHUTDOWN_TIMEOUT_MS` (10 seconds by default). A timeout is fatal and non-zero. Configure the supervisor grace period above this bound.

## Logging integration

Production logs are newline-delimited JSON on stdout/stderr. Collect them externally without modifying application output. Stable events include `http.request.completed`, `http.request.failed`, `lifecycle.started`, `lifecycle.startup.failed`, and shutdown events. Support staff may use the returned `X-Request-ID`; never request cookies, credentials, query strings, bodies, or database URLs. Route fields are templates rather than raw URLs. No metrics, trace, dashboard, or alert backend is selected in Phase 11.

## Headers and browser boundary

NestJS and Next.js set CSP, framing, MIME, referrer, permissions, and disclosure protections. HSTS is emitted only when production HTTPS mode is explicit. Next.js App Router currently requires inline bootstrap scripts/styles, so production CSP narrowly retains `unsafe-inline`; `unsafe-eval` is not allowed. Reassess CSP whenever Next.js rendering changes.

Deploy by starting a candidate, waiting for readiness, switching traffic, and then signaling the old process. Roll back by reversing traffic to the previous compatible build. Do not roll back across an incompatible migration without the database recovery procedure.
