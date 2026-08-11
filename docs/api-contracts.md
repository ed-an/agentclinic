# HTTP API contracts

Base URL placeholder: `<BASE_URL>`. All bodies are JSON. Successful GETs are 200. Unless stated otherwise, endpoints are public, have no body, no CSRF or
Origin requirement, no pagination, and make read-only database queries.
Every response includes `x-request-id` and security headers.

## Endpoint inventory

| Capability     | Method and path                                              | Access and mutation input                                       | Success output                                             | Errors and persistence                                                                                       |
| -------------- | ------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Health         | `GET /health`, `/health/live`                                | Public                                                          | 200 `{status:"ok"}`                                        | no DB for legacy/live                                                                                        |
| Readiness      | `GET /health/ready`                                          | Public                                                          | 200 `{status:"ok"}`                                        | 503 `{status:"unavailable"}` if DB query, exactly 9 applied migrations, or traffic acceptance fails          |
| Agents         | `GET /agents`                                                | Public                                                          | `Agent[]`; name/id ascending                               | `[]`; no pagination                                                                                          |
| Agents         | `GET /agents/{id}`                                           | UUID v4                                                         | `Agent`                                                    | 400 UUID; 404 Agent                                                                                          |
| Ailments       | `GET /ailments`                                              | optional single `q`; trim; blank absent; ≤100 code points       | `Ailment[]`; name/id ascending                             | 400 repeated/non-string/too long; `[]`                                                                       |
| Ailments       | `GET /ailments/{id}`                                         | UUID v4                                                         | `Ailment`                                                  | 400/404                                                                                                      |
| Associations   | `GET /ailments/{id}/therapies`                               | UUID v4                                                         | `Therapy[]`; name/id ascending                             | 400/404; `[]` when no associations                                                                           |
| Therapies      | `GET /therapies`                                             | Public                                                          | `Therapy[]`; name/id ascending                             | `[]`                                                                                                         |
| Therapies      | `GET /therapies/{id}`                                        | UUID v4                                                         | `TherapyDetail` with sorted ailments                       | 400/404                                                                                                      |
| Availability   | `GET /therapies/{id}/availability`                           | UUID; optional exact `from`,`to`; timezone ISO; max 90 days     | available, unoccupied, future `Slot[]`; start/id ascending | 400/404; `[]`; `[from,to)`                                                                                   |
| Booking        | `GET /appointments/booking-context/{slotId}`                 | UUID                                                            | `BookingContext`                                           | 400, 404 absent slot, 409 unavailable/past/occupied                                                          |
| Booking        | `POST /appointments`                                         | exact `CreateAppointment`; required `Idempotency-Key` UUID      | 201 new or 200 exact replay, `Appointment`                 | 400; 404 slot/Agent; 409 occupied or key mismatch; transaction creates Appointment + initial event           |
| Confirmation   | `GET /appointments/{id}`                                     | UUID                                                            | `Appointment`                                              | 400/404                                                                                                      |
| Authentication | `POST /auth/sign-in`                                         | trusted `Origin`; exact JSON email/password/optional returnTo   | 200 `Session`; two cookies                                 | 400, 401 generic, 403 Origin, 429; transaction revokes prior session and creates session                     |
| Authentication | `GET /auth/session`                                          | session + CSRF cookies                                          | 200 `Session`                                              | 401; read-only                                                                                               |
| Authentication | `POST /auth/sign-out`                                        | if authenticated: trusted Origin + CSRF header; session cookie  | 204 empty; clears cookies                                  | 403; idempotent when no valid session; revokes matching active session                                       |
| Agent          | `GET /agent/appointments/upcoming`                           | AGENT session                                                   | confirmed future `AgentAppointment[]`                      | 401/403; `[]`                                                                                                |
| Agent          | `POST /agent/appointments/{appointmentId}/cancel`            | AGENT session, Origin, CSRF, UUID                               | 200 `AgentAppointment`                                     | 400/401/403/404/409; transaction updates Appointment + event; already cancelled is idempotent                |
| Agent legacy   | `GET /agents/{agentId}/appointments/upcoming`                | AGENT session; route UUID must equal account Agent              | same as current Agent list                                 | mismatch is non-revealing 404                                                                                |
| Agent legacy   | `POST /agents/{agentId}/appointments/{appointmentId}/cancel` | same ownership, Origin and CSRF                                 | same cancellation                                          | same errors/transaction                                                                                      |
| Staff          | `GET /staff/appointments`                                    | STAFF session; optional status(s), agentId, therapyId, from, to | `StaffAppointment[]`; start/id ascending                   | 400/401/403; default is future PENDING+CONFIRMED; explicit filters remove implicit future constraint         |
| Staff          | `POST /staff/appointments/{appointmentId}/confirm`           | STAFF, Origin, CSRF, UUID                                       | 200 `StaffAppointment`                                     | 400/401/403/404/409; transaction changes PENDING to CONFIRMED + event; future CONFIRMED replay is idempotent |
| Staff          | `POST /staff/appointments/{appointmentId}/cancel`            | STAFF, Origin, CSRF; exact reason body                          | 200 `StaffAppointment`                                     | 400/401/403/404/409; transaction changes active state + event; cancelled replay is idempotent                |

