# First release incident checklist

- [ ] Name incident owner and backup delegate.
- [ ] Record UTC start, deployed revision, stable events, safe request IDs, and health state.
- [ ] Do not collect bodies, cookies, credentials, tokens, database URLs, or personal records.
- [ ] Classify availability, startup/configuration, database/readiness, elevated errors, security/privacy, dependency, storage, or backup failure.
- [ ] Contain traffic and preserve evidence; never edit live SQLite manually.
- [ ] Choose compatible application rollback or restore-to-new-path recovery.
- [ ] Verify integrity, migrations, liveness/readiness, critical journeys, log ingestion, and alerts before restoring traffic.
- [ ] Communicate impact and status through the approved route.
- [ ] Record cause, owner, corrective action, and reassessment trigger.
