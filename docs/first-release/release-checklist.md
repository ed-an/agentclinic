# First release go/no-go checklist

Allowed states: `PASS`, `FAIL`, `BLOCKED`, `ACCEPTED-RISK`, `N/A`. Every state needs a dated, privacy-safe evidence link and owner. A missing required sign-off, `FAIL`, `BLOCKED`, or unresolved critical issue is **NO-GO**.

## Governance

- [ ] Release owner named: **BLOCKED — human assignment required**
- [ ] Technical reviewer named: **BLOCKED — human assignment required**
- [ ] Accessibility reviewer named: **BLOCKED — human assignment required**
- [ ] Facilitator, Staff participant, and Agent participant named: **BLOCKED — human assignment required**
- [ ] Incident and backup/recovery owners named: **BLOCKED — human assignment required**
- [ ] Provider decision and separate provisioning authorization: **BLOCKED — external gate**

## Local preparation

- [ ] Reviewed revision and reproducible release manifest recorded
- [ ] Repository validation suite passes on Node 24.19.0
- [ ] Production containers build and run as non-root
- [ ] Single-instance/single-writer configuration rejects unsupported topology
- [ ] `/data` persistent SQLite path contract and migration/preflight procedure pass
- [ ] Hydration investigation has an evidence-based disposition
- [ ] Dependency and secret scans are recorded with no unresolved critical issue

## External production evidence

- [ ] Approved target, domains, HTTPS, storage, and configuration
- [ ] Secure secret injection and leakage scan
- [ ] External log ingestion and delivered actionable test alert
- [ ] Scheduled encrypted remote backup, checksum, retention, and access controls
- [ ] Isolated restore drill and rollback rehearsal
- [ ] Clean production migration, deployment, liveness, readiness, headers, and critical journeys

## Human evidence and sign-off

- [ ] Manual NVDA review approved
- [ ] Staff participant approves Staff workflow
- [ ] Agent participant approves Agent workflow
- [ ] Technical reviewer approves technical evidence
- [ ] Release owner issues explicit GO
- [ ] Release and rollback communication approved

Current result: **NO-GO — provider selection, external evidence, human reviews, and sign-offs remain blocked.**
