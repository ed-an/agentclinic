# First Release — Validation

Every required check must link to privacy-safe evidence and have an explicit result. Environmental limitations are **blocked**, not passed. Any required rejection, missing sign-off, blocked check, or unresolved critical issue produces **NO-GO**.

## 1. Scope, governance, and provider authorization

- [ ] Phase 12 includes no Later candidate or unrelated product feature.
- [ ] The release owner, Technical reviewer, Staff representative, Agent representative, Accessibility reviewer, facilitator, incident owner, and backup/recovery owner are identified.
- [ ] The target design remains provider-neutral until an explicit provider decision and separate provisioning authorization are recorded.
- [ ] No provider, paid service, cloud resource, domain/DNS record, bucket, monitor, secret store, production database, or deployment environment was selected or created without authorization.

## 2. Architecture and production configuration

- [ ] Evidence shows one NestJS instance, one Next.js instance, one persistent SQLite database, and one active writer.
- [ ] No horizontal scaling, multiple replicas, multiple writers, or shared/durable in-memory throttle claim exists.
- [ ] Prisma and SQLite remain server-only; Next.js consumes the versioned API.
- [ ] UTC remains authoritative and appointment display uses `America/Sao_Paulo`.
- [ ] Persistent storage, lifecycle, domain, HTTPS termination, network, and trusted-proxy behavior match the approved design.
- [ ] All production configuration validates before readiness succeeds.

## 3. Repository and production build gate

- [ ] Every repository validation command documented for the project passes, including formatting, linting, type checking, validation tests, builds, smoke tests, browser tests, performance checks, dependency checks, and backup/restore validation where applicable.
- [ ] The production server and web builds succeed from the reviewed revision.
- [ ] Generated artifacts and reports contain no credentials, secrets, prohibited personal data, or unrelated changes.
- [ ] The working revision and release artifact are traceable in the final checklist.

## 4. Deployment, migration, health, and transport

- [ ] Deployment to the explicitly approved production target succeeds.
- [ ] A verified pre-migration backup exists.
- [ ] Committed migrations apply cleanly against the production target through the documented procedure.
- [ ] Liveness and readiness return their approved safe results; dependency or migration failure makes readiness fail safely.
- [ ] HTTPS and the approved production security headers pass on representative routes.
- [ ] Domain, origin, CORS, cookie, proxy, and session configuration match the approved production topology.

## 5. Critical journeys and security boundaries

- [ ] A public visitor can find a Therapy, select valid availability, and complete booking without duplicate or ambiguous state.
- [ ] An Agent can authenticate, view only their dashboard, and cancel an eligible Appointment.
- [ ] Staff can authenticate, use the queue, and confirm or cancel eligible Appointments with recorded state changes.
- [ ] Session expiry/revocation, role and record ownership, CSRF, CORS, privacy shaping, concurrency, idempotency, and safe-error behavior pass.
- [ ] Responses, HTML, URLs, logs, screenshots, traces, and reports expose no credentials, secrets, database paths, internal exception details, or unnecessary personal data.

## 6. External logs, monitoring, and alerts

- [ ] Structured application logs reach the approved external collector with request correlation intact and prohibited data absent.
- [ ] Availability, readiness, application-failure, and backup-failure monitoring is active with documented thresholds and ownership.
- [ ] At least one actionable test alert travels through the production delivery path and its receipt and escalation are recorded.
- [ ] Incident ownership, escalation, safe evidence collection, and communication procedures are verified.

## 7. Secrets

- [ ] Production secrets are injected through the approved external mechanism with least-privilege access.
- [ ] Rotation, revocation, ownership, and incident procedures are documented and reviewable.
- [ ] Automated and manual inspection finds no secret in source, Git-tracked configuration, logs, HTML, URLs, responses, build output, screenshots, reports, or release artifacts.

## 8. Scheduled backup, retention, and restore

