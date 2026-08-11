# First Release — Plan

## 1. Establish release governance and the provider decision gate

1. Confirm the Phase 12 requirements, evidence locations, release owner, Technical reviewer, Accessibility reviewer, facilitator, Staff participant, and Agent participant.
2. Create a traceable release checklist with explicit pass, fail, blocked, accepted-risk, and not-applicable states.
3. Document provider-neutral production requirements and stop at the provider-selection gate.
4. Obtain separate explicit authorization before selecting or provisioning any provider or external resource.

**Checkpoint:** responsibilities, evidence rules, and the provider decision gate are approved without any external resource having been selected or created implicitly.

## 2. Approve the target production design

1. After provider authorization, record the hosting decision and map it to one NestJS instance, one Next.js instance, persistent SQLite storage, and one active writer.
2. Document domain and HTTPS termination, process supervision, persistent-volume lifecycle, network boundaries, trusted-proxy behavior, UTC storage, and `America/Sao_Paulo` display.
3. Confirm that no component assumes replicas, horizontal scaling, multiple writers, or shared in-memory throttling.
4. Record capacity assumptions, ownership, and triggers that would require architecture reassessment.

**Checkpoint:** the approved design preserves the current architecture and makes its single-instance limitations explicit.

## 3. Prepare secure production configuration

1. Inventory required production configuration without recording secret values.
2. Configure an approved secure injection mechanism with least-privilege access, rotation, revocation, and named ownership.
3. Validate origins, public URLs, database configuration, timezone, HTTPS/cookie/proxy behavior, sessions, and operational settings before traffic is accepted.
4. Scan source, logs, HTML, URLs, responses, build output, screenshots, and release artifacts for secret leakage.

**Checkpoint:** production configuration validates successfully and no secret appears in prohibited output.

## 4. Connect external observability and incident handling

1. Route privacy-safe structured logs to the approved external collector.
2. Configure availability, readiness, application-error, and backup-failure monitoring and alerts.
3. Send at least one safe test alert through the real delivery path and record receipt and escalation evidence.
4. Assign incident ownership and rehearse request-ID correlation, triage, escalation, and release communication without exposing personal data.

**Checkpoint:** logs are externally searchable, an actionable test alert reaches its owner, and incident responsibilities are usable.

## 5. Establish scheduled encrypted backup and recovery

1. Configure the supported SQLite backup command on an approved schedule.
2. Store backups in encrypted remote storage with least-privilege access, retention, audit, and secure-deletion controls.
3. Record safe checksum, schedule, retention, and success/failure evidence.
4. Restore a selected backup into an isolated target and validate checksum, SQLite integrity, foreign keys, migrations, and safe expected data.
5. Assign backup/recovery ownership and test failure escalation.

**Checkpoint:** a scheduled encrypted remote backup and isolated restore drill succeed without modifying production data.

## 6. Investigate hydration behavior and dependency risk

1. Reproduce the hydration warning under controlled production-build and browser conditions and locate its source.
2. Correct the source with focused regression evidence, or document attempts and evidence supporting a non-reproducible disposition.
3. Do not merge the WIP workaround automatically and do not delete or retire its branch in this work.
4. Reassess `find-my-way`, Next-bundled PostCSS, and Next-bundled Sharp against the release tree and production features.
5. Record remediation or explicit acceptance with reachability, owner, and trigger; stop on any unresolved critical advisory.

**Checkpoint:** hydration behavior has an evidence-based disposition and dependency risks remain accurate, explicit, and non-critical.

## 7. Run manual accessibility and representative usability reviews

1. Prepare scripted critical Agent and Staff journeys and privacy-safe finding templates.
2. Have the Accessibility reviewer complete the manual NVDA/assistive-technology review and classify every finding.
3. Have the named facilitator conduct the scripts with at least one representative Staff participant and one representative Agent participant.
4. Record severity, owner, disposition, release-blocking state, and participant approval or rejection without credentials or personal data.
5. Correct and revalidate every release-blocking finding.

**Checkpoint:** manual accessibility and representative usability evidence is complete and no blocking finding or required participant rejection remains.

## 8. Deploy, migrate, and verify production

1. Run all repository validation commands and create the production builds.
2. Complete deployment preflight, take and verify a backup, and apply committed migrations to the approved production target.
3. Deploy the NestJS and Next.js instances and verify startup, liveness, readiness, HTTPS, security headers, and production configuration.
4. Exercise public booking, Agent authentication/dashboard/cancellation, and Staff authentication/queue/confirmation/cancellation.
5. Recheck sessions, ownership, CSRF, CORS, privacy, safe errors, log ingestion, alerts, and absence of secret leakage.

**Checkpoint:** production deployment and all required technical and critical-journey evidence pass against the approved target.

## 9. Test rollback and recovery readiness

1. Define rollback triggers, authority, traffic handling, application rollback, database compatibility, verification, and communication.
2. Rehearse the procedure safely without destructive production database replacement.
3. Verify the restored target and operational monitoring after the rehearsal.
4. Record deviations, owners, and corrective actions and repeat failed checks.

**Checkpoint:** rollback and recovery procedures are proven, owned, and safe for the approved topology.

## 10. Complete go/no-go review and release communication

1. Assemble the final checklist and evidence for every requirement and validation gate.
2. Obtain Technical reviewer, Staff representative, Agent representative, and Accessibility reviewer sign-offs.
3. Record accepted risks and confirm that no critical issue or blocked required check remains.
4. Prepare scope, support, ownership, known-risk, timing, and rollback communications.
5. Ask the release owner for the final decision; proceed only on an explicit GO.
6. Record release verification and communication. Any missing approval or rejection is NO-GO.

**Checkpoint:** the release owner has issued GO based on complete evidence, the release is communicated, and the initial production release is verified without expanding product scope.
