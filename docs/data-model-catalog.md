# Data model catalog

SQLite is authoritative. Prisma describes eight models; migration SQL adds
checks and a partial unique index Prisma cannot express. IDs are application or
seed supplied UUID strings; the database does not generate them unless a field
default is explicitly noted.

## Models

### Agent

`id` PK; required `name`, `model`, `summary`. Index `(name,id)`. One Agent has
many Appointments and zero or one UserAccount. Account deletion is not cascaded
from Agent (`RESTRICT`). Seeded catalog identity/content; read-only public API
exposes all four safe fields. No visitor/authentication secret.

### Ailment

`id` PK; required `name`, `summary`, `description`; index `(name,id)`. Many-to-
many Therapies through Prisma's `_AilmentToTherapy`, whose `(A,B)` pair is
unique and whose foreign keys cascade. Seeded catalog content; all fields are
public.

### Therapy

`id` PK; required unique `name`, `summary`, `description`; index `(name,id)`.
Many Ailments and many AvailabilitySlots. Therapy deletion cascades join rows
and slots. Seeded catalog content; all scalar fields and safe associated
Ailment IDs/names are public.

### AvailabilitySlot

`id` PK; required `therapyId`, `startsAt`, integer `durationMinutes`, Boolean
`isAvailable`. SQL checks duration > 0. Unique `(therapyId,startsAt)` and index
`(therapyId,isAvailable,startsAt,id)`. Required Therapy FK cascades on Therapy
delete. One slot has many historical Appointments. Seed supplies slots. API
exposes ID, Therapy ID, UTC start/end and duration, not `isAvailable` directly.

### Appointment

Fields: `id` PK; required `availabilitySlotId`, `agentId`, `visitorName`,
normalized `visitorEmail`, status default `PENDING`; nullable `cancelledAt`,
`cancellationSource`, `cancellationReasonCode`; required unique
`idempotencyKey`; `createdAt` default current time. Slot and Agent FKs are
`RESTRICT`. Indexes: unique idempotency key, `(agentId)`, `(agentId,status)`.

Migration checks restrict status to PENDING/CONFIRMED/CANCELLED, source to
AGENT/STAFF and reasons to the four approved codes. The cancellation-state
check requires active records to have no cancellation fields; cancelled Agent
records have source AGENT/no reason, and cancelled Staff records have source
STAFF/a reason.

The manually managed partial unique index
`Appointment_one_active_per_slot` covers `availabilitySlotId` where status is
PENDING or CONFIRMED. Thus both states block availability; multiple historical
CANCELLED records may share a slot. Booking creates PENDING; staff confirms;
Agent/Staff cancellation changes active state. Visitor name/email and
idempotency key are confidential/internal and never appear in public DTOs.

### AppointmentStatusEvent

`id` PK; required Appointment FK, nullable `fromStatus`, required `toStatus`,
`actorType`, nullable `reasonCode`, required `createdAt`. Index
`(appointmentId,createdAt,id)`; Appointment deletion cascades events. SQL checks
states, actors VISITOR/AGENT/STAFF/SYSTEM, allowed transitions, and requires a
reason only for Staff cancellation. Services append an initial VISITOR event
and one event per successful transition in the same transaction. The intended
append-only rule is not enforced by an SQLite trigger.

### UserAccount

`id` PK; unique normalized lowercase/trimmed `email`; required
`passwordHash`, role, Boolean `isActive` default true, timestamps, nullable
unique `agentId`. Index `(role,isActive)`. SQL permits only AGENT/STAFF and
enforces exactly one linked Agent for AGENT and no Agent for STAFF. Agent FK is
RESTRICT. Demo seed creates accounts only when explicitly enabled with complete
valid encoded hashes. Safe session output exposes ID/email/role and safe Agent
identity; `passwordHash` must never leave persistence.

### AuthSession

`id` PK; required `accountId`; unique `tokenHash` and `csrfTokenHash`; required
creation/expiry and nullable revocation instant. Index `(accountId,expiresAt)`.
Account deletion cascades sessions. SQL requires expiry after creation and
revocation not before creation. Sign-in creates, sign-out or replacement
revokes; expired/revoked/inactive-account sessions fail authentication. Only
hashes persist; hashes and raw token/cookie values must never appear publicly.

## Mutability and transaction boundaries

Catalog and slot records are seed-managed. Appointment creation and its initial
event are atomic. Agent cancellation, Staff confirmation and Staff cancellation
each conditionally update the Appointment, append an event and reread in one
transaction. Session replacement revocation and creation are atomic. Account
and catalog administration APIs do not exist.

## Retention considerations

No automated record-deletion policy exists. Cancelled appointments and status
events remain history. AuthSession expiry/revocation is enforced during reads,
but no cleanup job is implemented. Visitor name/email are personal data and
need an approved retention/deletion policy before production. Backups inherit
all database classifications and require encryption, access controls and
retention rules.

## Migration-history note

The booking migration originally allowed only CONFIRMED and one appointment of
any status per slot. Phase 8 introduced CANCELLED and a confirmed-only partial
index; Phase 9 replaced this with the current PENDING/CONFIRMED active index and
status events. These are intentional historical transformations, not the
current API contract.