## Schemas

- `Agent`: `id`, `name`, `model`, `summary` strings.
- `Ailment`: `id`, `name`, `summary`, `description` strings.
- `Therapy`: `id`, `name`, `summary`, `description` strings.
- `TherapyDetail`: Therapy plus `ailments: {id,name}[]`.
- `Slot`: `id`, `therapyId` UUID strings; `startsAt`, `endsAt` UTC date-time
  strings; positive integer `durationMinutes`.
- `BookingContext`: `slotId`, `therapy:{id,name}`, start/end date-times,
  duration and `displayTimeZone`.
- `CreateAppointment`: exactly `availabilitySlotId`, `agentId`,
  `visitorName`, `visitorEmail`. UUIDs are v4; name is trimmed 1–100; email is
  trimmed/lowercased, regex-validated and ≤254.
- `Appointment`: `id`; status `PENDING|CONFIRMED|CANCELLED`; safe Agent and
  Therapy pairs; start/end, duration, display timezone and creation instant.
  Visitor contact and idempotency key are never returned.
- `Session`: `accountId`, normalized example.test `email`, role
  `AGENT|STAFF`, nullable `agent:{id,name}`, `expiresAt`, `csrfToken`; sign-in
  adds nullable `returnTo`. The raw session token is never JSON.
- `AgentAppointment`: `id`, status `CONFIRMED|CANCELLED`, Therapy, start/end,
  duration, cancellation boolean/deadline and display timezone.
- `StaffAppointment`: `id`, three-state status, Agent/Therapy, start/end,
  duration, timezone, created/status-change instants and allowed-action flags.

## Headers, cookies and trust

`Content-Type: application/json` is required for JSON mutations. Booking also
requires `Idempotency-Key: <IDEMPOTENCY_KEY>`. Clients may send a valid
`X-Request-Id` matching 1–64 safe characters; otherwise the server generates
one. Authentication uses `agentclinic_session=<SESSION_COOKIE>` (HttpOnly) and
`agentclinic_csrf=<CSRF_TOKEN>` (readable double-submit cookie). Protected
mutations require `X-AgentClinic-CSRF: <CSRF_TOKEN>` and an exact configured
`Origin`. Cookies are Path `/`, SameSite=Lax, eight-hour Max-Age/expiry and
Secure in production. Authenticated responses are `private, no-store`.

## Booking concurrency and idempotency

The complete booking operation is one Prisma transaction. It checks exact
idempotent replay, slot state, blocking appointments and Agent existence, then
creates the Appointment and initial VISITOR status event. SQLite's partial
unique index permits at most one PENDING or CONFIRMED appointment per slot.
Concurrent unique failures are mapped to exact replay or safe 409.

## Appointment transitions

Agent cancellation is allowed only for the authenticated owner's CONFIRMED
future appointment at or before the configured deadline. Staff may confirm a
future PENDING appointment and cancel a future PENDING or CONFIRMED appointment
with a reason. Conditional `updateMany` plus a reread detects races. Each real
transition and its status event share one transaction. There is no pagination.

## Examples and error bodies

See [API examples](examples/api-examples.md). It supplies a valid invocation
for all 24 endpoints plus representative validation, authentication,
authorization, not-found and conflict responses. Values are placeholders or
fictional; no repository database content is used.
