# AgentClinic input and output catalog

Audit date: 2026-08-11. Source of truth: current implementation, tests,
Prisma schema and migrations, scripts, configuration, and completed phase
specifications. Phase 12 is not complete. This catalog describes existing
behavior; it does not authorize production deployment.

## Catalog map

- [HTTP API contracts](api-contracts.md)
- [UI inputs and outputs](ui-input-output.md)
- [Operations and configuration](operations-input-output.md)
- [Data model](data-model-catalog.md)
- [Copyable API examples](examples/api-examples.md)
- [OpenAPI 3.1 description](openapi.yaml)

## System boundaries

The Next.js application accepts browser navigation and form input and calls a
NestJS/Fastify HTTP API. NestJS is the validation, authorization, business-rule
and persistence boundary. Prisma accesses one SQLite database. Dates are stored
as UTC instants and displayed using `AGENTCLINIC_TIME_ZONE`, defaulting to
`America/Sao_Paulo`.

No API pagination exists. All collection results are JSON arrays; an empty
result is `[]`. Catalog ordering is name then UUID. Availability and appointment
queues are ordered by start time then UUID.

## Input classes

| Boundary           | Inputs                                                      | Normalization and limits                                                                                                         |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| HTTP routing       | UUID v4 route parameters                                    | Nest `ParseUUIDPipe` rejects malformed values with 400                                                                           |
| Search             | `q`                                                         | trim; blank means absent; maximum 100 Unicode code points                                                                        |
| Availability       | `from`, `to`                                                | single timezone-qualified ISO instant; half-open `[from,to)`; maximum 90 days when both supplied                                 |
| Booking            | slot UUID, Agent UUID, visitor name/email, idempotency UUID | exact body fields; trim name; trim/lowercase email; name 1–100, email at most 254                                                |
| Authentication     | email, password, optional return path                       | email is trimmed/lowercased in service; body email 3–254, password 1–1024; return path is accepted only when local and undecoded |
| Staff queue        | status, Agent/Therapy UUID, from/to                         | approved unique statuses; comma or repeated status; exact query keys                                                             |
| Staff cancellation | reason code                                                 | exactly one `reasonCode` from the four implemented codes                                                                         |
| Configuration      | environment variables                                       | startup and script-specific guards; see operations catalog                                                                       |
| CLI                | npm arguments, environment, temporary paths                 | command-specific guards; destructive commands are labeled                                                                        |

## Output classes

| Boundary               | Output                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Public catalog         | mapped DTOs; no raw Prisma records                                                                                       |
| Booking                | safe appointment confirmation including visitor-selected Agent/Therapy, not visitor name/email                           |
| Auth                   | safe account/session identity and CSRF value; session token only in HttpOnly cookie                                      |
| Protected appointments | role-specific mapped DTOs; visitor contact fields omitted                                                                |
| Health                 | `{ "status": "ok" }`; readiness may return 503 `{ "status": "unavailable" }`                                             |
| Errors                 | Nest safe HTTP exception response for known 4xx; controlled unexpected 5xx envelope with `INTERNAL_ERROR` and request ID |
| Logs                   | newline-delimited JSON metadata; no body, query-string values, cookies, authorization or database URL                    |
| Database               | eight Prisma models plus implicit Ailment–Therapy join table                                                             |

## Standard error catalog

Known Nest exceptions normally serialize as `{statusCode,message,error}`;
message can be a string or framework validation content. They do **not** carry
a stable application code or request ID in the body. Every HTTP response does
carry `x-request-id`. Only the controlled unexpected-error envelope contains
`code` and `requestId`.

| Status | Shape/message class                                                                       | Trigger                                                                           | Retry/action                                             |
| -----: | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
|    400 | Nest `Bad Request` response                                                               | malformed UUID/query/body/header                                                  | correct input; do not retry unchanged                    |
|    401 | `Authentication required` or generic credential failure                                   | missing/expired/revoked session; bad credentials                                  | sign in or reauthenticate                                |
|    403 | access, Origin, or CSRF message                                                           | wrong role, untrusted/missing Origin, invalid CSRF                                | use correct account/origin/token; no blind retry         |
|    404 | resource-specific message; protected ownership uses non-revealing `Appointment not found` | absent resource or ownership mismatch                                             | correct identifier/navigation                            |
|    409 | state/idempotency/concurrency-safe message                                                | unavailable slot, reused key with different request, stale appointment transition | refresh state; retry only with appropriate new input/key |
|    429 | `Sign-in temporarily unavailable`                                                         | 5 failures per source or normalized email in 15 minutes                           | wait; changing credentials does not bypass source bucket |
|    500 | `{statusCode:500,code:"INTERNAL_ERROR",message:"Unable to complete request",requestId}`   | unexpected failure                                                                | retry cautiously and report request ID                   |
|    503 | `{status:"unavailable"}`                                                                  | readiness DB/migration/shutdown failure                                           | do not route traffic; operator action                    |