- [ ] The supported consistent SQLite backup procedure runs successfully on the approved schedule.
- [ ] The resulting backup is stored remotely with encryption at rest and documented access controls.
- [ ] Retention, auditability, secure deletion, ownership, and failure alerting are documented and active.
- [ ] Safe evidence records schedule execution, size, cryptographic checksum, migration state, and retention without record contents or secrets.
- [ ] Restore into an isolated target validates checksum, SQLite integrity, foreign keys, migration compatibility, and safe expected data.
- [ ] The restore drill does not overwrite or mutate production and succeeds under the named recovery owner.

## 9. Rollback

- [ ] Rollback triggers, decision authority, traffic handling, application procedure, database compatibility, verification, and communication are documented.
- [ ] A safe rollback rehearsal succeeds without an unauthorized destructive database replacement.
- [ ] Health, critical smoke behavior, logging, and monitoring work after the rehearsal.
- [ ] Any failure or deviation is corrected and the affected checks are repeated.

## 10. Manual accessibility review

- [ ] The Accessibility reviewer completes and records an NVDA/assistive-technology review of public booking, Agent authentication/dashboard/cancellation, and Staff authentication/queue/actions.
- [ ] Keyboard order, accessible names, landmarks, headings, forms, validation, status announcements, focus management, dynamic updates, and error recovery are reviewed.
- [ ] Findings contain no credentials or personal data and include severity, owner, disposition, and retest evidence.
- [ ] No unresolved critical accessibility issue remains and the Accessibility reviewer records approval; rejection is NO-GO.

## 11. Staff and Agent usability review

- [ ] A named facilitator runs scripted critical journeys with at least one representative Staff participant and one representative Agent participant.
- [ ] Findings are privacy-safe and record severity, owner, release-blocking state, disposition, and retest evidence.
- [ ] The Staff representative explicitly approves the Staff workflow or records rejection.
- [ ] The Agent representative explicitly approves the Agent workflow or records rejection.
- [ ] No unresolved critical usability issue or participant rejection remains.

## 12. Hydration-warning disposition

- [ ] Controlled production-build/browser attempts either reproduce the warning and identify its source or support a documented non-reproducible result.
- [ ] A reproduced warning is corrected at its source and covered by focused regression evidence.
- [ ] The WIP workaround is not automatically merged and `suppressHydrationWarning` is not presented as proof of a source correction.
- [ ] `wip/hydration-warning-workaround` is not merged, deleted, or retired by this feature.

## 13. Dependency-risk reassessment

- [ ] The exact release tree is checked for `find-my-way`, Next-bundled PostCSS, Next-bundled Sharp, and any new advisories.
- [ ] Accepted advisory reachability assumptions remain true under the production configuration and exercised features.
- [ ] Every unresolved accepted risk states reachability, rationale, owner, and reassessment trigger and is not described as resolved.
- [ ] No unresolved critical advisory or production-reachable release-blocking dependency risk remains.

## 14. Final release gate and sign-off

- [ ] No unresolved critical usability, accessibility, security, data-integrity, backup, monitoring, deployment, or dependency issue remains.
- [ ] No required validation is failed or blocked; environmental limitations have not been relabeled as passing.
- [ ] The Technical reviewer signs off on migrations, security, monitoring, backup, restore, rollback, and complete validation evidence.
- [ ] The Staff representative, Agent representative, and Accessibility reviewer provide their required approvals.
- [ ] The release checklist records scope, revision/artifact, evidence, accepted risks, operational owners, release communication, and rollback authority.
- [ ] The release owner provides an explicit final **GO**. Missing approval or any required rejection produces **NO-GO**.
- [ ] The production release is published only after GO, and post-release liveness, readiness, critical smoke, external logging, and alerting verification pass.

## Merge decision

The Phase 12 implementation may be merged only when all repository-controlled work and evidence are complete, external production evidence required for the first release is attached, every mandatory sign-off is affirmative, the release owner has issued GO, no required check is blocked, and no critical issue remains. Specification approval alone does not authorize provisioning, deployment, merging, or release.
