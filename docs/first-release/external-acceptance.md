# External service acceptance criteria

## Secrets

Runtime-only injection; least privilege; access audit; rotation and emergency revocation; named owner; no values in image metadata, source, logs, HTML, URLs, build output, screenshots, or reports.

## Logs, monitoring, and alerts

Ingest unmodified structured stdout/stderr; preserve safe request IDs; restrict access and retention; monitor HTTPS, liveness, readiness, elevated failures, restarts, volume capacity, and backup failures; deliver a safe actionable test alert to a named responder with escalation.

## Backups

Run the supported online SQLite backup on an approved schedule; encrypt in transit and at rest; store away from the runtime volume; enforce least privilege, retention, audit, and secure deletion; retain checksum/manifest evidence; alert on missed/failed jobs; assign a restore owner and prove isolated restore within approved RPO/RTO.

All three sections remain **BLOCKED** until a provider is approved, resources are separately authorized, and real evidence is reviewed.
