# Incident response

1. Protect people and data: stop affected traffic if privacy, authentication, corruption, or unsafe configuration is suspected.
2. Record UTC time, stable event names, request IDs, deployed commit, and safe health status. Do not collect bodies, cookies, credentials, tokens, database URLs, or personal records.
3. Classify startup/configuration, readiness/database, elevated 5xx, dependency, security/privacy, or backup/restore failure.
4. Contain with rollback, origin/proxy correction, process replacement, or restore-to-new-target as appropriate. Never edit a live SQLite file manually.
5. Verify liveness/readiness, critical browser journeys, integrity/foreign keys, migrations, and log privacy before restoring traffic.
6. Document cause, impact, corrective action, owner, and reassessment trigger. Rotate externally managed secrets if exposure is plausible.

Escalate any suspected unauthorized access, corrupted backup, missing migration, repeated shutdown timeout, or production-reachable high/critical advisory. External alert delivery and vendor dashboards remain deployment responsibilities.
