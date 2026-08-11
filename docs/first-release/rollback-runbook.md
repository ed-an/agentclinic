# Provider-neutral rollback runbook

Rollback authority and the target-specific command must be approved before deployment.

Trigger rollback for failed readiness, critical journey failure, privacy/security exposure, migration/data-integrity failure, sustained elevated errors, missing observability, or release-owner direction.

1. Declare the incident, record UTC time/revision/request IDs, and stop affected traffic or writes.
2. Preserve logs and the current database; never edit or replace a live SQLite file manually.
3. If the prior application is schema-compatible, start its retained immutable artifact, wait for readiness, reverse the atomic traffic switch, and verify smoke/monitoring.
4. If schema compatibility is uncertain, do not start the older application. Follow recovery: restore the verified pre-migration backup to a new path, validate it, update the target database secret/configuration, start a compatible candidate, and switch traffic only after readiness.
5. Communicate status, impact, accepted risk, and next decision. Record deviations and corrective actions.

The generic `scripts/rollback-target.mjs` refuses to run without explicit target, revision, authorization, and reviewed provider command. Destructive database replacement is not implemented.