## Privacy and security invariants

- Never expose `visitorName`, `visitorEmail`, password hashes, token hashes,
  raw session tokens, raw cookie headers, database URLs, or exception stacks.
- The booking POST is public but requires an idempotency key. Authentication
  mutations require trusted Origin; protected mutations also require a CSRF
  header matching the authenticated session.
- Agent ownership mismatch is deliberately returned as 404.
- Session and CSRF tokens are random 32-byte base64url values; only SHA-256
  hashes are stored. Passwords use the implemented scrypt profile.
- Structured logs contain method, route template, status, duration and safe
  request ID, never request bodies or raw query strings.

## Traceability matrix

| UI action               | Route/component/client         | HTTP endpoint                      | Controller/service                 | Models                        | Validation                       | Browser journey                        |
| ----------------------- | ------------------------------ | ---------------------------------- | ---------------------------------- | ----------------------------- | -------------------------------- | -------------------------------------- |
| Browse Agents           | `/agents`, `agent-api.ts`      | `GET /agents`, `GET /agents/{id}`  | AgentsController/Service           | Agent                         | `agents.spec.ts`, page/API tests | `agent-directory.spec.ts`              |
| Search Ailments         | `/ailments`, `ailment-api.ts`  | `GET /ailments?q=`                 | AilmentsController/Service         | Ailment                       | `ailments.spec.ts`, UI tests     | `ailment-catalog.spec.ts`              |
| Browse Therapies        | `/therapies`, `therapy-api.ts` | therapy and association GETs       | Therapies/Ailments services        | Therapy, Ailment, join        | `therapies.spec.ts`              | `therapy-catalog.spec.ts`              |
| View availability       | `/therapies/{id}`              | `GET /therapies/{id}/availability` | AvailabilityService                | AvailabilitySlot, Appointment | `availability.spec.ts`           | `appointment-availability.spec.ts`     |
| Book                    | `/appointments/book`           | context, POST, confirmation GET    | AppointmentsController/Service     | Appointment, StatusEvent      | `appointments.spec.ts`           | `book-appointment.spec.ts`             |
| Sign in/out             | `/sign-in`, layout controls    | auth endpoints                     | AuthController/Service/Guard       | UserAccount, AuthSession      | `access-control.spec.ts`         | authenticated dashboard/queue journeys |
| Agent review/cancel     | `/agent/dashboard`             | current-Agent GET/POST             | CurrentAgentAppointmentsController | Appointment, StatusEvent      | `agent-dashboard.spec.ts`        | `agent-dashboard.spec.ts`              |
| Legacy Agent route      | `/agents/{id}/dashboard`       | Agent-scoped GET/POST              | AgentAppointmentsController        | Appointment, StatusEvent      | ownership tests                  | legacy route coverage                  |
| Staff filter/transition | `/staff/appointments`          | staff GET/confirm/cancel           | StaffAppointmentsController        | Appointment, StatusEvent      | staff queue tests                | `staff-appointment-queue.spec.ts`      |
| Health/release check    | no user page                   | health GETs                        | HealthController/Readiness         | migration table               | health/operations tests          | production-readiness journey           |

## Recorded conflicts and ambiguity

1. `Appointment` schema declares default `PENDING`; the earlier Phase 6
   migration created confirmed-only appointments. Later migrations intentionally
   replaced that historical contract. Current behavior is `PENDING`.
2. `AppointmentStatusEvent` is described as append-only in specifications and
   services only create rows, but SQLite has no trigger preventing update/delete.
3. `DISPLAY_TIME_ZONE` is captured at module import while operational config
   validates the same environment value at startup; changing it requires restart.
4. Known 4xx errors do not implement stable error codes or body request IDs,
   despite operational correlation requirements; correlation is available in
   the response header.
5. The legacy `/agents/{agentId}/appointments/*` endpoints remain registered
   alongside current-session `/agent/appointments/*` endpoints.
6. Phase 12 human reviews, external logging/alerts, secrets, remote backups,
   production deployment and provider selection remain external and incomplete.
