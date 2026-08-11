# Production provider decision package

Status: **decision required; no provider selected or provisioned**.

## Mandatory technical requirements

| Area                   | Minimum requirement                                                                                                    | Evidence required before approval                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Server                 | Exactly one long-running NestJS/Node 24.19.0 instance; SIGTERM grace period greater than 10 seconds                    | Runtime/process and restart policy                                                 |
| Web                    | Exactly one Next.js/Node 24.19.0 instance built with the approved public API origin                                    | Build/runtime separation and restart policy                                        |
| Database               | One active SQLite writer owned by NestJS                                                                               | Topology declaration and enforcement of replica count 1                            |
| Storage                | Durable filesystem volume mounted at `/data`, writable by the non-root server user, preserved across releases/restarts | Volume durability, backup compatibility, ownership, capacity, and failure behavior |
| Deployment             | Candidate startup and readiness before atomic traffic switch; immutable revision/artifact identity                     | Deployment and traffic-switch procedure                                            |
| Rollback               | Previous compatible artifact retained; reverse traffic switch; database recovery uses a new restored path              | Rollback limits, authority, and rehearsal support                                  |
| Domain/TLS             | Approved domains, automatic certificate renewal, TLS 1.2+, HTTPS redirect, HSTS-compatible termination                 | DNS/TLS ownership and expiry alerting                                              |
| Secrets                | Runtime injection without image/source/log exposure; least privilege, audit, rotation, and revocation                  | Secret-store mechanism and access model                                            |
| Logs                   | Unmodified newline-delimited JSON stdout/stderr ingestion with retention and restricted access                         | Search, request-ID correlation, and redaction evidence                             |
| Monitoring             | HTTPS/liveness/readiness, elevated failures, process restart, volume capacity, and backup failure signals              | Thresholds, recipients, escalation, and delivered test alert                       |
| Backup                 | Scheduled online SQLite backup; encrypted remote storage distinct from the runtime volume                              | Scheduler, encryption, checksum, access, and failure alert evidence                |
| Retention              | Explicit retention period, auditability, legal/product approval, and secure deletion                                   | Policy and lifecycle-rule evidence                                                 |
| Recovery               | Named owner can restore to an isolated new path and switch only after validation                                       | Restore drill and escalation route                                                 |
| Availability objective | Proposed initial service objective and maintenance allowance approved by release owner                                 | Measurable target and alert mapping                                                |
| Recovery objectives    | Proposed RPO no greater than the approved backup interval; explicit RTO supported by restore rehearsal                 | Approved RPO/RTO and drill timing                                                  |

## Sizing assumptions to validate

The first release assumes low course/demo traffic: one server and one web process, no sustained concurrency beyond the existing local performance harness, a single SQLite writer, and modest database growth. Candidate evaluation must state CPU, memory, persistent-volume capacity/IOPS, outbound log/backup bandwidth, expected concurrent users, monthly growth, and headroom. Suggested evaluation floor—not a purchase recommendation—is 1 dedicated/vCPU-equivalent and 1 GiB RAM per application process plus at least 10 GiB durable storage. Load and real usage evidence must replace these assumptions before capacity is approved.

## Decision matrix

Score each authorized candidate as pass/fail, attach sourced evidence, and do not compensate for a mandatory failure with price or convenience.

| Criterion                                               | Mandatory | Candidate evidence |
| ------------------------------------------------------- | --------: | ------------------ |
| Single-instance controls and durable `/data` volume     |       Yes | Pending            |
| Atomic candidate/traffic switch and compatible rollback |       Yes | Pending            |
| Non-root containers and SIGTERM lifecycle               |       Yes | Pending            |
| Domain, HTTPS, renewal, and trusted-proxy support       |       Yes | Pending            |
| Audited secret injection                                |       Yes | Pending            |
| Structured-log export and actionable alerts             |       Yes | Pending            |
| Scheduled encrypted off-runtime backups and retention   |       Yes | Pending            |
| Isolated restore support and named ownership            |       Yes | Pending            |
| Approved availability, RPO, and RTO                     |       Yes | Pending            |
| Resource limits, volume monitoring, and cost visibility |       Yes | Pending            |
| Data location and contractual/privacy fit               |       Yes | Pending            |

## Decisions required

- Named hosting/provider and region/data location.
- Production web and API domains and DNS owner.
- HTTPS termination and trusted-proxy topology.
- Secret-injection system and owners.
- Log/monitoring/alert system, thresholds, recipients, and retention.
- Remote backup system, schedule, retention, encryption/access policy, RPO, and RTO.
- Incident, recovery, technical-review, accessibility-review, facilitator, Staff, and Agent owners.
- Explicit authorization to create each external resource and deploy.
