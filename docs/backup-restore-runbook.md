# SQLite backup and restore runbook

Backups contain personal and authentication data. The external storage environment must provide encryption at rest, least-privilege access, retention limits, auditability, and secure deletion. Phase 11 does not schedule or upload backups.

Use absolute, explicit paths outside broad/root/home targets:

```sh
npm run backup:sqlite -- /absolute/source.db /absolute/backup.db
npm run restore:sqlite -- /absolute/backup.db /absolute/new-target.db
```

Backup uses SQLite's online backup API, creates mode 0600 where supported, refuses overwrite, validates integrity/foreign keys/indexes, and writes a sibling `.manifest.json` containing only UTC time, application/schema state, size, and SHA-256 checksum. Never copy a live `.db` file directly.

Restore verifies the checksum before opening data, validates integrity, foreign keys, migration compatibility, safe table counts, authentication relations, status-event presence, and `Appointment_one_active_per_slot`. It writes a `.partial` database, validates it, and atomically renames it to a new target. Failure removes partial output. Active-database replacement is intentionally not offered by the command.

For recovery, stop traffic, preserve the failed database for investigation, restore to a new path, run the validation command, update the secret database URL through the deployment system, start the candidate, wait for readiness, and then switch traffic. Roll back by returning to the prior untouched database path. Never test against `apps/server/prisma/dev.db`.
