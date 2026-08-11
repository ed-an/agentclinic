# First Release — Requirements

## Context

This feature delivers Phase 12, **First release**, from [the roadmap](../roadmap.md). It follows [the mission](../mission.md) by proving that an Agent can confidently find a Therapy and book care and that Staff can manage the Appointment without ambiguity. It follows [the technical constitution](../tech-stack.md): NestJS remains the authoritative application and persistence boundary, Next.js consumes its versioned API, SQLite remains the durable store, UTC is authoritative, accessibility and privacy are release gates, and production launch requires safe operations and tested recovery.

Phases 0–11 are implemented. Phase 12 converts that production-ready application into an explicitly approved first production release. It includes the deployment and operational rollout as well as representative usability and manual accessibility reviews. It does not authorize provider selection or provisioning by itself.

## Objective

Produce reviewable evidence for a strict go/no-go decision, deploy the existing AgentClinic scope to an approved production target, verify its critical Agent and Staff journeys and operational controls, and release only when every required reviewer approves and no release-blocking issue remains.

## Scope and decisions

### Provider-neutral decision gate

1. Record the production environment and hosting decision before provisioning begins.
2. Keep all specification and preparatory work provider-neutral until the release owner explicitly selects and approves a provider.
3. Treat provider selection and every external provisioning action as a decision gate requiring separate explicit authorization after this specification is reviewed.
4. Do not choose, purchase, configure, or provision cloud resources, domains, DNS records, buckets, monitoring projects, secret stores, paid services, production databases, or deployment environments without that authorization.

### Initial production architecture

5. Deploy one NestJS server instance and one Next.js web instance against one persistent SQLite database with exactly one active database writer.
6. Do not use horizontal scaling, multiple application replicas, or multiple active database writers. In-memory authentication throttling is valid only inside this single-instance constraint and must not be represented as shared or durable state.
7. Keep SQLite and Prisma access inside NestJS. The web application must continue to use only the versioned HTTP API.
8. Store authoritative dates in UTC and display appointment times in `America/Sao_Paulo`.
9. Record persistent-storage location and ownership, process lifecycle, restart behavior, domain configuration, HTTPS termination, trusted-proxy assumptions, and network boundaries without exposing secrets or sensitive paths.

### Production configuration and secrets

10. Define and validate all production configuration before accepting traffic, including exact trusted origins, database location, public URLs, timezone, HTTPS/cookie/proxy settings, authentication/session controls, and operational settings.
11. Inject production secrets through an approved secure external mechanism. Do not commit them or expose them in source, logs, HTML, URLs, responses, build output, screenshots, reports, or release artifacts.
12. Define secret ownership, least-privilege access, rotation, revocation, and incident handling.

### Observability and incident response

13. Send the existing privacy-safe structured application logs to an approved external collector.
14. Establish external monitoring and actionable alert delivery for availability, readiness, application failures, and backup failures, with documented thresholds, recipients, escalation, and test procedure.
15. Assign named incident ownership and document how responders correlate safe request IDs, assess impact, communicate status, and escalate security or data-integrity events.

### Backup and recovery

16. Schedule backups using the supported consistent SQLite backup mechanism; never rely on a naive live-file copy.
17. Store backups remotely with encryption at rest, least-privilege access controls, a documented retention period, auditability, and secure deletion.
18. Preserve checksum and safe manifest evidence without record contents, credentials, URLs, or personal data.
19. Perform a restore drill into an isolated target, verify checksum, integrity, foreign keys, migration compatibility, and safe expected data, and never overwrite production as part of the drill.
20. Assign named backup and recovery ownership and document failure escalation.

### Deployment, migration, and rollback

21. Define repeatable preflight, production build, deployment, committed database migration, startup, liveness/readiness verification, security-header/HTTPS verification, and post-deployment smoke procedures.
22. Back up and verify the database before applying production migrations. Apply only committed migrations through the documented server-owned procedure.
23. Define rollback triggers, decision authority, application rollback steps, database compatibility constraints, traffic handling, verification, and communication.
24. Test the rollback procedure safely. Never perform destructive production database replacement without separate explicit approval.

### Usability and accessibility review

25. Conduct a facilitated review with at least one representative Staff participant and at least one representative Agent participant.
26. Name the facilitator/reviewer, use scripted critical journeys, and record findings without credentials or personal data.
27. Classify each finding by severity, identify release blockers, record ownership and disposition, and obtain each participant's approval or documented rejection.
28. Complete and record a manual NVDA/assistive-technology review of all critical journeys. Automated accessibility results do not substitute for this review.

### Hydration-warning disposition

29. Investigate the hydration warning independently of the existing WIP workaround. Reproduce it and correct its source, or record controlled evidence that it is non-reproducible.
30. Do not automatically merge `wip/hydration-warning-workaround` or treat `suppressHydrationWarning` as a verified correction.
31. Retiring or deleting the WIP branch is a separate action requiring explicit approval and is not part of this feature.

### Dependency risk

32. Reassess the documented `find-my-way`, Next-bundled PostCSS, and Next-bundled Sharp advisories against the exact release dependency tree and production configuration.
33. An advisory may remain an accepted risk only when its documented reachability assumptions still hold, its owner and reassessment trigger remain explicit, and it is not critical. Do not silently treat an accepted risk as resolved.
34. Any unresolved critical advisory or newly production-reachable release-blocking risk results in no-go.

### Release approval and communication

35. Maintain a final release checklist linking to evidence without including credentials or personal data.
36. Record release communication covering scope, known accepted risks, operational ownership, support/escalation route, release time, and rollback authority.
37. Required sign-off consists of:
    - a Technical reviewer confirming migrations, security, monitoring, backup, restore, rollback, and validation evidence;
    - the Staff representative approving the Staff workflow;
    - the Agent representative approving the Agent workflow;
    - an Accessibility reviewer recording the NVDA/manual accessibility result; and
    - the release owner providing final go/no-go approval.
38. Any required rejection, missing sign-off, blocked required check, or unresolved critical usability, accessibility, security, data-integrity, backup, monitoring, deployment, or dependency issue results in **NO-GO**.
39. Report environmental limitations as blocked, never passed. Make every accepted risk explicit.

## Out of scope

- Selecting or provisioning a deployment provider before separate explicit authorization.
- Creating cloud resources, domains, DNS records, buckets, monitoring projects, secret stores, paid services, production databases, or deployment environments as part of specification work.
- Horizontal scaling, multiple replicas, multiple writers, shared throttling, or replacing SQLite.
- Automatically merging the hydration-warning workaround or deleting its branch.
- Appointment rescheduling or reminders.
- Staff-managed catalog editing.
- Richer care history or notes.
- Therapy capacity or practitioner scheduling.
- Product analytics.

## Acceptance outcome

The first release is authorized only after the approved provider-neutral design has received a separately authorized production target; deployment, migration, operations, backup, restore, rollback, security, accessibility, and critical journeys have supplied complete passing evidence; all required reviewers have signed off; the release owner has issued GO; and no known critical issue remains.
